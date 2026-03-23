export type Intent =
  | 'faq'           // Database хариулна → $0
  | 'recommend'     // Тест санал болгох → LLM
  | 'analyze'       // Үр дүн анализ → LLM
  | 'upsell'        // Дараагийн тест → LLM
  | 'general'       // Ерөнхий яриа → LLM

export interface ClassifyResult {
  intent: Intent
  confidence: number
  useLLM: boolean
  detectedLang: 'mn' | 'en'
}

// LLM шаардлагатай pattern-ууд
const LLM_PATTERNS: Record<Exclude<Intent, 'faq'>, RegExp[]> = {
  recommend: [
    /надад тохирох|намайг|миний хувьд|зөвлө|санал болго/i,
    /ямар тест авах|хаанаас эхл|юу хийх/i,
    /which test|recommend|suggest|best for me|where to start/i,
    /би.*тест|тест.*би/i,
  ],
  analyze: [
    /үр дүн|оноо|хэрхэн.*тайлбар|дүн.*тайлбар/i,
    /result|score|explain.*result|what does.*mean/i,
    /\d+.*оноо|\d+.*%|оноо.*\d+/i,
    /яагаад.*оноо|оноо.*яагаад/i,
  ],
  upsell: [
    /дараа нь|цаашид|дараагийн алхам/i,
    /next step|what now|after.*test|improve/i,
    /хөгжүүлэх|сайжруулах|нэмэгдүүлэх/i,
  ],
  general: [],
}

// FAQ pattern-ууд — LLM хэрэггүй
const FAQ_PATTERNS: RegExp[] = [
  /үнэ|төлбөр|хэд|мөнгө/i,
  /ямар тест|тестүүд байдаг|жагсаалт/i,
  /бүртгүүл|нэвтрэх|акаунт/i,
  /хэдэн минут|хугацаа|удаан уу/i,
  /хэн.*компани|axiom|байршил|холбоо/i,
  /үнэгүй|төлбөргүй/i,
  /найдвартай|итгэж болох/i,
  /price|cost|fee|how much/i,
  /what tests|test list|available/i,
  /register|sign up|login/i,
  /how long|duration|minutes/i,
  /contact|address|about/i,
  /free test|no cost/i,
]

function detectLang(message: string): 'mn' | 'en' {
  // Кирилл үсэг байвал Монгол
  const cyrillicCount = (message.match(/[\u0400-\u04FF]/g) || []).length
  const latinCount = (message.match(/[a-zA-Z]/g) || []).length
  return cyrillicCount >= latinCount ? 'mn' : 'en'
}

export function classify(message: string): ClassifyResult {
  const lang = detectLang(message)

  // 1. FAQ шалгана — хамгийн эхэлж, LLM огт шаардлагагүй
  const isFaq = FAQ_PATTERNS.some(p => p.test(message))
  if (isFaq) {
    return { intent: 'faq', confidence: 0.95, useLLM: false, detectedLang: lang }
  }

  // 2. LLM intent-үүд шалгана
  for (const [intent, patterns] of Object.entries(LLM_PATTERNS)) {
    if (intent === 'general') continue
    const matched = (patterns as RegExp[]).some(p => p.test(message))
    if (matched) {
      return {
        intent: intent as Intent,
        confidence: 0.85,
        useLLM: true,
        detectedLang: lang,
      }
    }
  }

  // 3. Богино мессеж → FAQ-д хариулах магадлалтай
  if (message.trim().length < 15) {
    return { intent: 'faq', confidence: 0.6, useLLM: false, detectedLang: lang }
  }

  // 4. Тодорхойгүй → LLM шийдэх
  return { intent: 'general', confidence: 0.5, useLLM: true, detectedLang: lang }
}