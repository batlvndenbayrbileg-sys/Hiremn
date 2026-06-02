import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a health assessment analyst for hire.mn.
Analyze the test result and return ONLY valid compact JSON (no whitespace, no markdown).

Required structure (keep ALL values SHORT - max 10 words each):
{"healthScore":75,"riskLevel":"Low","quitPotential":"High","summary":{"title":"2-3 words","description":"1 sentence max"},"metrics":[{"label":"short","score":3,"maxScore":10,"status":"1 word"}],"strengths":["short phrase","short phrase","short phrase"],"risks":["short phrase","short phrase","short phrase"],"insights":[{"emoji":"❤️","title":"short","description":"1 sentence","detail":"2 sentences max","actions":["action","action","action"]}],"roadmap":[{"week":"1-р долоо хоног","title":"short goal","tasks":["task","task"]},{"week":"2-р долоо хоног","title":"short goal","tasks":["task","task"]},{"week":"3-р долоо хоног","title":"short goal","tasks":["task","task"]},{"week":"4-р долоо хоног","title":"short goal","tasks":["task","task"]}]}

Rules:
- Return ONLY JSON, nothing else
- All text in Mongolian
- Keep everything SHORT to avoid token limits
- metrics: exactly 3 items
- insights: exactly 3 items
- roadmap: exactly 4 weeks`

export async function POST(request: Request) {
  try {
    const { reportData, reportTitle } = await request.json()

    // Хэт урт data-г хязгаарлана
    const truncatedData = typeof reportData === 'string'
      ? reportData.slice(0, 3000)
      : JSON.stringify(reportData).slice(0, 3000)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Тест: ${reportTitle || 'Үнэлгээ'}\nДата: ${truncatedData}`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // JSON хайж олно
    let jsonStr = text.trim()

    // Markdown code block байвал хасна
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Эхний { олж авна
    const start = jsonStr.indexOf('{')
    const end = jsonStr.lastIndexOf('}')

    if (start === -1 || end === -1) {
      throw new Error('JSON олдсонгүй')
    }

    jsonStr = jsonStr.slice(start, end + 1)

    const data = JSON.parse(jsonStr)

    // Талбаруудыг шалгана
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