// app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { classify } from '@/lib/classifier'
import { findFAQ } from '@/lib/faq-db'
import { buildSystemPrompt, compressHistory } from '@/lib/brain'
import { parseTestMarkers, TEST_DATABASE } from '@/lib/test-db'
import {
  getAllAssessments,
  formatAssessmentForWidget,
  getResultByCode,
  type Assessment,
  type UserAnswerResult,
} from '@/lib/hire-api'

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Cache ────────────────────────────────────────────────────────────────────
let cachedAssessments: Assessment[] = []
let cacheTime = 0

async function getAssessments(): Promise<Assessment[]> {
  const now = Date.now()
  if (cachedAssessments.length === 0 || now - cacheTime > 5 * 60 * 1000) {
    const fresh = await getAllAssessments()
    if (fresh.length > 0) { cachedAssessments = fresh; cacheTime = now }
  }
  return cachedAssessments
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
    // "ямар тест байдаг вэ" гэх мэт энгийн хүсэлтэд шууд бүх тестийг буцаана
    if (isListAllIntent(lastMessage)) {
      const tests = liveAssessments.map(a => formatAssessmentForWidget(a, lang))
      const categories = [...new Set(liveAssessments.map(a => a.category?.name).filter(Boolean))] as string[]

      return Response.json({
        reply: lang === 'mn'
          ? `hire.mn дээр нийт **${tests.length} тест** байна 📋\nКатегориор нь шүүж үзэх боломжтой:`
          : `hire.mn has **${tests.length} assessments** 📋\nFilter by category:`,
        tests,
        categories,
        source: 'list_all',
        intent: 'list_all',
        tokens_used: 0,
      })
    }

    // ── ROUTE 2: FAQ — instant, no AI cost ────────────────────────────────
    if (!useLLM || intent === 'faq') {
      const faqAnswer = findFAQ(lastMessage, lang)
      if (faqAnswer) {
        const { cleanText, testIds } = parseTestMarkers(faqAnswer)
        const tests = testIds.map(shapeTest).filter(Boolean)
        return Response.json({ reply: cleanText, tests, categories: [], source: 'faq', intent, tokens_used: 0 })
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
    const { category: detectedCategory } = classify(lastMessage)
    const systemPrompt = buildSystemPrompt(intent, lang, liveAssessments, detectedCategory) + examContext
    const compressed = compressHistory(messages)
    const formattedMessages = compressed
      .filter((m: { role: string }) => ['user', 'assistant', 'bot'].includes(m.role))
      .map((m: { role: string; content: string }) => ({
        role: (m.role === 'bot' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: String(m.content),
      }))

    // analyze-д sonnet, бусад бүхэнд haiku (хурдан, хямд)
    const model = intent === 'analyze'
      ? 'claude-sonnet-4-20250514'
      : 'claude-haiku-3-5-20241022'

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
    const tests = testIds.map(shapeTest).filter(Boolean)

    // Category tabs — тестүүд байвал үргэлж category-г буцаана
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
