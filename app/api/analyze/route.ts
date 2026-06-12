import Anthropic from '@anthropic-ai/sdk'

// 120s ceiling for the detailed Sonnet 4.6 analysis (applies on Vercel Pro;
// Hobby caps at 60s). Frontend AbortController is aligned to this.
export const maxDuration = 120

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── JSON repair for truncated LLM output ──────────────────────────────────
function closeOpenBrackets(s: string): string {
  let inString = false
  let escape = false
  const stack: string[] = []
  let lastSafeEnd = -1

  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (escape) { escape = false; continue }
    if (c === '\\' && inString) { escape = true; continue }
    if (c === '"') { inString = !inString; continue }
    if (inString) continue
    if (c === '{' || c === '[') stack.push(c)
    else if (c === '}') {
      if (stack[stack.length - 1] === '{') stack.pop()
      if (stack.length === 1) lastSafeEnd = i + 1
    } else if (c === ']') {
      if (stack[stack.length - 1] === '[') stack.pop()
      if (stack.length === 1) lastSafeEnd = i + 1
    } else if (c === ',' && stack.length === 1) {
      lastSafeEnd = i
    }
  }

  let trimmed = lastSafeEnd > 0 ? s.slice(0, lastSafeEnd) : s
  const closeStack: string[] = []
  let inStr = false
  let esc = false
  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i]
    if (esc) { esc = false; continue }
    if (c === '\\' && inStr) { esc = true; continue }
    if (c === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (c === '{') closeStack.push('}')
    else if (c === '[') closeStack.push(']')
    else if (c === '}' || c === ']') closeStack.pop()
  }
  if (inStr) trimmed += '"'
  while (closeStack.length) trimmed += closeStack.pop()
  return trimmed
}

// Strip HTML tags from question/answer text (API returns "<p>...</p>")
const stripHtml = (s: string) => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

// Test type enum — the AI classifier decides which bucket each test falls into
// based on the assessment description. We don't hardcode keywords because the
// system must handle any future test without code changes.
type TestType = 'profile' | 'cognitive' | 'screening' | 'aptitude' | 'generic'
type ScoreDirection = 'high-good' | 'low-good' | 'profile'
type OutcomeQuality = 'positive' | 'neutral' | 'concerning'

// Structural-only heuristic fallback — used ONLY if the AI classification
// fails to parse or returns garbage. Conservative defaults that won't be
// wildly misleading: many dims → profile, otherwise generic.
function structuralFallbackType(dimCount: number): TestType {
  return dimCount >= 5 ? 'profile' : dimCount >= 2 ? 'screening' : 'generic'
}

// Per-type configuration: which UI sections to emit, label vocabulary, framing
const TYPE_CONFIG: Record<TestType, {
  primaryLabel: string  // "Үр дүн" / "Profile" / "Оноо" / "Эрсдэл"
  kpiLabels: { metric1: string; risk: string; potential: string }
  hasRoadmap: boolean
  hasRiskFraming: boolean
  framingLine: string  // appended to system prompt for tone calibration
}> = {
  profile: {
    primaryLabel: 'Profile',
    kpiLabels: { metric1: 'Үндсэн төрөл', risk: 'Тэнцвэр', potential: 'Хөгжүүлэх' },
    hasRoadmap: false,
    hasRiskFraming: false,
    framingLine: 'Энэ бол ЗАН ЧАНАР/PROFILE тест. Эрсдэл/зөвлөмж биш — давуу тал, сул тал, баг доторх роль, харилцан ажиллагааны зөвлөмжид анхаар. "Сайн/муу" биш "тохиромжтой/тохиромжгүй нөхцөл" гэж бич.',
  },
  cognitive: {
    primaryLabel: 'Оноо',
    kpiLabels: { metric1: 'Гүйцэтгэл', risk: 'Сул бүсүүд', potential: 'Хөгжүүлэх боломж' },
    hasRoadmap: true,
    hasRiskFraming: false,
    framingLine: 'Энэ бол ТАНИН МЭДЭХҮЙН (IQ/логик) тест. Чадвар, сэтгэн бодох хурд, дүн шинжилгээний түвшинд анхаар. "Эрсдэл" гэж бүү ашигла — "сул бүс", "сайжруулах талбар" гэж бич.',
  },
  screening: {
    primaryLabel: 'Эрсдэл',
    kpiLabels: { metric1: 'Түвшин', risk: 'Эрсдэл', potential: 'Сэргэх боломж' },
    hasRoadmap: true,
    hasRiskFraming: true,
    framingLine: 'Энэ бол СКРИНИНГ тест (стресс/зависимости/түгшүүр). Эмпатитэй, эерэг, дэмжих өнгө. "Оношилгоо БИШ — зөвлөгөө". Мэргэжлийн тусламжид хандах боломжийг сануулна.',
  },
  aptitude: {
    primaryLabel: 'Тохирол',
    kpiLabels: { metric1: 'Тэргүүлэх чиглэл', risk: 'Sкилл цоорхой', potential: 'Карьерийн боломж' },
    hasRoadmap: true,
    hasRiskFraming: false,
    framingLine: 'Энэ бол МЭРГЭЖЛИЙН ЧИГ БАРИМЖАА/УР ЧАДВАР тест. Карьерын чиглэл, тохирох мэргэжил, skill gap-д анхаар. "Эрсдэл" биш "хөгжүүлэх ёстой ур чадвар".',
  },
  generic: {
    primaryLabel: 'Үр дүн',
    kpiLabels: { metric1: 'Үндсэн оноо', risk: 'Анхаарах', potential: 'Боломж' },
    hasRoadmap: true,
    hasRiskFraming: false,
    framingLine: '',
  },
}

