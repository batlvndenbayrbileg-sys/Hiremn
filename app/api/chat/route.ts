// app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { classify } from '@/lib/classifier'
import { findFAQ } from '@/lib/faq-db'
import { buildSystemPrompt, compressHistory } from '@/lib/brain'
import { parseTestMarkers, TEST_DATABASE } from '@/lib/test-db'
import {
  getAllAssessments,
  getAssessmentCategories,
  formatAssessmentForWidget,
  getResultByCode,
  type Assessment,
  type UserAnswerResult,
  type AssessmentCategoryWithTests,
} from '@/lib/hire-api'

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json'))
      return Response.json({ error: 'Content-Type must be application/json' }, { status: 415 })

    const body = await req.json()
    const { messages, lang: forcedLang } = body

    if (!Array.isArray(messages) || messages.length === 0)
      return Response.json({ error: 'messages array required' }, { status: 400 })

    const lastMessage = (messages[messages.length - 1]?.content as string) ?? ''
    if (!lastMessage.trim())
      return Response.json({ error: 'empty message' }, { status: 400 })

    // Intent + хэл тодорхойлох
    const { intent, useLLM, detectedLang, priceFilter } = classify(lastMessage)
    const lang: 'mn' | 'en' = forcedLang === 'mn' || forcedLang === 'en' ? forcedLang : detectedLang

    // API-аас тестүүд татах
    const liveAssessments = await getAssessments()
    const assessmentMap = new Map(liveAssessments.map(a => [a.id, a]))

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
    const systemPrompt = buildSystemPrompt(intent, lang, relevantAssessments, detectedCategory) + examContext
    const compressed = compressHistory(messages)
    const formattedMessages = compressed
      .filter((m: { role: string }) => ['user', 'assistant', 'bot'].includes(m.role))
      .map((m: { role: string; content: string }) => ({
        role: (m.role === 'bot' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: String(m.content),
      }))

    const model = 'claude-sonnet-4-20250514'

    const aiResponse = await anthropic.messages.create({
      model,
      max_tokens: 300,
      system: systemPrompt,
      messages: formattedMessages,
    })

    const rawText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : ''
    const tokensUsed = (aiResponse.usage?.input_tokens ?? 0) + (aiResponse.usage?.output_tokens ?? 0)

    // Parse [TEST:id] markers from response + extract tests
    const { cleanText, testIds } = parseTestMarkers(rawText)
    
    // Extract tests from BOTH static TEST_DATABASE AND live assessments API
    let tests: any[] = []
    const addedIds = new Set<number>()

    // 1. First add tests from static TEST_DATABASE based on LLM markers
    for (const id of testIds) {
      const testInfo = TEST_DATABASE[id]
      if (testInfo && !addedIds.has(id)) {
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

    // 2. Also add tests from live assessments API based on LLM markers
    if (relevantAssessments?.length > 0) {
      for (const id of testIds) {
        const liveTest = relevantAssessments.find(a => a.id === id)
        if (liveTest && !addedIds.has(id)) {
          tests.push(formatAssessmentForWidget(liveTest, lang))
          addedIds.add(id)
        }
      }
    }

    // If priceFilter specified (user asked for "үнэгүй" or "төлбөртэй"), get ALL matching tests
    if (priceFilter) {
      tests = [] // Clear any existing tests

      // 1. Get all matching tests from static TEST_DATABASE
      const allStaticTests = Object.values(TEST_DATABASE)
      const filteredStatic = allStaticTests.filter(t => {
        const isFree = t.price === 'Uneggui' || t.priceEn === 'Free'
        return priceFilter === 'free' ? isFree : !isFree
      })
      tests.push(...filteredStatic.map(t => {
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
          category: t.category,
          icon: '', count: 0, author: '',
        }
      }))

      // 2. Get all matching tests from live assessments API
      if (relevantAssessments?.length > 0) {
        const filteredLive = relevantAssessments.filter(a => {
          const isFree = a.price === 0
          return priceFilter === 'free' ? isFree : !isFree
        })
        tests.push(...filteredLive.map(a => formatAssessmentForWidget(a, lang)))
      }

      // 3. Remove duplicates by id
      const seenIds = new Set<number>()
      tests = tests.filter(t => {
        if (seenIds.has(t.id)) return false
        seenIds.add(t.id)
        return true
      })
    }
    // If no priceFilter and no tests found in markers, look through live assessments
    else if (tests.length === 0 && relevantAssessments?.length > 0) {
      tests = relevantAssessments.map(a => formatAssessmentForWidget(a, lang))
    }

    // Category tabs — санал болгосон тестүүдийн категориудаар tab харуулна
    const categories = tests.length > 0
      ? [...new Set(tests.map(t => t?.category).filter(Boolean))] as string[]
      : []

    return Response.json({
      reply: cleanText,
      tests,
      categories,
      source: 'llm',
      intent,
      tokens_used: tokensUsed,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[chat/route] error:', message)
    if (message.includes('API key'))
      return Response.json({ error: 'Anthropic API key missing.', code: 'API_KEY_ERROR' }, { status: 503 })
    return Response.json({ error: message }, { status: 500 })
  }
}
