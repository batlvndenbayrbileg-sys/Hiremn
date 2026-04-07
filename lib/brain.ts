// lib/brain.ts — AI system prompt builder
import { Intent } from './classifier'
import type { Assessment } from './hire-api'

// Assessment-уудыг LLM-д өгөх форматаар бэлтгэнэ
function formatTestList(assessments: Assessment[], lang: 'mn' | 'en'): string {
  if (assessments.length === 0) return '(Тестийн мэдээлэл байхгүй байна)'

  return assessments
    .filter(a => a.isActive !== false)
    .map(a => {
      const name = lang === 'en' && a.nameEn ? a.nameEn : a.name
      const price = a.price === 0 ? 'Үнэгүй' : `${a.price.toLocaleString()}₮`
      const duration = a.duration ? `${a.duration} мин` : ''
      const cat = a.category?.name || ''
      const desc = a.description ? a.description.slice(0, 60) : ''
      return `[TEST:${a.id}] ${name} | ${price} | ${duration} | ${cat} | ${desc}`
    })
    .join('\n')
}

// Категориудыг summary болгон гаргана
function formatCategorySummary(assessments: Assessment[]): string {
  const catMap = new Map<string, number>()
  for (const a of assessments) {
    const cat = a.category?.name || 'Бусад'
    catMap.set(cat, (catMap.get(cat) || 0) + 1)
  }
  return [...catMap.entries()].map(([c, n]) => `• ${c}: ${n} тест`).join('\n')
}

export function buildSystemPrompt(
  intent: Intent,
  lang: 'mn' | 'en',
  assessments: Assessment[] = [],
  filterCategory?: string
): string {
  const testList = formatTestList(assessments, lang)
  const catSummary = formatCategorySummary(assessments)
  const freeCount = assessments.filter(a => a.price === 0).length
  const paidCount = assessments.filter(a => a.price > 0).length

  const coreIdentity = `Та hire.mn платформын мэргэжлийн AI зөвлөх. 
hire.mn = Монголын анхны сэтгэл зүй, зан төлөв, мэргэжлийн чадварын үнэлгээний платформ.
Уриа: "Зөв хүн, зөв газарт"

ҮНДСЭН ЗОРИЛГО: Хэрэглэгчийн асуултад мэргэжлийн түвшинд хариулж, тохирох тестийг санал болгож, худалдан авахад урамшуулах.`

  const testContext = `
ОДОО БАЙГАА ТЕСТҮҮД (${assessments.length} ширхэг, ${freeCount} үнэгүй, ${paidCount} төлбөртэй):
${testList}

КАТЕГОРИУД:
${catSummary}`

  const responseRules = `
ХАРИУЛАХ ДҮРЭМ:
1. Монгол хэлээр, ${lang === 'mn' ? 'кирилл' : 'латин'} үсгээр хариул
2. Мэргэжлийн, найрсаг, итгэл төрүүлэхүйц өнгө аястай бай
3. Богино, тодорхой хариул (2-3 өгүүлбэр)
4. ЗААВАЛ тохирох БҮГД тестийг санал болго — [TEST:id] marker ашигла (2-6 тест)
5. Тестийн нэр, үнийг текстэд давтаж бичэхгүй — карт дээр харагдана
6. Хэрэглэгчийн нөхцөл байдлыг ойлгож, тохирох тестүүдийг БҮГДИЙГ санал болго
7. Категорийн бүх тестийг санал болго — ганцыг биш, бүгдийг нь`

  const intentGuides: Record<Intent, string> = {
    faq: `Асуултад товч хариул + тохирох 2-4 тест санал болго [TEST:id].`,

    recommend: `Хэрэглэгчийн сонирхолд тохирох БҮГД тестийг санал болго.
Категори дотор хэдэн тест байна, бүгдийг нь [TEST:id] marker-аар жагсаа.
Жишээ: "Чадамжийн тест" → Чадамжийн тест категорийн БҮХ тестийн [TEST:id]-г оруул
1-2 өгүүлбэрээр тайлбарла + БҮГД [TEST:id] маркерууд.`,

    analyze: `Үр дүнг мэргэжлийн түвшинд тайлбарла (2-3 өгүүлбэр).
Дараа нь цаашдын хөгжилд тохирох 2-3 тест санал болго [TEST:id].`,

    upsell: `Дараагийн алхамыг санал болго + 2-3 тест [TEST:id].`,

    general: `Хэрэглэгчийн асуултад хариулж, ЗААВАЛ тохирох БҮГД тестийг санал болго.
Категори нэрлэсэн бол тэр категорийн БҮХ тестийн [TEST:id]-г оруул.`
  }

  const categoryHint = filterCategory
    ? `\nИЛРҮҮЛСЭН СОНИРХОЛ: "${filterCategory}" чиглэл. Энэ категорийн тестүүдийг давуу эрэмбэлээрэй.`
    : ''

  return `${coreIdentity}
${testContext}
${categoryHint}
${responseRules}

ДААЛГАВАР (${intent}): ${intentGuides[intent]}`
}

export function compressHistory(
  messages: { role: string; content: string }[]
): { role: string; content: string }[] {
  if (messages.length <= 6) return messages

  const old = messages.slice(0, -4)
  const recent = messages.slice(-4)

  const summary = old
    .filter(m => m.role === 'user')
    .map(m => m.content.slice(0, 50))
    .join('; ')

  return [
    { role: 'user', content: `[Өмнөх яриа: ${summary}]` },
    { role: 'assistant', content: 'Ойлголоо. Та юугаар туслах вэ?' },
    ...recent,
  ]
}
