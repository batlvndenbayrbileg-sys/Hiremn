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
    const truncated = typeof reportData === 'string'
      ? reportData.slice(0, 1200)
      : JSON.stringify(reportData).slice(0, 1200)

    const SYSTEM = `Та hire.mn-ийн мэргэжлийн тест шинжээч. Тест: "${reportTitle}".
Дараах JSON-г ЯГ буцаа (markdown үгүй, бүх text монгол, мэргэжлийн ярианы хэлээр).

ЧУХАЛ:
- strengths болон risks: 4-5 ширхэг, ХЭЛБЭР: "Богино гарчиг: тодорхой тайлбар" (макс 18 үг)
- insights: 3 ширхэг, detail-д 2-3 өгүүлбэрээр мэргэжлийн тайлбар, actions 4-5 ширхэг
- todayGoals: 3 ширхэг, тодорхой үйлдэл

JSON:
{"healthScore":<0-100>,"riskLevel":"Low"|"Medium"|"High","quitPotential":"Low"|"Medium"|"High","summary":{"title":"<2-3 үг>","description":"<1 өгүүлбэр>"},"highlightTitle":"<гарчиг>","highlightMessage":"<1 өгүүлбэр>","metrics":[{"label":"<нэр>","score":<0-10>,"maxScore":10,"status":"<1-2 үг>"},{"label":"<нэр>","score":<0-10>,"maxScore":10,"status":"<1-2 үг>"},{"label":"<нэр>","score":<0-10>,"maxScore":10,"status":"<1-2 үг>"}],"strengths":["<Гарчиг: дэлгэрэнгүй тайлбар 1>","<Гарчиг: тайлбар 2>","<Гарчиг: тайлбар 3>","<Гарчиг: тайлбар 4>","<Гарчиг: тайлбар 5>"],"risks":["<Гарчиг: тайлбар 1>","<Гарчиг: тайлбар 2>","<Гарчиг: тайлбар 3>","<Гарчиг: тайлбар 4>","<Гарчиг: тайлбар 5>"],"insights":[{"emoji":"<e>","title":"<гарчиг>","description":"<1 өгүүлбэр>","detail":"<2-3 өгүүлбэрийн мэргэжлийн тайлбар>","actions":["<алхам1>","<алхам2>","<алхам3>","<алхам4>","<алхам5>"]},{"emoji":"<e>","title":"<гарчиг>","description":"<1 өгүүлбэр>","detail":"<2-3 өгүүлбэр>","actions":["<алхам1>","<алхам2>","<алхам3>","<алхам4>"]},{"emoji":"<e>","title":"<гарчиг>","description":"<1 өгүүлбэр>","detail":"<2-3 өгүүлбэр>","actions":["<алхам1>","<алхам2>","<алхам3>","<алхам4>"]}],"roadmap":[{"week":"1-р долоо хоног","title":"<товч>","tasks":["<товч>","<товч>"]},{"week":"2-р долоо хоног","title":"<товч>","tasks":["<товч>","<товч>"]},{"week":"3-р долоо хоног","title":"<товч>","tasks":["<товч>","<товч>"]},{"week":"4-р долоо хоног","title":"<товч>","tasks":["<товч>","<товч>"]}],"todayGoals":["<товч1>","<товч2>","<товч3>"],"kpiLabels":{"metric1Label":"<KPI нэр>","riskLabel":"Эрсдэл","potentialLabel":"Боломж"},"statCards":[{"icon":"🎯","label":"<нэр>","value":"<утга>","sub":"<товч>"},{"icon":"📊","label":"<нэр>","value":"<утга>","sub":"<товч>"},{"icon":"⭐","label":"<нэр>","value":"<утга>","sub":"<товч>"},{"icon":"🚀","label":"<нэр>","value":"<утга>","sub":"<товч>"}]}`

    // Prefill assistant with `{` to force pure JSON output (no preamble)
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 3200,
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

    if (!data.healthScore || !data.summary || !data.roadmap) {
      throw new Error('JSON бүтэц дутуу')
    }

    return Response.json({ success: true, data })
  } catch (error) {
    console.error('[analyze]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Шинжилгээ хийхэд алдаа гарлаа' },
      { status: 500 }
    )
  }
}
