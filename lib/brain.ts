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
  if (assessments.length === 0) return '(Тестийн мэдээлэл байхгүй байна)'

  return assessments
    .filter(a => a.isActive !== false)
    .slice(0, 20) // Limit for context window
    .map(a => {
      const name = lang === 'en' && a.nameEn ? a.nameEn : a.name
      const price = a.price === 0 ? 'Үнэгүй' : `${a.price.toLocaleString()}₮`
      const duration = a.duration ? `${a.duration} мин` : ''
      const cat = a.category?.name || ''
      return `[TEST:${a.id}] ${name} | ${price} | ${duration} | ${cat}`
    })
    .join('\n')
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
  const coreIdentity = `Та hire.mn платформын МЭРГЭЖЛИЙН AI ЗӨВЛӨХ.

HIRE.MN ТУХАЙ:
• Монголын анхны сэтгэл зүй, зан төлөв, мэргэжлийн чадварын үнэлгээний платформ
• 2020 онд байгуулагдсан
• Уриа: "Зөв хүн, зөв газарт"
• Одоогоор ${totalCount}+ тест, ${freeCount} үнэгүй, ${paidCount} төлбөртэй
• 50,000+ бүртгэлтэй хэрэглэгч, 200+ хамтрагч байгууллага

ТАНЫ ҮҮРЭГ:
1. Хэрэглэгчийн асуудал, сэтгэл зүйн байдлыг ГҮНЗГИЙ ОЙЛГОХ
2. Тэдний нөхцөл байдалд ТОХИРОХ тестүүдийг МЭРГЭЖЛИЙН ТҮВШИНД санал болгох
3. Тест бүрийн ЗОХИОГЧ, АРГА ЗҮЙ, ҮР АШГИЙГ тайлбарлах
4. Итгэл төрүүлэхүйц, энэрэнгүй, мэргэжлийн харилцаа барих`

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
  // ────────────────────────────────────────────────────────────────────────────���
  const freeTests = assessments.filter(a => a.price === 0)
  const paidTests = assessments.filter(a => a.price > 0)
  
  const freeTestMarkers = freeTests.slice(0, 15).map(a => `[TEST:${a.id}]`).join(' ')
  const paidTestMarkers = paidTests.slice(0, 15).map(a => `[TEST:${a.id}]`).join(' ')

  // ─────────────────────────────────────────────────────────────────────────────
  // Test database with use cases
  // ─────────────────────────────────────────────────────────────────────────────
  const testContext = `
ТЕСТҮҮДИЙН МЭДЭЭЛЭЛ (${totalCount} ширхэг):
${formatTestList(assessments, lang)}

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
   - Энгийн асуулт (сайн уу, хэд вэ) → 1-2 өгүүлбэр
   - Ерөнхий асуулт → 2-3 өгүүлбэр
   - Дэлгэрэнгүй асуулт (тайлбарла, яагаад) → 3-5 өгүүлбэр, бүрэн утга санаатай
   - Өгүүлбэр ДУНДАА ТАСРАХГҮЙ, бүрэн дуусгах

2. МОНГОЛ ХЭЛНИЙ ДҮРЭМ
   - Үгийн дараалал: Эзэн + Тодотгол + Үйл үг
   - Хүндэтгэл: "Та" том үсгээр
   - Үг давтахгүй, ижил утгатай үг солих
   - Залгавар зөв: "-ын/-ийн", "-д/-т", "-аар/-оор"

3. [TEST:id] МАРКЕР
   - Тестийн нэр, үнийг текстэд БИЧЭХГҮЙ
   - [TEST:id] маркер → карт автомат харагдана

4. ХОРИГЛОХ
   - Давхардсан үг, хэт урт өгүүлбэр
   - Дундаас тасрах, дутуу өгүүлбэр`

  // ─────────────────────────────────────────────────────────────────────────────
  // Intent-specific guides
  // ─────────────────────────────────────────────────────────────────────────────
  const intentGuides: Record<Intent, string> = {
    faq: `Асуултад товч, тодорхой хариул. Холбогдох тест байвал [TEST:id] нэм.`,

    recommend: `Хэрэглэгчийн асуудлыг ойлгосноо харуул + яагаад тохирохыг 1 өгүүлбэрээр тайлбарла + [TEST:id].
"Үнэгүй тест" → ${freeTestMarkers}
"Төлбөртэй тест" → ${paidTestMarkers}`,

    analyze: `Үр дүнг товч тайлбарла + дараагийн алхам санал болго + [TEST:id].`,

    upsell: `Өмнөх тесттэй холбогдох 2-3 тест санал болго + [TEST:id].`,

    general: `Товч хариулт + холбогдох [TEST:id].
АСУУДАЛ → ТЕСТ:
• Стресс/burnout → [TEST:2] [TEST:6] [TEST:8]
• Өөртөө итгэлгүй → [TEST:7] [TEST:4]
• Харилцаа → [TEST:3] [TEST:12]
• Манлайлал → [TEST:11] [TEST:3]
• Тамхи/архи → [TEST:5] [TEST:99]
• Депресс → [TEST:6] [TEST:8]
• Карьер → [TEST:12] [TEST:1]`
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Category hint
  // ─────────────────────────────────────────────────────────────────────────────
  const categoryHint = filterCategory
    ? `\nИЛРҮҮЛСЭН СОНИРХОЛ: "${filterCategory}" чиглэл. Энэ категорийн тестүүдийг давуу эрэмбэлээрэй.`
    : ''

  // ─────────────────────────────────────────────────────────────────────────────
  // Assemble final prompt
  // ─────────────────────────────────────────────────────────────────────────────
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
// ══════════════════════════════════════════════════════════════════════════════

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
