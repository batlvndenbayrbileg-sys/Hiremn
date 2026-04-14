// lib/memory.ts — Conversation Memory System for hire.mn Chatbot
// Stores user context, preferences, and conversation history for personalized responses

export interface UserMemory {
  // User identification
  sessionId: string
  
  // Conversation context
  topics: string[]                    // Хэрэглэгч юуны талаар асуусан
  mentionedIssues: string[]           // Хэрэглэгчийн дурдсан асуудлууд
  interestedCategories: string[]      // Сонирхол илэрхийлсэн категориуд
  viewedTests: number[]               // Үзсэн тестүүд (ID-ээр)
  recommendedTests: number[]          // Санал болгосон тестүүд
  
  // User preferences
  prefersFree: boolean | null         // Үнэгүй тест хайж байгаа эсэх
  language: 'mn' | 'en'               // Хэлний сонголт
  
  // Emotional context
  emotionalState?: string             // Хэрэглэгчийн сэтгэл зүйн байдал
  urgency?: 'low' | 'medium' | 'high' // Яаралтай эсэх
  
  // Session data
  messageCount: number
  firstMessageAt: number
  lastMessageAt: number
  
  // Key conversation points
  keyFacts: string[]                  // Хэрэглэгчийн хэлсэн чухал зүйлс
}

// In-memory store (production-д Redis/DB ашиглана)
const memoryStore = new Map<string, UserMemory>()

// Create or get user memory
export function getOrCreateMemory(sessionId: string): UserMemory {
  if (!memoryStore.has(sessionId)) {
    memoryStore.set(sessionId, {
      sessionId,
      topics: [],
      mentionedIssues: [],
      interestedCategories: [],
      viewedTests: [],
      recommendedTests: [],
      prefersFree: null,
      language: 'mn',
      emotionalState: undefined,
      urgency: undefined,
      messageCount: 0,
      firstMessageAt: Date.now(),
      lastMessageAt: Date.now(),
      keyFacts: [],
    })
  }
  return memoryStore.get(sessionId)!
}

// Update memory based on user message
export function updateMemoryFromMessage(
  sessionId: string, 
  message: string,
  extractedData: {
    detectedCategory?: string
    priceFilter?: 'free' | 'paid'
    intent?: string
    recommendedTestIds?: number[]
  }
): UserMemory {
  const memory = getOrCreateMemory(sessionId)
  const lowerMsg = message.toLowerCase()
  
  // Update timestamps and count
  memory.lastMessageAt = Date.now()
  memory.messageCount++
  
  // Extract emotional state
  if (/стресс|ядар|burnout|сандр|түгш|санаа зов/i.test(lowerMsg)) {
    memory.emotionalState = 'stressed'
    memory.urgency = 'high'
  } else if (/депресс|гутр|уйтгар|гуниг|сэтгэл муу/i.test(lowerMsg)) {
    memory.emotionalState = 'depressed'
    memory.urgency = 'high'
  } else if (/итгэлгүй|эргэлз|айдас|ичимхий/i.test(lowerMsg)) {
    memory.emotionalState = 'anxious'
    memory.urgency = 'medium'
  }
  
  // Extract key issues mentioned
  const issuePatterns = [
    { pattern: /ажил.*их|их.*ажил|overtime|overwork/i, issue: 'workload' },
    { pattern: /харилц.*асуудал|асуудал.*харилц/i, issue: 'relationship' },
    { pattern: /удирд|манлайл|менежер|баг/i, issue: 'leadership' },
    { pattern: /өөртөө итгэ|self.?confidence/i, issue: 'confidence' },
    { pattern: /өөрийгөө үнэл|self.?esteem/i, issue: 'self-esteem' },
    { pattern: /тамхи|никотин|архи|донт/i, issue: 'addiction' },
    { pattern: /нойр|унт/i, issue: 'sleep' },
    { pattern: /гэр бүл|хамтрагч|нөхөр|эхнэр/i, issue: 'family' },
    { pattern: /карьер|ажил хайж|шинэ ажил/i, issue: 'career' },
  ]
  
  for (const { pattern, issue } of issuePatterns) {
    if (pattern.test(lowerMsg) && !memory.mentionedIssues.includes(issue)) {
      memory.mentionedIssues.push(issue)
    }
  }
  
  // Update category interest
  if (extractedData.detectedCategory && !memory.interestedCategories.includes(extractedData.detectedCategory)) {
    memory.interestedCategories.push(extractedData.detectedCategory)
  }
  
  // Update price preference
  if (extractedData.priceFilter === 'free') {
    memory.prefersFree = true
  } else if (extractedData.priceFilter === 'paid') {
    memory.prefersFree = false
  }
  
  // Track recommended tests
  if (extractedData.recommendedTestIds) {
    for (const id of extractedData.recommendedTestIds) {
      if (!memory.recommendedTests.includes(id)) {
        memory.recommendedTests.push(id)
      }
    }
  }
  
  // Extract key facts from message
  const keyFactPatterns = [
    /би (.*?) хүн/i,
    /миний (.*?) асуудал/i,
    /надад (.*?) байна/i,
    /би (.*?) ажилладаг/i,
    /би (.*?) настай/i,
  ]
  
  for (const pattern of keyFactPatterns) {
    const match = lowerMsg.match(pattern)
    if (match && match[1] && !memory.keyFacts.includes(match[0])) {
      memory.keyFacts.push(match[0])
    }
  }
  
  return memory
}

