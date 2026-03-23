import { generateText } from 'ai'
import { classify } from '@/lib/classifier'
import { findFAQ } from '@/lib/faq-db'
import { buildSystemPrompt, compressHistory } from '@/lib/ai-brain'

// NOTE: Do NOT use runtime = 'edge' with AI SDK

export async function POST(req: Request) {
  try {
    const { messages, lang: forcedLang } = await req.json()
    console.log('[v0] Received messages:', JSON.stringify(messages))

    if (!messages?.length) {
      return Response.json({ error: 'messages required' }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1].content as string
    console.log('[v0] Last message:', lastMessage)

    // STEP 1: Classify intent (no LLM cost)
    const { intent, useLLM, detectedLang } = classify(lastMessage)
    const lang = forcedLang || detectedLang
    console.log('[v0] Classification:', { intent, useLLM, detectedLang, lang })

    // STEP 2: FAQ -> Database (fast, $0)
    if (!useLLM || intent === 'faq') {
      const faqAnswer = findFAQ(lastMessage, lang)
      console.log('[v0] FAQ answer found:', !!faqAnswer)
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
    console.log('[v0] Using LLM for intent:', intent)

    // Format messages for AI SDK
    const formattedMessages = compressedMessages.map((m: { role: string; content: string }) => ({
      role: m.role === 'bot' ? 'assistant' as const : m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Use Vercel AI Gateway - no API key needed in v0
    console.log('[v0] Calling generateText with openai/gpt-4o-mini...')
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      system: systemPrompt,
      messages: formattedMessages,
      maxOutputTokens: 500,
    })
    console.log('[v0] LLM response received:', result.text?.substring(0, 100))

    return Response.json({
      reply: result.text,
      source: 'llm',
      intent,
      tokens_used: result.usage?.totalTokens || 0,
    })

  } catch (err) {
    console.error('[v0] Chat API error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[v0] Error details:', errorMessage)
    return Response.json(
      { error: 'Error occurred. Please try again.', details: errorMessage },
      { status: 500 }
    )
  }
}
