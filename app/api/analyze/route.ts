import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { reportData, reportTitle } = await request.json()
    // Aggressive truncation for speed
    const truncated = typeof reportData === 'string'
      ? reportData.slice(0, 800)
      : JSON.stringify(reportData).slice(0, 800)

    // Ultra-compact prompt. Aim for <8s total.
    const SYSTEM = `Та hire.mn тест шинжээч. Тест нэр: "${reportTitle}".
Дараах JSON бүтцийг ЯГ ингэж буцаа (markdown үгүй, монголоор, тайлбар ≤10 үг):
{"healthScore":<0-100>,"riskLevel":"Low"|"Medium"|"High","quitPotential":"Low"|"Medium"|"High","summary":{"title":"<2-3 үг>","description":"<1 өгүүлбэр>"},"highlightTitle":"<гарчиг>","highlightMessage":"<1 өгүүлбэр>","metrics":[{"label":"<нэр>","score":<0-10>,"maxScore":10,"status":"<1-2 үг>"},{"label":"<нэр>","score":<0-10>,"maxScore":10,"status":"<1-2 үг>"}],"strengths":["<сайн1>","<сайн2>"],"risks":["<эрсдэл1>","<эрсдэл2>"],"insights":[{"emoji":"<e>","title":"<гарчиг>","description":"<товч>","detail":"<1-2 өгүүлбэр>","actions":["<алхам1>","<алхам2>"]},{"emoji":"<e>","title":"<гарчиг>","description":"<товч>","detail":"<1-2 өгүүлбэр>","actions":["<алхам1>","<алхам2>"]}],"roadmap":[{"week":"1-р долоо хоног","title":"<товч>","tasks":["<товч>"]},{"week":"2-р долоо хоног","title":"<товч>","tasks":["<товч>"]},{"week":"3-р долоо хоног","title":"<товч>","tasks":["<товч>"]},{"week":"4-р долоо хоног","title":"<товч>","tasks":["<товч>"]}],"todayGoals":["<товч1>","<товч2>","<товч3>"],"kpiLabels":{"metric1Label":"<KPI нэр>","riskLabel":"Эрсдэл","potentialLabel":"Боломж"},"statCards":[{"icon":"🎯","label":"<нэр>","value":"<утга>","sub":"<товч>"},{"icon":"📊","label":"<нэр>","value":"<утга>","sub":"<товч>"},{"icon":"⭐","label":"<нэр>","value":"<утга>","sub":"<товч>"},{"icon":"🚀","label":"<нэр>","value":"<утга>","sub":"<товч>"}]}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Дата: ${truncated}` }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    let jsonStr = text.trim()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const start = jsonStr.indexOf('{')
    const end = jsonStr.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('JSON олдсонгүй')
    jsonStr = jsonStr.slice(start, end + 1)

    const data = JSON.parse(jsonStr)
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
