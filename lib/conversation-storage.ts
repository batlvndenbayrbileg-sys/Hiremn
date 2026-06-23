// Conversation storage - localStorage-д хадгалах
export interface Conversation {
  id: string
  title: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  createdAt: number
  updatedAt: number
  messageCount: number
}

interface UsageData {
  count: number
  lockedUntil: number | null // timestamp when locked, null if not locked
}

const MESSAGE_LIMIT = 10
const LOCK_DURATION = 8 * 60 * 60 * 1000 // 8 hours in milliseconds
const STORAGE_KEY = 'hiremn_conversations'
const ACTIVE_CONVERSATION_KEY = 'hiremn_active_conversation'
const USAGE_KEY = 'hiremn_usage_v2'

// Get usage data
function getUsageData(): UsageData {
  if (typeof window === 'undefined') return { count: 0, lockedUntil: null }
  try {
    const data = localStorage.getItem(USAGE_KEY)
    if (!data) return { count: 0, lockedUntil: null }
    const usage = JSON.parse(data) as UsageData
    
    // Check if lock has expired
    if (usage.lockedUntil && Date.now() >= usage.lockedUntil) {
      // Reset after lock expires
      return { count: 0, lockedUntil: null }
    }
    
    return usage
  } catch {
    return { count: 0, lockedUntil: null }
  }
}

// Save usage data
function saveUsageData(usage: UsageData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage))
}

// Increment message count
export function incrementDailyCount(): void {
  const usage = getUsageData()
  usage.count += 1
  
  // Lock if limit reached
  if (usage.count >= MESSAGE_LIMIT && !usage.lockedUntil) {
    usage.lockedUntil = Date.now() + LOCK_DURATION
  }
  
  saveUsageData(usage)
}

// Get remaining messages
export function getRemainingMessages(): number {
  const usage = getUsageData()
  if (usage.lockedUntil && Date.now() < usage.lockedUntil) {
    return 0
  }
  return Math.max(0, MESSAGE_LIMIT - usage.count)
}

// Check if user is locked
export function isUserLocked(): boolean {
  const usage = getUsageData()
  return !!(usage.lockedUntil && Date.now() < usage.lockedUntil)
}

// Get unlock time
export function getUnlockTime(): Date | null {
  const usage = getUsageData()
  if (usage.lockedUntil && Date.now() < usage.lockedUntil) {
    return new Date(usage.lockedUntil)
  }
  return null
}

// Check if can send message
export function canSendMessage(): boolean {
  return getRemainingMessages() > 0 && !isUserLocked()
}

// Get total used
export function getTodayUsedCount(): number {
  return getUsageData().count
}

// Format unlock time for display
export function formatUnlockTime(): string {
  const unlockTime = getUnlockTime()
  if (!unlockTime) return ''
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return unlockTime.toLocaleDateString('mn-MN', options)
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
