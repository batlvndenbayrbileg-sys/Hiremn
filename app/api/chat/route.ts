// hire.mn chat API — v2 with Anthropic SDK
import Anthropic from '@anthropic-ai/sdk'
import { classify } from '@/lib/classifier'
import { findFAQ } from '@/lib/faq-db'
import { buildSystemPrompt, compressHistory } from '@/lib/brain'
import { parseTestMarkers, TEST_DATABASE } from '@/lib/test-db'

export const maxDuration = 30

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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

    // Helper: convert TestInfo → widget-compatible shape
    const shapeTest = (id: number) => {
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
    const systemPrompt = buildSystemPrompt(intent, lang)
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
    const tests = testIds.map(shapeTest).filter(Boolean)

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
