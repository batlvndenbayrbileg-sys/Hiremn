// lib/brain.ts — AI system prompt builder
import { Intent } from './classifier'
import type { Assessment } from './hire-api'
import { TEST_DATABASE } from './test-db'

// Static test database-аас тестүүдийн дэлгэрэнгүй мэдээллийг авах
function getStaticTestContext(): string {
  return Object.values(TEST_DATABASE).map(t => {
    const isFree = t.price === 'Uneggui'
    return `[TEST:${t.id}] ${t.name} | ${isFree ? 'Үнэгүй' : t.price + '₮'} | ${t.time} | ${t.category}
  Тохирох асуудлууд: ${t.useCases}`
  }).join('\n\n')
}

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

  // Separate free and paid test lists for the prompt
  const freeTests = assessments.filter(a => a.price === 0)
  const paidTests = assessments.filter(a => a.price > 0)
  
  const freeTestMarkers = freeTests.map(a => `[TEST:${a.id}]`).join(' ')
  const paidTestMarkers = paidTests.map(a => `[TEST:${a.id}]`).join(' ')

  // Static test database context with detailed use cases
  const staticTestContext = getStaticTestContext()

  const testContext = `
ТЕСТҮҮДИЙН ДЭЛГЭРЭНГҮЙ МЭДЭЭЛЭЛ (Хэрэглэгчийн асуудалд тохирох тестийг сонго):
${staticTestContext}

ҮНЭГҮЙ ТЕСТҮҮД: ${freeTestMarkers}
ТӨЛБӨРТЭЙ ТЕСТҮҮД: ${paidTestMarkers}

ЧУХАЛ ЗААВАРЧИЛГАА:
- Хэрэглэгч асуудлаа хэлэхэд: "Тохирох асуудлууд" хэсэгт таарч байгаа тестүүдийн [TEST:id] marker-уудыг санал болго
- "Үнэгүй тест" гэж асуувал: ЗӨВХӨН үнэгүй тестүүдийн marker буцаа
- "Төлбөртэй тест" гэж асуувал: ЗӨВХӨН төлбөртэй тестүүдийн marker буцаа
- Тест бүрийн "Тохирох асуудлууд" хэсгийг уншаад хэрэглэгчийн асуудалтай холбогдох тестүүдийг сонго`

  const responseRules = `
ХАРИУЛАХ ДҮРЭМ:
1. Монгол хэлээр, ${lang === 'mn' ? 'кирилл' : 'латин'} үсгээр, НАЙРУУЛГА ЗҮЙН АЛДААГҮЙ хариул
2. Мэргэжлийн, энэрэнгүй, итгэл төрүүлэхүйц өнгө аястай бай
3. БОГИНО хариул — 1-2 өгүүлбэр (хэрэглэгчийн асуудлыг ойлгосноо харуулах + тест санал болгох)
4. ТЕСТИЙГ ТЕКСТЭЭР ЖАГСААХГҮЙ — зөвхөн [TEST:id] marker ашигла
5. Хэрэглэгч асуудлаа хэлэхэд: "Тохирох асуудлууд" хэсэгт таарч байгаа БҮГД тестүүдийг санал болго
6. Жишээ: "Би стресстэй байна" → Ажил-амьдрал тэнцвэр [TEST:2], СЭМУТ [TEST:6], Түгшүүр [TEST:8] тохирно
7. Үг үсгийн алдаа, давхардсан үг ХЭЗЭЭ Ч бичэхгүй`

  const intentGuides: Record<Intent, string> = {
    faq: `Асуултад 1 өгүүлбэрээр хариул + холбогдох [TEST:id] маркерууд.`,

    recommend: `Хэрэглэгчийн асуудлыг ойлгосноо харуулах 1 өгүүлбэр + "Тохирох асуудлууд" хэсэгт таарч байгаа БҮГД [TEST:id] маркерууд.
"Үнэгүй тест" хүсвэл: ${freeTestMarkers}
"Төлбөртэй тест" хүсвэл: ${paidTestMarkers}`,

    analyze: `Үр дүнг 2 өгүүлбэрээр тайлбарла + холбогдох [TEST:id] маркерууд.`,

    upsell: `1 өгүүлбэр + 2-3 тест [TEST:id].`,

    general: `Хэрэглэгчийн асуудалд 1-2 өгүүлбэрээр хариулж, "Тохирох асуудлууд" хэсэгт таарч байгаа БҮГД [TEST:id] маркеруудыг санал болго.
Жишээ асуудал → тест:
- "Стресстэй" → [TEST:2] [TEST:6] [TEST:8]
- "Өөртөө итгэлгүй" → [TEST:7] [TEST:4]
- "Харилцааны асуудал" → [TEST:3] [TEST:12]
- "Ажилдаа их цаг" → [TEST:2]`
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
