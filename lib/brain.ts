// lib/brain.ts
import { Intent } from './classifier'
import type { Assessment } from './hire-api'

function formatTestList(assessments: Assessment[], lang: 'mn' | 'en', filterCategory?: string): string {
  const FALLBACK = [
    '[TEST:114] AUDIT — Үнэгүй — 10 мин — Эрүүл мэнд',
    '[TEST:113] Никотин хамаарал — Үнэгүй — 10 мин — Эрүүл мэнд',
    '[TEST:112] СЭМҮТ — Үнэгүй — 25 мин — Сэтгэл зүй',
    '[TEST:102] Mindset — 10,000₮ — 10 мин — Хөгжил',
    '[TEST:99] Ажил-амьдрал тэнцвэр — 20,000₮ — 10 мин — Тэнцвэр',
    '[TEST:95] Харилцааны хэв шинж — 30,000₮ — 10 мин — Зан төлөв',
  ].join('\n')

  if (assessments.length === 0) return FALLBACK

  let list = assessments.filter(a => a.isActive !== false)

  if (filterCategory) {
    const filtered = list.filter(a =>
      (a.category?.name || '').toLowerCase().includes(filterCategory.toLowerCase())
    )
    if (filtered.length > 0) list = filtered
  }

  return list
    .map(a => {
      const name = lang === 'en' && a.nameEn ? a.nameEn : a.name
      const price = a.price === 0 ? 'Үнэгүй' : `${a.price.toLocaleString()}₮`
      const duration = a.duration ? `${a.duration} мин` : '10 мин'
      const cat = a.category?.name || ''
      return `[TEST:${a.id}] ${name} — ${price} — ${duration} — ${cat}`
    })
    .join('\n')
}

export function buildSystemPrompt(
  intent: Intent,
  lang: 'mn' | 'en',
  assessments: Assessment[] = [],
  filterCategory?: string
): string {
  const langInstruction = lang === 'mn'
    ? 'Монгол хэлээр (кирилл) хариул.'
    : 'Respond in English.'

  const testList = formatTestList(assessments, lang, filterCategory)

  const intentInstructions: Record<Intent, string> = {
    faq: `1-2 өгүүлбэрээр хариул. Асуултад шууд хариулсны ЭЦЭСТнэгийн санал болгох тест [TEST:id] нэм.`,

    recommend: `Хэрэглэгчийн нөхцөл байдалд тулгуурлан хамгийн тохирох 2-4 тест санал болго.
1 богино өгүүлбэр (10-аас дахиагүй үг) + [TEST:id] маркерууд.
Карт дээр нэр/үнэ харагдах тул текстэд давтаж бичихгүй.`,

    analyze: `Хэрэглэгчийн үр дүнг 2-3 bullet point-оор тайлбарла. Дараа нь тохирох [TEST:id] санал болго.`,

    upsell: `1 урамшуулах өгүүлбэр + 1-2 [TEST:id]. 15 үгнээс хэтрэхгүй.`,

    general: `2 өгүүлбэрээс хэтрэхгүй хариул. ЗААВАЛ 1-3 тохирох [TEST:id] оруул.
Хэрэглэгч ямар чиглэлд сонирхож байгааг таамаглаж тест санал болго.`,
  }

  return `Та hire.mn AI борлуулагч туслагч. hire.mn = Монголын мэргэжлийн үнэлгээний платформ.
ҮНДСЭН ЗОРИЛГО: Хэрэглэгчид тохирох тестийг санал болгож, тэдгээрийг худалдан авахад урамшуулах.
${langInstruction}

ТЕСТҮҮД:
${testList}

ДААЛГАВАР: ${intentInstructions[intent]}

ХАТУУ ДҮРМҮҮД:
- ЗААВАЛ дор хаяж нэг [TEST:id] оруул (зөвхөн analyze-д заавал биш)
- Тестийн нэр, үнийг текстэд давтаж бичихгүй
- 3-аас их өгүүлбэр бичихгүй
- Категори нэрлэсэн бол тэр категорийн бүх тестийг санал болго`
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