// Generate memory context for LLM
export function generateMemoryContext(memory: UserMemory): string {
  const parts: string[] = []
  
  if (memory.messageCount > 1) {
    parts.push(`[Энэ хэрэглэгчтэй ${memory.messageCount} удаа ярилцсан]`)
  }
  
  if (memory.mentionedIssues.length > 0) {
    const issueLabels: Record<string, string> = {
      workload: 'ажлын ачаалал',
      relationship: 'харилцааны асуудал', 
      leadership: 'манлайлал/удирдлага',
      confidence: 'өөртөө итгэл',
      'self-esteem': 'өөрийгөө үнэлэх',
      addiction: 'хамаарал/донтолт',
      sleep: 'нойр',
      family: 'гэр бүл',
      career: 'карьер',
    }
    const issues = memory.mentionedIssues.map(i => issueLabels[i] || i).join(', ')
    parts.push(`[Өмнө дурдсан асуудлууд: ${issues}]`)
  }
  
  if (memory.emotionalState) {
    const stateLabels: Record<string, string> = {
      stressed: 'стресстэй/ачаалалтай',
      depressed: 'сэтгэл гутралтай',
      anxious: 'санаа зовнилтой',
    }
    parts.push(`[Сэтгэл зүйн байдал: ${stateLabels[memory.emotionalState] || memory.emotionalState}]`)
  }
  
  if (memory.prefersFree === true) {
    parts.push('[Үнэгүй тест хайж байгаа]')
  }
  
  if (memory.recommendedTests.length > 0) {
    parts.push(`[Өмнө санал болгосон тестүүд: ${memory.recommendedTests.slice(-5).join(', ')}]`)
  }
  
  if (memory.keyFacts.length > 0) {
    parts.push(`[Хэрэглэгчийн хэлсэн: "${memory.keyFacts.slice(-3).join('", "')}"]`)
  }
  
  return parts.length > 0 ? '\n\nХЭРЭГЛЭГЧИЙН CONTEXT:\n' + parts.join('\n') : ''
}

// Clear old memories (cleanup)
export function cleanupOldMemories(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
  const now = Date.now()
  for (const [sessionId, memory] of memoryStore.entries()) {
    if (now - memory.lastMessageAt > maxAgeMs) {
      memoryStore.delete(sessionId)
    }
  }
}
