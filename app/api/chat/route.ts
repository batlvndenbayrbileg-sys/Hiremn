// hire.mn chat API — v2
import { generateText } from 'ai'
import { classify } from '@/lib/classifier'
import { findFAQ } from '@/lib/faq-db'
import { buildSystemPrompt, compressHistory } from '@/lib/brain'

export const maxDuration = 30

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

    // 2. FAQ lookup — free, instant, zero AI cost
    if (!useLLM || intent === 'faq') {
      const faqAnswer = findFAQ(lastMessage, lang)
      if (faqAnswer) {
        return Response.json({ reply: faqAnswer, source: 'faq', intent, tokens_used: 0 })
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

    const { text, usage } = await generateText({
      model: 'openai/gpt-4o-mini',
      system: systemPrompt,
      messages: formattedMessages,
      maxOutputTokens: 500,
      temperature: 0.7,
    })

    return Response.json({
      reply: text,
      source: 'llm',
      intent,
      tokens_used: usage?.totalTokens ?? 0,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[chat/route] error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
