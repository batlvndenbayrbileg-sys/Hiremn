// lib/faq-db.ts — Instant FAQ responses (no LLM cost)
// Бүх үнэ, тестийн мэдээллийг API-аас авдаг тул hardcode хийхгүй

import type { Assessment } from './hire-api'

export interface FAQEntry {
  id: string
  keywords: string[]
  category: 'price' | 'tests' | 'register' | 'howto' | 'company' | 'time' | 'reliability'
  // Dynamic answer generator — assessments-аас мэдээлэл авна
  generateAnswer: (lang: 'mn' | 'en', assessments: Assessment[]) => string
  // Санал болгох тест категориуд
  suggestCategories?: string[]
}

// Үнийн мэдээллийг API-аас динамикаар гаргана
function formatPriceList(assessments: Assessment[], lang: 'mn' | 'en'): string {
  const free = assessments.filter(a => a.price === 0 && a.isActive !== false)
  const paid = assessments.filter(a => a.price > 0 && a.isActive !== false).sort((a, b) => a.price - b.price)

  const freeList = free.length > 0
    ? free.map(a => `• ${a.name} — ${a.duration || 10} мин`).join('\n')
    : '• Одоогоор үнэгүй тест байхгүй'

  const paidList = paid.length > 0
    ? paid.slice(0, 6).map(a => `• ${a.name} — ${a.price.toLocaleString()}₮ (${a.duration || 10} мин)`).join('\n')
    : ''

  if (lang === 'mn') {
    return `Үнэгүй тестүүд:\n${freeList}${paidList ? `\n\nТөлбөртэй тестүүд:\n${paidList}` : ''}`
  }
  return `Free tests:\n${freeList}${paidList ? `\n\nPaid tests:\n${paidList}` : ''}`
}

// Категориудаар бүлэглэсэн тестийн жагсаалт
function formatTestsByCategory(assessments: Assessment[], lang: 'mn' | 'en'): string {
  const catMap = new Map<string, Assessment[]>()
  for (const a of assessments.filter(x => x.isActive !== false)) {
    const cat = a.category?.name || 'Бусад'
    if (!catMap.has(cat)) catMap.set(cat, [])
    catMap.get(cat)!.push(a)
  }

  const lines: string[] = []
  for (const [cat, tests] of catMap) {
    lines.push(`${cat}:`)
    for (const t of tests.slice(0, 4)) {
      const price = t.price === 0 ? 'Үнэгүй' : `${t.price.toLocaleString()}₮`
      lines.push(`  • ${t.name} (${price})`)
    }
    if (tests.length > 4) lines.push(`  • +${tests.length - 4} бусад...`)
  }
  return lines.join('\n')
}

