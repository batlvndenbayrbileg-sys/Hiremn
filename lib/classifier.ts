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
}

// Категорийн keyword map — hire.mn /api/v1/assessmentCategory-д байгаа нэртэй таарна
// Key нь API-ийн category.name утгатай (case-insensitive) тохирдог
export const CATEGORY_KEYWORDS: Record<string, RegExp> = {
  // hire.mn API-д байгаа үндсэн категориуд
  'Өөрийн үнэлгээ':       /өөрийн үнэлгээ|өөрийгөө үнэл|self.?assess|өөрийнхөө|миний үнэлгээ|өөрийгөө|өөрт|өөртөө/i,
  'Зан төлөвийн тест':     /зан төлөв|зан чанар|personality|хэв шинж|character|зан|байдал/i,
  'Психометрик тест':      /психометрик|psychometric|оюун ухаан|iq|iq тест|хэмжих|оюун|тархи/i,
  // Keyword-ээр шүүх нэмэлт утга — нэр таарахгүй ч тохирох категори олох
  'сэтгэл':                /сэтгэл зүй|сэтгэц|mental|stress|стресс|anxiety|түгшүүр|сэтгэлийн|гутрал|депресс|anxiety/i,
  'харилцаа':              /харилцаа|communicat|харилцааны|empat|эмпат|нийгмийн|social/i,
  'эрүүл мэнд':            /эрүүл мэнд|health|никотин|тамхи|архи|audit|дарс|уух|тамхидах/i,
  'ажил':                  /ажил|мэргэжил|career|leadership|манаж|удирд|ажлын байр|компани/i,
  'тэнцвэр':               /тэнцвэр|balance|амьдрал|амралт|work.?life|амьдрал.?ажил/i,
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

export function classify(message: string): ClassifyResult {
  const lang = detectLang(message)
  const category = detectCategory(message)

  // 1. Үр дүн шинжилгэх — хамгийн эхэлж
  if (ANALYZE_PATTERNS.some(p => p.test(message))) {
    return { intent: 'analyze', confidence: 0.9, useLLM: true, detectedLang: lang, category }
  }

  // 2. Дараагийн тест
  if (UPSELL_PATTERNS.some(p => p.test(message))) {
    return { intent: 'upsell', confidence: 0.88, useLLM: true, detectedLang: lang, category }
  }

  // 3. Компани/платформ талаарх мэдээлэл — FAQ
  if (FAQ_PATTERNS.some(p => p.test(message))) {
    return { intent: 'faq', confidence: 0.95, useLLM: false, detectedLang: lang }
  }

  // 4. Үнэ, хугацаа, тестийн жагсаалт — FAQ боловч тест санал болгохтой хавсарна
  const isPriceDuration = /үнэ|төлбөр|хэд|мөнгө|үнэгүй|хэдэн минут|хугацаа|price|cost|free|how long/i.test(message)
  if (isPriceDuration) {
    return { intent: 'faq', confidence: 0.85, useLLM: false, detectedLang: lang, category }
  }

  // 5. DEFAULT: recommend — чатботын үндсэн зорилго бол тест санал болгох
  // Ямар ч асуулт ирсэн ч тесттэй холбон хариулна
  return { intent: 'recommend', confidence: 0.8, useLLM: true, detectedLang: lang, category }
}
