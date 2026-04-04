// hire.mn API integration service
const API_BASE = process.env.HIRE_API_URL || 'https://api.hire.mn/api/v1'
const API_KEY = process.env.HIRE_API_KEY || ''

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

async function apiCall<T>(endpoint: string, options: ApiOptions = {}): Promise<T | null> {
  const { method = 'GET', body } = options
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
    
    // Add auth header if API key exists
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!res.ok) {
      console.error(`[hire-api] ${method} ${endpoint} failed:`, res.status, res.statusText)
      return null
    }

    return await res.json()
  } catch (err) {
    console.error(`[hire-api] ${method} ${endpoint} error:`, err)
    return null
  }
}

// ============ Assessment (Tests) ============

export interface Assessment {
  id: number
  name: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  price: number
  duration?: number // minutes
  questionCount?: number
  image?: string
  categoryId?: number
  category?: AssessmentCategory
  isFree?: boolean
  isActive?: boolean
  createdAt?: string
}

export interface AssessmentCategory {
  id: number
  name: string
  nameEn?: string
  description?: string
  icon?: string
  color?: string
}

// Get all assessments
export async function getAllAssessments(): Promise<Assessment[]> {
  const data = await apiCall<unknown>('/assessment/all')
  console.log('[v0] API /assessment/all raw response:', JSON.stringify(data).slice(0, 500))
  if (!data) return []
  
  // Handle various response formats
  if (Array.isArray(data)) {
    console.log('[v0] Response is array, length:', data.length)
    return data as Assessment[]
  }
  
  const obj = data as Record<string, unknown>
  
  // Try common response wrapper keys
  if (obj.data && Array.isArray(obj.data)) {
    console.log('[v0] Response has data array, length:', obj.data.length)
    return obj.data as Assessment[]
  }
  if (obj.result && Array.isArray(obj.result)) {
    console.log('[v0] Response has result array, length:', obj.result.length)
    return obj.result as Assessment[]
  }
  if (obj.assessments && Array.isArray(obj.assessments)) {
    console.log('[v0] Response has assessments array, length:', obj.assessments.length)
    return obj.assessments as Assessment[]
  }
  if (obj.items && Array.isArray(obj.items)) {
    console.log('[v0] Response has items array, length:', obj.items.length)
    return obj.items as Assessment[]
  }
  
  console.log('[v0] Unknown response format, keys:', Object.keys(obj))
  return []
}

// Get assessment by ID
export async function getAssessmentById(id: number): Promise<Assessment | null> {
  return apiCall<Assessment>(`/assessment/${id}`)
}

// Get home page assessments (featured)
export async function getHomeAssessments(): Promise<Assessment[]> {
  const data = await apiCall<Assessment[] | { data: Assessment[] }>('/assessment/home/page')
  if (!data) return []
  return Array.isArray(data) ? data : (data.data || [])
}

// ============ Categories ============

export async function getAllCategories(): Promise<AssessmentCategory[]> {
  const data = await apiCall<AssessmentCategory[] | { data: AssessmentCategory[] }>('/assessmentCategory')
  if (!data) return []
  return Array.isArray(data) ? data : (data.data || [])
}

export async function getCategoryById(id: number): Promise<AssessmentCategory | null> {
  return apiCall<AssessmentCategory>(`/assessmentCategory/${id}`)
}

// ============ Questions ============

export interface Question {
  id: number
  assessmentId: number
  text: string
  textEn?: string
  type?: string // multiple_choice, scale, etc.
  order?: number
  answers?: QuestionAnswer[]
}

export interface QuestionAnswer {
  id: number
  questionId: number
  text: string
  textEn?: string
  value?: number
  order?: number
}

// Get questions for an assessment
export async function getAssessmentQuestions(assessmentId: number): Promise<Question[]> {
  const data = await apiCall<Question[] | { data: Question[] }>(`/question/assessment/${assessmentId}`)
  if (!data) return []
  return Array.isArray(data) ? data : (data.data || [])
}

// Get all question answers
export async function getQuestionAnswers(): Promise<QuestionAnswer[]> {
  const data = await apiCall<QuestionAnswer[] | { data: QuestionAnswer[] }>('/question/answer')
  if (!data) return []
  return Array.isArray(data) ? data : (data.data || [])
}

// ============ User Answers ============

export interface UserAnswerSubmission {
  assessmentId: number
  answers: Array<{
    questionId: number
    answerId?: number
    value?: number
    text?: string
  }>
  userId?: string
}

export async function submitUserAnswers(submission: UserAnswerSubmission): Promise<unknown> {
  return apiCall('/userAnswer', {
    method: 'POST',
    body: submission,
  })
}

// ============ Helper: Convert API Assessment to Widget Format ============

const CATEGORY_COLORS: Record<string, string> = {
  'personality': '#E8541A',
  'career': '#3B82F6',
  'health': '#22C55E',
  'mental': '#EC4899',
  'leadership': '#8B5CF6',
  'default': '#E8541A',
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'personality': '🧠',
  'career': '💼',
  'health': '🏥',
  'mental': '🧘',
  'leadership': '👔',
  'default': '📋',
}

export function formatAssessmentForWidget(a: Assessment, lang: 'mn' | 'en' = 'mn') {
  const isFree = a.isFree || a.price === 0
  const categoryKey = a.category?.name?.toLowerCase() || 'default'
  
  return {
    id: a.id,
    name: lang === 'en' && a.nameEn ? a.nameEn : a.name,
    desc: lang === 'en' && a.descriptionEn ? a.descriptionEn : (a.description || ''),
    url: `https://hire.mn/test/${a.id}`,
    price: isFree ? 'Үнэгүй' : `${a.price?.toLocaleString()}₮`,
    duration: a.duration ? `${a.duration} мин` : '10 мин',
    emoji: CATEGORY_EMOJIS[categoryKey] || CATEGORY_EMOJIS.default,
    color: CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.default,
    free: isFree,
  }
}
