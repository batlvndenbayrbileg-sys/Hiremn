// app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { classify } from '@/lib/classifier'
import { findFAQ } from '@/lib/faq-db'
import { buildSystemPrompt, compressHistory } from '@/lib/brain'
import { parseTestMarkers, TEST_DATABASE } from '@/lib/test-db'
import { getOrCreateMemory, updateMemoryFromMessage, cleanupOldMemories } from '@/lib/memory'
import { searchTestsByProblem } from '@/lib/agent-tools'
import {
  getAllAssessments,
  getAssessmentCategories,
  formatAssessmentForWidget,
  getResultByCode,
  type Assessment,
  type UserAnswerResult,
  type AssessmentCategoryWithTests,
} from '@/lib/hire-api'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

function filterByDetectedCategory(
  assessments: Assessment[],
  detectedCategory: string | undefined,
  categories: AssessmentCategoryWithTests[]
): Assessment[] {
  if (!detectedCategory) return assessments
  const needle = detectedCategory.toLowerCase()

  const exactCat = categories.find(c => c.name.toLowerCase() === needle)
  if (exactCat?.assessments?.length) {
    const ids = new Set(exactCat.assessments.map(a => a.id))
    const filtered = assessments.filter(a => ids.has(a.id))
    if (filtered.length > 0) return filtered
  }

  const partialCat = categories.find(c =>
    c.name.toLowerCase().includes(needle) || needle.includes(c.name.toLowerCase())
  )
  if (partialCat?.assessments?.length) {
    const ids = new Set(partialCat.assessments.map(a => a.id))
    const filtered = assessments.filter(a => ids.has(a.id))
    if (filtered.length > 0) return filtered
  }

  const filtered = assessments.filter(a =>
    (a.category?.name || '').toLowerCase().includes(needle) ||
    needle.includes((a.category?.name || '').toLowerCase())
  )
  if (filtered.length > 0) return filtered

  return assessments
}

function extractExamCode(msg: string): string | null {
  const m = msg.match(/\b([A-Z0-9]{6,12})\b/)
  return m ? m[1] : null
}

