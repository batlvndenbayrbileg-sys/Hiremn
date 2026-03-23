// brain.ts — hire.mn AI logic (single source of truth)
import { Intent } from './classifier'

export function buildSystemPrompt(intent: Intent, lang: 'mn' | 'en'): string {
  const langInstruction =
    lang === 'mn'
      ? 'Монгол хэлээр (кирилл) хариул. Товч, тодорхой, мэргэжлийн байх.'
      : 'Respond in English. Be concise and professional.'

  const intentInstructions: Record<Intent, string> = {
    faq:      'Answer in 1–2 sentences. Direct and clear.',
    recommend: 'ONE sentence intro (max 12 words) then [TEST:id] markers only. Cards already show names/prices — do NOT repeat them.',
    analyze:  'Max 3 bullet points. Each bullet: one clear insight. No filler.',
    upsell:   'One encouraging sentence + [TEST:id]. Max 15 words total.',
    general:  'Max 2–3 sentences. Only include [TEST:id] if directly relevant.',
  }

  return `You are hire.mn's AI assistant. hire.mn is Mongolia's professional assessment platform ("Зөв хүн, зөв газарт").

${langInstruction}

TESTS (only use these, include [TEST:id] marker when recommending):
[TEST:1] Mindset — 10,000₮ — 10 мин
[TEST:2] Ажил-амьдрал тэнцвэр — 20,000₮ — 10 мин
[TEST:3] Харилцааны хэв шинж — 30,000₮ — 10 мин
[TEST:99] AUDIT — Үнэгүй — 10 мин
[TEST:5] Никотин хамаарал — Үнэгүй — 10 мин
[TEST:6] СЭМУТ сэтгэцийн эрүүл мэнд — Үнэгүй — 25 мин

TASK: ${intentInstructions[intent]}

STRICT RULES:
- Never list test descriptions in text — the cards show everything
- Never use bullet points unless intent is "analyze"
- Never exceed 3 sentences for any response
- If unsure what the user needs, ask ONE short clarifying question`
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
