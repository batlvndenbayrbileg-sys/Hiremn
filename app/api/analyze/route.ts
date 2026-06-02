import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a professional health & psychology assessment analyst for hire.mn platform.

Analyze the user's test result and return ONLY valid JSON with NO markdown, NO explanation.

Return exactly this structure:
{
  "healthScore": <0-100 integer>,
  "riskLevel": "<Low|Medium|High>",
  "quitPotential": "<Low|Medium|High>",
  "summary": {
    "title": "<2-4 word title>",
    "description": "<max 2 sentences>"
  },
  "metrics": [
    { "label": "<name>", "score": <0-10>, "maxScore": 10, "status": "<1 word>" }
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "insights": [
    { "emoji": "<emoji>", "title": "<short title>", "description": "<1 sentence>", "detail": "<2-3 sentences of deeper explanation>", "actions": ["<action 1>", "<action 2>", "<action 3>"] }
  ],
  "roadmap": [
    { "week": "Week 1", "title": "<goal>", "tasks": ["<task 1>", "<task 2>"] }
  ]
}

Rules:
- healthScore: realistic based on results
- metrics: 3-4 most relevant metrics from the test
- insights: 3-4 key insights with emoji
- roadmap: exactly 4 weeks
- All text in Mongolian language
- Be specific to the actual test data provided`

export async function POST(request: Request) {
  try {
    const { reportData, reportTitle } = await request.json()

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Тест: ${reportTitle || 'Үнэлгээний тест'}\n\nДата:\n${typeof reportData === 'string' ? reportData : JSON.stringify(reportData, null, 2)}`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // JSON extract
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON олдсонгүй')

    const data = JSON.parse(jsonMatch[0])
    return Response.json({ success: true, data })
  } catch (error) {
    console.error('[analyze]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Шинжилгээ хийхэд алдаа гарлаа' },
      { status: 500 }
    )
  }
}