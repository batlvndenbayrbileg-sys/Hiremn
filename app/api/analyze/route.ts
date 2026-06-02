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

════════════════════════════════════════════════════
CRITICAL — SCORE ACCURACY RULES (DO NOT VIOLATE):
════════════════════════════════════════════════════

1. NEVER invent or guess scores. Use ONLY the actual scores from the test data.

2. SCORE CONVERSION FORMULA — if the test uses a different scale:
   - metric.score = round((actual_score / max_possible_score) * 10)
   - healthScore = round((total_actual_score / total_max_score) * 100)
   - Example: 14/40 → metric.score = round(14/40 * 10) = round(3.5) = 4, healthScore = round(14/40 * 100) = 35

3. If the test has multiple dimensions with separate scores, create a separate metric for EACH dimension using its actual score.

4. Do NOT round aggressively — preserve accuracy:
   - 14/40 = 3.5 → use 4 (not 3 or 5)
   - 7/10 = 7 → use 7 exactly

5. riskLevel and quitPotential must logically match the actual scores:
   - Low score (0-3/10) → riskLevel: "High", quitPotential: "High" (needs improvement)
   - Mid score (4-6/10) → riskLevel: "Medium", quitPotential: "Medium"
   - High score (7-10/10) → riskLevel: "Low", quitPotential: "Low" (already healthy)

6. INCLUDE ALL DIMENSIONS — if the test has D, I, S, C dimensions, include all 4. Never omit any.

7. healthScore must equal the overall percentage: round(total/maxTotal * 100)
════════════════════════════════════════════════════

Required JSON structure:
{
  "healthScore": <calculated from actual data, 0-100>,
  "riskLevel": "<Low|Medium|High — must match actual score level>",
  "quitPotential": "<Low|Medium|High — must match actual score level>",
  "testCategory": "<rses|disc|personality|cognitive|leadership|stress|health|general>",
  "summary": {
    "title": "<2-4 word summary in Mongolian based on ACTUAL score>",
    "description": "<1-2 sentences in Mongolian referencing the ACTUAL score e.g. '14/40 оноо авсан'>"
  },
  "highlightTitle": "<headline based on actual result level in Mongolian>",
  "highlightMessage": "<1-2 sentences mentioning the ACTUAL score/percentage in Mongolian>",
  "metrics": [
    {
      "label": "<exact dimension name from test>",
      "actualScore": <raw score from test data e.g. 14>,
      "actualMax": <max possible e.g. 40>,
      "score": <converted 0-10 using formula above>,
      "maxScore": 10,
      "status": "<1-3 word status in Mongolian matching actual score level>",
      "description": "<1 sentence explaining this dimension's result using actual score, in Mongolian>"
    }
  ],
  "strengths": ["<strength based on actual high-scoring areas>", "<strength>", "<strength>"],
  "risks": ["<risk based on actual low-scoring areas>", "<risk>", "<risk>"],
  "insights": [
    {
      "emoji": "<emoji>",
      "title": "<short title in Mongolian>",
      "description": "<1 sentence referencing actual score in Mongolian>",
      "detail": "<2-3 sentences with specific actionable advice in Mongolian>",
      "actions": ["<concrete action>", "<concrete action>", "<concrete action>"]
    }
  ],
  "roadmap": [
    { "week": "1-р долоо хоног", "title": "<specific goal for this test>", "tasks": ["<task>", "<task>"] },
    { "week": "2-р долоо хоног", "title": "<goal>", "tasks": ["<task>", "<task>"] },
    { "week": "3-р долоо хоног", "title": "<goal>", "tasks": ["<task>", "<task>"] },
    { "week": "4-р долоо хоног", "title": "<goal>", "tasks": ["<task>", "<task>"] }
  ],
  "todayGoals": ["<specific goal matching actual weak areas>", "<goal>", "<goal>"],
  "kpiLabels": {
    "metric1Label": "<primary KPI name for this test in Mongolian>",
    "riskLabel": "<context-appropriate risk label in Mongolian>",
    "potentialLabel": "<potential label in Mongolian>"
  },
  "statCards": [
    { "icon": "<emoji>", "label": "<stat>", "value": "<ACTUAL value from data>", "sub": "<note>" },
    { "icon": "<emoji>", "label": "<stat>", "value": "<ACTUAL value>", "sub": "<note>" },
    { "icon": "<emoji>", "label": "<stat>", "value": "<ACTUAL value>", "sub": "<note>" },
    { "icon": "<emoji>", "label": "<stat>", "value": "<ACTUAL value>", "sub": "<note>" }
  ]
}

FINAL CHECK before outputting:
- Verify healthScore = round(actualTotal/maxTotal * 100)
- Verify each metric.score = round(actualDimensionScore/maxDimensionScore * 10)
- Verify riskLevel and quitPotential logically match the scores
- Verify ALL test dimensions are included in metrics
- Verify actual scores are mentioned in descriptions`

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `Тест: ${reportTitle}\n\nТестийн дата (яг энэ дата-аас оноонуудыг ав, дураараа өөрчлөхгүй):\n${truncated}`
      }]
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

    // Validate score range — prevent hallucinated impossible scores
    if (data.healthScore < 0 || data.healthScore > 100) {
      data.healthScore = Math.min(100, Math.max(0, data.healthScore))
    }
    if (Array.isArray(data.metrics)) {
      data.metrics = data.metrics.map((m: any) => ({
        ...m,
        score: Math.min(m.maxScore || 10, Math.max(0, m.score)),
      }))
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