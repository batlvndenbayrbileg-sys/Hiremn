import Anthropic from '@anthropic-ai/sdk'

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY тохируулагдаагүй')
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function POST(request: Request) {
  try {
    const { reportData, reportTitle } = await request.json()

    const truncated = typeof reportData === 'string'
      ? reportData.slice(0, 3000)
      : JSON.stringify(reportData).slice(0, 3000)

    const SYSTEM = `You are a professional health & psychology assessment analyst for hire.mn platform.

Analyze the test result and return ONLY compact valid JSON (no whitespace, no markdown, no code blocks).

The test name is: "${reportTitle}"

Based on the test name and data, generate CONTEXTUAL and RELEVANT content. For example:
- Nicotine/smoking tests → focus on dependency, health risks, quitting
- Stress tests → focus on stress levels, relaxation, work-life balance  
- Personality tests → focus on traits, strengths, interpersonal skills
- IQ/cognitive tests → focus on cognitive abilities, learning, problem-solving
- Leadership tests → focus on leadership style, team dynamics, career growth
- General health tests → focus on overall wellbeing, lifestyle changes

Required JSON structure:
{
  "healthScore": <0-100 integer based on results>,
  "riskLevel": "<Low|Medium|High>",
  "quitPotential": "<Low|Medium|High>",
  "testCategory": "<health|personality|cognitive|leadership|stress|general>",
  "summary": {
    "title": "<CONTEXTUAL 2-4 word title in Mongolian based on the test>",
    "description": "<1-2 sentences in Mongolian relevant to THIS specific test>"
  },
  "highlightTitle": "<Engaging headline in Mongolian like 'Сайн мэдээ!' or 'Анхаарал татаж байна!' based on results>",
  "highlightMessage": "<1-2 sentences about the key finding, specific to this test type, in Mongolian>",
  "metrics": [
    { "label": "<CONTEXTUAL metric name for this test in Mongolian>", "score": <0-10>, "maxScore": 10, "status": "<1-2 word status in Mongolian>" }
  ],
  "strengths": ["<relevant strength for this test>", "<strength>", "<strength>"],
  "risks": ["<relevant risk for this test>", "<risk>", "<risk>"],
  "insights": [
    { "emoji": "<relevant emoji>", "title": "<short title in Mongolian>", "description": "<1 sentence in Mongolian>", "detail": "<2-3 sentences in Mongolian>", "actions": ["<action>", "<action>", "<action>"] }
  ],
  "roadmap": [
    { "week": "1-р долоо хоног", "title": "<goal for week 1, relevant to test>", "tasks": ["<task>", "<task>"] },
    { "week": "2-р долоо хоног", "title": "<goal>", "tasks": ["<task>", "<task>"] },
    { "week": "3-р долоо хоног", "title": "<goal>", "tasks": ["<task>", "<task>"] },
    { "week": "4-р долоо хоног", "title": "<goal>", "tasks": ["<task>", "<task>"] }
  ],
  "todayGoals": ["<specific goal 1>", "<specific goal 2>", "<specific goal 3>"],
  "kpiLabels": {
    "metric1Label": "<first KPI name for this test in Mongolian, e.g. 'Никотин хамаарал' or 'Стрессийн түвшин'>",
    "riskLabel": "<risk section label, e.g. 'Эрсдэл' or 'Анхаарал'>",
    "potentialLabel": "<potential label, e.g. 'Гарах боломж' or 'Сайжрах боломж'>"
  },
  "statCards": [
    { "icon": "🫁", "label": "<stat name relevant to test>", "value": "<calculated value>", "sub": "<brief note>" },
    { "icon": "❤️", "label": "<stat name>", "value": "<value>", "sub": "<note>" },
    { "icon": "💰", "label": "<stat name>", "value": "<value>", "sub": "<note>" },
    { "icon": "📅", "label": "<stat name>", "value": "<value>", "sub": "<note>" }
  ]
}

Rules:
- ALL text must be in Mongolian
- Keep descriptions SHORT (max 15 words each)
- metrics: exactly 3 items
- insights: exactly 3 items
- roadmap: exactly 4 weeks
- Make EVERYTHING relevant to the specific test type
- statCards should reflect meaningful statistics for this test`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
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

    if (data.healthScore == null || !data.summary || !data.roadmap) {
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