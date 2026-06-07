// Feedback storage - Reinforcement Learning системтэй
// Thumbs up хариултыг түлхүү үзүүлэх, дахин ашиглах

export interface FeedbackEntry {
  id: string
  userMessage: string
  assistantMessage: string
  rating: 'thumbsUp' | 'thumbsDown'
  timestamp: number
  keywords: string[] // Асуултын түлхүүр үгс
}

export interface BestAnswer {
  userQuery: string
  assistantResponse: string
  keywords: string[]
  score: number // Reinforcement score
  useCount: number
  successCount: number // Хэдэн удаа 👍 авсан
  lastUsed: number
}

const FEEDBACK_KEY = 'hiremn_feedback'
const BEST_ANSWERS_KEY = 'hiremn_best_answers'

// Түлхүүр үг гаргах
function extractKeywords(text: string): string[] {
  const stopWords = ['юу', 'ямар', 'яаж', 'хэрхэн', 'байна', 'вэ', 'уу', 'үү', 'бол', 'гэж', 'нь', 'би', 'миний', 'надад', 'тест', 'хийх', 'авах', 'the', 'is', 'a', 'an', 'what', 'how']
  return text
    .toLowerCase()
    .replace(/[?!.,]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.includes(w))
    .slice(0, 10)
}

// Хоёр асуултын ижил төстэй байдлыг тооцоолох (0-1)
function calculateSimilarity(keywords1: string[], keywords2: string[]): number {
  if (keywords1.length === 0 || keywords2.length === 0) return 0
  const matches = keywords1.filter(k => keywords2.includes(k)).length
  return matches / Math.max(keywords1.length, keywords2.length)
}

export function saveFeedback(feedback: Omit<FeedbackEntry, 'keywords'>) {
  try {
    const keywords = extractKeywords(feedback.userMessage)
    const entry: FeedbackEntry = { ...feedback, keywords }
    
    const existing = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]')
    existing.push(entry)
    const recent = existing.slice(-200)
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(recent))
    
    return entry
  } catch (error) {
    console.warn('Failed to save feedback:', error)
    return null
  }
}

// Reinforcement Learning: Thumbs up -> score нэмэх
export function saveBestAnswer(query: string, response: string) {
  try {
    const keywords = extractKeywords(query)
    const existing: BestAnswer[] = JSON.parse(localStorage.getItem(BEST_ANSWERS_KEY) || '[]')
    
    // Ижил хариулт байгаа эсэх шалгах
    const foundIndex = existing.findIndex(a => 
      calculateSimilarity(a.keywords, keywords) > 0.6
    )
    
    if (foundIndex >= 0) {
      // Байгаа бол score нэмэх (reinforcement)
      existing[foundIndex].score += 1
      existing[foundIndex].successCount += 1
      existing[foundIndex].lastUsed = Date.now()
      
      // Хэрэв шинэ хариулт илүү урт бол update хийх
      if (response.length > existing[foundIndex].assistantResponse.length) {
        existing[foundIndex].assistantResponse = response
      }
    } else {
      // Шинэ best answer нэмэх
      existing.push({
        userQuery: query,
        assistantResponse: response,
        keywords,
        score: 1,
        useCount: 0,
        successCount: 1,
        lastUsed: Date.now(),
      })
    }
    
    // Score-оор эрэмбэлж хадгалах
    existing.sort((a, b) => b.score - a.score)
    localStorage.setItem(BEST_ANSWERS_KEY, JSON.stringify(existing.slice(0, 100)))
    
    return true
  } catch (error) {
    console.warn('Failed to save best answer:', error)
    return false
  }
}

// Thumbs down -> score хасах
export function penalizeAnswer(query: string) {
  try {
    const keywords = extractKeywords(query)
    const existing: BestAnswer[] = JSON.parse(localStorage.getItem(BEST_ANSWERS_KEY) || '[]')
    
    const foundIndex = existing.findIndex(a => 
      calculateSimilarity(a.keywords, keywords) > 0.6
    )
    
    if (foundIndex >= 0) {
      existing[foundIndex].score = Math.max(0, existing[foundIndex].score - 0.5)
      localStorage.setItem(BEST_ANSWERS_KEY, JSON.stringify(existing))
    }
  } catch (error) {
    console.warn('Failed to penalize answer:', error)
  }
}

// Хамгийн сайн хариулт олох (reinforcement learning-д суурилсан)
export function getBestAnswer(query: string): { response: string; confidence: number } | null {
  try {
    const keywords = extractKeywords(query)
    const answers: BestAnswer[] = JSON.parse(localStorage.getItem(BEST_ANSWERS_KEY) || '[]')
    
    let bestMatch: BestAnswer | null = null
    let highestSimilarity = 0
    
    for (const answer of answers) {
      const similarity = calculateSimilarity(keywords, answer.keywords)
      // Score-оор weighted similarity
      const weightedScore = similarity * (1 + answer.score * 0.1)
      
      if (weightedScore > highestSimilarity && similarity > 0.5) {
        highestSimilarity = weightedScore
        bestMatch = answer
      }
    }
    
    if (bestMatch && highestSimilarity > 0.5) {
      // Use count нэмэх
      bestMatch.useCount += 1
      localStorage.setItem(BEST_ANSWERS_KEY, JSON.stringify(answers))
      
      return {
        response: bestMatch.assistantResponse,
        confidence: Math.min(highestSimilarity, 1)
      }
    }
  } catch (error) {
    console.warn('Failed to get best answer:', error)
  }
  return null
}

// Ижил төстэй асуултууд олох (suggestion-д ашиглах)
export function getSimilarQuestions(query: string): BestAnswer[] {
  try {
    const keywords = extractKeywords(query)
    const answers: BestAnswer[] = JSON.parse(localStorage.getItem(BEST_ANSWERS_KEY) || '[]')
    
    return answers
      .map(a => ({
        ...a,
        similarity: calculateSimilarity(keywords, a.keywords)
      }))
      .filter(a => a.similarity > 0.3)
      .sort((a, b) => (b.score * b.similarity) - (a.score * a.similarity))
      .slice(0, 5)
  } catch {
    return []
  }
}

// Статистик авах
export function getFeedbackStats() {
  try {
    const feedback: FeedbackEntry[] = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]')
    const bestAnswers: BestAnswer[] = JSON.parse(localStorage.getItem(BEST_ANSWERS_KEY) || '[]')
    
    const thumbsUp = feedback.filter(f => f.rating === 'thumbsUp').length
    const thumbsDown = feedback.filter(f => f.rating === 'thumbsDown').length
    
    return {
      totalFeedback: feedback.length,
      thumbsUp,
      thumbsDown,
      satisfactionRate: feedback.length > 0 ? (thumbsUp / feedback.length) * 100 : 0,
      bestAnswersCount: bestAnswers.length,
      topAnswers: bestAnswers.slice(0, 5)
    }
  } catch {
    return null
  }
}
