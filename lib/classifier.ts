export type Intent =
  | 'faq'       // Instant DB хариулт — AI зардалгүй
  | 'recommend' // Тест санал болгох — үндсэн зорилго
  | 'analyze'   // Үр дүн тайлбарлах
  | 'upsell'    // Дараагийн тест санал болгох
  | 'general'   // Ерөнхий яриа — always дагалдаад тест санал болгодог

export interface ClassifyResult {
  intent: Intent
  confidence: number
  useLLM: boolean
  detectedLang: 'mn' | 'en'
  category?: string // хэрэглэгч тодорхой категори нэрлэсэн бол
  priceFilter?: 'free' | 'paid' // "үнэгүй" эсвэл "төлбөртэй" тест хүссэн бол
}

// Категорийн keyword map — hire.mn /api/v1/assessmentCategory-д байгаа нэртэй таарна
// Хэрэглэгчийн асуултаас категорийг илрүүлж, тохирох тестүүдийг шүүнэ
export const CATEGORY_KEYWORDS: Record<string, RegExp> = {
  // hire.mn API-д байгаа үндсэн категориуд (exact match) — API нэртэй яг таарах
  'Өөрийн үнэлгээ':        /өөрийн үнэлгээ|өөрийгөө үнэл|self.?assess|миний үнэлгээ|өөрийгөө танин мэд/i,
  'Зан төлөвийн тест':     /зан төлөв|зан чанар|personality|хэв шинж|character/i,
  'Психометрик тест':      /психометрик|psychometric|оюун ухаан|iq тест|оюуны чадвар|танин мэдэхүй/i,
  'Чадамжийн тест':        /чадамж|чадварын тест|competenc|skill.?test|мэргэжлийн чадвар|аналитик|verbal|numerical|логик сэтгэлгээ/i,
  
  // Сэтгэл зүйн асуудлууд — сэтгэл гутрал, түгшүүр, хямрал, өөрийгөө гэмтээх бодол
  'сэтгэл':                /сэтгэл зүй|сэтгэц|mental|stress|стресс|түгшүүр|сэтгэлийн|гутрал|депресс|depress|санаа зов|уйтгар|гуниг|цөхөр|цөхрөл|найдваргүй|ганцаард|нойргүй|panic|сандрал|айдас|хямрал|burnout|шаталт|амиа хорл|амьдрахаас залх|үхмээр|өөрийгөө гэмт|суицид|suicide/i,
  
  // Харилцааны асуудлууд
  'харилцаа':              /харилцаа|communicat|эмпат|нийгмийн|social|хамт олон|найз нөхөд|хос|гэр бүл|хамтрагч/i,
  
  // Эрүүл мэндийн асуудлууд
  'эрүүл мэнд':            /эрүүл мэнд|health|никотин|тамхи|архи|audit|дарс|уух|тамхидах|согтуурах|донтолт|хамаарал/i,
  
  // Ажил, карьертай холбоотой
  'ажил':                  /ажил горилогч|ажилд орох|resume|cv|ярилцлага|interview|ажлын байр/i,
  
  // Амьдралын тэнцвэр
  'тэнцвэр':               /тэнцвэр|balance|амралт|work.?life|амьдрал.?ажил|цаг хуваарь|ачаалал/i,
  
  // Хувийн хөгжил
  'хөгжил':                /хувийн хөгжил|өсөлт|growth|mindset|сэтгэлгээ|хандлага|суралц/i,
}

// Үр дүн шинжилгэх pattern
const ANALYZE_PATTERNS: RegExp[] = [
  /үр дүн|оноо|хэрхэн.*тайлбар|дүн.*тайлбар/i,
  /result|score|explain.*result|what does.*mean/i,
  /\d+.*оноо|\d+.*%|оноо.*\d+/i,
  /[A-Z0-9]{6,12}/, // exam code
]

// Дараагийн тест авах
const UPSELL_PATTERNS: RegExp[] = [
  /дараа нь|цаашид|дараагийн алхам|өөр тест/i,
  /next step|what now|after.*test|improve|another test/i,
  /хөгжүүлэх|сайжруулах|нэмэгдүүлэх/i,
]

