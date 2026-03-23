import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { classify } from '@/lib/classifier'
import { findFAQ } from '@/lib/faq-db'
import { buildSystemPrompt, compressHistory } from '@/lib/ai-brain'

// NOTE: Do NOT use runtime = 'edge' with AI SDK

export async function POST(req: NextRequest) {
  try {
    const { messages, lang: forcedLang } = await req.json()

    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1].content as string

    // STEP 1: Classify the intent
    const { intent, useLLM, detectedLang } = classify(lastMessage)
    const lang = forcedLang || detectedLang

    // STEP 2: FAQ -> Database (fast, $0 cost)
    if (!useLLM || intent === 'faq') {
      const faqAnswer = findFAQ(lastMessage, lang)
      if (faqAnswer) {
        return NextResponse.json({
          reply: faqAnswer,
          source: 'faq',
          intent,
          tokens_used: 0,
        })
      }
    }

    // STEP 3: LLM for complex questions
    // Using Vercel AI Gateway - zero config, works automatically in v0
    const systemPrompt = buildSystemPrompt(intent, lang)
    const compressedMessages = compressHistory(messages)

    // Convert messages to AI SDK format
    const aiMessages = compressedMessages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: msg.content,
    }))

    const result = await generateText({
      model: 'anthropic/claude-3-5-haiku-20241022',
      system: systemPrompt,
      messages: aiMessages,
      maxOutputTokens: 512,
    })

    return NextResponse.json({
      reply: result.text,
      source: 'llm',
      intent,
      tokens_used: (result.usage?.promptTokens || 0) + (result.usage?.completionTokens || 0),
    })

  } catch (err) {
    console.error('Chat API error:', err)
    
    // Provide a helpful fallback response
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Error occurred. Please try again.',
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}
