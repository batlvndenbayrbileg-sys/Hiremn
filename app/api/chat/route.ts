import { generateText } from 'ai'
import { classify } from '@/lib/classifier'
import { findFAQ } from '@/lib/faq-db'
import { buildSystemPrompt, compressHistory } from '@/lib/ai-brain'

export async function POST(req: Request) {
  try {
    const { messages, lang: forcedLang } = await req.json()

    if (!messages?.length) {
      return Response.json({ error: 'messages required' }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1].content as string

    // STEP 1: Classify intent (no LLM cost)
    const { intent, useLLM, detectedLang } = classify(lastMessage)
    const lang = forcedLang || detectedLang

    // STEP 2: FAQ lookup — instant, $0
    if (!useLLM || intent === 'faq') {
      const faqAnswer = findFAQ(lastMessage, lang)
      if (faqAnswer) {
        return Response.json({ reply: faqAnswer, source: 'faq', intent, tokens_used: 0 })
      }
    }

    // STEP 3: LLM via Vercel AI Gateway (no API key needed)
    const systemPrompt = buildSystemPrompt(intent, lang)
    const compressedMessages = compressHistory(messages)

    const formattedMessages = compressedMessages.map((m: { role: string; content: string }) => ({
      role: (m.role === 'bot' ? 'assistant' : m.role) as 'user' | 'assistant',
      content: m.content,
    }))

    const { text, usage } = await generateText({
      model: 'openai/gpt-5',
      system: systemPrompt,
      messages: formattedMessages,
      maxOutputTokens: 500,
    })

    return Response.json({
      reply: text,
      source: 'llm',
      intent,
      tokens_used: usage?.totalTokens || 0,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[chat/route] error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
