// app/api/chat/route.ts
import { generateText } from 'ai'
import { hasGeminiKey, withGeminiFallback, polishMongolian } from '@/lib/llm'
import { classify, detectCrisis } from '@/lib/classifier'
import { findFAQ } from '@/lib/faq-db'
import { buildSystemPrompt, compressHistory } from '@/lib/brain'
import { parseTestMarkers, TEST_DATABASE } from '@/lib/test-db'
import { getOrCreateMemory, updateMemoryFromMessage, type UserMemory } from '@/lib/memory'
import { rankAssessments } from '@/lib/test-ranker'
import {
  getAllAssessments,
  getAssessmentCategories,
  formatAssessmentForWidget,
  getResultByCode,
  type Assessment,
  type UserAnswerResult,
  type AssessmentCategoryWithTests,
} from '@/lib/hire-api'

// Vercel Hobby max is 10s. Keep this conservative.
export const maxDuration = 60


// ── Cache ────────────────────────────────────────────────────────────────────
let cachedAssessments: Assessment[] = []
let cachedCategories: AssessmentCategoryWithTests[] = []
let cacheTime = 0

async function getAssessments(): Promise<Assessment[]> {
  const now = Date.now()
  if (cachedAssessments.length === 0 || now - cacheTime > 5 * 60 * 1000) {
    const [fresh, cats] = await Promise.all([getAllAssessments(), getAssessmentCategories()])
    if (fresh.length > 0) { cachedAssessments = fresh; cacheTime = now }
    if (cats.length > 0) cachedCategories = cats
  }
  return cachedAssessments
}