export const FAQ_DB: FAQEntry[] = [
  {
    id: 'price_general',
    keywords: ['үнэ', 'төлбөр', 'хэд', 'мөнгө', 'price', 'cost', 'fee', 'how much'],
    category: 'price',
    suggestCategories: ['Өөрийн үнэлгээ'],
    generateAnswer: (lang, assessments) => {
      const priceInfo = formatPriceList(assessments, lang)
      return lang === 'mn'
        ? `${priceInfo}\n\nҮнэгүй тестээс эхлээд өөрийгөө танин мэдээрэй.`
        : `${priceInfo}\n\nStart with a free test to learn about yourself.`
    }
  },
  {
    id: 'test_list',
    keywords: ['ямар тест', 'тестүүд', 'жагсаалт', 'байдаг тест', 'what tests', 'list', 'available tests', 'test list'],
    category: 'tests',
    generateAnswer: (lang, assessments) => {
      const list = formatTestsByCategory(assessments, lang)
      return lang === 'mn'
        ? `hire.mn дээр ${assessments.length} тест байна:\n\n${list}\n\nАль чиглэлээр сонирхож байна вэ?`
        : `hire.mn has ${assessments.length} tests:\n\n${list}\n\nWhich area interests you?`
    }
  },
  {
    id: 'register',
    keywords: ['бүртгүүл', 'яаж бүртгүүл', 'хэрхэн бүртгүүл', 'нэвтрэх', 'register', 'sign up', 'how to register', 'create account'],
    category: 'register',
    suggestCategories: ['Өөрийн үнэлгээ'],
    generateAnswer: (lang) => lang === 'mn'
      ? `Бүртгэл үүсгэх:\n① hire.mn → "Нэвтрэх"\n② И-мэйл оруулах\n③ Нууц үг үүсгэх\n④ И-мэйл баталгаажуулах\n\nБүртгэлгүй ч зарим тест өгөх боломжтой.`
      : `To register:\n① Visit hire.mn → "Login"\n② Enter email\n③ Create password\n④ Verify email\n\nSome tests are available without registration.`
  },
  {
    id: 'test_duration',
    keywords: ['хэдэн минут', 'хугацаа', 'удаан', 'хэр их цаг', 'how long', 'duration', 'minutes', 'time'],
    category: 'time',
    generateAnswer: (lang, assessments) => {
      const durations = assessments
        .filter(a => a.isActive !== false && a.duration)
        .map(a => `• ${a.name}: ${a.duration} мин`)
        .slice(0, 6)
        .join('\n')
      return lang === 'mn'
        ? `Тестийн хугацаа:\n${durations}\n\nИхэнх тест 10-15 минутад багтана.`
        : `Test durations:\n${durations}\n\nMost tests take 10-15 minutes.`
    }
  },
  {
    id: 'company_info',
    keywords: ['хэн', 'компани', 'axiom', 'байршил', 'холбоо барих', 'about', 'company', 'contact', 'address', 'who'],
    category: 'company',
    generateAnswer: (lang) => lang === 'mn'
      ? `hire.mn — Аксиом Инк ХХК\nБайршил: СЭЗИС, Б байр, 7 давхар\nУтас: 7511-1111\nИ-мэйл: info@axiominc.mn\n\nМонголын анхны мэргэжлийн үнэлгээний платформ.`
      : `hire.mn — Axiom Inc LLC\nAddress: MUBS Building B, 7th floor\nPhone: 7511-1111\nEmail: info@axiominc.mn\n\nMongolia's first professional assessment platform.`
  },
  {
    id: 'free_tests',
    keywords: ['үнэгүй', 'төлбөргүй', 'free', 'no cost', 'without paying'],
    category: 'price',
    suggestCategories: ['Өөрийн үнэлгээ'],
    generateAnswer: (lang, assessments) => {
      const free = assessments.filter(a => a.price === 0 && a.isActive !== false)
      const list = free.map(a => `• ${a.name} (${a.duration || 10} мин)`).join('\n')
      return lang === 'mn'
        ? `Үнэгүй ${free.length} тест байна:\n${list}\n\nБүртгэлгүй ч эхлэх боломжтой.`
        : `${free.length} free tests available:\n${list}\n\nYou can start without registration.`
    }
  },
  {
    id: 'result_validity',
    keywords: ['хэр зөв', 'найдвартай', 'accurate', 'valid', 'reliable', 'итгэж болох уу'],
    category: 'reliability',
    generateAnswer: (lang) => lang === 'mn'
      ? `hire.mn тестүүд олон улсын стандартад нийцсэн, эрдэм шинжилгээний үндэслэлтэй. Мичиганы ИС, ДЭМБ зэрэг байгууллагуудтай хамтран хөгжүүлсэн.\n\nҮр дүн нь зөвхөн лавлагаа — эмнэлгийн оношлогоог орлохгүй.`
      : `hire.mn tests meet international standards and are evidence-based. Developed with University of Michigan, WHO and others.\n\nResults are for reference only and do not replace medical diagnosis.`
  }
]

// FAQ хайх + test marker нэмэх
export function findFAQ(message: string, lang: 'mn' | 'en', assessments: Assessment[] = []): { answer: string; suggestCategories?: string[] } | null {
  const lower = message.toLowerCase()
  
  for (const entry of FAQ_DB) {
    const matched = entry.keywords.some(kw => lower.includes(kw.toLowerCase()))
    if (matched) {
      return {
        answer: entry.generateAnswer(lang, assessments),
        suggestCategories: entry.suggestCategories
      }
    }
  }
  return null
}
