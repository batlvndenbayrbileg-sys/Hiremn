import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Best-effort JSON repair for truncated LLM output. Walks the string,
// tracks unclosed { [ " and trims to the last complete value, then closes
// any remaining open structures so the result is valid JSON.
function closeOpenBrackets(s: string): string {
  let inString = false
  let escape = false
  const stack: string[] = []
  let lastSafeEnd = -1  // index just past a complete top-level value

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

  // Trim back to the last complete element, then close everything still open
  let trimmed = lastSafeEnd > 0 ? s.slice(0, lastSafeEnd) : s

  // Re-scan trimmed to figure out what still needs closing
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
  // Close strings first if needed
  if (inStr) trimmed += '"'
  while (closeStack.length) trimmed += closeStack.pop()
  return trimmed
}

export async function POST(request: Request) {
  try {
    const { reportData, reportTitle } = await request.json()
    // ── Extract REAL test result values (DO NOT let the AI invent these) ──
    // hire.mn API wraps payload in payload.payload
    const examPayload: any =
      (reportData as any)?.exam?.payload ?? (reportData as any)?.exam ?? {}
    const answersPayload: any[] =
      (reportData as any)?.answers?.payload ?? (reportData as any)?.answers ?? []

    const actualResultLabel: string = examPayload.result || ""
    const actualScore: number = Number(examPayload.point ?? examPayload.value ?? 0) || 0
    const actualMaxScore: number = Number(examPayload.total ?? examPayload.assessment?.totalPoint ?? 0) || 0
    const actualDescription: string = examPayload.assessment?.description || ""
    const actualUsage: string = examPayload.assessment?.usage || ""

    // Derive healthScore: percentage of points achieved
    const actualPct = actualMaxScore > 0
      ? Math.round((actualScore / actualMaxScore) * 100)
      : 50

    // Map result label / pct to risk levels
    const lowerLabel = actualResultLabel.toLowerCase()
    let actualRiskLevel: "Low" | "Medium" | "High" = "Medium"
    if (lowerLabel.includes("бага") || lowerLabel.includes("сул") || actualPct <= 33) actualRiskLevel = "Low"
    else if (lowerLabel.includes("их") || lowerLabel.includes("өндөр") || lowerLabel.includes("хүнд") || actualPct >= 67) actualRiskLevel = "High"

    // Compact answers summary for context (no need to flood prompt)
    const answersSummary = answersPayload.slice(0, 12).map((a: any, i: number) => {
      const v = a?.answer?.value ?? ""
      const p = a?.point ?? a?.answer?.point ?? "0"
      return `${i + 1}.${v}(${p})`
    }).join("; ")

    const truncated = `Тестийн нэр: ${reportTitle}
БОДИТ үр дүн (АНТЫ ӨӨРЧИЛБӨЛ БУРУУ!): ${actualResultLabel || "тодорхойгүй"}
БОДИТ оноо: ${actualScore}/${actualMaxScore} (${actualPct}%)
Эрсдэлийн түвшин (тооцоологдсон): ${actualRiskLevel}
Тестийн тайлбар: ${(actualDescription || "").slice(0, 300)}
Зориулалт: ${(actualUsage || "").slice(0, 200)}
Хариултууд: ${answersSummary}`

    const SYSTEM = `Та hire.mn-ийн сэтгэл зүйч мэргэжилтэн AI. Тест: "${reportTitle}".

╔══════════════════════════════════════════════════════════╗
║  ХАМГИЙН ЧУХАЛ — БОДИТ ӨГӨГДӨЛИЙГ ҮЛ ЗӨРЧИХ:             ║
╠══════════════════════════════════════════════════════════╣
║ Хэрэглэгчийн message-д өгсөн БОДИТ оноог ЯГ ашиглах:     ║
║   - healthScore = ӨГСӨН хувь (% утга)                    ║
║   - riskLevel = ӨГСӨН эрсдэлийн түвшин                   ║
║   - summary.title = ӨГСӨН үр дүнгийн нэр (е.г. "Бага    ║
║     зэргийн хамааралтай")                                ║
║   - metrics[0].score = ӨГСӨН score утга                  ║
║   - metrics[0].maxScore = ӨГСӨН max утга                 ║
║ ЗОХИОХГҮЙ. БУРУУШААХГҮЙ. ЯГ ТЭР УТГЫГ АШИГЛА.            ║
╚══════════════════════════════════════════════════════════╝

КРИТИК ДҮРМҮҮД:
1. Зөвхөн БОДИТОЙ монгол үг ашигла. Үг зохиож БҮҮ бич.
2. Хориглосон зохиомол үгс: "эмдээлэл", "эмдлүүлэх", "сэвших", "хүүхэл", "сугалах", "цэнгэлэг", "амандуу", "дүүрэлт".
3. Зөв үгсийг ашигла: хамаарал, эрсдэл, дадал, зуршил, тогтвортой, чадвар, сэтгэл, стресс, тайвшрах, эмчилгээ, эмч, эмнэлэг, тусламж, дэмжлэг, найз, гэр бүл, удирдах, бууруулах, нэмэгдүүлэх, хэрэглэх, татах, сэргэх.
4. Үг үсгийн алдаагүй (сэргэх✅ биш сэвших❌).
5. Эерэг, эмпатитэй мэргэжлийн өнгө. Оношилгоо БИШ — "...магадгүй", "...болзошгүй".
6. Тест төрөлд тохирох контекст.
7. Бүх text ≤15 үг богино.

ХЭЛБЭР: JSON буцаа (markdown ҮГҮЙ):
- strengths/risks: ЯГ 4 зүйл, "Богино гарчиг: тайлбар" (≤12 үг)
- insights: 3 зүйл, detail 2 өгүүлбэр, actions 3 зүйл
- roadmap: 4 долоо хоног, tasks 1 зүйл тус бүр
- summary.title нь ӨГӨГДСӨН үр дүнгийн нэртэй яг ТААРУУЛНА

{"healthScore":<өгсөн % утга>,"riskLevel":"<өгсөн>","quitPotential":"Low"|"Medium"|"High","summary":{"title":"<өгсөн үр дүнгийн нэр>","description":"<1 өгүүлбэр>"},"highlightTitle":"<сэтгэл хөдөлгөм гарчиг>","highlightMessage":"<1 өгүүлбэр>","metrics":[{"label":"<нэр>","score":<өгсөн оноо>,"maxScore":<өгсөн max>,"status":"<өгсөн үр дүнгийн нэр>"},{"label":"<нэр>","score":<0-10>,"maxScore":10,"status":"<1-2 үг>"}],"strengths":["<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>"],"risks":["<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>"],"insights":[{"emoji":"<e>","title":"<гарчиг>","description":"<1 өгүүлбэр>","detail":"<2 өгүүлбэр>","actions":["<алхам>","<алхам>","<алхам>"]},{"emoji":"<e>","title":"<гарчиг>","description":"<1 өгүүлбэр>","detail":"<2 өгүүлбэр>","actions":["<алхам>","<алхам>","<алхам>"]},{"emoji":"<e>","title":"<гарчиг>","description":"<1 өгүүлбэр>","detail":"<2 өгүүлбэр>","actions":["<алхам>","<алхам>","<алхам>"]}],"roadmap":[{"week":"1-р долоо хоног","title":"<товч>","tasks":["<товч>"]},{"week":"2-р долоо хоног","title":"<товч>","tasks":["<товч>"]},{"week":"3-р долоо хоног","title":"<товч>","tasks":["<товч>"]},{"week":"4-р долоо хоног","title":"<товч>","tasks":["<товч>"]}],"todayGoals":["<товч>","<товч>","<товч>"],"kpiLabels":{"metric1Label":"<KPI>","riskLabel":"Эрсдэл","potentialLabel":"Боломж"},"statCards":[{"icon":"🎯","label":"<нэр>","value":"<утга>","sub":"<товч>"},{"icon":"📊","label":"<нэр>","value":"<утга>","sub":"<товч>"},{"icon":"⭐","label":"<нэр>","value":"<утга>","sub":"<товч>"},{"icon":"🚀","label":"<нэр>","value":"<утга>","sub":"<товч>"}]}`

    // Prefill assistant with `{` to force pure JSON output (no preamble)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      system: SYSTEM,
      messages: [
        { role: 'user', content: `Дата: ${truncated}` },
        { role: 'assistant', content: '{' },
      ],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    // Prepend the `{` we prefilled with
    let jsonStr = '{' + rawText
    jsonStr = jsonStr
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const start = jsonStr.indexOf('{')
    const end = jsonStr.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('JSON олдсонгүй')
    jsonStr = jsonStr.slice(start, end + 1)

    // Sanitize common LLM JSON mistakes
    const repair = (s: string) =>
      s
        // Remove trailing commas before } or ]
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix unescaped newlines inside strings (rare but happens)
        .replace(/("(?:[^"\\]|\\.)*")|\n/g, (match, str) => str ?? ' ')

    let data: any
    try {
      data = JSON.parse(jsonStr)
    } catch (e1) {
      try {
        data = JSON.parse(repair(jsonStr))
      } catch (e2) {
        console.error('[analyze] JSON parse failed. First 200 chars:', jsonStr.slice(0, 200))
        console.error('[analyze] Last 200 chars:', jsonStr.slice(-200))
        // Hard truncation may have cut JSON mid-string — try to close braces/brackets
        const closed = closeOpenBrackets(jsonStr)
        data = JSON.parse(closed)
      }
    }

    // ─── HARD OVERRIDE: use REAL test values, ignore anything AI invented ───
    // This is the single source of truth — never let AI hallucinate scores.
    if (actualMaxScore > 0) {
      data.healthScore = actualPct
      data.displayScore = actualScore
      data.displayMaxScore = actualMaxScore
      data.displayLabel = actualResultLabel
      data.riskLevel = actualRiskLevel
      data.summary = {
        title: actualResultLabel || data.summary?.title || "Дүн шинжилгээ",
        description: data.summary?.description || (actualDescription || "").slice(0, 200) || "Үр дүн боловсруулагдсан.",
      }
      // Force the first metric to match the real test score
      if (!Array.isArray(data.metrics) || data.metrics.length === 0) {
        data.metrics = []
      }
      data.metrics[0] = {
        label: data.metrics[0]?.label || reportTitle.slice(0, 30) || "Үр дүн",
        score: actualScore,
        maxScore: actualMaxScore,
        status: actualResultLabel || data.metrics[0]?.status || "—",
      }
      // Strip any extra AI-invented sub-metrics — only the real one is truth
      data.metrics = data.metrics.slice(0, 1)
    } else if (data.healthScore == null) {
      console.error('[analyze] missing healthScore. Keys:', Object.keys(data))
      throw new Error('JSON бүтэц дутуу — healthScore байхгүй')
    }

    if (!data.summary) {
      data.summary = { title: "Дүн шинжилгээ", description: "Үр дүн боловсруулагдсан." }
    }
    if (!Array.isArray(data.metrics) || data.metrics.length === 0) {
      data.metrics = [{ label: "Ерөнхий оноо", score: Math.round((data.healthScore || 50) / 10), maxScore: 10, status: "—" }]
    }
    if (!Array.isArray(data.strengths)) data.strengths = []
    if (!Array.isArray(data.risks)) data.risks = []
    if (!Array.isArray(data.insights)) data.insights = []
    if (!Array.isArray(data.roadmap) || data.roadmap.length === 0) {
      data.roadmap = [
        { week: "1-р долоо хоног", title: "Эхлэлийн алхам", tasks: ["Үр дүнгээ үзэх", "Зорилго тодорхойлох"] },
        { week: "2-р долоо хоног", title: "Дадал хэвшүүлэх", tasks: ["Шинэ зуршил эхлүүлэх"] },
        { week: "3-р долоо хоног", title: "Тогтворжуулах", tasks: ["Үргэлжлүүлэх"] },
        { week: "4-р долоо хоног", title: "Үр дүн", tasks: ["Шинжлэх"] },
      ]
    }
    if (!data.riskLevel) data.riskLevel = "Medium"
    if (!data.quitPotential) data.quitPotential = "Medium"

    return Response.json({ success: true, data })
  } catch (error) {
    console.error('[analyze]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Шинжилгээ хийхэд алдаа гарлаа' },
      { status: 500 }
    )
  }
}
