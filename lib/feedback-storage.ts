// Feedback storage - хэрэглэгчийн 👍/👎 хариултуудыг хадгалах

export interface FeedbackEntry {
  id: string
  userMessage: string
  assistantMessage: string
  rating: 'thumbsUp' | 'thumbsDown'
  timestamp: number
  category?: string // test, advice, etc
}

export interface BestAnswer {
  userQuery: string
  assistantResponse: string
  rating: number
  useCount: number
  lastUsed: number
}

// LocalStorage дээр хадгалах
const FEEDBACK_KEY = 'hiremn_feedback'
const BEST_ANSWERS_KEY = 'hiremn_best_answers'

export function saveFeedback(feedback: FeedbackEntry) {
  try {
    const existing = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]')
    existing.push(feedback)
    // Сүүлийн 100 feedback л хадгалах (storage хэмнэх)
    const recent = existing.slice(-100)
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(recent))
  } catch (error) {
    console.warn('[v0] Failed to save feedback:', error)
  }
}

export function getFeedbackHistory(): FeedbackEntry[] {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveBestAnswer(query: string, response: string) {
  try {
    const existing = JSON.parse(localStorage.getItem(BEST_ANSWERS_KEY) || '[]')
    const found = existing.find((a: BestAnswer) => a.userQuery === query)
    
    if (found) {
      found.rating += 1
      found.lastUsed = Date.now()
    } else {
      existing.push({
        userQuery: query,
        assistantResponse: response,
        rating: 1,
        useCount: 0,
        lastUsed: Date.now(),
      })
    }
    
    localStorage.setItem(BEST_ANSWERS_KEY, JSON.stringify(existing))
  } catch (error) {
    console.warn('[v0] Failed to save best answer:', error)
  }
}

export function getBestAnswer(query: string): string | null {
  try {
    const answers = JSON.parse(localStorage.getItem(BEST_ANSWERS_KEY) || '[]')
    const bestMatch = answers.find((a: BestAnswer) => 
      a.userQuery.toLowerCase() === query.toLowerCase()
    )
    
    if (bestMatch) {
      bestMatch.useCount += 1
      localStorage.setItem(BEST_ANSWERS_KEY, JSON.stringify(answers))
      return bestMatch.assistantResponse
    }
  } catch (error) {
    console.warn('[v0] Failed to get best answer:', error)
  }
  return null
}

export function getSimilarQuestions(query: string): BestAnswer[] {
  try {
    const answers = JSON.parse(localStorage.getItem(BEST_ANSWERS_KEY) || '[]')
    const queryWords = query.toLowerCase().split(' ')
    
    return answers
      .filter((a: BestAnswer) => {
        const answerWords = a.userQuery.toLowerCase().split(' ')
        const matches = queryWords.filter((w: string) => answerWords.includes(w))
        return matches.length >= 2 //至少2个共同词汇
      })
      .sort((a: BestAnswer, b: BestAnswer) => b.rating - a.rating)
      .slice(0, 3)
  } catch {
    return []
  }
}