// Classifier-ийн category keyword-оос API-ийн бодит category нэрийг олж тестүүдийг шүүнэ
function filterByDetectedCategory(
  assessments: Assessment[],
  detectedCategory: string | undefined,
  categories: AssessmentCategoryWithTests[]
): Assessment[] {
  if (!detectedCategory) return assessments

  const needle = detectedCategory.toLowerCase()

  // 1. Exact match — API category нэртэй шууд таарвал тэр категорийн тестүүдийг буцаана
  const exactCat = categories.find(c => c.name.toLowerCase() === needle)
  if (exactCat?.assessments?.length) {
    const ids = new Set(exactCat.assessments.map(a => a.id))
    const filtered = assessments.filter(a => ids.has(a.id))
    if (filtered.length > 0) return filtered
  }

  // 2. Partial match — category нэрэнд keyword агуулагдвал
  const partialCat = categories.find(c =>
    c.name.toLowerCase().includes(needle) || needle.includes(c.name.toLowerCase())
  )
  if (partialCat?.assessments?.length) {
    const ids = new Set(partialCat.assessments.map(a => a.id))
    const filtered = assessments.filter(a => ids.has(a.id))
    if (filtered.length > 0) return filtered
  }

  // 3. Assessments-ийн category.name-аар шүүх
  const filtered = assessments.filter(a =>
    (a.category?.name || '').toLowerCase().includes(needle) ||
    needle.includes((a.category?.name || '').toLowerCase())
  )
  if (filtered.length > 0) return filtered

  // Таарахгүй бол бүгдийг буцаана
  return assessments
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Мессежээс exam code хайх (6-12 тэмдэгт, том үсэг+тоо)
function extractExamCode(msg: string): string | null {
  const m = msg.match(/\b([A-Z0-9]{6,12})\b/)
  return m ? m[1] : null
}

// "бүх тест жагсаа" гэсэн энгийн хүсэлт — LLM шаардлагагүй
function isListAllIntent(msg: string): boolean {
  return /^(ямар тест|тестүүд|жагсаалт|бүх тест|бүгдийг харуул|what tests|all tests|show all|list all)/i.test(msg.trim())
}

// ── CRISIS SAFETY ─────────────────────────────────────────────────────────────
// Live tests whose text relates to mental health, so a crisis reply can gently
// surface the free depression/anxiety screener instead of unrelated tests.
const MENTAL_HEALTH_RE =
  /депресс|depress|түгшүүр|anxiety|сэтгэц|сэтгэл\s*гутр|стресс|stress|dass|phq|gad|сэмүт|mental|уйтгар|гуниг|panic/i

function pickMentalHealthTests(assessments: Assessment[], lang: 'mn' | 'en') {
  return assessments
    .filter(a =>
      MENTAL_HEALTH_RE.test(
        `${a.name} ${a.nameEn ?? ''} ${a.description ?? ''} ${a.usage ?? ''} ${a.measure ?? ''} ${a.category?.name ?? ''}`
      )
    )
    .slice(0, 2)
    .map(a => formatAssessmentForWidget(a, lang))
}

// Deterministic, supportive reply for self-harm / suicide messages. We never let
// the LLM recommender run for these — leading with warmth + real help matters far
// more than a test card, and it prevents unrelated tests from being surfaced.
const CRISIS_REPLY_MN =
  'Таны бичсэнийг уншаад санаа зовлоо. Эдгээр мэдрэмж хэцүү байдгийг ойлгож байна — та ганцаараа биш, тусламж авах бүрэн боломж бий.\n\n' +
  '- Хэрэв яг одоо аюултай, эсвэл өөрийгөө гэмтээх бодол төрж байвал **103 (яаралтай тусламж)** руу залгах, эсвэл ойр дотны итгэдэг хүндээ яг одоо хэлээрэй.\n' +
  '- **Сэтгэцийн Эрүүл Мэндийн Үндэсний Төв (СЭМҮТ)** зэрэг мэргэжлийн байгууллагад хандаж, сэтгэл зүйч эсвэл эмчтэй уулзвал бодит тус болно.\n' +
  '- Ийм мэдрэмж мөнхийн биш — мэргэжлийн тусламж, дэмжлэгтэйгээр хөнгөрдөг.\n\n' +
  'Хүсвэл сэтгэлийн байдлаа эхлээд үнэлэхэд доорх үнэгүй асуумж чиглүүлэг өгч болно. Гэхдээ энэ нь мэргэжлийн эмч/сэтгэл зүйчийг орлохгүй гэдгийг санаарай.'

const CRISIS_REPLY_EN =
  "I'm really glad you reached out, and I'm concerned about what you shared. You don't have to face this alone — help is available.\n\n" +
  '- If you feel in danger right now or are thinking of harming yourself, please call **103 (emergency services)** or tell someone you trust immediately.\n' +
  '- Reaching a mental-health professional — for example the **National Center for Mental Health** — and talking to a psychologist or doctor can genuinely help.\n' +
  '- These feelings are not permanent; they ease with proper support.\n\n' +
  'If it helps, the free screener below can be a first step to understand how you feel. It is not a substitute for a professional doctor or psychologist.'

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json'))
      return Response.json({ error: 'Content-Type must be application/json' }, { status: 415 })

    const body = await req.json()
    const { messages, lang: forcedLang, sessionId: providedSessionId, examContext: clientExamContext } = body
    
    // Generate or use provided session ID for memory
    const sessionId = providedSessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2)}`

    if (!Array.isArray(messages) || messages.length === 0)
      return Response.json({ error: 'messages array required' }, { status: 400 })

    const lastMessage = (messages[messages.length - 1]?.content as string) ?? ''
    if (!lastMessage.trim())
      return Response.json({ error: 'empty message' }, { status: 400 })

    // ── FAST PATH: Report analysis requests ─────────────────────────────
    // Bypass classifier/test-lookup. Keep token budget tight so we stay under
    // Vercel's serverless timeout.
    if (/^Тестийн үр дүнгийн дүн шинжилгээ хийнэ үү/i.test(lastMessage.trim())) {
      try {
        if (!hasGeminiKey()) {
          return Response.json({ error: 'GEMINI_API_KEY missing on server' }, { status: 503 })
        }

        // Trim huge prompts to keep latency predictable (max ~5k chars input)
        const trimmedPrompt =
          lastMessage.length > 5000 ? lastMessage.slice(0, 5000) + '\n...' : lastMessage

        const analysisSystem =
          'Та hire.mn-ийн сэтгэл зүйч AI зөвлөх. Тестийн үр дүнг ТОВЧ, ВИЗУАЛ хэлбэрээр задлан шинжил.\n\n' +
          'ХЭЛНИЙ ШААРДЛАГА (маш чухал):\n' +
          '- Зөвхөн жирийн, өдөр тутмын монгол үг ашигла. Зохиомол үг бичихгүй.\n' +
          '- Үг үсгийн алдаагүй бичих ёстой.\n' +
          '- Англи үгийг монголоор бичих гэж бүү оролдоорой.\n\n' +
          'ХЭМЖЭЭ ШААРДЛАГА (маш чухал):\n' +
          '- Гол дүгнэлт: яг 1 өгүүлбэр (макс 20 үг).\n' +
          '- Bullet бүр: "**Гарчиг (2-4 үг):** товч тайлбар (5-10 үг)" хэлбэртэй.\n' +
          '- Bullet body хэт урт байх ёсгүй — НИЙТ 12 үгээс ХЭТРЭХГҮЙ.\n' +
          '- Хэт олон bullet хэрэггүй: давуу 3, анхаарах 3, зөвлөмж 3, алхам 3.\n\n' +
          'БҮТЭЦ (Markdown, гарчгийг ** одоор тодруулна):\n' +
          '**Гол дүгнэлт**\n[1 товч өгүүлбэр]\n\n' +
          '**Давуу тал**\n' +
          '• **Гарчиг:** товч тайлбар\n' +
          '• **Гарчиг:** товч тайлбар\n' +
          '• **Гарчиг:** товч тайлбар\n\n' +
          '**Анхаарах зүйл**\n' +
          '• **Гарчиг:** товч тайлбар\n' +
          '• **Гарчиг:** товч тайлбар\n' +
          '• **Гарчиг:** товч тайлбар\n\n' +
          '**Практик зөвлөмж**\n' +
          '• **Гарчиг:** товч тайлбар\n' +
          '• **Гарчиг:** товч тайлбар\n' +
          '• **Гарчиг:** товч тайлбар\n\n' +
          '**Цаашдын алхам**\n' +
          '• **Алхам 1 нэр:** ямар үйлдэл хийх\n' +
          '• **Алхам 2 нэр:** ямар үйлдэл хийх\n' +
          '• **Алхам 3 нэр:** ямар үйлдэл хийх\n\n' +
          'ЗААВАЛ "Цаашдын алхам" хэсгийг үлдээх. Тон: эерэг, эмпатитэй, оношилгоо БИШ.'

        const { text } = await withGeminiFallback(model => generateText({
          model,
          // Generous budget: thinking tokens (on 3.x models) count here too, so
          // leave room for both the model's reasoning and the full answer.
          maxOutputTokens: 3000,
          system: analysisSystem,
          messages: [{ role: 'user', content: trimmedPrompt }],
        }))
        const polished = await polishMongolian(text.trim())
        return Response.json({ reply: polished || 'Шинжилгээ хийж чадсангүй.' })
      } catch (analysisErr: any) {
        const m = analysisErr?.message || String(analysisErr)
        console.error('[chat/route] analysis fast-path failed:', m)
        return Response.json({ error: `Analysis failed: ${m}` }, { status: 500 })
      }
    }

    // Intent + хэл тодорхойлох
    const { intent, useLLM, detectedLang, priceFilter, category: detectedCategoryFromClassifier } = classify(lastMessage)
    const lang: 'mn' | 'en' = forcedLang === 'mn' || forcedLang === 'en' ? forcedLang : detectedLang

    // Get or create user memory for personalization
    const memory = getOrCreateMemory(sessionId)

    // API-аас тестүүд татах
    const liveAssessments = await getAssessments()
    const assessmentMap = new Map(liveAssessments.map(a => [a.id, a]))

    // ── CRISIS SAFETY: self-harm / suicide takes priority over everything ──────
    // Skip the classifier/LLM recommender entirely (it was surfacing unrelated
    // tests like team-role or alcohol). Respond with support + real resources
    // and, at most, the free mental-health screener.
    if (detectCrisis(lastMessage)) {
      const mhTests = pickMentalHealthTests(liveAssessments, lang)
      return Response.json({
        reply: lang === 'en' ? CRISIS_REPLY_EN : CRISIS_REPLY_MN,
        tests: mhTests,
        categories: [...new Set(mhTests.map(t => t?.category).filter(Boolean))] as string[],
        source: 'crisis',
        intent: 'general',
        tokens_used: 0,
        sessionId,
      })
    }

    // Assessment ID → widget card (live data эсвэл static fallback)
    const shapeTest = (id: number) => {
      const live = assessmentMap.get(id)
      if (live) return formatAssessmentForWidget(live, lang)
      const t = TEST_DATABASE[id]
      if (!t) return null
      const isFree = t.price === 'Uneggui' || t.priceEn === 'Free'
      return {
        id: t.id,
        name: lang === 'mn' ? t.name : t.nameEn,
        desc: lang === 'mn' ? t.desc : t.descEn,
        url: t.url,
        price: isFree ? 'Үнэгүй' : `${t.price}₮`,
        duration: t.time,
        emoji: t.emoji,
        color: t.color,
        free: isFree,
        image: t.image,
        icon: '', category: '', count: 0, author: '',
      }
    }

    // ── ROUTE 1: Бүх тест жагсаах — AI зардалгүй ──────────────────────────
    const { category: detectedCategory } = classify(lastMessage)

    if (isListAllIntent(lastMessage)) {
      // Category илрүүлсэн бол шүүж харуулна, үгүй бол бүгдийг
      const source = filterByDetectedCategory(liveAssessments, detectedCategory, cachedCategories)
      const tests = source.map(a => formatAssessmentForWidget(a, lang))
      const categories = [...new Set(source.map(a => a.category?.name).filter(Boolean))] as string[]
      const catLabel = detectedCategory && tests.length < liveAssessments.length
        ? `"${detectedCategory}" категорийн `
        : 'нийт '

      return Response.json({
        reply: lang === 'mn'
          ? `hire.mn дээр ${catLabel}**${tests.length} тест** байна. Категориор нь шүүж үзэх боломжтой:`
          : `hire.mn has **${tests.length} assessments**. You can filter by category:`,
        tests,
        categories,
        source: 'list_all',
        intent: 'list_all',
        tokens_used: 0,
      })
    }

    // ── ROUTE 1.5: Free/Paid Tests — static, no AI cost ──────────────────
    if (lastMessage === '__FREE_TESTS__') {
      const freeTests = liveAssessments
        .filter(a => a.price === 0 && a.isActive !== false)
        .map(a => formatAssessmentForWidget(a, lang))
      return Response.json({
        reply: '',
        tests: freeTests,
        categories: ['free'],
        source: 'static_free',
        intent: 'recommend',
        tokens_used: 0,
      })
    }
    
    if (lastMessage === '__PAID_TESTS__') {
      const paidTests = liveAssessments
        .filter(a => a.price > 0 && a.isActive !== false)
        .map(a => formatAssessmentForWidget(a, lang))
      return Response.json({
        reply: '',
        tests: paidTests,
        categories: ['paid'],
        source: 'static_paid',
        intent: 'recommend',
        tokens_used: 0,
      })
    }

    // ── ROUTE 2: FAQ — instant, no AI cost ────────────────────────────────
    if (!useLLM || intent === 'faq') {
      const faqResult = findFAQ(lastMessage, lang, liveAssessments)
      if (faqResult) {
        // FAQ хариултын хамт холбогдох категорийн тестүүдийг санал болгоно
        let suggestedTests: typeof liveAssessments = []
        if (faqResult.suggestCategories && faqResult.suggestCategories.length > 0) {
          // Санал болгох категорийн тестүүдийг шүүнэ
          for (const cat of faqResult.suggestCategories) {
            const catTests = liveAssessments
              .filter(a => a.category?.name?.toLowerCase().includes(cat.toLowerCase()))
              .slice(0, 3)
            suggestedTests.push(...catTests)
          }
        }
        // Хэрэв категори тодорхойлогдоогүй бол үнэгүй тестүүдийг санал болгоно
        if (suggestedTests.length === 0) {
          suggestedTests = liveAssessments
            .filter(a => a.price === 0 && a.isActive !== false)
            .slice(0, 3)
        }
        const tests = suggestedTests.map(a => formatAssessmentForWidget(a, lang))
        const categories = [...new Set(tests.map(t => t?.category).filter(Boolean))] as string[]
        return Response.json({
          reply: faqResult.answer,
          tests,
          categories,
          source: 'faq',
          intent,
          tokens_used: 0
        })
      }
    }

    // ── ROUTE 3: Analyze — exam code-оор үр дүн татах ────────────────────
    let examContext = ''
    if (intent === 'analyze') {
      const code = extractExamCode(lastMessage)
      if (code) {
        const result: UserAnswerResult | null = await getResultByCode(code)
        if (result) {
          const name = result.assessmentId
            ? (assessmentMap.get(result.assessmentId)?.name ?? `Тест #${result.assessmentId}`)
            : 'тест'
          examContext = lang === 'mn'
            ? `\n\nХЭРЭГЛЭГЧИЙН ҮР ДҮН (${code}):\n• Тест: ${name}\n• Оноо: ${result.score ?? '?'}\n• Түвшин: ${result.level ?? '?'}`
            : `\n\nUSER RESULT (${code}):\n• Test: ${name}\n• Score: ${result.score ?? '?'}\n• Level: ${result.level ?? '?'}`
        }
      }
    }

    // ── ROUTE 4: LLM — тест санал болгох үндсэн зорилготой ─────────────
    // Category илрүүлсэн бол тэр категорийн тестүүдийг LLM-д өгч, карт ч шүүж харуулна
    const relevantAssessments = filterByDetectedCategory(liveAssessments, detectedCategory, cachedCategories)

    // Relevance ranking over the FULL live set (not the category-filtered subset)
    // so a strong cross-category match is never hidden. Drives both the prompt's
    // shortlist and the no-marker fallback below.
    const ranked = rankAssessments(lastMessage, liveAssessments, { category: detectedCategory })
    const rankedShortlist = ranked.slice(0, 8)
    
    // Widget-provided context: summary of the user's just-analyzed test result.
    // With this in the system prompt the AI advises on the result directly
    // instead of asking the user to paste it again.
    const clientExamBlock =
      typeof clientExamContext === 'string' && clientExamContext.trim()
        ? (lang === 'mn'
            ? `\n\nХЭРЭГЛЭГЧИЙН СҮҮЛД ӨГСӨН ТЕСТИЙН ҮР ДҮН (системд аль хэдийн байгаа — код нэхэх, үр дүн хуулж оруулахыг хүсэх ХЭРЭГГҮЙ):\n${clientExamContext.slice(0, 2500)}\n\nХэрэглэгч "энэ үр дүн", "миний тест", "зөвлөгөө өгөөч" гэх мэтээр хандвал ЭНЭ үр дүнд шууд тулгуурлан мэргэжлийн сэтгэл зүйчийн түвшинд тодорхой, хэрэгжихүйц зөвлөгөө өг. Аль тест болохыг дахин бүү асуу.\n\nТООН МЭДЭЭЛЛИЙН ХАТУУ ДҮРЭМ:\n- Зөвхөн ДЭЭР бичигдсэн тоог ашигла. Оноо, дээд оноо, хувь, түвшинг ЗОХИОХГҮЙ, ӨӨРЧЛӨХГҮЙ, дахин тооцохгүй.\n- Дээд оноо (хуваарь) өгөгдөөгүй тоог "x/10", "x/100" гэх мэтээр хуваарьтай болгож бүү бич, хувь болгож бүү хөрвүүл.\n- Аль нэг тоо контекстод байхгүй бол түүнийг дурдахгүй байх, эсвэл "тайланд заагаагүй" гэж хэл.`
            : `\n\nUSER'S LATEST TEST RESULT (already in the system — never ask them to paste it):\n${clientExamContext.slice(0, 2500)}\n\nWhen the user refers to "my result" or asks for advice, ground your professional guidance in this result and answer directly without asking which test they mean.\n\nSTRICT NUMERIC RULES:\n- Use ONLY the numbers written above. Never invent, alter or recompute a score, maximum or percentage.\n- Never attach a denominator ("x/10", "x/100") to a value whose maximum was not given, and never convert it to a percentage.\n- If a number is not in the context, omit it or say it is not stated in the report.`)
        : ''

    // Reply style contract. The widget renders **bold**, headings and bullets
    // but NOT markdown tables, and the reply must fit the token budget below
    // without getting cut off — so the model is told both explicitly.
    const styleRules = lang === 'mn'
      ? `\n\nХАРИУЛТЫН НАЙРУУЛГА (заавал мөрдөнө):
- МОНГОЛ ХЭЛНИЙ ЧАНАР ЧУХАЛ: дүрэм, найруулга зүй, цэг таслал ТӨГС, алдаагүй бич. Өгүүлбэр бүр утга төгс, бүтэн. Албан бус ярианы хэллэг, орос/англи болон зохиомол үг хэрэглэхгүй, үгсийг оновчтой сонго.
- Emoji хэт их хэрэглэхгүй: гарчигт огт хэрэглэхгүй, нийт хариултад хамгийн ихдээ 1.
- Markdown ХҮСНЭГТ (| ... | ... |) ОГТ хэрэглэхгүй — оронд нь "**Нэр:** товч тайлбар" хэлбэрийн жагсаалт ашигла.
- Бүтэц: **тод гарчиг**, дараа нь • жагсаалт. Урт нуршсан догол мөр бичихгүй.
- Хэмжээ: 250 үгээс хэтрэхгүй. Хариултаа ЗААВАЛ бүрэн өгүүлбэрээр төгсгө — хэзээ ч тас орхихгүй; багтахгүй бол агуулгаа хураангуйл.
- Сэтгэл зүй, эрүүл мэнд, хувь хүний зөвлөгөө өгсөн бол хариултынхаа ЭЦЭСТ дараах мэдэгдлийг заавал нэг мөрөөр нэм: "Энэ бол анхан шатны зөвлөгөө бөгөөд мэргэжлийн эмч/сэтгэл зүйчийг орлохгүй." Өөрийгөө "мэргэжлийн эмч/сэтгэл зүйч" гэж бүү нэрлэ, онош бүү тавь.`
      : `\n\nREPLY STYLE (mandatory):
- Professional, grammatically correct language. No slang.
- Minimal emoji: none in headings, at most 1 in the whole reply.
- NEVER use markdown tables (| ... |) — use "**Label:** short text" bullet lines instead.
- Structure: **bold headings** + • bullets. No long rambling paragraphs.
- Length: at most ~250 words. ALWAYS end on a complete sentence — never cut off mid-thought; condense instead.`

    // Build system prompt with RAG knowledge retrieval and memory context
    const systemPrompt = buildSystemPrompt(
      intent,
      lang,
      relevantAssessments,
      detectedCategory,
      lastMessage,  // For RAG knowledge retrieval
      memory,       // For personalization
      rankedShortlist  // Relevance-ranked candidates for this query
    ) + examContext + clientExamBlock + styleRules
    const compressed = compressHistory(messages)
    const formattedMessages = compressed
      .filter((m: { role: string }) => ['user', 'assistant', 'bot'].includes(m.role))
      .map((m: { role: string; content: string }) => ({
        role: (m.role === 'bot' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: String(m.content),
      }))

    const aiResponse = await withGeminiFallback(model => generateText({
      model,
      // Mongolian is token-heavy (~2-3 tokens/word) and 3.x models spend tokens
      // "thinking"; a generous budget lets the reply finish instead of truncating.
      maxOutputTokens: 3000,
      system: systemPrompt,
      messages: formattedMessages,
    }))

    const rawText = aiResponse.text ?? ''
    const tokensUsed = aiResponse.usage?.totalTokens ?? 0

    // Parse [TEST:id] markers from response
    const { cleanText, testIds } = parseTestMarkers(rawText)
    
    // ALWAYS use live assessments API as primary source
    let tests: any[] = []
    const addedIds = new Set<number>()

    // If priceFilter specified (user asked for "үнэгүй" or "төлбөртэй"), get ALL matching tests from API
    if (priceFilter && relevantAssessments?.length > 0) {
      const filteredLive = relevantAssessments.filter(a => {
        const isFree = a.price === 0
        return priceFilter === 'free' ? isFree : !isFree
      })
      tests = filteredLive.map(a => formatAssessmentForWidget(a, lang))
    }
    // Otherwise, get tests based on LLM markers from API. Resolve against the
    // FULL live set (not the category-filtered subset) so a valid cross-category
    // pick from the ranked shortlist still renders.
    else if (testIds.length > 0 && liveAssessments.length > 0) {
      for (const id of testIds) {
        const liveTest = assessmentMap.get(id)
        if (liveTest && !addedIds.has(id)) {
          tests.push(formatAssessmentForWidget(liveTest, lang))
          addedIds.add(id)
        }
      }
      // Fallback to static database if API doesn't have the test
      for (const id of testIds) {
        if (addedIds.has(id)) continue
        const testInfo = TEST_DATABASE[id]
        if (testInfo) {
          const isFree = testInfo.price === 'Uneggui'
          tests.push({
            id: testInfo.id,
            name: lang === 'en' ? testInfo.nameEn : testInfo.name,
            desc: lang === 'en' ? testInfo.descEn : testInfo.desc,
            url: testInfo.url,
            price: isFree ? 'Үнэгүй' : `${testInfo.price}₮`,
            duration: testInfo.time,
            emoji: testInfo.emoji,
            color: testInfo.color,
            free: isFree,
            image: testInfo.image,
            category: testInfo.category,
            icon: '', count: 0, author: '',
          })
          addedIds.add(id)
        }
      }
    }
    // If no LLM markers found, fall back to the relevance ranking — the top
    // matches for THIS query, not a random slice. Only surface ones that clear
    // a real relevance threshold so weak/incidental matches don't show.
    else if (testIds.length === 0 && liveAssessments.length > 0) {
      const STRONG = 6  // ≈ one strong field hit (e.g. a name/measure keyword)
      for (const r of ranked) {
        if (tests.length >= 3) break
        if (r.score >= STRONG && !addedIds.has(r.assessment.id)) {
          tests.push(formatAssessmentForWidget(r.assessment, lang))
          addedIds.add(r.assessment.id)
        }
      }
      // Still nothing? Only show a default list when the user is actually
      // browsing (e.g. "show me tests", price/duration questions). For a
      // described problem with no genuine match, show NO cards — the text reply
      // guides instead. A random slice here was what produced unrelated results.
      const isBrowsing = isListAllIntent(lastMessage) || !!priceFilter ||
        /үнэ|төлбөр|хэд|хэдэн минут|хугацаа|price|cost|how long|бүх тест|all tests/i.test(lastMessage)
      if (tests.length === 0 && isBrowsing) {
        tests = relevantAssessments.slice(0, 6).map(a => formatAssessmentForWidget(a, lang))
      }
    }

    // Category tabs — санал болгосон тестүүдийн категориудаар tab харуулна
    const categories = tests.length > 0
      ? [...new Set(tests.map(t => t?.category).filter(Boolean))] as string[]
      : []

    // Second-pass Mongolian proofread for substantial replies — Gemini flash
    // still makes occasional grammar/word errors ("амсарч"→"амарч"), so a tight
    // proofreader cleans them without touching meaning/structure. Short replies
    // (greetings etc.) skip it to save latency.
    const replyText = (lang === 'mn' && cleanText.trim().length > 120)
      ? await polishMongolian(cleanText)
      : cleanText

    // Update memory with this conversation turn
    const recommendedTestIds = tests.map(t => t.id).filter(Boolean)
    updateMemoryFromMessage(sessionId, lastMessage, {
      detectedCategory,
      priceFilter,
      intent,
      recommendedTestIds,
    })

    return Response.json({
      reply: replyText,
      tests,
      categories,
      source: 'llm',
      intent,
      tokens_used: tokensUsed,
      sessionId, // Return session ID for client to persist
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[chat/route] error:', message)
    if (message.includes('API key') || message.includes('API_KEY'))
      return Response.json({ error: 'Gemini API key missing or invalid.', code: 'API_KEY_ERROR' }, { status: 503 })
    return Response.json({ error: message }, { status: 500 })
  }
}
