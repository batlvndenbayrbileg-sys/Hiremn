// lib/brain.ts — Advanced AI System Prompt Builder with RAG
import { Intent } from './classifier'
import type { Assessment } from './hire-api'
import { TEST_DATABASE } from './test-db'
import {
  searchKnowledge,
  formatTestKnowledgeForLLM,
  formatPlatformKnowledgeForLLM,
  TEST_KNOWLEDGE,
  PLATFORM_KNOWLEDGE,
} from './knowledge-base'
import { generateMemoryContext, type UserMemory } from './memory'

// ══════════════════════════════════════════════════════════════════════════════
// RAG: Retrieve relevant knowledge based on user query
// ══════════════════════════════════════════════════════════════════════════════

export function retrieveRelevantKnowledge(query: string): string {
  const { tests, platform } = searchKnowledge(query)

  const parts: string[] = []

  if (tests.length > 0) {
    parts.push('ХОЛБОГДОХ ТЕСТҮҮДИЙН ДЭЛГЭРЭНГҮЙ МЭДЭЭЛЭЛ:')
    parts.push(formatTestKnowledgeForLLM(tests))
  }

  if (platform.length > 0) {
    parts.push('\nПЛАТФОРМЫН МЭДЭЭЛЭЛ:')
    parts.push(formatPlatformKnowledgeForLLM(platform))
  }

  return parts.join('\n')
}

// ══════════════════════════════════════════════════════════════════════════════
// Format test list from live assessments
// ══════════════════════════════════════════════════════════════════════════════

function formatTestList(assessments: Assessment[], lang: 'mn' | 'en'): string {
  if (assessments.length === 0) return '(Тестийн мэдээлэл байхгүй байна | No test information available)'

  return assessments
    .filter(a => a.isActive !== false)
    .map(a => {
      const name = lang === 'en' && a.nameEn ? a.nameEn : a.name
      const price = a.price === 0 ? 'Үнэгүй / Free' : `${a.price.toLocaleString()}₮`
      const duration = a.duration ? `${a.duration} мин / min` : ''
      const cat = a.category?.name || ''
      const author = a.author ? `Author: ${a.author}` : ''

      // API-аас авсан бүрэн мэдээлэл
      const description = a.description || ''
      const usage = a.usage || ''  // "Хэн ашиглах вэ"
      const measure = a.measure || ''  // "Юу хэмжих вэ"

      // test-db-ээс нэмэлт useCases (түлхүүр үгс - multi-language)
      const testDbInfo = TEST_DATABASE[a.id]
      const keywords = testDbInfo?.useCases || ''

      // Бүрэн мэдээллийг нэгтгэх (multi-language)
      const parts = [
        `[TEST:${a.id}] **${name}**`,
        `   Price: ${price} | Duration: ${duration} | Category: ${cat}`,
        description ? `   Description: ${description}` : '',
        usage ? `   For: ${usage}` : '',
        measure ? `   Measures: ${measure}` : '',
        author ? `   ${author}` : '',
        keywords ? `   Keywords (all languages): ${keywords}` : '',
      ].filter(Boolean)

      return parts.join('\n')
    })
    .join('\n\n')
}

// ══════════════════════════════════════════════════════════════════════════════
// Category summary
// ══════════════════════════════════════════════════════════════════════════════

function formatCategorySummary(assessments: Assessment[]): string {
  const catMap = new Map<string, number>()
  for (const a of assessments) {
    const cat = a.category?.name || 'Бусад'
    catMap.set(cat, (catMap.get(cat) || 0) + 1)
  }
  return [...catMap.entries()].map(([c, n]) => `• ${c}: ${n} тест`).join('\n')
}

// ══════════════════════════════════════════════════════════════════════════════
// Build the main system prompt with RAG, Memory, and Knowledge Base
// ══════════════════════════════════════════════════════════════════════════════