export async function POST(request: Request) {
  try {
    const { reportData, reportTitle } = await request.json()

    // ── New payload shape: reportData.report = { exam, assessment, result, answers } ──
    // Fall back to old shape for backward compatibility during deploy transition.
    const reportPayload: any =
      (reportData as any)?.report?.payload ?? (reportData as any)?.report ?? {}

    const assessment: any = reportPayload.assessment || (reportData as any)?.exam?.payload || (reportData as any)?.exam || {}
    const resultObj: any = reportPayload.result || (reportData as any)?.exam?.payload || {}
    const answersGrouped: any[] = reportPayload.answers || []

    // ── Extract canonical values ─────────────────────────────────────────
    const actualResultLabel: string = resultObj.result || assessment.result || ''

    // ── Compute canonical score + max from ANSWERS (source of truth) ──────
    // Why: assessment.totalPoint is unreliable across test types.
    //   - Belbin (partialScore=true): totalPoint=70 IS the max (correct)
    //   - RSES (partialScore=false): totalPoint=10 is the QUESTION COUNT, not max
    // We compute from answers and reconcile with reported fields.
    const allAnswerPoints: number[] = []
    for (const grp of (answersGrouped || [])) {
      for (const a of (grp?.answers || [])) {
        const p = Number(a?.point)
        if (Number.isFinite(p)) allAnswerPoints.push(p)
      }
    }
    const sumAnswerPoints = allAnswerPoints.reduce((s, p) => s + p, 0)
    const maxPointSeen = allAnswerPoints.length > 0 ? Math.max(...allAnswerPoints) : 0
    const totalQuestions = allAnswerPoints.length
    // Likert-style inference: if every Q can score up to maxPointSeen, total max = Qs × max
    const inferredLikertMax = totalQuestions * maxPointSeen

    // Score: prefer result.value (used for non-partialScore tests like RSES),
    // then result.point, then summed answers
    const actualScore: number =
      Number(resultObj.value ?? resultObj.point ?? assessment.point ?? 0) ||
      sumAnswerPoints ||
      0

    // Max: trust assessment.totalPoint ONLY if it's >= the achieved score and
    // we have no better signal. Otherwise prefer inferredLikertMax which is
    // grounded in real answer-level data.
    const reportedMax = Number(assessment.totalPoint ?? assessment.total ?? 0) || 0
    const reportedMaxLooksLikeCount = reportedMax > 0 && reportedMax < actualScore
    const actualMaxScore: number =
      reportedMaxLooksLikeCount && inferredLikertMax > 0 ? inferredLikertMax
      : reportedMax > 0 ? reportedMax
      : inferredLikertMax > 0 ? inferredLikertMax
      : Number(resultObj.total ?? 0) || 0

    console.log('[analyze] score:', {
      resultPoint: resultObj.point,
      resultValue: resultObj.value,
      resultTotal: resultObj.total,
      assessmentTotalPoint: assessment.totalPoint,
      partialScore: assessment.partialScore,
      sumAnswerPoints, maxPointSeen, totalQuestions, inferredLikertMax,
      picked: { score: actualScore, max: actualMaxScore },
    })
    const assessmentDescription: string = stripHtml(assessment.description || '')
    const assessmentUsage: string = stripHtml(assessment.usage || '')
    const assessmentMeasure: string = stripHtml(assessment.measure || '')
    const assessmentAuthor: string = assessment.author || ''

    const actualPct = actualMaxScore > 0
      ? Math.round((actualScore / actualMaxScore) * 100)
      : 50

    // ── Dimensions — primary source: result.details[] (pre-scored per dim) ──
    type Dim = { label: string; score: number; maxScore: number; pct: number }
    let dimensions: Dim[] = []

    // Try to derive a per-dimension max from many possible fields.
    // Different test types put it in different places; we try them in order.
    const extractDimMax = (d: any): number => {
      const candidates = [
        d?.total, d?.totalPoint, d?.maxPoint, d?.maxValue, d?.max,
        d?.point_total, d?.pointTotal, d?.full, d?.outOf,
        d?.category?.total, d?.category?.totalPoint, d?.category?.maxValue,
      ]
      for (const c of candidates) {
        const n = Number(c)
        if (Number.isFinite(n) && n > 0) return n
      }
      return 0
    }

    if (Array.isArray(resultObj.details) && resultObj.details.length > 0) {
      const rawDims = resultObj.details
        .map((d: any) => ({
          label: String(d.value || '').trim(),
          score: Number(d.cause ?? d.point ?? 0) || 0,
          rawMax: extractDimMax(d),
        }))
        .filter((d: any) => d.label)

      // Per-dim max priority:
      //   1. Explicit per-detail max field (rawMax) — best
      //   2. Equal split of total max across dims — works for symmetric tests
      //      like RSES where 2 sub-scales each have N questions × max-per-Q
      //   3. Highest detail score (visible relativeness only) — last resort
      const evenSplit = actualMaxScore > 0 && rawDims.length > 0
        ? actualMaxScore / rawDims.length
        : 0
      const dimsSum = rawDims.reduce((s: number, d: { score: number }) => s + d.score, 0)
      // Equal split is valid only if the sum of dim scores doesn't exceed the
      // total — otherwise we'd display impossible percentages.
      const evenSplitValid = evenSplit > 0 && rawDims.every((d: { score: number }) => d.score <= evenSplit)
      const fallbackMax = Math.max(...rawDims.map((d: { score: number }) => d.score), 1)

      dimensions = rawDims.map((d: { label: string; score: number; rawMax: number }) => {
        const m = d.rawMax > 0 ? d.rawMax
                : evenSplitValid ? evenSplit
                : fallbackMax
        return {
          label: d.label,
          score: d.score,
          maxScore: m,
          pct: m > 0 ? Math.round((d.score / m) * 100) : 0,
        }
      })

      console.log('[analyze] dims:', { source: 'details', evenSplit, evenSplitValid, dimsSum, dims: dimensions.map(d => `${d.label}: ${d.score}/${d.maxScore}`) })
    }

    // Fallback: derive dimensions from answers grouped by questionCategory.
    // Compute per-dim max from per-question max if available.
    if (dimensions.length === 0 && Array.isArray(answersGrouped) && answersGrouped.length > 1) {
      const dimMap = new Map<string, { label: string; sum: number; max: number; count: number }>()
      for (const grp of answersGrouped) {
        const catId = grp?.questionCategoryId ?? 'misc'
        const catName: string = grp?.questionCategoryName || grp?.category?.name || `Бүлэг ${catId}`
        const sum = (grp?.answers || []).reduce((acc: number, a: any) => acc + (Number(a?.point) || 0), 0)
        const maxSum = (grp?.answers || []).reduce((acc: number, a: any) => {
          const m = Number(a?.question?.point ?? a?.question?.maxValue ?? a?.maxPoint ?? 0)
          return acc + (Number.isFinite(m) && m > 0 ? m : 0)
        }, 0)
        const cur = dimMap.get(String(catId)) || { label: catName, sum: 0, max: 0, count: 0 }
        cur.sum += sum
        cur.max += maxSum
        cur.count += grp?.answers?.length || 0
        dimMap.set(String(catId), cur)
      }
      if (dimMap.size >= 2) {
        const arr = Array.from(dimMap.values()).map(v => ({
          label: v.label,
          score: v.sum,
          maxScore: v.max > 0 ? v.max : Math.max(v.sum, 1),
        }))
        dimensions = arr.map(d => ({
          ...d,
          pct: d.maxScore > 0 ? Math.round((d.score / d.maxScore) * 100) : 0,
        }))
      }
    }

    // Sort dimensions descending so highest is first
    dimensions.sort((a, b) => b.score - a.score)

    // Structural priors — the AI sees these as STARTING guesses and is told
    // to override them in its output if the test description suggests otherwise.
    // Single AI call (no separate classifier round-trip) keeps latency low.
    let testType: TestType = structuralFallbackType(dimensions.length)
    let scoreDirection: ScoreDirection = dimensions.length >= 5 ? 'profile' : 'high-good'
    let outcomeQuality: OutcomeQuality = 'neutral'

    // ── Build compact deep context for the AI ─────────────────────────────
    // Flatten grouped answers, take a representative sample with question text
    const flatAnswers: Array<{ q: string; a: string; p: number }> = []
    for (const grp of (answersGrouped || [])) {
      for (const a of (grp?.answers || [])) {
        flatAnswers.push({
          q: stripHtml(a?.questionName || '').slice(0, 80),
          a: stripHtml(a?.answerValue || '').slice(0, 100),
          p: Number(a?.point) || 0,
        })
      }
    }
    // Top 6 highest-scoring answers — evidence for pattern detection
    flatAnswers.sort((a, b) => b.p - a.p)
    const sampleAnswers = flatAnswers.slice(0, 6)
      .map((x, i) => `${i + 1}. [${x.p}] ${x.q} → ${x.a}`)
      .join('\n')


    const truncated = `Тестийн нэр: ${reportTitle}
Зохиогч: ${assessmentAuthor || '—'}
Тайлбар: ${assessmentDescription.slice(0, 700)}
Зориулалт: ${assessmentUsage.slice(0, 400)}
Хэмжих зүйл (онооны түвшин/зэрэглэл энд байж магадгүй): ${assessmentMeasure.slice(0, 500)}

═══ БОДИТ ҮР ДҮН ═══
Үр дүнгийн нэр: "${actualResultLabel || 'тодорхойгүй'}"
${actualMaxScore > 0 ? `Нийт оноо: ${actualScore}/${actualMaxScore} (${actualPct}%)` : ''}

═══ DIMENSION ОНОО (тус бүрийг ТУСАД нь тайлбарла, нийлбэр БИШ) ═══
${dimensions.length > 0 ? dimensions.slice(0, 12).map((d, i) => `${i + 1}. ${d.label}: ${d.score}/${d.maxScore} (${d.pct}%)`).join('\n') : '—'}
${dimensions.length >= 2 ? `Хамгийн өндөр: "${dimensions[0].label}" — энэ нь давамгай хэмжээс.` : ''}

═══ ХАМГИЙН ӨНДӨР ҮНЭЛГЭЭТЭЙ ХАРИУЛТУУД (ишлэл татаж ашигла) ═══
${sampleAnswers || '—'}`

    const SYSTEM = `Та hire.mn-ийн мэргэжлийн сэтгэл зүйч, коуч AI. Эерэг, эмпатитэй, мэргэжлийн өнгөөр зөв монгол хэлээр бичнэ.

ТЕСТ: "${reportTitle}"

АНГИЛАЛ — description уншаад тогтоо:
• testType: profile | cognitive | screening | aptitude | generic
• scoreDirection: high-good | low-good | profile
• outcomeQuality: positive | concerning | neutral

═══ ТАНЫ ҮҮРЭГ: ТАЙЛБАРЛАГЧ, ТООЦООЛОГЧ БИШ ═══
1. Оноо, хувь, түвшин, ангилал ЗОХИОХЫГ ХОРИГЛОНО. Зөвхөн өгөгдсөн утгыг давт.
2. Хувь хэмжээ бичвэл зөвхөн БҮХЭЛ ТОО (71% ✅, 71.43% ❌)
3. Text-д тоо оруулахаас аль болох ТАТГАЛЗ — semantic үг ашигла
4. Зохиосон үг хориглоно: эмдээлэл, сэвших, хүүхэл, цэнгэлэг
5. Оношилгоо БИШ: "...магадгүй", "...болзошгүй"
6. label "${actualResultLabel || ''}" ЯГ ашигла
7. positive үр дүнд "эрсдэл/шуурхай арга хэмжээ" БҮҮ бич — баяр хүргэ
8. concerning үр дүнд эмпатитэй, мэргэжлийн тусламж зөвлө
9. Хариултын ишлэлийг ашиглаж "энэ намайг ойлгож байна" мэдрэмж төрүүл

═══ ГҮН ШИНЖИЛГЭЭ — ЭНЭ ТАНЫ ҮНЭ ЦЭНЭ ═══
• Хариултуудын ХООРОНДЫН ХАМААРЛЫГ ол: "X гэж хариулсан мөртлөө Y гэж хариулсан нь Z-ийг илтгэнэ"
• Давтагдах ХЭВ МАЯГИЙГ илрүүл: ижил сэдэвт хэд хэдэн хариулт юу өгүүлж байна
• Хэрэглэгчийн ХАРИУЛТААС иш татаж бичих — generic зөвлөгөө БИШ, энэ хүний өгөгдөлд суурилсан
• "яагаад", "юу гэсэн үг" гэдгийг тайлбарла

═══ HIRE.MN АЛБАН ЁСНЫ ТАЙЛАНГИЙН ЗАРЧИМ (ЭНЭ ЧАНАРААР БИЧ) ═══
1. ОЛОН ХЭМЖЭЭСТ тест (burnout, DISC г.м): хэмжээс бүрийг ТУСАД нь тайлбарла — нийлбэр БИШ. Хамгийн өндөр хэмжээс нь давамгай. carousel-д хэмжээс/дүр бүрд НЭГ карт: тухайн хэмжээсийн түвшин + ЯАГААД + ТУХАЙН хэмжээст тусгайлсан зөвлөгөө.
2. ТҮВШИН/ЗЭРЭГЛЭЛ: тестэд онооны муж (0-49, 50-74 г.м) тодорхойлсон бол ЯГ тэр нэрлэсэн түвшинг ашигла.
3. PROFILE дүр/шинж бүрд 4 талыг хүчтэй гарга: (а) гол шинж чанар (б) дуртай/тохирох орчин (в) багт/орчинд оруулах хувь нэмэр (г) бусад хүн таныг хэрхэн хардаг + сул тал.
4. ТУСГАЙЛСАН зөвлөгөө: домэйнд тохирсон бодит алхам. Жишээ: ажлын стресс→ажил хувааx/хил тогтоох/эрэмбэлэх; харилцагчийн стресс→"үгүй" гэж сурах/дэмжлэг авах; хувийн→өөртөө цаг гаргах/хобби. Generic "тайвшир" БИШ.
5. tip нь практик, шууд хэрэгжих ёстой (албан ёсны тайлан bullet point-той адил).
6. Эерэг, хүндэтгэлтэй, "та" хэллэгээр. Хэрэглэгчийг ойлгож буйгаа мэдрүүл.

═══ ЮУ ГАРГАХ ВЭ — ЗӨВХӨН АГУУЛГА (бүтцийг сервер угсарна) ═══
Та доорх агуулгыг л бичнэ. Хуудас, layout, диаграмыг СЕРВЕР автоматаар угсарна.

1. opening — хэрэглэгчид зориулсан 1 дулаахан өгүүлбэр.
2. headline — хамгийн чухал НЭГ дүгнэлт: title (богино) + body (1-2 өгүүлбэр, яагаад чухал).
3. cards — ⭐ХАМГИЙН ЧУХАЛ: 4-5 карт (давуу тал / анхаарах зүйл / зөвлөгөө). Swipe хийгдэх том картууд болж харагдана.
   Карт бүр: tone (positive=давуу/сайн, warning=анхаарах/сул, info=зөвлөгөө), emoji, title (богино гарчиг), detail (2 өгүүлбэр — ЯАГААД, юу гэсэн үг, хэрэглэгчийн хариултад суурилсан), tip (1 богино практик алхам), meta (богино шошго).
   ОЛОН ХЭМЖЭЭСТ тест: давамгай 2-3 хэмжээс тус бүрд карт (meta=хэмжээсийн нэр, title=түвшин) + 1-2 зөвлөгөөний карт.
   НЭГ онооны тест: давуу тал, анхаарах зүйл, зөвлөгөө, дэмжлэг гэсэн картууд.
4. plan — ЯГ 4 алхам (сэргэх зам / хөгжүүлэх зам): алхам бүр title (богино) + text (1 өгүүлбэр, ТУСГАЙЛСАН бодит алхам).
5. today — өнөөдөр шууд хийх ЯГ 3 энгийн зорилго (богино).

ЧАНАР: detail нь ҮНЭХЭЭР хэрэгтэй, тестийн контекст + хариултад суурилсан. tip/plan нь домэйнд тусгайлсан (generic "тайвшир" БИШ). Бүх text цэвэр монгол, тоо багатай.

JSON буцаа ({ -ээр эхэл, ЗӨВХӨН энэ бүтэц):
{"testType":"...","scoreDirection":"...","outcomeQuality":"...","opening":"<1 өгүүлбэр>","summary":{"title":"${actualResultLabel || 'Дүн'}","description":"<1 өгүүлбэр тоогүй>"},"headline":{"title":"<богино>","body":"<1-2 өгүүлбэр>"},"cards":[{"tone":"<positive|warning|info>","emoji":"<e>","title":"<гарчиг>","detail":"<2 өгүүлбэр>","tip":"<1 алхам>","meta":"<шошго>"},{"tone":"...","emoji":"...","title":"...","detail":"...","tip":"...","meta":"..."},{"tone":"...","emoji":"...","title":"...","detail":"...","tip":"...","meta":"..."},{"tone":"...","emoji":"...","title":"...","detail":"...","tip":"...","meta":"..."}],"plan":[{"title":"<богино>","text":"<1 өгүүлбэр>"},{"title":"...","text":"..."},{"title":"...","text":"..."},{"title":"...","text":"..."}],"today":["<богино>","<богино>","<богино>"]}`

    // Note: Sonnet 4.6 does not support assistant message prefill —
    // we instruct raw JSON output and extract the {...} span instead.
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2200,
      system: SYSTEM,
      messages: [
        { role: 'user', content: `Дата:\n${truncated}\n\nЗӨВХӨН JSON буцаа — markdown, тайлбар үг ҮГҮЙ, шууд { -ээр эхэл.` },
      ],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    let jsonStr = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const start = jsonStr.indexOf('{')
    const end = jsonStr.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('JSON олдсонгүй')
    jsonStr = jsonStr.slice(start, end + 1)

    const repair = (s: string) =>
      s
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/("(?:[^"\\]|\\.)*")|\n/g, (match, str) => str ?? ' ')

    let data: any
    try { data = JSON.parse(jsonStr) }
    catch {
      try { data = JSON.parse(repair(jsonStr)) }
      catch {
        console.error('[analyze] parse failed first 200:', jsonStr.slice(0, 200))
        data = JSON.parse(closeOpenBrackets(jsonStr))
      }
    }

    // ── Read AI classification and validate ────────────────────────────────
    const validTypes: TestType[] = ['profile', 'cognitive', 'screening', 'aptitude', 'generic']
    const validDirs: ScoreDirection[] = ['high-good', 'low-good', 'profile']
    const validQuals: OutcomeQuality[] = ['positive', 'neutral', 'concerning']
    if (validTypes.includes(data.testType)) testType = data.testType
    if (validDirs.includes(data.scoreDirection)) scoreDirection = data.scoreDirection
    if (validQuals.includes(data.outcomeQuality)) outcomeQuality = data.outcomeQuality
    console.log('[analyze] AI classification:', { testType, scoreDirection, outcomeQuality })

    // Compute wellbeing + risk from AI's classification
    const wellbeingScore =
      scoreDirection === 'low-good' ? (100 - actualPct) :
      scoreDirection === 'profile'  ? (dimensions[0]?.pct ?? 50) :
      actualPct
    const actualRiskLevel: 'Low' | 'Medium' | 'High' =
      outcomeQuality === 'positive'    ? 'Low' :
      outcomeQuality === 'concerning'  ? 'High' :
      'Medium'

    // ── HARD OVERRIDE: real values are source of truth ─────────────────────
    data.testType = testType
    data.scoreDirection = scoreDirection
    data.outcomeQuality = outcomeQuality
    data.displayLabel = actualResultLabel
    data.riskLevel = actualRiskLevel
    data.summary = {
      title: actualResultLabel || data.summary?.title || 'Дүн шинжилгээ',
      description: data.summary?.description || assessmentDescription.slice(0, 200) || 'Үр дүн боловсруулагдсан.',
    }

    // healthScore drives UI ring colour — wellbeing not raw %
    data.healthScore = wellbeingScore

    if (testType === 'profile' && dimensions.length > 0) {
      // Profile tests: no single score/max — the dominant dimension IS the
      // result. Signal the UI to show a "type" hero instead of a 0-100 ring.
      data.displayScore = undefined
      data.displayMaxScore = undefined
      data.isProfile = true
      data.dominantLabel = dimensions[0].label       // e.g. "Сэтгэгч" (Plant)
      data.dominantScore = dimensions[0].score
      data.secondaryLabel = dimensions[1]?.label || ''
    } else if (actualMaxScore > 0) {
      // Score-based tests: show the RAW score the user got (e.g. "2/10")
      // even though the wellbeing ring is colored independently.
      data.displayScore = actualScore
      data.displayMaxScore = actualMaxScore
    }

    // Force dimensions metrics from real data
    if (dimensions.length >= 2) {
      data.metrics = dimensions.map(d => ({
        label: d.label,
        score: d.score,
        maxScore: d.maxScore,
        status: `${d.pct}%`,
      }))
      data.dimensions = dimensions
    } else {
      data.metrics = [{
        label: reportTitle.slice(0, 30) || 'Үр дүн',
        score: actualScore,
        maxScore: actualMaxScore,
        status: actualResultLabel || '—',
      }]
    }

    // KPI label fallback — AI-ийн өгсөн утга байвал нь хадгална, эс бөгөөс default
    const cfg = TYPE_CONFIG[testType]
    if (!data.kpiLabels || typeof data.kpiLabels !== 'object') data.kpiLabels = {}
    data.kpiLabels.metric1Label = data.kpiLabels.metric1Label || cfg.kpiLabels.metric1
    data.kpiLabels.riskLabel = data.kpiLabels.riskLabel || cfg.kpiLabels.risk
    data.kpiLabels.potentialLabel = data.kpiLabels.potentialLabel || cfg.kpiLabels.potential

    // ── Strip fabricated decimal/percent numbers from AI text fields ────────
    // AI sometimes computes percentages with floats (71.4285714%) — clamp.
    const stripBadNumbers = (s: any): string => {
      if (typeof s !== 'string') return s
      // Round floats with many decimals like 71.4285714 → 71
      return s.replace(/(\d+)\.(\d{2,})/g, (_, intPart) => intPart)
    }
    if (data.summary?.description) data.summary.description = stripBadNumbers(data.summary.description)
    if (data.highlightTitle) data.highlightTitle = stripBadNumbers(data.highlightTitle)
    if (data.highlightMessage) data.highlightMessage = stripBadNumbers(data.highlightMessage)
    if (Array.isArray(data.strengths)) data.strengths = data.strengths.map(stripBadNumbers)
    if (Array.isArray(data.risks)) data.risks = data.risks.map(stripBadNumbers)

    // ── statCards always derived server-side from REAL dimensions ──────────
    // AI was inventing "+7%, +8%" — instead we build cards from actual data.
    if (dimensions.length >= 2) {
      data.statCards = dimensions.slice(0, 4).map((d, i) => ({
        icon: ['📊', '🎯', '⭐', '🧭'][i] || '📊',
        label: d.label.slice(0, 18),
        value: `${d.score}/${d.maxScore}`,
        sub: `${d.pct}%`,
      }))
    } else if (actualMaxScore > 0) {
      // Single-score test: show just one card with the real value
      data.statCards = [{
        icon: '📊',
        label: 'Үндсэн оноо',
        value: `${actualScore}/${actualMaxScore}`,
        sub: `${actualPct}%`,
      }]
    } else {
      data.statCards = []
    }

    // ── SERVER ASSEMBLES THE PRESENTATION PLAN ─────────────────────────────
    // The AI returns compact CONTENT (headline, cards, plan, today). The server
    // builds the sections[] + chapters with correct layouts and real dimension
    // numbers. This is reliable (small AI output never truncates) and guarantees
    // the carousel + radar/bars + recovery plan + checklist always appear.
    const VALID_TONES = ['positive', 'warning', 'neutral', 'info']
    const clip = (v: any, n: number) => stripBadNumbers(String(v ?? '')).slice(0, n)

    // Chapter names by test type — distinct feel per assessment
    const chapNames = testType === 'profile'
      ? { overview: 'Таны дүр', insights: 'Гүн тал', plan: 'Хөгжүүлэх' }
      : testType === 'cognitive'
      ? { overview: 'Тойм', insights: 'Чадвар', plan: 'Дасгал' }
      : testType === 'aptitude'
      ? { overview: 'Тохирол', insights: 'Дүгнэлт', plan: 'Карьер' }
      : { overview: 'Тойм', insights: 'Дүгнэлт', plan: 'Сэргэх зам' }

    const heroTone: string = outcomeQuality === 'positive' ? 'positive' : outcomeQuality === 'concerning' ? 'warning' : 'info'
    const sections: any[] = []

    // 1) Hero — headline insight (chapter: overview)
    const hl = data.headline || {}
    sections.push({
      chapter: chapNames.overview, kind: 'key_finding', layout: 'hero',
      priority: 'critical', tone: heroTone, expanded: true, emoji: '💡',
      title: clip(hl.title || actualResultLabel || 'Таны үр дүн', 70),
      body: clip(hl.body || data.summary?.description || '', 400),
      items: [],
    })

    // 2) Dimensions viz — radar (3+) or bars (2). Numbers from REAL data only.
    if (dimensions.length >= 2) {
      const useRadar = dimensions.length >= 3
      sections.push({
        chapter: chapNames.overview, kind: 'dimensions',
        layout: useRadar ? 'radar' : 'bars', priority: 'high', tone: 'neutral',
        expanded: true, emoji: useRadar ? '🕸️' : '📊',
        title: testType === 'profile' ? 'Таны дүрийн зураглал'
          : useRadar ? 'Хэмжээсүүдийн зураглал' : 'Хэмжээсүүдийн задаргаа',
        body: '',
        items: dimensions.slice(0, 12).map(d => ({
          emoji: '', title: d.label, text: '',
          meta: testType === 'profile' ? `${d.score}` : `${d.score}/${d.maxScore}`,
          pct: d.pct,
        })),
      })
    }

    // 3) Carousel — strengths / weaknesses / advice (chapter: insights). ⭐
    const rawCards = Array.isArray(data.cards) ? data.cards : []
    const cardItems = rawCards.slice(0, 6).map((c: any) => ({
      emoji: typeof c?.emoji === 'string' ? c.emoji.slice(0, 4) : '✨',
      tone: VALID_TONES.includes(c?.tone) ? c.tone : 'info',
      title: clip(c?.title, 70),
      detail: clip(c?.detail, 360),
      tip: clip(c?.tip, 130),
      meta: clip(c?.meta, 28),
      text: '',
    })).filter((c: any) => c.title || c.detail)

    // Safety net: if the AI returned too few cards but we have dimensions,
    // synthesize one card per dimension so the advice carousel NEVER vanishes
    // on multi-dimension tests (sleep, burnout, etc).
    if (cardItems.length < 2 && dimensions.length >= 2) {
      const isLowGood = scoreDirection === 'low-good'
      for (const d of dimensions.slice(0, 4)) {
        // For low-good tests high pct = concern; for others high pct = strength
        const high = d.pct >= 50
        const tone = isLowGood ? (high ? 'warning' : 'positive') : (high ? 'positive' : 'warning')
        cardItems.push({
          emoji: tone === 'positive' ? '💪' : tone === 'warning' ? '🎯' : '💡',
          tone,
          title: clip(d.label, 70),
          detail: clip(`Энэ хэмжээст ${d.score}/${d.maxScore} оноо авсан байна. ${tone === 'warning' ? 'Энэ чиглэлд анхаарал хандуулах нь зүйтэй.' : 'Энэ нь таны давуу тал юм.'}`, 360),
          tip: '',
          meta: clip(d.label, 28),
          text: '',
        })
      }
    }

    if (cardItems.length >= 2) {
      sections.push({
        chapter: chapNames.insights, kind: 'strengths_weaknesses', layout: 'carousel',
        priority: 'high', tone: 'neutral', expanded: true, emoji: '💡',
        title: 'Давуу тал, зөвлөгөө', body: '',
        items: cardItems,
      })
    }

    // 4) Recovery / development plan — timeline (chapter: plan)
    const rawPlan = Array.isArray(data.plan) ? data.plan : []
    const planItems = rawPlan.slice(0, 4).map((p: any, i: number) => ({
      emoji: '', title: clip(p?.title, 60), text: clip(p?.text, 160),
      meta: `${i + 1}-р алхам`,
    })).filter((p: any) => p.title)
    if (planItems.length >= 2) {
      sections.push({
        chapter: chapNames.plan, kind: 'plan', layout: 'timeline',
        priority: 'high', tone: 'info', expanded: true, emoji: '🗺️',
        title: testType === 'profile' ? 'Хөгжүүлэх алхмууд' : 'Цаашид юу хийх вэ',
        body: '', items: planItems,
      })
    }

    // 5) Today's checklist (chapter: plan) — test-specific, never generic
    const rawToday = Array.isArray(data.today) ? data.today : []
    let todayItems = rawToday.slice(0, 3).map((t: any) => ({ emoji: '', title: clip(t, 90), text: '', meta: '' })).filter((t: any) => t.title)
    // Fallback ladder: AI today → card tips → plan steps → generic. Card tips
    // and plan steps are already test-specific actionable content.
    if (todayItems.length < 3) {
      const tipPool = [
        ...cardItems.map((c: any) => c.tip).filter(Boolean),
        ...planItems.map((p: any) => p.title).filter(Boolean),
      ]
      for (const tip of tipPool) {
        if (todayItems.length >= 3) break
        if (todayItems.some((t: any) => t.title === clip(tip, 90))) continue
        todayItems.push({ emoji: '', title: clip(tip, 90), text: '', meta: '' })
      }
    }
    if (todayItems.length < 1) {
      todayItems = [
        { emoji: '', title: 'Үр дүнгээ дахин уншиж эргэцүүлэх', text: '', meta: '' },
        { emoji: '', title: 'Нэг тодорхой зорилго сонгох', text: '', meta: '' },
        { emoji: '', title: 'AI-аас нэмэлт зөвлөгөө асуух', text: '', meta: '' },
      ]
    }
    sections.push({
      chapter: chapNames.plan, kind: 'next_steps', layout: 'checklist',
      priority: 'high', tone: 'positive', expanded: true, emoji: '✅',
      title: 'Өнөөдрийн алхам', body: '',
      items: todayItems,
    })

    data.sections = sections
    if (typeof data.opening === 'string') data.opening = stripBadNumbers(data.opening).slice(0, 300)

    // ── Legacy field synthesis (AnalysisCard preview compatibility) ─────────
    data.roadmap = planItems.length
      ? planItems.map((p: any, i: number) => ({ week: p.meta || `${i + 1}-р алхам`, title: p.title, tasks: p.text ? [p.text] : [] }))
      : data.roadmap
    data.todayGoals = todayItems.length ? todayItems.map((t: any) => t.title) : data.todayGoals
    if (cardItems.length) {
      data.strengths = cardItems.filter((c: any) => c.tone === 'positive').map((c: any) => `${c.title}: ${c.detail}`).slice(0, 4)
      data.risks = cardItems.filter((c: any) => c.tone === 'warning').map((c: any) => `${c.title}: ${c.detail}`).slice(0, 4)
    }

    // ── Defaults ────────────────────────────────────────────────────────────
    if (!data.summary) data.summary = { title: 'Дүн шинжилгээ', description: 'Үр дүн боловсруулагдсан.' }
    if (!Array.isArray(data.strengths)) data.strengths = []
    if (!Array.isArray(data.risks)) data.risks = []
    if (!Array.isArray(data.insights)) data.insights = []
    if (!Array.isArray(data.roadmap) || data.roadmap.length === 0) {
      data.roadmap = [
        { week: '1-р долоо хоног', title: 'Эхлэлийн алхам', tasks: ['Үр дүнгээ үзэх'] },
        { week: '2-р долоо хоног', title: 'Дадал хэвшүүлэх', tasks: ['Шинэ дадал эхлүүлэх'] },
        { week: '3-р долоо хоног', title: 'Тогтворжуулах', tasks: ['Үргэлжлүүлэх'] },
        { week: '4-р долоо хоног', title: 'Үр дүн', tasks: ['Шинжлэх'] },
      ]
    }
    if (!Array.isArray(data.todayGoals) || data.todayGoals.length === 0) {
      data.todayGoals = data.roadmap[0]?.tasks?.slice(0, 3) || ['Үр дүнгээ үзэх', 'Зорилго тодорхойлох', 'Дараагийн алхам төлөвлөх']
    }
    if (!data.riskLevel) data.riskLevel = actualRiskLevel
    if (!data.quitPotential) data.quitPotential = 'Medium'

    return Response.json({ success: true, data })
  } catch (error) {
    console.error('[analyze]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Шинжилгээ хийхэд алдаа гарлаа' },
      { status: 500 }
    )
  }
}
