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

// ── Test type detection ──────────────────────────────────────────────────
// We classify tests by structural signals in the result payload, not by name.
type TestType = 'profile' | 'cognitive' | 'screening' | 'aptitude' | 'generic'

function detectTestType(opts: {
  assessment: any
  result: any
  details: Array<{ value: string; cause: number }>
  resultLabel: string
  pct: number
}): TestType {
  const { assessment, details, resultLabel } = opts
  const name = (assessment?.name || '').toLowerCase()
  const desc = (assessment?.description || '').toLowerCase()
  const usage = (assessment?.usage || '').toLowerCase()
  const combined = `${name} ${desc} ${usage}`

  // Profile/personality — 4+ named dimensions with comparable scores
  // (Belbin 9 roles, DISC 4, Big5 5, MBTI 4 dichotomies, Holland 6)
  if (details.length >= 4) return 'profile'

  // Screening — addiction, stress, depression, anxiety, burnout keywords
  if (/(зависим|архи|тамхи|стресс|сэтгэл.*гутрал|түгш|burnout|хамаарал|депресс|анхаарал.*алда)/.test(combined)) {
    return 'screening'
  }

  // Cognitive — IQ, logic, memory, attention, reasoning keywords
  if (/(iq|логик|оюун|танин мэдэхүй|санах|анхаарал|шуурхай|тооцоо|reasoning)/.test(combined)) {
    return 'cognitive'
  }

  // Aptitude — career, profession, skill, interest, vocational
  if (/(мэргэжил|карьер|ур чадвар|сонирхол|чиглэл|career|vocational|aptitude|holland)/.test(combined)) {
    return 'aptitude'
  }

  // Profile with 2-3 dimensions still counts
  if (details.length >= 2) return 'profile'

  return 'generic'
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
    const actualScore: number = Number(resultObj.point ?? resultObj.value ?? assessment.point ?? 0) || 0
    const actualMaxScore: number = Number(resultObj.total ?? assessment.totalPoint ?? assessment.total ?? 0) || 0
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

    if (Array.isArray(resultObj.details) && resultObj.details.length > 0) {
      // Use server-computed dimension scores. Each item: { value, cause, ... }
      const rawDims = resultObj.details
        .map((d: any) => ({
          label: String(d.value || '').trim(),
          score: Number(d.cause ?? d.point ?? 0) || 0,
        }))
        .filter((d: any) => d.label && d.score >= 0)
      const maxDimScore = Math.max(...rawDims.map((d: { score: number }) => d.score), 1)
      dimensions = rawDims.map((d: { label: string; score: number }) => ({
        label: d.label,
        score: d.score,
        maxScore: maxDimScore,
        pct: Math.round((d.score / maxDimScore) * 100),
      }))
    }

    // Fallback: derive dimensions from answers grouped by questionCategory
    if (dimensions.length === 0 && Array.isArray(answersGrouped) && answersGrouped.length > 1) {
      const dimMap = new Map<string, { sum: number; count: number }>()
      for (const grp of answersGrouped) {
        const catId = grp?.questionCategoryId ?? 'misc'
        const sum = (grp?.answers || []).reduce((acc: number, a: any) => acc + (Number(a?.point) || 0), 0)
        const cur = dimMap.get(String(catId)) || { sum: 0, count: 0 }
        cur.sum += sum
        cur.count += grp?.answers?.length || 0
        dimMap.set(String(catId), cur)
      }
      if (dimMap.size >= 2) {
        const arr = Array.from(dimMap.entries()).map(([label, v]) => ({ label: `Бүлэг ${label}`, score: v.sum }))
        const maxDimScore = Math.max(...arr.map(d => d.score), 1)
        dimensions = arr.map(d => ({
          label: d.label,
          score: d.score,
          maxScore: maxDimScore,
          pct: Math.round((d.score / maxDimScore) * 100),
        }))
      }
    }

    // Sort dimensions descending so highest is first
    dimensions.sort((a, b) => b.score - a.score)

    // ── Detect test type ──────────────────────────────────────────────────
    const testType = detectTestType({
      assessment,
      result: resultObj,
      details: dimensions.map(d => ({ value: d.label, cause: d.score })),
      resultLabel: actualResultLabel,
      pct: actualPct,
    })
    const cfg = TYPE_CONFIG[testType]
    console.log('[analyze] testType:', testType, '| dimensions:', dimensions.length, '| label:', actualResultLabel, '| pct:', actualPct)

    // ── Risk level (only for screening types) ──────────────────────────────
    const lowerLabel = actualResultLabel.toLowerCase()
    let actualRiskLevel: 'Low' | 'Medium' | 'High' = 'Medium'
    if (cfg.hasRiskFraming) {
      if (lowerLabel.includes('бага') || lowerLabel.includes('сул') || actualPct <= 33) actualRiskLevel = 'Low'
      else if (lowerLabel.includes('их') || lowerLabel.includes('өндөр') || lowerLabel.includes('хүнд') || actualPct >= 67) actualRiskLevel = 'High'
    } else {
      // For non-screening: "risk" field becomes "growth area" — invert semantics
      actualRiskLevel = actualPct >= 67 ? 'Low' : actualPct >= 34 ? 'Medium' : 'High'
    }

    // ── Build compact deep context for the AI ─────────────────────────────
    // Send dimension scores (primary signal), top answers, assessment metadata.
    // Question/answer text gives AI substance for nuanced insights.
    const dimSummary = dimensions.length > 0
      ? dimensions.map(d => `${d.label}: ${d.score}`).join(', ')
      : '(нэг хэмжээст)'

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
    // Take top-scored answers + a few diverse samples to stay under token budget
    flatAnswers.sort((a, b) => b.p - a.p)
    const topAnswers = flatAnswers.slice(0, 8)
    const sampleAnswers = topAnswers
      .map((x, i) => `${i + 1}. [${x.p}] ${x.q} → ${x.a}`)
      .join('\n')

    const truncated = `Тестийн нэр: ${reportTitle}
Зохиогч: ${assessmentAuthor || '—'}
Тестийн төрөл (autodetect): ${testType}
Тайлбар: ${assessmentDescription.slice(0, 400)}
Зориулалт: ${assessmentUsage.slice(0, 200)}
Хэмжих зүйл: ${assessmentMeasure.slice(0, 200)}

═══ БОДИТ ҮР ДҮН (АНТЫ ӨӨРЧИЛБӨЛ БУРУУ) ═══
Үр дүнгийн нэр: ${actualResultLabel || 'тодорхойгүй'}
Нийт оноо: ${actualScore}/${actualMaxScore} (${actualPct}%)
${cfg.hasRiskFraming ? `Эрсдэлийн түвшин: ${actualRiskLevel}` : ''}

═══ DIMENSION ОНОО (тус бүр) ═══
${dimensions.length > 0 ? dimensions.slice(0, 12).map(d => `• ${d.label}: ${d.score} оноо (${d.pct}%)`).join('\n') : '—'}

═══ ХАМГИЙН ӨНДӨР ҮНЭЛГЭЭТЭЙ ХАРИУЛТУУД ═══
${sampleAnswers || '—'}`

    // ── Build dynamic JSON schema per test type ───────────────────────────
    const roadmapField = cfg.hasRoadmap
      ? `,"roadmap":[{"week":"1-р долоо хоног","title":"<товч>","tasks":["<товч>"]},{"week":"2-р долоо хоног","title":"<товч>","tasks":["<товч>"]},{"week":"3-р долоо хоног","title":"<товч>","tasks":["<товч>"]},{"week":"4-р долоо хоног","title":"<товч>","tasks":["<товч>"]}]`
      : `,"roadmap":[]`

    const SYSTEM = `Та hire.mn-ийн мэргэжлийн сэтгэл зүйч AI. Тест: "${reportTitle}".

╔══════════════════════════════════════════════════════════╗
║  ХАМГИЙН ЧУХАЛ — БОДИТ ӨГӨГДЛИЙГ ҮЛ ЗӨРЧИХ:              ║
╠══════════════════════════════════════════════════════════╣
║  • healthScore = ${actualPct}                            ║
║  • summary.title = "${actualResultLabel || 'Дүн шинжилгээ'}"║
║  • Dimension хүснэгтийн утгыг ЯГ ашигла, БҮҮ зохио       ║
╚══════════════════════════════════════════════════════════╝

${cfg.framingLine}

КРИТИК ДҮРМҮҮД:
1. Зөвхөн БОДИТ монгол үг. Үг зохиож БҮҮ бич. (Жишээ: "сэргэх" ✅, "сэвших" ❌)
2. Хориглосон зохиомол үгс: эмдээлэл, эмдлүүлэх, сэвших, хүүхэл, цэнгэлэг, амандуу.
3. Тестийн БОДИТ контекст дээр үндэслэ. Зөвхөн оноо биш — асуултын утга, dimension-уудын харьцаа дээр анхаар.
4. Доош өгсөн "ХАМГИЙН ӨНДӨР ҮНЭЛГЭЭТЭЙ ХАРИУЛТУУД"-ыг ашиглаж тодорхой ишлэл татна.
5. Эмпатитэй, эерэг өнгө. Оношилгоо БИШ — "...магадгүй", "...болзошгүй".
6. Бүх text ≤15 үг богино.
7. strengths/risks: ЯГ 4 зүйл, "Богино гарчиг: тайлбар" (≤12 үг)
8. insights: 3 зүйл, detail 2 өгүүлбэр, actions 3 алхам
9. summary.title нь ӨГСӨН үр дүнгийн нэртэй ЯГ таарна

JSON буцаа (markdown ҮГҮЙ):
{"testType":"${testType}","healthScore":${actualPct},"riskLevel":"${actualRiskLevel}","summary":{"title":"${actualResultLabel || 'Дүн шинжилгээ'}","description":"<1 өгүүлбэр тестийн утга дээр үндэслэсэн>"},"highlightTitle":"<сэтгэл хөдөлгөм гарчиг>","highlightMessage":"<1 өгүүлбэр>","strengths":["<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>"],"risks":["<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>"],"insights":[{"emoji":"<e>","title":"<гарчиг>","description":"<1 өгүүлбэр>","detail":"<2 өгүүлбэр>","actions":["<алхам>","<алхам>","<алхам>"]},{"emoji":"<e>","title":"<гарчиг>","description":"<1 өгүүлбэр>","detail":"<2 өгүүлбэр>","actions":["<алхам>","<алхам>","<алхам>"]},{"emoji":"<e>","title":"<гарчиг>","description":"<1 өгүүлбэр>","detail":"<2 өгүүлбэр>","actions":["<алхам>","<алхам>","<алхам>"]}]${roadmapField},"todayGoals":["<товч>","<товч>","<товч>"],"kpiLabels":{"metric1Label":"${cfg.kpiLabels.metric1}","riskLabel":"${cfg.kpiLabels.risk}","potentialLabel":"${cfg.kpiLabels.potential}"},"statCards":[{"icon":"🎯","label":"<нэр>","value":"<утга>","sub":"<товч>"},{"icon":"📊","label":"<нэр>","value":"<утга>","sub":"<товч>"},{"icon":"⭐","label":"<нэр>","value":"<утга>","sub":"<товч>"},{"icon":"🚀","label":"<нэр>","value":"<утга>","sub":"<товч>"}]}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2200,
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

    // ── HARD OVERRIDE: real values are source of truth ─────────────────────
    data.testType = testType
    if (actualMaxScore > 0) {
      data.healthScore = actualPct
      data.displayScore = actualScore
      data.displayMaxScore = actualMaxScore
      data.displayLabel = actualResultLabel
      data.riskLevel = actualRiskLevel
      data.summary = {
        title: actualResultLabel || data.summary?.title || 'Дүн шинжилгээ',
        description: data.summary?.description || assessmentDescription.slice(0, 200) || 'Үр дүн боловсруулагдсан.',
      }
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

    // Inject KPI labels per type (in case AI ignored them)
    data.kpiLabels = {
      metric1Label: cfg.kpiLabels.metric1,
      riskLabel: cfg.kpiLabels.risk,
      potentialLabel: cfg.kpiLabels.potential,
    }

    // ── Defaults ───────────────────────────────────────────────────────────
    if (!data.summary) data.summary = { title: 'Дүн шинжилгээ', description: 'Үр дүн боловсруулагдсан.' }
    if (!Array.isArray(data.strengths)) data.strengths = []
    if (!Array.isArray(data.risks)) data.risks = []
    if (!Array.isArray(data.insights)) data.insights = []
    if (!Array.isArray(data.roadmap)) data.roadmap = []
    // Roadmap default only when type expects it
    if (cfg.hasRoadmap && data.roadmap.length === 0) {
      data.roadmap = [
        { week: '1-р долоо хоног', title: 'Эхлэлийн алхам', tasks: ['Үр дүнгээ үзэх'] },
        { week: '2-р долоо хоног', title: 'Дадал хэвшүүлэх', tasks: ['Шинэ дадал эхлүүлэх'] },
        { week: '3-р долоо хоног', title: 'Тогтворжуулах', tasks: ['Үргэлжлүүлэх'] },
        { week: '4-р долоо хоног', title: 'Үр дүн', tasks: ['Шинжлэх'] },
      ]
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
