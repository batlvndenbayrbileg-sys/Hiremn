import { Intent } from './classifier'

// ── Conversation compression ──────────────────────────────────────────
// 8+ мессеж болвол хуучнийг товчлоно → token хэмнэнэ
export function compressHistory(
  messages: { role: string; content: string }[]
): { role: string; content: string }[] {
  if (messages.length <= 8) return messages

  const oldMessages = messages.slice(0, -4)
  const recentMessages = messages.slice(-4)

  // Хуучин мессежийг нэг мөрөөр товчлоно
  const summary = oldMessages
    .filter(m => m.role === 'assistant')
    .map(m => m.content.slice(0, 80))
    .join(' | ')

  return [
    {
      role: 'user',
      content: `[Previous conversation summary: ${summary}]`
    },
    {
      role: 'assistant',
      content: 'I understand. How can I help you further?'
    },
    ...recentMessages
  ]
}

export function buildSystemPrompt(intent: Intent, lang: 'mn' | 'en'): string {
  const langInstruction = lang === 'mn'
    ? 'ALWAYS respond in Mongolian (Cyrillic script). Use warm, encouraging, professional tone. Keep responses concise and friendly.'
    : 'ALWAYS respond in English. Use warm, encouraging, professional tone. Keep responses concise and friendly.'

  const intentInstructions: Record<Intent, string> = {
    faq: '', // FAQ → database хариулдаг тул хэрэггүй

    recommend: `You are a professional career counselor helping someone choose the right assessment.
Your goal: Understand their needs, recommend 1-3 specific tests with clear reasoning.
Always include [TEST:id] markers for recommendations.
Format: 
1. Acknowledge their situation
2. Recommend tests with [TEST:id] marker 
3. Explain what they will discover
4. Why these tests matter for them
Keep it warm, encouraging, under 120 words.`,

    analyze: `You are an expert psychologist analyzing test results.
When given scores, provide:
1. What their scores reveal about them
2. TOP 2-3 key strengths  
3. TOP 1-2 areas for growth
4. Concrete next actions (specific, actionable)
5. Naturally suggest follow-up assessment if relevant
Be encouraging, specific, data-driven. Under 150 words.`,

    upsell: `You are a professional development coach.
The user completed a test and wants guidance.
Your role:
1. Celebrate their progress  
2. Identify what matters most for them
3. Recommend follow-up tests naturally with [TEST:id]
4. Explain specific value they will gain
Keep it motivating and authentic. Under 120 words.`,

    general: `You are a friendly, expert assistant for hire.mn.
Help with questions about professional development, tests, and self-discovery.
When relevant, naturally mention a test using [TEST:id] format.
Be conversational, helpful, and professional. Under 150 words.`,
  }

  return `You are the official AI assistant for hire.mn — Mongolia's leading professional assessment platform.
Tagline: "Зөв хүн, зөв газарт" (Right person, right place)

${langInstruction}

AVAILABLE TESTS (always use [TEST:id] markers):
• Mindset Test [TEST:1] - 10,000₮ - Personal development
• Work-Life Balance [TEST:2] - 20,000₮ - Stress & burnout
• Communication Style [TEST:3] - 30,000₮ - Leadership
• AUDIT Test [TEST:99] - FREE - Health screening
• Nicotine Dependency [TEST:5] - FREE - Health screening
• SEMUT Mental Health [TEST:6] - FREE - Mental health

INSTRUCTION FOR THIS MESSAGE:
${intentInstructions[intent]}

KEY RULES:
✓ Include [TEST:id] when recommending (e.g., Mindset Test [TEST:1])
✓ Be specific and encouraging
✓ Ask clarifying questions if needed
✓ Only mention tests listed above
✓ Explain concrete benefits
✓ Keep responses focused and concise`
}

// ── Conversation compression ──────────────────────────────────────────
// 8+ мессеж болвол хуучнийг товчлоно → token хэмнэнэ
export function compressHistory(
  messages: { role: string; content: string }[]
): { role: string; content: string }[] {
  if (messages.length <= 8) return messages

  const oldMessages = messages.slice(0, -4)
  const recentMessages = messages.slice(-4)

  // Хуучин мессежийг нэг мөрөөр товчлоно
  const summary = oldMessages
    .filter(m => m.role === 'assistant')
    .map(m => m.content.slice(0, 80))
    .join(' | ')

  return [
    {
      role: 'user',
      content: `[Previous conversation summary: ${summary}]`
    },
    {
      role: 'assistant',
      content: 'I understand. How can I help you further?'
    },
    ...recentMessages
  ]
}
