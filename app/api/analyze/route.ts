import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { reportData, reportTitle } = await request.json()
    // Trim aggressively: more input = slower output
    const truncated = typeof reportData === 'string'
      ? reportData.slice(0, 1500)
      : JSON.stringify(reportData).slice(0, 1500)

    // Compact prompt for speed. Haiku 4.5 + small max_tokens = ~3-6s response.
    const SYSTEM = `Та hire.mn-ийн тест шинжээч. Тест: "${reportTitle}".
Зөвхөн valid JSON буцаа (markdown/code block үгүй, бүх text монголоор).
Тест нэрнээс хамаараад агуулга тохируул (никотин→хамаарал, стресс→тайвшрал, leadership→манлайлал).
Бүтэц:
{"healthScore":<0-100>,"riskLevel":"Low|Medium|High","quitPotential":"Low|Medium|High","testCategory":"<төрөл>","summary":{"title":"<2-4 үг>","description":"<1 өгүүлбэр>"},"highlightTitle":"<гарчиг>","highlightMessage":"<1 өгүүлбэр>","metrics":[{"label":"<нэр>","score":<0-10>,"maxScore":10,"status":"<төлөв>"},{"label":"<нэр>","score":<0-10>,"maxScore":10,"status":"<төлөв>"},{"label":"<нэр>","score":<0-10>,"maxScore":10,"status":"<төлөв>"}],"strengths":["<сайн1>","<сайн2>","<сайн3>"],"risks":["<эрсдэл1>","<эрсдэл2>","<эрсдэл3>"],"insights":[{"emoji":"<emoji>","title":"<гарчиг>","description":"<товч>","detail":"<2 өгүүлбэр>","actions":["<алхам1>","<алхам2>","<алхам3>"]},{"emoji":"<emoji>","title":"<гарчиг>","description":"<товч>","detail":"<2 өгүүлбэр>","actions":["<алхам1>","<алхам2>","<алхам3>"]},{"emoji":"<emoji>","title":"<гарчиг>","description":"<товч>","detail":"<2 өгүүлбэр>","actions":["<алхам1>","<алхам2>","<алхам3>"]}],"roadmap":[{"week":"1-р долоо хоног","title":"<зорилго>","tasks":["<даалгавар1>","<даалгавар2>"]},{"week":"2-р долоо хоног","title":"<зорилго>","tasks":["<даалгавар1>","<даалгавар2>"]},{"week":"3-р долоо хоног","title":"<зорилго>","tasks":["<даалгавар1>","<даалгавар2>"]},{"week":"4-р долоо хоног","title":"<зорилго>","tasks":["<даалгавар1>","<даалгавар2>"]}],"todayGoals":["<зорилго1>","<зорилго2>","<зорилго3>"],"kpiLabels":{"metric1Label":"<KPI>","riskLabel":"Эрсдэл","potentialLabel":"Боломж"},"statCards":[{"icon":"🫁","label":"<нэр>","value":"<утга>","sub":"<тэмдэглэл>"},{"icon":"❤️","label":"<нэр>","value":"<утга>","sub":"<тэмдэглэл>"},{"icon":"💰","label":"<нэр>","value":"<утга>","sub":"<тэмдэглэл>"},{"icon":"📅","label":"<нэр>","value":"<утга>","sub":"<тэмдэглэл>"}]}
Дүрэм: тайлбар бүгд богино (≤12 үг), үг үсэг зөв байх.`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2400,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Тест: ${reportTitle}\nДата:\n${truncated}` }]
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
