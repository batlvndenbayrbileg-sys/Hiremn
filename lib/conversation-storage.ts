// Conversation storage - localStorage-д хадгалах
export interface Conversation {
  id: string
  title: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  createdAt: number
  updatedAt: number
  messageCount: number
}

interface DailyUsage {
  date: string // YYYY-MM-DD
  count: number
}

const MESSAGE_LIMIT = 20
const STORAGE_KEY = 'hiremn_conversations'
const ACTIVE_CONVERSATION_KEY = 'hiremn_active_conversation'
const DAILY_USAGE_KEY = 'hiremn_daily_usage'

// Get today's date as YYYY-MM-DD
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

// Get daily usage
function getDailyUsage(): DailyUsage {
  if (typeof window === 'undefined') return { date: getTodayDate(), count: 0 }
  try {
    const data = localStorage.getItem(DAILY_USAGE_KEY)
    if (!data) return { date: getTodayDate(), count: 0 }
    const usage = JSON.parse(data) as DailyUsage
    // Reset if it's a new day
    if (usage.date !== getTodayDate()) {
      return { date: getTodayDate(), count: 0 }
    }
    return usage
  } catch {
    return { date: getTodayDate(), count: 0 }
  }
}

// Save daily usage
function saveDailyUsage(usage: DailyUsage): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DAILY_USAGE_KEY, JSON.stringify(usage))
}

// Increment daily message count
export function incrementDailyCount(): void {
  const usage = getDailyUsage()
  usage.count += 1
  saveDailyUsage(usage)
}

// Get remaining messages for today (across ALL conversations)
export function getRemainingMessages(): number {
  const usage = getDailyUsage()
  return Math.max(0, MESSAGE_LIMIT - usage.count)
}

// Check if can send message today
export function canSendMessage(): boolean {
  return getRemainingMessages() > 0
}

// Get total used today
export function getTodayUsedCount(): number {
  return getDailyUsage().count
}

export function getConversations(): Conversation[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveConversation(conversation: Conversation): void {
  if (typeof window === 'undefined') return
  try {
    const conversations = getConversations()
    const index = conversations.findIndex(c => c.id === conversation.id)
    
    if (index >= 0) {
      conversations[index] = conversation
    } else {
      conversations.unshift(conversation)
    }
    
    // Keep only last 10 conversations
    const recent = conversations.slice(0, 10)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent))
  } catch (e) {
    console.error('Failed to save conversation:', e)
  }
}

export function getConversation(id: string): Conversation | null {
  return getConversations().find(c => c.id === id) || null
}

export function deleteConversation(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const conversations = getConversations().filter(c => c.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  } catch (e) {
    console.error('Failed to delete conversation:', e)
  }
}

export function createNewConversation(): Conversation {
  const id = Date.now().toString()
  return {
    id,
    title: 'Шинэ яриа',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messageCount: 0,
  }
}

export function setActiveConversation(conversation: Conversation): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(ACTIVE_CONVERSATION_KEY, JSON.stringify(conversation))
}

export function getActiveConversation(): Conversation | null {
  if (typeof window === 'undefined') return null
  try {
    const data = sessionStorage.getItem(ACTIVE_CONVERSATION_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function generateConversationTitle(firstMessage: string): string {
  return firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : '')
}
