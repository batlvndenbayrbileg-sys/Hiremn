import { generateText } from 'ai'
import { classify } from '@/lib/classifier'
import { findFAQ } from '@/lib/faq-db'
import { buildSystemPrompt, compressHistory } from '@/lib/ai-brain'

export async function POST(req: Request) {
  try {
    const { messages, lang: forcedLang } = await req.json()
    console.log('[chat/route] Received:', messages.length, 'messages')

    if (!messages?.length) {
      return Response.json({ error: 'messages required' }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1].content as string
    console.log('[chat/route] Last message:', lastMessage.substring(0, 50))

    // STEP 1: Classify intent
    try {
      const { intent, useLLM, detectedLang } = classify(lastMessage)
      const lang = forcedLang || detectedLang
      console.log('[chat/route] Intent:', intent)

      // STEP 2: FAQ lookup
      if (!useLLM || intent === 'faq') {
        const faqAnswer = findFAQ(lastMessage, lang)
        if (faqAnswer) {
          console.log('[chat/route] FAQ match found')
          return Response.json({ reply: faqAnswer, source: 'faq', intent, tokens_used: 0 })
        }
      }

      // STEP 3: LLM
      console.log('[chat/route] Calling LLM for intent:', intent)
      const systemPrompt = buildSystemPrompt(intent, lang)
      const compressedMessages = compressHistory(messages)

      const formattedMessages = compressedMessages.map((m: { role: string; content: string }) => ({
        role: (m.role === 'bot' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content,
      }))

      const { text, usage } = await generateText({
        model: 'openai/gpt-4o-mini',
        system: systemPrompt,
        messages: formattedMessages,
        maxOutputTokens: 500,
      })

      console.log('[chat/route] LLM success')
      return Response.json({
        reply: text,
        source: 'llm',
        intent,
        tokens_used: usage?.totalTokens || 0,
      })
    } catch (classifyErr) {
      console.error('[chat/route] Classify/FAQ/LLM error:', classifyErr instanceof Error ? classifyErr.message : String(classifyErr))
      throw classifyErr
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[chat/route] Fatal error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
