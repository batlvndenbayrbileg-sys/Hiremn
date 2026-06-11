import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

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
    // Top 5 highest-scoring answers — enough context, keeps prompt fast
    flatAnswers.sort((a, b) => b.p - a.p)
    const sampleAnswers = flatAnswers.slice(0, 5)
      .map((x, i) => `${i + 1}. [${x.p}] ${x.q} → ${x.a}`)
      .join('\n')


    const truncated = `Тестийн нэр: ${reportTitle}
Зохиогч: ${assessmentAuthor || '—'}
Тайлбар: ${assessmentDescription.slice(0, 500)}
Зориулалт: ${assessmentUsage.slice(0, 300)}
Хэмжих зүйл: ${assessmentMeasure.slice(0, 300)}

═══ БОДИТ ҮР ДҮН ═══
Үр дүнгийн нэр: "${actualResultLabel || 'тодорхойгүй'}"
${actualMaxScore > 0 ? `Нийт оноо: ${actualScore}/${actualMaxScore} (${actualPct}%)` : ''}

═══ DIMENSION ОНОО ═══
${dimensions.length > 0 ? dimensions.slice(0, 12).map(d => `• ${d.label}: ${d.score}/${d.maxScore} (${d.pct}%)`).join('\n') : '—'}

═══ ХАМГИЙН ӨНДӨР ҮНЭЛГЭЭТЭЙ ХАРИУЛТУУД (контекстэд ашиглах) ═══
${sampleAnswers || '—'}`

    const SYSTEM = `Та hire.mn-ийн мэргэжлийн сэтгэл зүйч, коуч AI. Эерэг, эмпатитэй, мэргэжлийн өнгөөр зөв монгол хэлээр бичнэ.

ТЕСТ: "${reportTitle}"

АНГИЛАЛ — description уншаад тогтоо:
• testType: profile | cognitive | screening | aptitude | generic
• scoreDirection: high-good | low-good | profile
• outcomeQuality: positive | concerning | neutral

═══ ХАМГИЙН ЧУХАЛ — ТОО ЗОХИОХЫГ ХОРИГЛОНО ═══
1. ХУВЬ ХЭМЖЭЭ: text дотор хувь хэмжээ ОРУУЛБОЛ зөвхөн БҮХЭЛ ТОО (71% ✅, 71.43% ❌, 633.33% ❌)
2. SCORE үнэлгээ: зөвхөн БОДИТ оноог л давтан бич ("${actualScore}/${actualMaxScore}" эсвэл dimension утгуудыг)
3. ХҮВ "+7%, +12%" гэх ЗОХИОМОЛ хувь хэмжээ БҮҮ зохио — БОДИТ data байхгүй бол хувь хэмжээ хий
4. highlightMessage / summary / insight зэрэг text-д тоо оруулахаасаа ТАТГАЛЗ — зөвхөн semantic үг ашигла

═══ МОНГОЛ ХЭЛНИЙ ЧАНАР ═══
5. Зөв, бичигийн хэлээр (хүндэтгэлийн өнгөөр)
6. Зохиосон үг хориглоно: эмдээлэл, эмдлүүлэх, сэвших, хүүхэл, цэнгэлэг, амандуу
7. Оношилгоо БИШ: "...магадгүй", "...болзошгүй", "...харагдаж байна"
8. label "${actualResultLabel || ''}" ЯГ ашигла, өөрчилбөл буруу
9. positive үр дүнд: баяр хүргэх өнгө, "эрсдэл/шуурхай арга хэмжээ" БҮҮ ашигла
10. concerning үр дүнд: эмпатитэй, мэргэжлийн тусламж зөвлө

═══ AGRARRA SECTIONS ═══
• strengths/risks: ЯГ 4 ширхэг тус бүр, "Гарчиг: тайлбар" ≤12 үг
• insights: 3 ширхэг
• roadmap: ҮРГЭЛЖ 4 долоо хоног (тестэд тохирсон ТОДОРХОЙ алхмууд)
• todayGoals: ҮРГЭЛЖ 3 ширхэг өнөөдрийн зорилго
• statCards: 4 ширхэг — label нь өгөгдсөн dimension/ангилалын нэр, value нь "оноо/max" хэлбэртэй БОДИТ тоо (БҮҮ "+7%" зохио)

JSON буцаа ({ -ээр эхэл):
{"testType":"...","scoreDirection":"...","outcomeQuality":"...","summary":{"title":"${actualResultLabel || 'Дүн'}","description":"<1 өгүүлбэр тоогүй>"},"highlightTitle":"<гарчиг>","highlightMessage":"<1 өгүүлбэр тоогүй>","strengths":["<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>"],"risks":["<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>"],"insights":[{"emoji":"<e>","title":"<гарчиг>","description":"<1 өгүүлбэр>","detail":"<1 өгүүлбэр>","actions":["<алхам>","<алхам>","<алхам>"]},{"emoji":"<e>","title":"<гарчиг>","description":"<1 өгүүлбэр>","detail":"<1 өгүүлбэр>","actions":["<алхам>","<алхам>","<алхам>"]},{"emoji":"<e>","title":"<гарчиг>","description":"<1 өгүүлбэр>","detail":"<1 өгүүлбэр>","actions":["<алхам>","<алхам>","<алхам>"]}],"roadmap":[{"week":"1-р долоо хоног","title":"<товч>","tasks":["<товч>"]},{"week":"2-р долоо хоног","title":"<товч>","tasks":["<товч>"]},{"week":"3-р долоо хоног","title":"<товч>","tasks":["<товч>"]},{"week":"4-р долоо хоног","title":"<товч>","tasks":["<товч>"]}],"todayGoals":["<товч>","<товч>","<товч>"],"kpiLabels":{"metric1Label":"<нэр>","riskLabel":"<нэр>","potentialLabel":"<нэр>"}}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      system: SYSTEM,
      messages: [
        { role: 'user', content: `Дата:\n${truncated}` },
        { role: 'assistant', content: '{' },
      ],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    let jsonStr = '{' + rawText
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
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
      // Profile tests: no single score/max to display
      data.displayScore = undefined
      data.displayMaxScore = undefined
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

    // ── Roadmap + todayGoals ALWAYS present (user expects this section) ────
    if (!Array.isArray(data.summary)) {/* no-op */}
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
