// lib/faq-db.ts
// FAQ database — зөвхөн платформ, бүртгэл, компанийн мэдээлэл
// Тестийн үнэ, жагсаалт зэрэг бүгдийг API-аас авна

export interface FAQEntry {
  id: string
  keywords: string[]
  answer_mn: string
  answer_en: string
  category: 'register' | 'howto' | 'company' | 'trust' | 'support'
  // recommendTests: true бол хариулттай хамт тест санал болгоно
  recommendTests?: boolean
}

export const FAQ_DB: FAQEntry[] = [
  {
    id: 'register',
    keywords: ['бүртгүүл', 'яаж бүртгүүл', 'хэрхэн бүртгүүл', 'нэвтрэх', 'акаунт', 'register', 'sign up', 'create account', 'login'],
    category: 'register',
    answer_mn: `Бүртгүүлэх маш энгийн:\n\n1. hire.mn сайт руу орно\n2. "Нэвтрэх" дээр дарна\n3. И-мэйл хаяг оруулж нууц үг үүсгэнэ\n4. Баталгаажуулаад л дуусна\n\nБүртгэлгүйгээр ч зарим тест үнэгүй авах боломжтой.`,
    answer_en: `Registration is simple:\n\n1. Visit hire.mn\n2. Click "Login"\n3. Enter email and create password\n4. Verify and you're done\n\nSome tests are available free without registration.`,
    recommendTests: true
  },
  {
    id: 'company_info',
    keywords: ['хэн', 'компани', 'axiom', 'байршил', 'холбоо барих', 'утас', 'и-мэйл', 'about', 'company', 'contact', 'address', 'who', 'phone', 'email'],
    category: 'company',
    answer_mn: `hire.mn нь Аксиом Инк ХХК-ийн бүтээгдэхүүн.\n\nХаяг: СЭЗИС, Б байр, 7-р давхар, Энхтайвны өргөн чөлөө-5, Баянзүрх дүүрэг\nУтас: 7511-1111\nИ-мэйл: info@axiominc.mn`,
    answer_en: `hire.mn is a product of Axiom Inc LLC.\n\nAddress: MUBS, Building B, 7th floor, Bayanzurkh District, UB\nPhone: 7511-1111\nEmail: info@axiominc.mn`,
    recommendTests: false
  },
  {
    id: 'trust',
    keywords: ['найдвартай', 'итгэж болох', 'зөв үү', 'аюулгүй', 'нууц', 'хувийн мэдээлэл', 'reliable', 'accurate', 'valid', 'privacy', 'secure', 'trust'],
    category: 'trust',
    answer_mn: `hire.mn тестүүд олон улсын стандартад нийцсэн, эрдэм шинжилгээний үндэслэлтэй. Мичиганы их сургууль, ДЭМБ зэрэг байгууллагуудтай хамтран хөгжүүлсэн. Таны хувийн мэдээллийг нууцлалтай хадгална.`,
    answer_en: `hire.mn tests meet international standards and are evidence-based. Developed in collaboration with University of Michigan, WHO, and other organizations. Your personal data is kept confidential.`,
    recommendTests: true
  },
  {
    id: 'howto',
    keywords: ['хэрхэн', 'яаж', 'яаж ажилладаг', 'хэрхэн ашиглах', 'how to', 'how does', 'how it works'],
    category: 'howto',
    answer_mn: `hire.mn дээр тест өгөх:\n\n1. Тест сонгоно\n2. Асуултуудад хариулна (10-30 мин)\n3. Үр дүнгээ шууд харна\n4. Дэлгэрэнгүй тайлан авах боломжтой\n\nТайван орчинд, тасалдуулалгүй өгөхийг зөвлөе.`,
    answer_en: `Taking a test on hire.mn:\n\n1. Choose a test\n2. Answer questions (10-30 min)\n3. Get instant results\n4. Detailed report available\n\nWe recommend a quiet environment without interruptions.`,
    recommendTests: true
  },
  {
    id: 'support',
    keywords: ['тусламж', 'асуудал', 'алдаа', 'ажиллахгүй', 'help', 'support', 'problem', 'error', 'issue'],
    category: 'support',
    answer_mn: `Асуудал гарвал бидэнтэй холбогдоорой:\n\nИ-мэйл: info@axiominc.mn\nУтас: 7511-1111\n\nАжлын өдрүүдэд 09:00-18:00 цагт хариулна.`,
    answer_en: `If you have issues, contact us:\n\nEmail: info@axiominc.mn\nPhone: 7511-1111\n\nWe respond on business days 09:00-18:00.`,
    recommendTests: false
  }
]

export function findFAQ(message: string, lang: 'mn' | 'en'): { answer: string; recommendTests: boolean } | null {
  const lower = message.toLowerCase()
  
  for (const entry of FAQ_DB) {
    const matched = entry.keywords.some(kw => lower.includes(kw.toLowerCase()))
    if (matched) {
      return {
        answer: lang === 'mn' ? entry.answer_mn : entry.answer_en,
        recommendTests: entry.recommendTests ?? true
      }
    }
  }
  return null
}
