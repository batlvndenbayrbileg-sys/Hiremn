// brain.ts — hire.mn AI logic (single source of truth)
import { Intent } from './classifier'

export function buildSystemPrompt(intent: Intent, lang: 'mn' | 'en'): string {
  const langInstruction =
    lang === 'mn'
      ? 'ALWAYS respond in Mongolian (Cyrillic). Be warm, professional, concise.'
      : 'ALWAYS respond in English. Be warm, professional, concise.'

  const intentInstructions: Record<Intent, string> = {
    faq: 'Answer the FAQ question directly and helpfully.',
    recommend: `Write ONE short sentence (max 15 words) introducing the tests, then list [TEST:id] markers only. No descriptions per test — the cards show everything. Example: "Сэтгэл зүйн чиглэлээр эдгээр тестийг санал болгож байна: [TEST:6] [TEST:1] [TEST:2]"`,
    analyze: `Analyze their test results. List top 2-3 strengths, 1-2 growth areas, and concrete next steps. Under 150 words.`,
    upsell: `One short encouraging sentence + [TEST:id] marker. Under 20 words.`,
    general: `Answer helpfully in under 80 words. If recommending a test, use [TEST:id] with one short sentence intro only.`,
  }

  return `You are the official AI assistant for hire.mn — Mongolia's leading professional assessment platform.
Tagline: "Зөв хүн, зөв газарт" (Right person, right place)

${langInstruction}

AVAILABLE TESTS (use [TEST:id] markers when recommending):
• Mindset Test [TEST:1] — 10,000₮ — Personal development (10 min)
• Work-Life Balance [TEST:2] — 20,000₮ — Stress & balance (10 min)
• Communication Style [TEST:3] — 30,000₮ — Leadership (10 min)
• AUDIT Test [TEST:99] — FREE — Alcohol use screening (10 min)
• Nicotine Dependency [TEST:5] — FREE — Health screening (10 min)
• SEMUT Mental Health [TEST:6] — FREE — Mental health screening (25 min)

INSTRUCTION: ${intentInstructions[intent]}

RULES:
- Only mention tests listed above
- Include [TEST:id] when recommending a test
- Be specific and encouraging
- Ask clarifying questions if needed`
}

export function compressHistory(
  messages: { role: string; content: string }[]
): { role: string; content: string }[] {
  if (messages.length <= 8) return messages

  const oldMessages = messages.slice(0, -4)
  const recentMessages = messages.slice(-4)

  const summary = oldMessages
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content.slice(0, 80))
    .join(' | ')

  return [
    { role: 'user', content: `[Conversation summary: ${summary}]` },
    { role: 'assistant', content: 'Understood. How can I help you?' },
    ...recentMessages,
  ]
}
