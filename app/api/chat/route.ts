// hire.mn chat API — v3 with Anthropic SDK + Real API
import Anthropic from '@anthropic-ai/sdk'
import { classify } from '@/lib/classifier'
import { findFAQ } from '@/lib/faq-db'
import { buildSystemPrompt, compressHistory } from '@/lib/brain'
import { parseTestMarkers, TEST_DATABASE } from '@/lib/test-db'
import { getAllAssessments, formatAssessmentForWidget, type Assessment } from '@/lib/hire-api'

export const maxDuration = 30

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Cache for assessments (refreshed every 5 min by API service)
let cachedAssessments: Assessment[] = []
let cacheTime = 0

async function getAssessments(): Promise<Assessment[]> {
  const now = Date.now()
  // Refresh cache every 5 minutes
  if (cachedAssessments.length === 0 || now - cacheTime > 5 * 60 * 1000) {
    const fresh = await getAllAssessments()
    if (fresh.length > 0) {
      cachedAssessments = fresh
      cacheTime = now
    }
  }
  return cachedAssessments
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return Response.json({ error: 'Content-Type must be application/json' }, { status: 415 })
    }

    const body = await req.json()
    const { messages, lang: forcedLang } = body

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages array is required' }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]?.content as string
    if (!lastMessage?.trim()) {
      return Response.json({ error: 'last message content is empty' }, { status: 400 })
    }

    // 1. Classify intent and detect language
    const { intent, useLLM, detectedLang } = classify(lastMessage)
    const lang: 'mn' | 'en' = forcedLang === 'mn' || forcedLang === 'en' ? forcedLang : detectedLang

    // Fetch real assessments from API
    const liveAssessments = await getAssessments()
    const assessmentMap = new Map(liveAssessments.map(a => [a.id, a]))

    // Helper: convert Assessment → widget-compatible shape
    // First try live API data, fallback to static TEST_DATABASE
    const shapeTest = (id: number) => {
      const liveTest = assessmentMap.get(id)
      if (liveTest) {
        return formatAssessmentForWidget(liveTest, lang)
      }
      // Fallback to static data
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
      }
    }

    // 2. FAQ lookup — free, instant, zero AI cost
    if (!useLLM || intent === 'faq') {
      const faqAnswer = findFAQ(lastMessage, lang)
      if (faqAnswer) {
        const { cleanText, testIds } = parseTestMarkers(faqAnswer)
        const tests = testIds.map(shapeTest).filter(Boolean)
        return Response.json({ reply: cleanText, tests, source: 'faq', intent, tokens_used: 0 })
      }
    }

    // 3. LLM — only when truly needed
    const systemPrompt = buildSystemPrompt(intent, lang, liveAssessments)
    const compressed = compressHistory(messages)

    // Normalize roles: 'bot' → 'assistant', keep only user/assistant
    const formattedMessages = compressed
      .filter((m: { role: string; content: string }) =>
        m.role === 'user' || m.role === 'assistant' || m.role === 'bot'
      )
      .map((m: { role: string; content: string }) => ({
        role: (m.role === 'bot' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: String(m.content),
      }))

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: formattedMessages,
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)

    // Parse [TEST:id] markers out of the LLM reply
    const { cleanText, testIds } = parseTestMarkers(rawText)
    console.log('[v0] rawText from LLM:', rawText)
    console.log('[v0] testIds parsed:', testIds)
    console.log('[v0] liveAssessments count:', liveAssessments.length)
    console.log('[v0] liveAssessments IDs:', liveAssessments.slice(0, 10).map(a => a.id))
    
    const tests = testIds.map(id => {
      const result = shapeTest(id)
      console.log('[v0] shapeTest for id', id, ':', result ? 'found' : 'NOT FOUND')
      return result
    }).filter(Boolean)
    
    console.log('[v0] final tests count:', tests.length)

    return Response.json({
      reply: cleanText,
      tests,
      source: 'llm',
      intent,
      tokens_used: tokensUsed,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[chat/route] error:', message)
    
    if (message.includes('API key')) {
      return Response.json({ 
        error: 'Anthropic API key is missing or invalid.',
        code: 'API_KEY_ERROR'
      }, { status: 503 })
    }
    
    return Response.json({ error: message }, { status: 500 })
  }
}
