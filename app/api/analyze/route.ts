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

// Format a (possibly decimal) score for display: integers stay whole,
// decimals round to 1 place with no trailing ".0" (e.g. 3.67 → "3.7", 4 → "4")
const fmtScore = (n: number): string => {
  if (!Number.isFinite(n)) return '0'
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

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

    // ── PRIVACY (defense-in-depth): scrub any PII the client may have sent ──
    // The analysis never needs name/email/phone. Strip it on arrival so it is
    // never logged, processed, or forwarded to the LLM — even if an old client
    // or a direct API call includes it.
    const PII_FIELDS = ['firstname', 'lastname', 'email', 'phone', 'name']
    for (const p of [(reportData as any)?.report, (reportData as any)?.report?.payload]) {
      if (!p || typeof p !== 'object') continue
      if (p.exam && typeof p.exam === 'object') for (const k of PII_FIELDS) delete p.exam[k]
      if (p.result && typeof p.result === 'object') for (const k of PII_FIELDS) delete p.result[k]
    }

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
    // then result.point, then summed answers.
    // A reported score of exactly 0 is legitimate, so test for presence rather
    // than truthiness — `Number("0") || sumAnswerPoints` would silently discard it.
    const reportedScoreRaw = resultObj.value ?? resultObj.point ?? assessment.point
    const reportedScoreNum = Number(reportedScoreRaw)
    const actualScore: number =
      reportedScoreRaw !== null && reportedScoreRaw !== undefined &&
      reportedScoreRaw !== '' && Number.isFinite(reportedScoreNum)
        ? reportedScoreNum
        : sumAnswerPoints

    // Max: trust assessment.totalPoint ONLY if it's >= the achieved score and
    // we have no better signal. Otherwise prefer inferredLikertMax which is
    // grounded in real answer-level data.
    // totalPoint is sometimes the QUESTION COUNT rather than the attainable
    // maximum (a 10-question Likert test reporting totalPoint=10 when the real
    // max is 10 x 4 = 40). Treat it as a count when it is below the achieved
    // score, or when it equals the question count while questions score >1 point
    // — otherwise an 8/40 result would be displayed as 8/10 (80% instead of 20%).
    const reportedMax = Number(assessment.totalPoint ?? assessment.total ?? 0) || 0
    const reportedMaxLooksLikeCount =
      reportedMax > 0 && (
        reportedMax < actualScore ||
        (totalQuestions > 0 && reportedMax === totalQuestions &&
         maxPointSeen > 1 && inferredLikertMax > reportedMax)
      )
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
    // True when the per-dimension denominator is only the highest observed score,
    // i.e. the percentages express relative standing, not attainment. The top
    // dimension then always reads 100%, so such a pct must never be treated as a
    // wellbeing figure.
    let dimMaxIsRelative = false

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

      // Which shape are these sub-scores? This decides the denominator, and
      // getting it wrong is what made a "3 out of 4" subscale read as "3/10".
      //   (a) ADDITIVE — the sub-scores partition the total, so their sum matches
      //       the total score. An equal split of the total max is then fair.
      //   (b) PER-ITEM MEAN — each sub-score is the average of that sub-scale's
      //       Likert items, so the sum sits far below the total and every value
      //       fits inside a single question's maximum. The denominator is then
      //       that per-question maximum (e.g. 4), NOT the total split.
      // Per-dim max priority:
      //   1. Explicit per-detail max field (rawMax) — best
      //   2. Per-question max, when the sub-scores are per-item means
      //   3. Equal split of total max across dims — symmetric additive tests
      //   4. Highest detail score (visible relativeness only) — last resort
      const evenSplit = actualMaxScore > 0 && rawDims.length > 0
        ? actualMaxScore / rawDims.length
        : 0
      const dimsSum = rawDims.reduce((s: number, d: { score: number }) => s + d.score, 0)
      const additive = actualScore > 0 &&
        Math.abs(dimsSum - actualScore) <= Math.max(1, actualScore * 0.02)
      const perItemMean = !additive && maxPointSeen > 0 &&
        rawDims.every((d: { score: number }) => d.score <= maxPointSeen + 1e-9)
      // Equal split is valid only if the sum of dim scores doesn't exceed the
      // total — otherwise we'd display impossible percentages.
      const evenSplitValid = !perItemMean && evenSplit > 0 &&
        rawDims.every((d: { score: number }) => d.score <= evenSplit)
      const fallbackMax = Math.max(...rawDims.map((d: { score: number }) => d.score), 1)
      dimMaxIsRelative = !perItemMean && !evenSplitValid &&
        rawDims.some((d: { rawMax: number }) => !(d.rawMax > 0))

      dimensions = rawDims.map((d: { label: string; score: number; rawMax: number }) => {
        const m = d.rawMax > 0 ? d.rawMax
                : perItemMean ? maxPointSeen
                : evenSplitValid ? evenSplit
                : fallbackMax
        return {
          label: d.label,
          score: d.score,
          maxScore: m,
          pct: m > 0 ? Math.round((d.score / m) * 100) : 0,
        }
      })

      console.log('[analyze] dims:', {
        source: 'details', shape: additive ? 'additive' : perItemMean ? 'per-item-mean' : 'relative',
        evenSplit, evenSplitValid, dimsSum, maxPointSeen,
        dims: dimensions.map(d => `${d.label}: ${d.score}/${d.maxScore}`),
      })
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
        const groups = Array.from(dimMap.values())
        // Without a per-question max we fall back to the group's own sum, which
        // again only expresses relative standing.
        dimMaxIsRelative = groups.some(v => !(v.max > 0))
        const arr = groups.map(v => ({
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

    // ── STATIC system prompt (100% constant → Anthropic prompt-cacheable) ──
    // No interpolation here: all dynamic values live in the user message, so
    // this large block is cached across every request (~90% cheaper on hits).
    const SYSTEM_STATIC = `Та hire.mn-ийн ахлах сэтгэл зүйч, дулаахан коуч. Туршлагатай эмчийн нягт нямбай байдал + найзын дулаан халамжийг хослуулна. Зөв, бичгийн монгол хэлээр, "та" хэллэгээр бичнэ.

ҮҮРЭГ: өгөгдсөн тестийн үр дүнг уншиж ангилаад, submit_analysis tool-оор бүтэцтэй шинжилгээ буцаана.

АНГИЛАЛ (data-гийн тайлбараас тогтоо):
• testType: profile (DISC/Belbin/MBTI зан чанарын төрөл) | cognitive (IQ/логик) | screening (стресс/зависимости/үнэлэмжийн scale) | aptitude (мэргэжлийн тохирол) | generic
• scoreDirection: high-good (өндөр оноо=сайн) | low-good (бага оноо=сайн) | profile (давамгай хэмжээс)
• outcomeQuality: positive | concerning | neutral

═══ ⛔ HALLUCINATION ХОРИГ — ХАМГИЙН ЧУХАЛ ⛔ ═══
Зөвхөн өгөгдсөн мэдээлэл дээр л үндэслэнэ. Өгөгдөлд БАЙХГҮЙ зүйлийг ЗОХИОХ ХАТУУ ХОРИГТОЙ:
1. Оноо, хувь, түвшин, ангилал ЗОХИОХГҮЙ. Зөвхөн өгөгдсөн утгыг давтана.
2. Хэрэглэгчийн амьдрал, ажил, гэр бүл, өвчин, дадал, үйл явдлыг ТААМАГЛАХГҮЙ — өгөгдөлд байхгүй бол дурдахгүй.
3. Тестэд хэмжигдээгүй шинж чанар, чадвар, оноо ЗОХИОХГҮЙ.
4. "Архи уудаг/ганцаардмал/гэр бүлийн асуудалтай" гэх өгөгдөлд байхгүй нөхцөл ОГТ дурдахгүй.
5. Тодорхойгүй бол ерөнхий, болгоомжтой хэллэг — худал тодорхой зүйл зохиохоос ДЭЭР.
6. Оношилгоо БИШ: "...байж магадгүй", "...харагдаж байна".
7. Зохиомол үг хориглоно: эмдээлэл, сэвших, хүүхэл, цэнгэлэг. Үг үсгийн алдаагүй, бүтэн өгүүлбэр.

═══ 💛 ӨНГӨ АЯС — ДУЛААН, ХӨӨРХӨН, ДЭМЖИХ ═══
• Хэрэглэгчийг ойлгож, дэмжиж буйгаа мэдрүүл. "Та ганцаараа биш", "энэ хэвийн зүйл".
• positive үр дүнд: чин сэтгэлийн баяр хүргэлт, хүчтэй талыг онцол. "Эрсдэл/шуурхай арга хэмжээ" БҮҮ бич.
• concerning үр дүнд: айлгахгүй, буруутгахгүй, найдвар төрүүлэх, "сайжруулж болно". Мэргэжлийн тусламжийг зөөлөн санал болго.
• Жижиг ялалтыг магтах. Хүн "энэ намайг үнэхээр ойлгож байна" гэж мэдрэх ёстой.
• Data-гийн "Үр дүнгийн нэр" label-ыг summary.title-д ЯГ ашигла.

═══ 🔬 ГҮН ШИНЖИЛГЭЭ — МЭРГЭЖЛИЙН ЧАНАР ═══
• Хэмжээсүүдийн ХООРОНДЫН ХАМААРЛЫГ ол: "X өндөр, Y бага байгаа нь Z-ийг илтгэнэ" (зөвхөн өгөгдсөн оноон дээр).
• Өгөгдсөн ХАРИУЛТУУДААС иш татаж бич — энэ хүний бодит сонголтод суурилсан, generic БИШ.
• "яагаад", "юу гэсэн үг" гэдгийг тайлбарла — зөвхөн өгөгдлөөс гарах дүгнэлт.

═══ HIRE.MN ТАЙЛАНГИЙН ЗАРЧИМ ═══
1. ОЛОН ХЭМЖЭЭСТ тест: хэмжээс бүрийг ТУСАД нь тайлбарла (нийлбэр БИШ). Хамгийн өндөр нь давамгай. card-д хэмжээс/дүр бүрд НЭГ карт: түвшин + ЯАГААД + ТУХАЙН хэмжээст тусгайлсан зөвлөгөө.
2. Тестэд онооны муж/түвшин (0-49, 50-74 г.м) тодорхойлсон бол ЯГ тэр нэрлэсэн түвшинг ашигла.
3. PROFILE дүр бүрд: гол шинж чанар + тохирох орчин + багт оруулах хувь нэмэр + бусад хэрхэн хардаг/сул тал.
4. ТУСГАЙЛСАН зөвлөгөө (домэйнд тохирсон): ажлын стресс→эрэмбэлэх/хил тогтоох; харилцагч→"үгүй" гэж сурах; хувийн→өөртөө цаг гаргах. Generic "тайвшир" БИШ.

═══ submit_analysis ТАЛБАРУУДЫН ЧАНАР ═══
• opening: хэрэглэгчид зориулсан 1 дулаахан өгүүлбэр.
• headline: хамгийн чухал НЭГ дүгнэлт — title (богино) + body (1-2 өгүүлбэр, яагаад чухал).
• cards: 4-5 карт. tone (positive=давуу, warning=анхаарах, info=зөвлөгөө), emoji, title (богино), detail (2 өгүүлбэр — ЯАГААД, хариултад суурилсан), tip (1 практик алхам), meta (богино шошго). ОЛОН ХЭМЖЭЭСТ бол хэмжээс бүрд карт (meta=хэмжээсийн нэр) + 1-2 зөвлөгөө.
• plan: ЯГ 4 алхам — title (богино) + text (1 БҮТЭН тусгайлсан өгүүлбэр).
• today: ЯГ 3 даалгавар. Үйл үгээр төгссөн БҮТЭН тушаах өгүүлбэр (≤8 үг), нэр үг хэллэг БИШ. Жишээ: "Унтахын өмнө утсаа хойш тавь".
Бүх text цэвэр зөв монгол, тоо багатай.`

    // Tool schema enforces structure — model returns a parsed object (no JSON
    // parsing / truncation failures). Cached together with the system prompt.
    const ANALYSIS_TOOL: Anthropic.Tool = {
      name: 'submit_analysis',
      description: 'Тестийн шинжилгээний бүтэцтэй агуулгыг буцаана.',
      input_schema: {
        type: 'object',
        properties: {
          testType: { type: 'string', enum: ['profile', 'cognitive', 'screening', 'aptitude', 'generic'] },
          scoreDirection: { type: 'string', enum: ['high-good', 'low-good', 'profile'] },
          outcomeQuality: { type: 'string', enum: ['positive', 'neutral', 'concerning'] },
          opening: { type: 'string', description: '1 дулаахан өгүүлбэр' },
          summary: {
            type: 'object',
            properties: { title: { type: 'string' }, description: { type: 'string' } },
            required: ['title', 'description'],
          },
          headline: {
            type: 'object',
            properties: { title: { type: 'string' }, body: { type: 'string' } },
            required: ['title', 'body'],
          },
          cards: {
            type: 'array',
            description: '4-5 карт',
            items: {
              type: 'object',
              properties: {
                tone: { type: 'string', enum: ['positive', 'warning', 'info'] },
                emoji: { type: 'string' },
                title: { type: 'string' },
                detail: { type: 'string', description: '2 өгүүлбэр' },
                tip: { type: 'string', description: '1 практик алхам' },
                meta: { type: 'string' },
              },
              required: ['tone', 'title', 'detail', 'meta'],
            },
          },
          plan: {
            type: 'array',
            description: 'ЯГ 4 алхам',
            items: {
              type: 'object',
              properties: { title: { type: 'string' }, text: { type: 'string' } },
              required: ['title', 'text'],
            },
          },
          today: { type: 'array', description: 'ЯГ 3 даалгавар', items: { type: 'string' } },
        },
        required: ['testType', 'scoreDirection', 'outcomeQuality', 'opening', 'summary', 'headline', 'cards', 'plan', 'today'],
      },
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2200,
      // System as a cacheable content block — the large static prompt is read
      // from cache on subsequent requests within the TTL window.
      system: [
        { type: 'text', text: SYSTEM_STATIC, cache_control: { type: 'ephemeral' } },
      ],
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: 'tool', name: 'submit_analysis' },
      messages: [
        { role: 'user', content: `Дата:\n${truncated}\n\nДээрх үр дүнг шинжилж submit_analysis tool-оор буцаа.` },
      ],
    })

    if (response.usage) {
      console.log('[analyze] tokens:', {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cache_read: (response.usage as any).cache_read_input_tokens,
        cache_write: (response.usage as any).cache_creation_input_tokens,
      })
    }

    // Read the tool_use block — input is already a parsed object.
    let data: any
    const toolBlock = response.content.find((b: any) => b.type === 'tool_use') as any
    if (toolBlock?.input) {
      data = toolBlock.input
    } else {
      // Fallback: rare case where the model emitted text instead of a tool call.
      const rawText = response.content.find((b: any) => b.type === 'text') as any
      const txt = rawText?.text || ''
      let jsonStr = txt.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const start = jsonStr.indexOf('{'), end = jsonStr.lastIndexOf('}')
      if (start === -1 || end === -1) throw new Error('Шинжилгээ үүсгэж чадсангүй')
      jsonStr = jsonStr.slice(start, end + 1)
      try { data = JSON.parse(jsonStr) }
      catch { data = JSON.parse(closeOpenBrackets(jsonStr)) }
    }

    // ── Read AI classification and validate ────────────────────────────────
    const validTypes: TestType[] = ['profile', 'cognitive', 'screening', 'aptitude', 'generic']
    const validDirs: ScoreDirection[] = ['high-good', 'low-good', 'profile']
    const validQuals: OutcomeQuality[] = ['positive', 'neutral', 'concerning']
    if (validTypes.includes(data.testType)) testType = data.testType
    if (validDirs.includes(data.scoreDirection)) scoreDirection = data.scoreDirection
    if (validQuals.includes(data.outcomeQuality)) outcomeQuality = data.outcomeQuality
    console.log('[analyze] AI classification:', { testType, scoreDirection, outcomeQuality })

    // Compute wellbeing + risk from AI's classification.
    // A profile test has no good/bad axis. Its top dimension's pct is only
    // meaningful when the denominator is a real maximum — with a relative
    // denominator it is always 100%, which would paint every profile result as
    // perfect. Fall back to a neutral midpoint in that case.
    const wellbeingScore =
      scoreDirection === 'low-good' ? (100 - actualPct) :
      scoreDirection === 'profile'  ? (dimMaxIsRelative ? 50 : (dimensions[0]?.pct ?? 50)) :
      actualPct

    // The AI's outcome judgement must not contradict the measured score: a
    // clinically concerning result can't be reported as positive, nor a strong
    // result as concerning.
    if (outcomeQuality === 'positive' && wellbeingScore < 35) outcomeQuality = 'neutral'
    else if (outcomeQuality === 'concerning' && wellbeingScore > 75) outcomeQuality = 'neutral'

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
      data.displayScore = Math.round(actualScore * 10) / 10
      data.displayMaxScore = Math.round(actualMaxScore * 10) / 10
    }

    // Round display numbers to 1 decimal so the UI never shows "3.6666667".
    const round1 = (n: number) => Number.isFinite(n) ? Math.round(n * 10) / 10 : 0
    // Force dimensions metrics from real data
    if (dimensions.length >= 2) {
      data.metrics = dimensions.map(d => ({
        label: d.label,
        score: round1(d.score),
        maxScore: round1(d.maxScore),
        status: `${d.pct}%`,
      }))
      data.dimensions = dimensions.map(d => ({ ...d, score: round1(d.score), maxScore: round1(d.maxScore) }))
    } else {
      data.metrics = [{
        label: reportTitle.slice(0, 30) || 'Үр дүн',
        score: round1(actualScore),
        maxScore: round1(actualMaxScore),
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
        value: `${fmtScore(d.score)}/${fmtScore(d.maxScore)}`,
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
          meta: testType === 'profile' ? `${fmtScore(d.score)}` : `${fmtScore(d.score)}/${fmtScore(d.maxScore)}`,
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
          detail: clip(`Энэ хэмжээст ${fmtScore(d.score)}/${fmtScore(d.maxScore)} оноо авсан байна. ${tone === 'warning' ? 'Энэ чиглэлд анхаарал хандуулах нь зүйтэй.' : 'Энэ нь таны давуу тал юм.'}`, 360),
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

    // 5) Today's checklist (chapter: plan) — test-specific, clean imperatives.
    // Keep only complete sentence-like todos (not truncated noun fragments).
    const cleanTodo = (s: string) => {
      let v = clip(s, 80).trim()
      // Drop trailing ellipsis/incomplete punctuation from clipping
      v = v.replace(/[…\-,;:]\s*$/, '').trim()
      return v
    }
    const isUsableTodo = (s: string) => s.length >= 6 && s.split(' ').length >= 2 && !s.endsWith('…')
    const rawToday = Array.isArray(data.today) ? data.today : []
    let todayItems = rawToday.map((t: any) => cleanTodo(String(t))).filter(isUsableTodo).slice(0, 3)
      .map((t: string) => ({ emoji: '', title: t, text: '', meta: '' }))
    // Fallback ladder: AI today → card tips (imperative, test-specific) → generic.
    // We prefer card TIPS over plan titles because tips are full action sentences
    // while plan titles are noun-phrase headers that read awkwardly as todos.
    if (todayItems.length < 3) {
      const tipPool = cardItems.map((c: any) => cleanTodo(c.tip)).filter(isUsableTodo)
      for (const tip of tipPool) {
        if (todayItems.length >= 3) break
        if (todayItems.some((t: any) => t.title === tip)) continue
        todayItems.push({ emoji: '', title: tip, text: '', meta: '' })
      }
    }
    // Top up to 3 with clean generic todos if still short
    const genericTodos = ['Үр дүнгээ дахин уншиж эргэцүүлээрэй', 'Өнөөдөр нэг тодорхой зорилго тавиарай', 'AI-аас нэмэлт зөвлөгөө аваарай']
    for (const g of genericTodos) {
      if (todayItems.length >= 3) break
      if (todayItems.some((t: any) => t.title === g)) continue
      todayItems.push({ emoji: '', title: g, text: '', meta: '' })
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