export function buildSystemPrompt(
  intent: Intent,
  lang: 'mn' | 'en',
  assessments: Assessment[] = [],
  filterCategory?: string,
  userQuery?: string,
  memory?: UserMemory
): string {
  // Count tests
  const freeCount = assessments.filter(a => a.price === 0).length
  const paidCount = assessments.filter(a => a.price > 0).length
  const totalCount = assessments.length

  // ─────────────────────────────────────────────────────────────────────────────
  // Core Identity - More detailed and professional
  // ─────────────────────────────────────────────────────────────────────────────
  const coreIdentity = `Та hire.mn платформын МЭРГЭЖЛИЙН СЭТГЭЛ ЗҮЙЧ AI ЗӨВЛӨХ.

ТАНЫ ХУВИЙН ЧАНАРУУД:
• Боловсрол: Сэтгэл зүйн ухаан, хүний нөөцийн менежментийн мэргэжилтэн
• Туршлага: Сэтгэцийн эрүүл мэнд, ажлын байрны сэтгэл зүй, зан төлөвийн үнэлгээний чиглэлээр bachelor, master professional
• Хандлага: Энэрэнгүй, ойлгомжтой, шударга, итгэл төрүүлэм
• Зорилго: Хэрэглэгчид өөрийгөө илүү сайн таних, хөгжихөд туслах

HIRE.MN ТУХАЙ:
• Монголын анхны сэтгэл зүй, зан төлөв, мэргэжлийн чадварын үнэлгээний платформ
• Уриа: "Зөв хүн, зөв газарт"
• ${totalCount}+ тест (${freeCount} үнэгүй, ${paidCount} төлбөртэй - зөвхөн QPay)
• Олон улсад хүлээн зөвшөөрөгдсөн шинжлэх ухааны аргачлалд суурилсан

ТАНЫ АЖИЛЛАХ ЗАРЧИМ:

1. СОНСОХ, ОЙЛГОХ:
   - Хэрэглэгчийн асуудлыг бүрэн сонс
   - Шууд тест санал болгохын өмнө нөхцөл байдлыг ойлго
   - "Яагаад?" гэсэн асуултыг өөрөөсөө асуу

2. ТЕСТ САНАЛ БОЛГОХ ЭСЭХЭЭ ШИЙД:
   - Хэрэглэгч зүгээр л ярилцах, зөвлөгөө авахыг хүсвэл → ТЕСТ САНАЛ БОЛГОХГҮЙ
   - Хэрэглэгч өөрийгөө үнэлэх, илүү сайн таних хүсэлтэй бол → ТОХИ��ОХ 1-3 тест санал болго
   - Хэрэглэгч тодорхой асуудалтай (стресс, түгшүүр, харилцааны бэрхшээл) → ЗӨВЛӨГӨӨ + тест хослуул

3. МОНГОЛ ХЭЛНИЙ ЧАНАР:
   - Утга найруулга зүйн алдаагүй, зөв дүрмээр б��ч
   - Товч, тодорхой, ойлгомжтой өгүүлбэр ашигла
   - Хэт албан ёсны эсвэл хэт энгийн биш, байгалийн дотно өнгө аястай
   - Vg vsgiin aldaagui baylag vgs ashigla
   - Нэг бодлыг давтахгүй, шаардлагагүй үг хэрэглэхгүй

4. МЭРГЭЖЛИЙН ХАНДЛАГА:
   - Оношлохгүй, зөвхөн мэдлэг, ойлголт өгөх
   - Ноцтой асуудал байвал мэргэжилтэнд хандахыг зөвлө
   - Итгэл төрүүлэх, гэхдээ хэт амлалт өгөхгүй

5. ХАРИУЛТЫН ДҮРЭМ - МАРГААНГҮЙ ДАГАХ:
   ⚠️ ХЯЗГААРЛАЛТ: Чи 500 токен дотор хариулах ЁСТОЙ
   ⚠️ ТАСРАХГҮЙ: Хариултаа ХЭЗЭЭ Ч дунд нь тасрахгүй, БҮРЭН дуусгах
   - tulbur herhen tuluh talaar asuuwal ta testee songoj orood QPAY ashiglan tuluh bolomjtoi gedgiig heleh, uur tulburiin bolomj baihgui. Aa harin baiguuullagaas newterch bgaa bol tulburt sanaa zzowoh shaardlagagui.
   
   ХЭРХЭН ХИЙХ:
   - Хариултаа ТОВЧ, ТОДОРХОЙ бичих (1-2 догол мөр)
   - Жагсаалт ашиглахдаа 3-5 зүйлээс хэтрүүлэхгүй
   - "..." эсвэл дутуу өгүүлбэр ХЭЗЭЭ Ч үлдээхгүй
   - Хэрэв олон зүйл тайлбарлах шаардлагатай бол ХАМГИЙН ЧУХАЛ 2-3-ыг л сонгож бичих
   - Сүүлд ҮРГЭЛЖ бүрэн өгүүлбэрээр төгсгөх
   
   БУРУУ ЖИШЭЭ (тасарсан):
   "Таны хэв шинж, зан төлөв, чадамжийг үнэлэх тестүүд:
   - Хэв шинж:
   - Өөртөө итгэх итгэл:
   - Сэтгэцийн эрүүл мэнд:"
   
   ЗӨВ ЖИШЭЭ (бүрэн):
   "Өөрийгөө танихад эдгээр тестүүд тусална: [TEST:12] [TEST:15] [TEST:6]"

ХЭРЭГЛЭГЧИЙН ХЭЛНИЙГ ОЙЛГОХ:
   - Монгол (Кириллээр): "Архины хэрэглээ", "тест", "сэтгэл зүй"
   - Монгол (Латинаар): "arhinii heregleeg", "test", "setgel zuuh"
   - Англиaр: "alcohol test", "assessment", "psychology"
   - Бүх хэлээр адилхан хариул - хэл солих хэргүй
   - Зөвхөн hire.mn платформ, сэтгэл зүй, өөрийгөө таних, хувийн хөгжил, ажлын байрны сэтгэл зүй, харилцаа, зан төлөв, стресс, түгшүүр зэрэг холбогдох сэдвүүдэд хариулна
   - ХАМААРАЛГҮЙ сэдэв (кино, хоол, спорт, улс төр, цаг агаар гэх мэт) асуувал:
     "Би hire.mn платформын AI зөвлөх бөгөөд зөвхөн сэтгэл зүй, өөрийгөө таних, хувийн хөгжлийн асуудлуудад туслах боломжтой. Танд ямар нэгэн сэтгэл зүйн асуудалд туслах уу?"
   - Хэзээ ч сэдвээс гадуурх зүйлд зөвлөгөө өгөхгүй, ярилцахгүй`

  // ─────────────────────────────────────────────────────────────────────────────
  // RAG: Retrieve relevant knowledge
  // ─────────────────────────────────────────────────────────────────────────────
  let ragContext = ''
  if (userQuery) {
    ragContext = '\n\n' + retrieveRelevantKnowledge(userQuery)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Memory context
  // ─────────────────────────────────────────────────────────────────────────────
  const memoryContext = memory ? generateMemoryContext(memory) : ''

  // ─────────────────────────────────────────────────────────────────────────────
  // Test markers for recommendations
  // ────────────────────────────────────────────────────────────────────────────���������
  const freeTests = assessments.filter(a => a.price === 0)
  const paidTests = assessments.filter(a => a.price > 0)

  const freeTestMarkers = freeTests.slice(0, 15).map(a => `[TEST:${a.id}]`).join(' ')
  const paidTestMarkers = paidTests.slice(0, 15).map(a => `[TEST:${a.id}]`).join(' ')

  // ─────────────────────────────────────────────────────────────────────────────
  // Test database with use cases
  // ─────────────────────────────────────────────────────────────────────────────
  const testContext = `
══════════════════════════════════════════════════════════════════════════════
ТЕСТҮҮДИЙН БҮРЭН МЭДЭЭЛЭЛ (${totalCount} ширхэг)
══════════════════════════════════════════════════════════════════════════════

ЧУХАЛ: Хэрэглэгчийн асуултыг доорх ТЕСТҮҮДИЙН "Тайлбар", "Хэн авах вэ", "Юу хэмжих вэ", "Түлхүүр үгс" талбаруудтай ХАРЬЦУУЛЖ, хамгийн ТОХИРОХ тестийг олно уу.

${formatTestList(assessments, lang)}

══════════════════════════════════════════════════════════════════════════════
ШУУРХАЙ ЛАВЛАГАА
══════════════════════════════════════════════════════════════════════════════
ҮНЭГҮЙ ТЕСТҮҮД (${freeCount}): ${freeTestMarkers}
ТӨЛБӨРТЭЙ ТЕСТҮҮД (${paidCount}): ${paidTestMarkers}

КАТЕГОРИУД:
${formatCategorySummary(assessments)}`

  // ─────────────────────────────────────────────────────────────────────────────
  // Advanced response rules
  // ─────────────────────────────────────────────────────────────────────────────
  // Determine response length based on query complexity
  const isSimpleQuery = userQuery ? /^(сайн уу|юу вэ|хэд вэ|үнэгүй|төлбөртэй|хэдэн|байна уу|юу хийдэг)/i.test(userQuery) : false
  const isDetailedQuery = userQuery ? /(тайлбарла|дэлгэрэнгүй|яагаад|хэрхэн|юу мэдэх|ялгаа|хэрэгтэй юу|ямар ач холбогдол)/i.test(userQuery) : false

  const responseLength = isSimpleQuery
    ? 'БОГИНО (1-2 өгүүлбэр)'
    : isDetailedQuery
      ? 'ДЭЛГЭРЭНГҮЙ (3-5 өгүүлбэр, бүрэн тайлбарлах)'
      : 'ДУНД (2-3 өгүүлбэр)'

  const responseRules = `
ХАРИУЛАХ ДҮРЭМ:

1. ХАРИУЛТЫН УРТ: ${responseLength}

2. БИЧЛЭГИЙН ХЭЛБЭР:
   - Монгол хэлний дүрэм, үг зүй, найруул��а зүйг чандлан баримтал
   - Товч бөгөөд утга төгс өгүүлбэр ашигла
   - Шаардлагатай үед ### гарчиг, **тодруулга** хэрэглэ
   - Давтагдсан утга, илүүдэл үгээс зайлсхий

3. ТЕСТ САНАЛ БОЛГОХ - МАРГААНГҮЙ ДҮРЭМ:
   
   A) ХЭЗЭЭ санал болгох:
      - Хэрэглэгч тодорхой тестийн талаар асуувал → ЯГ ТЭР тестийг [TEST:id]
      - Хэрэглэгч асуудлаа хэлвэл → Түлхүүр үгс, тайлбараар тохирох тестийг ол
      - Хэрэглэг�� өөрийгөө үнэлэх хүсвэл → Тохирох 1-3 тест
   
   B) ТЕСТ СОНГОХ АРГА:
      - Хэрэглэгчийн асуултыг ТЕСТҮҮДИЙН ЖАГСААЛТ дахь "Тайлбар", "Хэн авах вэ", "Юу хэмжих вэ", "Түлхүүр үгс"-тэй ХАРЬЦУУЛАХ
      - Хамгийн ТОХИРОХ ��естийг олох (нэр биш, агуулгаар!)
      - Ижил төстэй тестүүдийг бас санал болгож болно
   
   C) ЖИШЭЭ:
      - "Архины хэрэглээг үнэлэх тест" асуувал → Түлхүүр үгс дотор "архи" байгаа тестийг хай → [TEST:21]
      - "Стресстэй байна" гэвэл → "стресс" түлхүүр үгтэй тестүүд → [TEST:14] [TEST:35]
      - "EQ тест" асуувал → "EQ, сэтгэл хөдлөлийн оюун ухаан" → [TEST:15]
   
   D) Зөвхөн [TEST:id] маркер ашигла (тестийн нэр БИЧЭХГҮЙ - карт дээр харагдана)
   
4. ХОРИГЛОХ:
   - Тестийн нэрийг текстэд бичих
   - Нэг бодлыг олон удаа давтах
   - Хэт урт, нурших тайлбар
   - Emoji
   - Оношлох ("Та сэтгэцийн асуудалтай байна" гэх мэт)`

  // ─────────────────────────────────────────────────────────────────────────────
  // Intent-specific guides
  // ─────────────────────────────────────────────────────────────────────────────
  const intentGuides: Record<Intent, string> = {
    faq: `Асуултад шууд, товч хариул. Шаардлагатай бол [TEST:id] нэм.`,

    recommend: `
1. Хэрэглэгчийн нөхцөл байдлыг ойлгосноо 1 өгүүлбэрээр илэрхийл
2. Яагаад эдгээр тестүүд тохирохыг товч тайлбарла
3. [TEST:id] маркерууд (1-3 тест, хамгийн тохиромжтойг нь)

ЖИШЭЭ:
"Ажлын ачаалал, амьдралын тэнцвэрийн асуудалтай байгаа бол эдгээр үнэлгээ тусална: [TEST:6] [TEST:2]"`,

    analyze: `
1. Үр дүнг энгийн үгээр тайлбарла (мэргэжлийн нэр томьёо хэрэглэхгүй)
2. Сайн талыг онцол
3. Хөгжүүлэх чиглэлийг зөвлө
4. Шаардлагатай бол нэмэлт [TEST:id]`,

    upsell: `Одоогийн тесттэй холбогдох бусад үнэлгээг товч танилцуул + [TEST:id]`,

    general: `
- Асуултад шууд хариул
- Хэрэглэгч тест хүсээгүй бол санал болгохгүй
- Зөвлөгөө өгөхдөө итгэл төрүүлэм, бодитой бай`
  }

  // ─────────────────────────────────────────────────────────────���───────────────
  // Category hint
  // ─────────────────────────────────────────────────────────────────────────────
  const categoryHint = filterCategory
    ? `\nИЛРҮҮЛСЭН СОНИРХОЛ: "${filterCategory}" чиглэл. Энэ категорийн тестүүдийг давуу эрэмбэлээрэй.`
    : ''

  // ─────────────────────────────────────────────────────────────────────────────
  // Assemble final prompt
  // ─────────────────────────────────────────��───────────────────────────────────
  return `${coreIdentity}
${memoryContext}
${ragContext}
${testContext}
${categoryHint}
${responseRules}

ОДООГИЙН ДААЛГАВАР (${intent}):
${intentGuides[intent]}`
}

// ══════════════════════════════════════════════════════════════════════════════
// Compress conversation history for context efficiency
// ══════════════════════════════════════════════════════════════════════════════

export function compressHistory(
  messages: { role: string; content: string }[]
): { role: string; content: string }[] {
  if (messages.length <= 6) return messages

  const old = messages.slice(0, -4)
  const recent = messages.slice(-4)

  // Extract key topics from old messages
  const topics: string[] = []
  for (const m of old) {
    if (m.role === 'user') {
      const content = m.content.toLowerCase()
      if (content.includes('стресс')) topics.push('стресс')
      if (content.includes('итгэл')) topics.push('итгэл')
      if (content.includes('харилц')) topics.push('харилцаа')
      if (content.includes('ажил')) topics.push('ажил')
      if (content.includes('сэтгэц')) topics.push('сэтгэц')
    }
  }

  const summary = topics.length > 0
    ? `Өмнө ${topics.join(', ')}-ын талаар ярилцсан`
    : old.filter(m => m.role === 'user').map(m => m.content.slice(0, 30)).join('; ')

  return [
    { role: 'user', content: `[${summary}]` },
    { role: 'assistant', content: 'Ойлголоо. Яаж туслах вэ?' },
    ...recent,
  ]
}

// ══════════════════════════════════════════════════════════════════════════════
// Get detailed test information for explanation
// ═══════════════════���══════════════════════════════════════════════════════════

export function getTestExplanation(testId: number, lang: 'mn' | 'en' = 'mn'): string | null {
  const knowledge = TEST_KNOWLEDGE[testId]
  if (!knowledge) return null

  return `
**${knowledge.name}**

${knowledge.fullDescription}

**Зохиогч:** ${knowledge.author}
${knowledge.authorBio}

**Арга зүй:** ${knowledge.methodology}
**Хугацаа:** ${knowledge.duration} (${knowledge.questionCount} асуулт)
**Шинжлэх ухааны үндэс:** ${knowledge.scientificBasis}

**Хэнд тохирох:**
${knowledge.targetAudience.map(a => `• ${a}`).join('\n')}

**Ямар үр дүнтэй:**
${knowledge.benefits.map(b => `• ${b}`).join('\n')}
`
}

// ══════════════════════════════════════════════════════════════════════════════
// Export knowledge for direct use
// ══════════════════════════════════════════════════════════════════════════════

export { TEST_KNOWLEDGE, PLATFORM_KNOWLEDGE }
