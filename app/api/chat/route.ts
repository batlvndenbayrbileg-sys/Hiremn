import { generateText } from 'ai'
import { classify } from '@/lib/classifier'
import { findFAQ } from '@/lib/faq-db'
import { buildSystemPrompt, compressHistory } from '@/lib/ai-brain'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, lang: forcedLang } = body

    if (!messages?.length) {
      return Response.json({ error: 'messages required' }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]?.content as string
    if (!lastMessage) {
      return Response.json({ error: 'last message content missing' }, { status: 400 })
    }

    // STEP 1: Classify intent + detect language
    const { intent, useLLM, detectedLang } = classify(lastMessage)
    const lang = (forcedLang === 'mn' || forcedLang === 'en') ? forcedLang : detectedLang

    // STEP 2: FAQ lookup — free, instant, no LLM cost
    if (!useLLM || intent === 'faq') {
      const faqAnswer = findFAQ(lastMessage, lang)
      if (faqAnswer) {
        return Response.json({ reply: faqAnswer, source: 'faq', intent, tokens_used: 0 })
      }
    }

    // STEP 3: LLM — only when needed
    const systemPrompt = buildSystemPrompt(intent, lang)
    const compressedMessages = compressHistory(messages)

    // Normalize roles: bot → assistant
    const formattedMessages = compressedMessages.map((m: { role: string; content: string }) => ({
      role: (m.role === 'bot' ? 'assistant' : m.role) as 'user' | 'assistant' | 'system',
      content: m.content,
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
