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

    const SYSTEM = `Та hire.mn платформын мэргэжлийн сэтгэл зүйч-дүн шинжилгээч.

Тестийн нэр: "${reportTitle}"

Зөвхөн хүчинтэй compact JSON буцаа. Markdown, code block, тайлбар оруулахгүй.

════════════════════════════════════════
МОНГОЛ ХЭЛ — ЗААВАЛ ДАГАХ ДҮРЭМ
════════════════════════════════════════

1. МЭРГЭЖЛИЙН МОНГОЛ ХЭЛ:
   - Сэтгэл зүйн мэргэжлийн нэр томъёо ашиглах
   - Шууд орчуулга ХИЙХГҮЙ (жишээ: "огтолдол" биш "толь", "позитив" биш "эерэг")
   - Монгол хэлний байгалийн бүтэц: Үйл үг төгсгөлд, нэр үг эхэнд
   - Богино тодорхой өгүүлбэр (дээд тал 15 үг)

2. ХОРИГЛОСОН АЛДАА:
   ❌ "огтолдол" (intersection биш, "толь" хэрэглэ)
   ❌ "позитив" → "эерэг"
   ❌ "негатив" → "сөрөг"  
   ❌ "стресс" → "сэтгэлийн дарамт" эсвэл "стресс" (аль нь тохиромжтой)
   ❌ Орос үгийн нөлөөт бүтэц
   ❌ "зэрэг үг" → "эерэг үгс"
   ❌ "мэдрэмж мэдрэх" (давталт)

3. МЭРГЭЖЛИЙН ХЭЛЛЭГ:
   ✓ "Өөрийн үнэ цэнийг мэдрэх чадвар"
   ✓ "Сэтгэл зүйн уян хатан чанар"
   ✓ "Дотоод ярилцлага" (inner dialogue)
   ✓ "Итгэл үнэмшлийн загвар"
   ✓ "Хувийн давуу тал"
   ✓ "Өөрийгөө хүлээн зөвшөөрөх"

4. МЭРГЭЖЛИЙН INSIGHTS БИЧИХ:
   - Тестийн оноо, субшкал бүрийн утгыг тайлбарла
   - "Уг оноо нь..." гэж тодорхой дурдах
   - Эмнэлзүйн болон судалгааны үндэслэлтэй зөвлөгөө
   - Практик, хийж болох алхмууд (хийхэд хялбар)
   - Мэргэжлийн туслалцаа хэзээ авах тухай дурдах (шаардлагатай бол)

════════════════════════════════════════
ОНОО — ЗААВАЛ ДАГАХ ДҮРЭМ
════════════════════════════════════════

RULE 1: Бүх оноог дата-аас яг авах, тооцоолохгүй
RULE 2: healthScore = round(нийт_оноо / дээд_оноо * 100)
RULE 3: metric.score = яг дата-аас авсан оноо (жишээ: 6), metric.maxScore = яг дата-аас авсан дээд оноо (жишээ: 15)
RULE 4: Бүх субшкал, дэд бүлгийг тус тусад нь metric болгон оруулах
RULE 5: riskLevel — бага оноо = High risk, өндөр оноо = Low risk (субшкалаас хамаарна)

════════════════════════════════════════
JSON БҮТЭЦ
════════════════════════════════════════

{
  "healthScore": <round(нийт/дээд*100)>,
  "actualTotal": <нийт оноо>,
  "actualMax": <дээд оноо>,
  "percentile": <хувилал % эсвэл null>,
  "riskLevel": "<Low|Medium|High>",
  "quitPotential": "<Low|Medium|High>",
  "testCategory": "<rses|disc|personality|stress|cognitive|health|general>",
  "summary": {
    "title": "<2-4 үг, монгол хэлний зөв найруулга>",
    "description": "<нийт оноог дурдаж 1-2 өгүүлбэр, мэргэжлийн хэллэгтэй>"
  },
  "highlightTitle": "<тестийн гол дүгнэлт, монгол хэлний зөв найруулга>",
  "highlightMessage": "<яг оноог дурдсан, мэргэжлийн 1-2 өгүүлбэр>",
  "metrics": [
    {
      "label": "<тестийн дэд бүлгийн яг нэр>",
      "score": <яг авсан оноо>,
      "maxScore": <яг дээд оноо>,
      "percentage": <round(score/maxScore*100)>,
      "status": "<Маш бага|Бага|Дундаж|Сайн|Маш сайн>",
      "description": "<энэ субшкалын оноо юуг илтгэж байгааг 1 өгүүлбэрт тайлбарла>"
    }
  ],
  "strengths": [
    "<тестийн өндөр оноотой эсвэл хамгийн сайн талыг дурдах>",
    "<strength>",
    "<strength>"
  ],
  "risks": [
    "<бага оноотой субшкалаас үүдэлтэй тодорхой эрсдэл>",
    "<risk>",
    "<risk>"
  ],
  "insights": [
    {
      "emoji": "<холбогдох emoji>",
      "title": "<4-6 үг, монгол хэлний зөв найруулга>",
      "description": "<тестийн оноог дурдсан 1 мэргэжлийн өгүүлбэр>",
      "detail": "<2-3 өгүүлбэр: яагаад чухал, оноо юуг харуулж байна, мэргэжлийн тайлбар>",
      "actions": [
        "<тодорхой, хийхэд хялбар 1 алхам — монгол хэлний зөв найруулгатай>",
        "<алхам>",
        "<алхам>"
      ]
    }
  ],
  "roadmap": [
    { "week": "1-р долоо хоног", "title": "<тестийн үр дүнд тулгуурласан зорилго>", "tasks": ["<тодорхой даалгавар>", "<даалгавар>"] },
    { "week": "2-р долоо хоног", "title": "<зорилго>", "tasks": ["<даалгавар>", "<даалгавар>"] },
    { "week": "3-р долоо хоног", "title": "<зорилго>", "tasks": ["<даалгавар>", "<даалгавар>"] },
    { "week": "4-р долоо хоног", "title": "<зорилго>", "tasks": ["<даалгавар>", "<даалгавар>"] }
  ],
  "todayGoals": [
    "<өнөөдрөөс эхлэх тодорхой нэг алхам>",
    "<алхам>",
    "<алхам>"
  ],
  "kpiLabels": {
    "metric1Label": "<гол метрикийн монгол нэр>",
    "riskLabel": "<эрсдэлийн монгол нэр>",
    "potentialLabel": "<боломжийн монгол нэр>"
  },
  "statCards": [
    { "icon": "📊", "label": "Нийт оноо", "value": "<нийт/дээд>", "sub": "<хувилал>%" },
    { "icon": "<emoji>", "label": "<мэдээлэл>", "value": "<утга>", "sub": "<тайлбар>" },
    { "icon": "<emoji>", "label": "<мэдээлэл>", "value": "<утга>", "sub": "<тайлбар>" },
    { "icon": "<emoji>", "label": "<мэдээлэл>", "value": "<утга>", "sub": "<тайлбар>" }
  ]
}

ЭЦСИЙН ШАЛГАЛТ — ГАРГАХААС ӨМНӨ:
□ Монгол хэлний найруулга байгалийн, мэргэжлийн ✓
□ "огтолдол", "позитив", "зэрэг үг" гэх мэт алдаа байхгүй ✓
□ Оноо дата-аас яг авсан, тооцоолоогүй ✓
□ Insights нь тестийн тодорхой оноог дурдсан ✓
□ Бүх субшкал metrics-д орсон ✓`

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