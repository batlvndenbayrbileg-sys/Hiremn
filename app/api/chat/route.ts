import { generateText } from 'ai'
import { classify } from '@/lib/classifier'
import { findFAQ } from '@/lib/faq-db'
import { buildSystemPrompt, compressHistory } from '@/lib/ai-brain'

// NOTE: Do NOT use runtime = 'edge' with AI SDK

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

    // STEP 2: FAQ -> Database (fast, $0)
    if (!useLLM || intent === 'faq') {
      const faqAnswer = findFAQ(lastMessage, lang)
      if (faqAnswer) {
        return Response.json({
          reply: faqAnswer,
          source: 'faq',
          intent,
          tokens_used: 0,
        })
      }
    }

    // STEP 3: LLM for complex questions using Vercel AI Gateway
    const systemPrompt = buildSystemPrompt(intent, lang)
    const compressedMessages = compressHistory(messages)

    // Format messages for AI SDK
    const formattedMessages = compressedMessages.map((m: { role: string; content: string }) => ({
      role: m.role === 'bot' ? 'assistant' as const : m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Use Vercel AI Gateway - no API key needed in v0
    const result = await generateText({
      model: 'openai/gpt-5-mini',
      system: systemPrompt,
      messages: formattedMessages,
      maxOutputTokens: 500,
    })

    return Response.json({
      reply: result.text,
      source: 'llm',
      intent,
      tokens_used: result.usage?.totalTokens || 0,
    })

  } catch (err) {
    console.error('Chat API error:', err)
    return Response.json(
      { error: 'Error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
