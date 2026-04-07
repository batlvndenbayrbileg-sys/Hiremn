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
    const { intent, useLLM, detectedLang } = classify(lastMessage)
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

      // Динамик статистик
      const freeCount = source.filter(a => a.price === 0).length
      const paidCount = source.filter(a => a.price > 0).length

      const catLabel = detectedCategory && tests.length < liveAssessments.length
        ? `"${detectedCategory}" чиглэлээр`
        : ''

      const reply = lang === 'mn'
        ? `${catLabel ? catLabel + ' ' : ''}**${tests.length} тест** байна (${freeCount} үнэгүй, ${paidCount} төлбөртэй). Аль нэгийг сонгоод дэлгэрэнгүй мэдээлэл аваарай:`
        : `${catLabel ? catLabel + ' ' : ''}**${tests.length} tests** available (${freeCount} free, ${paidCount} paid). Select one for details:`

      return Response.json({
        reply,
        tests,
        categories,
        source: 'list_all',
        intent: 'list_all',
        tokens_used: 0,
      })
    }

    // ── ROUTE 2: FAQ — instant, no AI cost ────────────────────────────────
    // FAQ хариулт олдвол шууд буцаана, recommendTests=true бол тест нэмнэ
    if (!useLLM || intent === 'faq') {
      const faqResult = findFAQ(lastMessage, lang)
      if (faqResult) {
        let tests: ReturnType<typeof shapeTest>[] = []
        let categories: string[] = []

        // FAQ хариулттай хамт тест санал болгох
        if (faqResult.recommendTests && liveAssessments.length > 0) {
          // Категори илрүүлсэн бол тэр категорийн тестүүд, үгүй бол үнэгүй тестүүд
          const relevant = detectedCategory
            ? filterByDetectedCategory(liveAssessments, detectedCategory, cachedCategories)
            : liveAssessments.filter(a => a.price === 0) // Үнэгүй тестүүд default

          const toShow = relevant.slice(0, 4)
          tests = toShow.map(a => formatAssessmentForWidget(a, lang))
          categories = [...new Set(toShow.map(a => a.category?.name).filter(Boolean))] as string[]
        }

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

    // [TEST:id] marker-уудыг parse хийж widget card болгоно
    const { cleanText, testIds } = parseTestMarkers(rawText)
    let tests = testIds.map(shapeTest).filter(Boolean)

    // LLM тест санал болгоогүй бол fallback — үргэлж тест харуулна
    if (tests.length === 0 && relevantAssessments.length > 0) {
      // Категори байвал тэр категорийн эхний 3, үгүй бол үнэгүй тестүүд
      const fallbackSource = detectedCategory
        ? relevantAssessments.slice(0, 3)
        : relevantAssessments.filter(a => a.price === 0).slice(0, 3)
      
      if (fallbackSource.length === 0) {
        // Үнэгүй тест байхгүй бол эхний 3-ыг авна
        tests = relevantAssessments.slice(0, 3).map(a => formatAssessmentForWidget(a, lang))
      } else {
        tests = fallbackSource.map(a => formatAssessmentForWidget(a, lang))
      }
    }

    // Category tabs — санал болгосон тестүүдийн категориудаар tab харуулна
    const categories = tests.length > 0
      ? [...new Set(tests.map(t => t?.category).filter(Boolean))] as string[]
      : detectedCategory
        ? [...new Set(relevantAssessments.map(a => a.category?.name).filter(Boolean))] as string[]
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