function isListAllIntent(msg: string): boolean {
  return /^(ямар тест|тестүүд|жагсаалт|бүх тест|бүгдийг харуул|what tests|all tests|show all|list all)/i.test(msg.trim())
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json'))
      return Response.json({ error: 'Content-Type must be application/json' }, { status: 415 })

    const body = await req.json()
    const { messages, lang: forcedLang, sessionId: providedSessionId } = body

    const sessionId = providedSessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2)}`

    if (!Array.isArray(messages) || messages.length === 0)
      return Response.json({ error: 'messages array required' }, { status: 400 })

    const lastMessage = (messages[messages.length - 1]?.content as string) ?? ''
    if (!lastMessage.trim())
      return Response.json({ error: 'empty message' }, { status: 400 })

    // classify() нэг л удаа дуудна
    const { intent, useLLM, detectedLang, priceFilter, category: detectedCategory } = classify(lastMessage)
    const lang: 'mn' | 'en' = forcedLang === 'mn' || forcedLang === 'en' ? forcedLang : detectedLang

    // Memory cleanup — 1000-аас хэтэрвэл хуучин session-уудыг цэвэрлэнэ
    if (typeof cleanupOldMemories === 'function') {
      try { cleanupOldMemories() } catch (_) { }
    }

    const memory = getOrCreateMemory(sessionId)
    const liveAssessments = await getAssessments()
    const assessmentMap = new Map(liveAssessments.map(a => [a.id, a]))

    // ── ROUTE 1: List all ──────────────────────────────────────────────────
    if (isListAllIntent(lastMessage)) {
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
        tests, categories,
        source: 'list_all', intent: 'list_all', tokens_used: 0,
      })
    }

    // ── ROUTE 1.5: Free/Paid ───────────────────────────────────────────────
    if (lastMessage === '__FREE_TESTS__') {
      const freeTests = liveAssessments
        .filter(a => a.price === 0 && a.isActive !== false)
        .map(a => formatAssessmentForWidget(a, lang))
      return Response.json({ reply: '', tests: freeTests, categories: ['free'], source: 'static_free', intent: 'recommend', tokens_used: 0 })
    }

    if (lastMessage === '__PAID_TESTS__') {
      const paidTests = liveAssessments
        .filter(a => a.price > 0 && a.isActive !== false)
        .map(a => formatAssessmentForWidget(a, lang))
      return Response.json({ reply: '', tests: paidTests, categories: ['paid'], source: 'static_paid', intent: 'recommend', tokens_used: 0 })
    }

    // ── ROUTE 2: FAQ ───────────────────────────────────────────────────────
    if (!useLLM || intent === 'faq') {
      const faqResult = findFAQ(lastMessage, lang, liveAssessments)
      if (faqResult) {
        let suggestedTests: typeof liveAssessments = []
        if (faqResult.suggestCategories?.length > 0) {
          for (const cat of faqResult.suggestCategories) {
            const catTests = liveAssessments
              .filter(a => a.category?.name?.toLowerCase().includes(cat.toLowerCase()))
              .slice(0, 3)
            suggestedTests.push(...catTests)
          }
        }
        if (suggestedTests.length === 0) {
          suggestedTests = liveAssessments.filter(a => a.price === 0 && a.isActive !== false).slice(0, 3)
        }
        const tests = suggestedTests.map(a => formatAssessmentForWidget(a, lang))
        const categories = [...new Set(tests.map(t => t?.category).filter(Boolean))] as string[]
        return Response.json({ reply: faqResult.answer, tests, categories, source: 'faq', intent, tokens_used: 0 })
      }
    }

    // ── ROUTE 3: Exam result context ───────────────────────────────────────
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

    // ── ROUTE 4: LLM ──────────────────────────────────────────────────────
    const relevantAssessments = filterByDetectedCategory(liveAssessments, detectedCategory, cachedCategories)

    const systemPrompt = buildSystemPrompt(
      intent, lang, relevantAssessments, detectedCategory, lastMessage, memory
    ) + examContext

    const compressed = compressHistory(messages)
    const formattedMessages = compressed
      .filter((m: { role: string }) => ['user', 'assistant', 'bot'].includes(m.role))
      .map((m: { role: string; content: string }) => ({
        role: (m.role === 'bot' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: String(m.content),
      }))

    const [aiResponse, agentResult] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: intent === 'analyze' ? 1500 : 800,
        system: systemPrompt,
        messages: formattedMessages,
      }),
      priceFilter
        ? Promise.resolve({ success: true, data: { matches: [] } })
        : Promise.resolve(searchTestsByProblem(lastMessage, relevantAssessments)),
    ])

    const rawText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : ''
    const tokensUsed = (aiResponse.usage?.input_tokens ?? 0) + (aiResponse.usage?.output_tokens ?? 0)
    const { cleanText, testIds } = parseTestMarkers(rawText)

    let tests: any[] = []
    const addedIds = new Set<number>()

    if (priceFilter && relevantAssessments?.length > 0) {
      tests = relevantAssessments
        .filter(a => priceFilter === 'free' ? a.price === 0 : a.price > 0)
        .map(a => formatAssessmentForWidget(a, lang))
    } else if (testIds.length > 0 && relevantAssessments?.length > 0) {
      for (const id of testIds) {
        const liveTest = relevantAssessments.find(a => a.id === id)
        if (liveTest && !addedIds.has(id)) {
          tests.push(formatAssessmentForWidget(liveTest, lang))
          addedIds.add(id)
        }
      }
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
    } else if (testIds.length === 0 && relevantAssessments?.length > 0) {
      if (agentResult.success && agentResult.data.matches?.length > 0) {
        for (const match of agentResult.data.matches) {
          const liveTest = relevantAssessments.find(a => a.id === match.id)
          if (liveTest && !addedIds.has(match.id)) {
            tests.push(formatAssessmentForWidget(liveTest, lang))
            addedIds.add(match.id)
          }
        }
      }
      if (tests.length === 0) {
        tests = relevantAssessments.slice(0, 6).map(a => formatAssessmentForWidget(a, lang))
      }
    }

    const categories = tests.length > 0
      ? [...new Set(tests.map(t => t?.category).filter(Boolean))] as string[]
      : []

    updateMemoryFromMessage(sessionId, lastMessage, {
      detectedCategory,
      priceFilter,
      intent,
      recommendedTestIds: tests.map(t => t.id).filter(Boolean),
    })

    return Response.json({
      reply: cleanText,
      tests, categories,
      source: 'llm', intent,
      tokens_used: tokensUsed,
      sessionId,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[chat/route] error:', message)
    if (message.includes('API key'))
      return Response.json({ error: 'Anthropic API key missing.', code: 'API_KEY_ERROR' }, { status: 503 })
    return Response.json({ error: message }, { status: 500 })
  }
}