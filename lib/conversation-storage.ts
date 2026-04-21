// Conversation storage - localStorage-д хадгалах
export interface Conversation {
  id: string
  title: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  createdAt: number
  updatedAt: number
  messageCount: number
}

// Session storage - нийт асуултын тоо
const MESSAGE_LIMIT = 20
const STORAGE_KEY = 'hiremn_conversations'
const ACTIVE_CONVERSATION_KEY = 'hiremn_active_conversation'

export function getCurrentMessageCount(): number {
  if (typeof window === 'undefined') return 0
  const active = sessionStorage.getItem(ACTIVE_CONVERSATION_KEY)
  if (!active) return 0
  const data = JSON.parse(active)
  return data.messageCount || 0
}

export function canSendMessage(): boolean {
  return getCurrentMessageCount() < MESSAGE_LIMIT
}

export function getRemainingMessages(): number {
  return Math.max(0, MESSAGE_LIMIT - getCurrentMessageCount())
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
    
    // Хамгийн сүүлийн 10 conversation л хадгалах
    const recent = conversations.slice(0, 10)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent))
  } catch (e) {
    console.error('[v0] Failed to save conversation:', e)
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
    console.error('[v0] Failed to delete conversation:', e)
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

export function updateMessageCount(count: number): void {
  if (typeof window === 'undefined') return
  const active = getActiveConversation()
  if (active) {
    active.messageCount = count
    setActiveConversation(active)
  }
}

export function generateConversationTitle(firstMessage: string): string {
  // Эхний асуултын эхний 30 үсэгээс title үүсгэх
  return firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : '')
}
