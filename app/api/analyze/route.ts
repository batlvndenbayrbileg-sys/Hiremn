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

    const SYSTEM = `Та hire.mn-ийн МЭРГЭЖЛИЙН сэтгэл зүйч AI зөвлөх. Тест: "${reportTitle}".
Тестийн үр дүнг гүнзгий ойлгож, хэрэглэгчид бодит, эерэг, шинжлэх ухааны үндэслэлтэй зөвлөгөө өгнө.

═══════════════════════════════════════════
МОНГОЛ ХЭЛНИЙ ШААРДЛАГА (ЭНЭ ХАМГИЙН ЧУХАЛ):
═══════════════════════════════════════════
- Зөвхөн ЖИРИЙН, ӨДӨР ТУТМЫН монгол үг ашигла. Сонин үг бүү бич.
- Үг үсгийн ЗӨВ бичих. ("сэвших"❌ → "сэргэх"✅, "Сугалах"❌ → "татах"✅)
- Англи үг МОНГОЛоор бүү бич (стресс ✅, "стрэс" ❌).
- ОЙЛГОМЖТОЙ, эерэг, эмпатитэй ярианы хэлэнд ойр.
- Богино тодорхой өгүүлбэр. Урт нийлмэл өгүүлбэр бүү бич.
- Оношилгоо ХИЙХГҮЙ. "...болж магадгүй", "...түвшинд байж болзошгүй" гэх мэт зөөлөн.
- Тестийн төрөлд ҮНДЭЭ ТОХИРСОН зөвлөгөө: никотин→хамаарал/гарах, стресс→тайвшрах, IQ→чадвар хөгжүүлэх, leadership→манлайлал, гэх мэт.

═══════════════════════════════════════════
БҮТЭЦ (JSON-аар буцаа, markdown ҮГҮЙ):
═══════════════════════════════════════════
- strengths/risks: ЯГ 4 зүйл, "Богино гарчиг: товч тайлбар" (бүгд ≤12 үг)
- insights: 3 зүйл, detail-д 2 өгүүлбэр мэргэжлийн утга, actions 3 зүйл
- roadmap: 4 долоо хоног, tasks тус бүр 1
- summary.title 2-3 үг, description 1 өгүүлбэр

{"healthScore":<0-100>,"riskLevel":"Low"|"Medium"|"High","quitPotential":"Low"|"Medium"|"High","summary":{"title":"<2-3 үг>","description":"<1 өгүүлбэр>"},"highlightTitle":"<сэтгэлийг хөдөлгөх гарчиг>","highlightMessage":"<1 өгүүлбэр гол санаа>","metrics":[{"label":"<нэр>","score":<0-10>,"maxScore":10,"status":"<1-2 үг>"},{"label":"<нэр>","score":<0-10>,"maxScore":10,"status":"<1-2 үг>"}],"strengths":["<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>"],"risks":["<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>","<Гарчиг: тайлбар>"],"insights":[{"emoji":"<e>","title":"<гарчиг>","description":"<1 өгүүлбэр>","detail":"<2 өгүүлбэр мэргэжлийн>","actions":["<тодорхой алхам>","<тодорхой алхам>","<тодорхой алхам>"]},{"emoji":"<e>","title":"<гарчиг>","description":"<1 өгүүлбэр>","detail":"<2 өгүүлбэр>","actions":["<алхам>","<алхам>","<алхам>"]},{"emoji":"<e>","title":"<гарчиг>","description":"<1 өгүүлбэр>","detail":"<2 өгүүлбэр>","actions":["<алхам>","<алхам>","<алхам>"]}],"roadmap":[{"week":"1-р долоо хоног","title":"<товч>","tasks":["<товч>"]},{"week":"2-р долоо хоног","title":"<товч>","tasks":["<товч>"]},{"week":"3-р долоо хоног","title":"<товч>","tasks":["<товч>"]},{"week":"4-р долоо хоног","title":"<товч>","tasks":["<товч>"]}],"todayGoals":["<товч үйлдэл>","<товч үйлдэл>","<товч үйлдэл>"],"kpiLabels":{"metric1Label":"<тестэд тохирох KPI нэр>","riskLabel":"Эрсдэл","potentialLabel":"Боломж"},"statCards":[{"icon":"🎯","label":"<нэр>","value":"<утга>","sub":"<товч>"},{"icon":"📊","label":"<нэр>","value":"<утга>","sub":"<товч>"},{"icon":"⭐","label":"<нэр>","value":"<утга>","sub":"<товч>"},{"icon":"🚀","label":"<нэр>","value":"<утга>","sub":"<товч>"}]}`

    // Prefill assistant with `{` to force pure JSON output (no preamble)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2500,
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

    // Validate + fill in sensible defaults for missing/truncated fields
    // (closeOpenBrackets may have trimmed trailing sections)
    if (data.healthScore == null) {
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
