import { NextRequest, NextResponse } from 'next/server'
import { classify } from '@/lib/classifier'
import { findFAQ } from '@/lib/faq-db'
import { buildSystemPrompt, compressHistory } from '@/lib/ai-brain'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { messages, lang: forcedLang } = await req.json()

    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1].content as string

    // STEP 1: Classify
    const { intent, useLLM, detectedLang } = classify(lastMessage)
    const lang = forcedLang || detectedLang

    // STEP 2: FAQ → Database (fast, $0)
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

    // STEP 3: LLM (for complex questions)
    const systemPrompt = buildSystemPrompt(intent, lang)
    const compressedMessages = compressHistory(messages)

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 512,
        system: systemPrompt,
        messages: compressedMessages,
      }),
    })

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json()
      throw new Error(err.error?.message || 'Anthropic API error')
    }

    const data = await anthropicRes.json()
    const reply = data.content[0].text

    return NextResponse.json({
      reply,
      source: 'llm',
      intent,
      tokens_used: data.usage?.input_tokens + data.usage?.output_tokens,
    })

  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json(
      { error: 'Error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
