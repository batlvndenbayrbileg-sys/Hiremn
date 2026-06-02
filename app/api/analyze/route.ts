import Anthropic from '@anthropic-ai/sdk'

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set')
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function POST(request: Request) {
  try {
    const { reportData, reportTitle } = await request.json()

    const truncated = typeof reportData === 'string'
      ? reportData.slice(0, 3000)
      : JSON.stringify(reportData).slice(0, 3000)

    const SYSTEM = `You are a professional assessment analyst for hire.mn platform.

Analyze the test result and return ONLY compact valid JSON (no whitespace, no markdown, no code blocks).

The test name is: "${reportTitle}"

CRITICAL RULE — METRICS:
You MUST include ALL dimensions/scales/categories of the test in the "metrics" array.
Examples:
- DISC test → 4 metrics: D (Удирдах чадвар), I (Нөлөөлөх чадвар), S (Тогтвортой байдал), C (Нийцэмжийн чадвар)
- Big Five test → 5 metrics: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
- IQ test → metrics for each cognitive area tested
- Stress test → metrics for each stress dimension
- NEVER omit any dimension. Include ALL of them regardless of how many there are.

Required JSON structure:
{
  "healthScore": <0-100 integer>,
  "riskLevel": "<Low|Medium|High>",
  "quitPotential": "<Low|Medium|High>",
  "testCategory": "<disc|personality|cognitive|leadership|stress|health|general>",
  "summary": {
    "title": "<2-4 word summary in Mongolian>",
    "description": "<1-2 sentences in Mongolian>"
  },
  "highlightTitle": "<engaging headline in Mongolian>",
  "highlightMessage": "<1-2 sentences about key finding in Mongolian>",
  "metrics": [
    { "label": "<EXACT dimension name from test>", "score": <actual score 0-10>, "maxScore": 10, "status": "<1-3 word status in Mongolian>", "description": "<1 sentence explaining this dimension in Mongolian>" }
  ],
  "strengths": ["<strength>", "<strength>", "<strength>"],
  "risks": ["<risk>", "<risk>", "<risk>"],
  "insights": [
    { "emoji": "<emoji>", "title": "<short>", "description": "<1 sentence in Mongolian>", "detail": "<2-3 sentences in Mongolian>", "actions": ["<action>", "<action>", "<action>"] }
  ],
  "roadmap": [
    { "week": "1-р долоо хоног", "title": "<goal>", "tasks": ["<task>", "<task>"] },
    { "week": "2-р долоо хоног", "title": "<goal>", "tasks": ["<task>", "<task>"] },
    { "week": "3-р долоо хоног", "title": "<goal>", "tasks": ["<task>", "<task>"] },
    { "week": "4-р долоо хоног", "title": "<goal>", "tasks": ["<task>", "<task>"] }
  ],
  "todayGoals": ["<specific goal>", "<specific goal>", "<specific goal>"],
  "kpiLabels": {
    "metric1Label": "<primary metric name for this test>",
    "riskLabel": "<risk label>",
    "potentialLabel": "<potential label>"
  },
  "statCards": [
    { "icon": "<emoji>", "label": "<stat name>", "value": "<value>", "sub": "<note>" },
    { "icon": "<emoji>", "label": "<stat name>", "value": "<value>", "sub": "<note>" },
    { "icon": "<emoji>", "label": "<stat name>", "value": "<value>", "sub": "<note>" },
    { "icon": "<emoji>", "label": "<stat name>", "value": "<value>", "sub": "<note>" }
  ]
}

Rules:
- ALL text in Mongolian
- metrics: include EVERY dimension of the test (could be 2, 3, 4, 5 or more)
- Each metric.score must reflect the ACTUAL score from the test data
- insights: exactly 3 items
- roadmap: exactly 4 weeks
- statCards: exactly 4 items relevant to this test`

    const response = await getAnthropic().messages.create({
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