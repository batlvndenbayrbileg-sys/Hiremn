import Anthropic from '@anthropic-ai/sdk'

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set')
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function POST(request: Request) {
  try {
    const { reportData, reportTitle } = await request.json()

    const truncated = typeof reportData === 'string'
      ? reportData.slice(0, 3500)
      : JSON.stringify(reportData).slice(0, 3500)

    const SYSTEM = `You are a professional assessment analyst for hire.mn.
Return ONLY valid compact JSON. No markdown, no code blocks, no explanation.

Test name: "${reportTitle}"

═══════════════════════════════════════════════════════
ABSOLUTE RULES — VIOLATING THESE IS AN ERROR:
═══════════════════════════════════════════════════════

RULE 1 — EXTRACT SCORES EXACTLY:
Step 1: Find ALL numeric score patterns in the data: "X/Y", "score: X", "оноо: X/Y"
Step 2: Use ONLY those exact numbers. Never invent numbers.
Step 3: For each dimension/subscale, use its EXACT actual score and max.

RULE 2 — HEALTH SCORE FORMULA (mandatory):
healthScore = Math.round((totalActualScore / totalMaxScore) * 100)
Example: 11/30 → Math.round(11/30 * 100) = Math.round(36.7) = 37
NEVER use a different formula. NEVER guess healthScore.

RULE 3 — METRIC SCORES (use ACTUAL numbers, NOT converted 0-10):
Each metric must store the REAL score:
  "score": <actual score e.g. 6>,
  "maxScore": <actual max e.g. 15>
Do NOT convert to 0-10 scale. Use the test's own scale.

RULE 4 — ALL DIMENSIONS:
Include every subscale/dimension. For RSES: "Өөртөө таалагдах байдал" AND "Өөрийн чадамж" — both.

RULE 5 — RISK LEVEL logic (based on percentage):
percentage = score/maxScore * 100
- 0-33% → riskLevel: "High", potentialLevel: "High" 
- 34-66% → riskLevel: "Medium", potentialLevel: "Medium"
- 67-100% → riskLevel: "Low", potentialLevel: "Low"

RULE 6 — VERIFY before output:
□ healthScore = round(total/max * 100) ✓
□ Each metric uses actual score and max ✓
□ All subscales included ✓
□ No invented numbers ✓
═══════════════════════════════════════════════════════

JSON structure:
{
  "healthScore": <round(actual_total/actual_max * 100), integer>,
  "actualTotal": <total actual score e.g. 11>,
  "actualMax": <total max score e.g. 30>,
  "percentile": <if available from data, else null>,
  "riskLevel": "<Low|Medium|High>",
  "quitPotential": "<Low|Medium|High>",
  "testCategory": "<rses|disc|personality|stress|cognitive|health|general>",
  "summary": {
    "title": "<2-4 words in Mongolian reflecting actual score level>",
    "description": "<mention actual score e.g. '11/30 оноо авсан' in Mongolian, 1-2 sentences>"
  },
  "highlightTitle": "<headline in Mongolian>",
  "highlightMessage": "<1-2 sentences with ACTUAL score mentioned in Mongolian>",
  "metrics": [
    {
      "label": "<exact dimension name from test in Mongolian>",
      "score": <ACTUAL score integer, e.g. 6>,
      "maxScore": <ACTUAL max integer, e.g. 15>,
      "percentage": <round(score/maxScore*100)>,
      "status": "<Маш бага|Бага|Дундаж|Сайн|Маш сайн depending on percentage>",
      "description": "<1 sentence about this dimension using actual score, in Mongolian>"
    }
  ],
  "strengths": ["<strength>", "<strength>", "<strength>"],
  "risks": ["<specific risk based on LOW scoring areas>", "<risk>", "<risk>"],
  "insights": [
    {
      "emoji": "<emoji>",
      "title": "<short title in Mongolian>",
      "description": "<1 sentence in Mongolian>",
      "detail": "<2-3 sentences of specific advice in Mongolian>",
      "actions": ["<concrete action>", "<concrete action>", "<concrete action>"]
    }
  ],
  "roadmap": [
    { "week": "1-р долоо хоног", "title": "<goal>", "tasks": ["<task>", "<task>"] },
    { "week": "2-р долоо хоног", "title": "<goal>", "tasks": ["<task>", "<task>"] },
    { "week": "3-р долоо хоног", "title": "<goal>", "tasks": ["<task>", "<task>"] },
    { "week": "4-р долоо хоног", "title": "<goal>", "tasks": ["<task>", "<task>"] }
  ],
  "todayGoals": ["<specific goal>", "<goal>", "<goal>"],
  "kpiLabels": {
    "metric1Label": "<first metric name>",
    "riskLabel": "<risk label>",
    "potentialLabel": "<potential label>"
  },
  "statCards": [
    { "icon": "📊", "label": "Нийт оноо", "value": "<actualTotal>/<actualMax>", "sub": "<percentage>%" },
    { "icon": "📈", "label": "Хувилал", "value": "<percentile if available else '-'>%", "sub": "нийт дундаас" },
    { "icon": "<emoji>", "label": "<stat>", "value": "<value>", "sub": "<note>" },
    { "icon": "<emoji>", "label": "<stat>", "value": "<value>", "sub": "<note>" }
  ]
}`

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `Тест: ${reportTitle}\n\nТест дата (яг энэ тоонуудыг хэрэглэ, дүгнэлт хий):\n${truncated}`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    let jsonStr = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const start = jsonStr.indexOf('{')
    const end = jsonStr.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('JSON олдсонгүй')
    jsonStr = jsonStr.slice(start, end + 1)

    const data = JSON.parse(jsonStr)
    if (data.healthScore == null || !data.summary || !data.roadmap) {
      throw new Error('JSON бүтэц дутуу')
    }

    // Hard clamp — prevent out-of-range values
    data.healthScore = Math.min(100, Math.max(0, Math.round(data.healthScore)))

    return Response.json({ success: true, data })
  } catch (error) {
    console.error('[analyze]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Шинжилгээ хийхэд алдаа гарлаа' },
      { status: 500 }
    )
  }
}