// FAQ — AI зардалгүй шууд хариулна
const FAQ_PATTERNS: RegExp[] = [
  /хэн.*компани|axiom|байршил|холбоо барих|утас|и-мэйл/i,
  /бүртгүүл|нэвтрэх|акаунт|нууц үг|register|sign up|login/i,
  /найдвартай|итгэж болох|аюулгүй|privacy|нууц/i,
  /хэрхэн ажилладаг|яаж.*ажилл|how.*work/i,
  /certificate|гэрчилгээ|баталгаа/i,
]

// ── CRISIS DETECTION ──────────────────────────────────────────────────────────
// Self-harm / suicide signals. When matched, the chat route must NOT run the
// generic test recommender (it surfaces unrelated tests); it leads with support
// and emergency resources instead. Kept deliberately broad — false positives here
// are far safer than misses.
export const CRISIS_PATTERN =
  /амиа\s*хорл|амиа\s*тасл|амьдрахаас\s*залх|амьдрах\s*(хүсэлгүй|хүсэхгүй|дургүй)|амьдрахыг\s*хүсэхгүй|үхмээр|үхэхийг\s*хүс|үхэх\s*(бодол|гэж)|өөрийгөө\s*(гэмт|ал|устга)|амьд\s*байхаас\s*залх|цөхөрч\s*байна|суицид|suicide|kill\s*myself|killing\s*myself|end\s*(my\s*life|it\s*all)|self.?harm|want\s*to\s*die|hurt\s*myself/i

export function detectCrisis(message: string): boolean {
  return CRISIS_PATTERN.test(message)
}

function detectLang(message: string): 'mn' | 'en' {
  const cyrillicCount = (message.match(/[\u0400-\u04FF]/g) || []).length
  const latinCount = (message.match(/[a-zA-Z]/g) || []).length
  return cyrillicCount >= latinCount ? 'mn' : 'en'
}

function detectCategory(message: string): string | undefined {
  for (const [cat, pattern] of Object.entries(CATEGORY_KEYWORDS)) {
    if (pattern.test(message)) return cat
  }
  return undefined
}

function detectPriceFilter(message: string): 'free' | 'paid' | undefined {
  const freePattern = /үнэгүй|free|тѳлбѳргүй|төлбөргүй|мөнгөгүй/i
  const paidPattern = /төлбөртэй|төлбөр төлдөг|мөнгөтэй|paid|premium/i
  
  if (freePattern.test(message)) return 'free'
  if (paidPattern.test(message)) return 'paid'
  return undefined
}

export function classify(message: string): ClassifyResult {
  const lang = detectLang(message)
  const category = detectCategory(message)
  const priceFilter = detectPriceFilter(message)

  // 1. Үр дүн шинжилгэх — хамгийн эхэлж
  if (ANALYZE_PATTERNS.some(p => p.test(message))) {
    return { intent: 'analyze', confidence: 0.9, useLLM: true, detectedLang: lang, category, priceFilter }
  }

  // 2. Дараагийн тест
  if (UPSELL_PATTERNS.some(p => p.test(message))) {
    return { intent: 'upsell', confidence: 0.88, useLLM: true, detectedLang: lang, category, priceFilter }
  }

  // 3. Компани/платформ талаарх мэдээлэл — FAQ
  if (FAQ_PATTERNS.some(p => p.test(message))) {
    return { intent: 'faq', confidence: 0.95, useLLM: false, detectedLang: lang, priceFilter }
  }

  // 4. Үнэ, хугацаа, тестийн жагсаалт — тэр төрлийн тестүүдийг санал болгоно
  const isPriceDuration = /үнэ|төлбөр|хэд|мөнгө|үнэгүй|хэдэн минут|хугацаа|price|cost|free|how long/i.test(message)
  if (isPriceDuration) {
    return { intent: 'recommend', confidence: 0.9, useLLM: true, detectedLang: lang, category, priceFilter }
  }

  // 5. DEFAULT: recommend — чатботын үндсэн зорилго бол тест санал болгох
  // Ямар ч асуулт ирсэн ч тесттэй холбон хариулна
  return { intent: 'recommend', confidence: 0.8, useLLM: true, detectedLang: lang, category, priceFilter }
}
