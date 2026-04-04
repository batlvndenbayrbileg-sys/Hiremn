// lib/brain.ts
import { Intent } from './classifier'
import type { Assessment } from './hire-api'

function formatTestList(assessments: Assessment[], lang: 'mn' | 'en'): string {
  if (assessments.length === 0) {
    return [
      '[TEST:114] AUDIT (Архины хэрэглээ) — Үнэгүй — 10 мин — Өөрийн үнэлгээ',
      '[TEST:113] Никотин хамаарал — Үнэгүй — 10 мин — Өөрийн үнэлгээ',
      '[TEST:112] СЭМҮТ урьдчилан сэргийлэх — Үнэгүй — 25 мин — Өөрийн үнэлгээ',
      '[TEST:102] Өсөлтийн сэтгэлгээ (Mindset) — 10,000₮ — 10 мин — Өөрийн үнэлгээ',
      '[TEST:99] Ажил-амьдрал тэнцвэр — 20,000₮ — 10 мин — Өөрийн үнэлгээ',
      '[TEST:95] Харилцааны хэв шинж — 30,000₮ — 10 мин — Зан төлөвийн тест',
    ].join('\n')
  }

  return assessments
    .filter(a => a.isActive !== false)
    .map(a => {
      const name = lang === 'en' && a.nameEn ? a.nameEn : a.name
      const price = a.price === 0 ? 'Үнэгүй' : `${a.price.toLocaleString()}₮`
      const duration = a.duration ? `${a.duration} мин` : '10 мин'
      const category = a.category?.name || ''
      return `[TEST:${a.id}] ${name} — ${price} — ${duration} — ${category}`
    })
    .join('\n')
}

export function buildSystemPrompt(
  intent: Intent,
  lang: 'mn' | 'en',
  assessments: Assessment[] = []
): string {
  const langInstruction = lang === 'mn'
    ? 'Монгол хэлээр (кирилл) хариул. Товч, тодорхой, мэргэжлийн байх.'
    : 'Respond in English. Be concise and professional.'

  const testList = formatTestList(assessments, lang)

  // Intent-д тохирсон зааврууд
  const intentInstructions: Record<Intent, string> = {
    faq: `
1-2 өгүүлбэрээр хариул. Шууд, тодорхой байх.
[TEST:id] marker ашиглах шаардлагагүй.`,

    recommend: `
Хэрэглэгчийн нөхцөл байдалд тулгуурлан ТОХИРОХ тестүүдийг санал болго.
- Нэг тест санал болгох бол: нэг [TEST:id]
- Хэд хэдэн санал болгох бол: хэд хэдэн [TEST:id] (хамгийн их 5)
- Нэг категориос хэд хэдэн санал болгох бол: тэр бүлгийн тестүүдийн [TEST:id]-г жагсаа
Эхэлж нэг богино өгүүлбэр (12-аас дахиагүй үг), дараа нь [TEST:id] маркерууд.
ЧУХАЛ: карт дээр нэр, үнэ бүгд харагдана — текстэд давтаж бичихгүй.`,

    analyze: `
Хэрэглэгчийн үр дүнг шинжил. Хамгийн их 3 bullet point.
Хэрэв дараагийн тест санал болгох нь зүйтэй бол [TEST:id] нэм.`,

    upsell: `
Нэг урамшуулах өгүүлбэр + [TEST:id]. Нийт 15-аас дахиагүй үг.`,

    general: `
Хамгийн их 2-3 өгүүлбэр. Хэрэглэгчийн асуултад хамааралтай бол [TEST:id] нэм.
Хэрэв ямар тест тохирохыг мэдэхгүй бол НЭГ товч тодруулах асуулт асуу.`,
  }

  return `Та hire.mn-ийн AI туслагч юм. hire.mn бол Монголын мэргэжлийн үнэлгээний платформ ("Зөв хүн, зөв газарт").

${langInstruction}

ТЕСТҮҮДИЙН ЖАГСААЛТ (зөвхөн эдгээрийг ашиглах, санал болгохдоо [TEST:id] marker оруулах):
${testList}

ДААЛГАВАР:${intentInstructions[intent]}

ХАТУУ ДҮРМҮҮД:
- Текстэд тестийн нэр, үнийг давтаж бичихгүй — карт дээр харагдана
- "analyze" intent-ээс бусад тохиолдолд bullet point ашиглахгүй
- 3-аас их өгүүлбэр бичихгүй
- Хэрэглэгч category нэрлэвэл тэр category-ийн тестүүдийн [TEST:id]-г оруул`
}

export function compressHistory(
  messages: { role: string; content: string }[]
): { role: string; content: string }[] {
  if (messages.length <= 8) return messages

  const old = messages.slice(0, -4)
  const recent = messages.slice(-4)

  const summary = old
    .filter(m => m.role === 'assistant')
    .map(m => m.content.slice(0, 80))
    .join(' | ')

  return [
    { role: 'user', content: `[Conversation summary: ${summary}]` },
    { role: 'assistant', content: 'Understood. How can I help you?' },
    ...recent,
  ]
}