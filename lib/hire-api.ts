// hire.mn API integration
// Endpoint: GET /api/v1/assessment/all?limit=50&page=1
// Бодит response: { succeed: true, payload: { data: [ { data: {...}, user: {...}, category: {...} } ], count, total } }

const API_BASE = process.env.HIRE_API_URL || 'https://api.hire.mn/api/v1'
const API_KEY = process.env.HIRE_API_KEY || ''

if (!API_KEY) {
  console.error('[hire-api] HIRE_API_KEY тохируулагдаагүй — /assessment/all зэрэг auth шаардсан API дуудалтууд 401 алдаа өгнө. .env файлд HIRE_API_KEY= тавина уу.')
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
}

async function apiCall<T>(endpoint: string, options: ApiOptions = {}): Promise<T | null> {
  const { method = 'GET', body, auth = false } = options
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
    if (auth && API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      console.error(`[hire-api] ${method} ${endpoint} → ${res.status}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.error(`[hire-api] error:`, err)
    return null
  }
}

export interface AssessmentCategory {
  id: number
  index?: number
  name: string
  nameEn?: string
  subcategories?: AssessmentCategory[]
  parent?: AssessmentCategory | null
}

export interface Assessment {
  id: number
  name: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  usage?: string
  measure?: string
  price: number
  duration?: number
  questionCount?: number
  icons?: string
  author?: string
  status?: number
  count?: number
  category?: AssessmentCategory
  isFree?: boolean
  isActive?: boolean
}

interface AssessmentItem {
  data: Assessment
  user?: unknown
  category?: AssessmentCategory
}

interface AssessmentListResponse {
  succeed: boolean
  payload: {
    data: AssessmentItem[]
    count: number
    total: number
    level: unknown[]
  }
}

function normalize(item: AssessmentItem): Assessment {
  const d = item.data
  return {
    ...d,
    isFree: d.price === 0,
    isActive: d.status === 10,
    category: item.category || d.category,
  }
}

export interface AssessmentCategoryWithTests extends AssessmentCategory {
  assessments?: Assessment[]
}

export async function getAssessmentCategories(): Promise<AssessmentCategoryWithTests[]> {
  const res = await apiCall<{ succeed: boolean; payload: AssessmentCategoryWithTests[] }>('/assessmentCategory')
  if (!res?.succeed || !Array.isArray(res.payload)) return []
  return res.payload
}

export async function getAllAssessments(limit = 50, page = 1): Promise<Assessment[]> {
  const res = await apiCall<AssessmentListResponse>(
    `/assessment/all?limit=${limit}&page=${page}`,
    { auth: true }
  )
  if (!res?.succeed || !Array.isArray(res.payload?.data)) return []
  return res.payload.data
    .map(normalize)
    .filter(a => a.id && a.isActive)
}

export async function getHomeAssessments(): Promise<Assessment[]> {
  const res = await apiCall<AssessmentListResponse>('/assessment/home/page', { auth: true })
  if (!res?.succeed || !Array.isArray(res.payload?.data)) return []
  return res.payload.data.map(normalize).filter(a => a.id)
}

export async function getAssessmentById(id: number): Promise<Assessment | null> {
  const res = await apiCall<{ succeed: boolean; payload: AssessmentItem }>(`/assessment/${id}`, { auth: true })
  if (!res?.succeed || !res.payload) return null
  return normalize(res.payload)
}

export interface UserAnswerResult {
  code?: string
  assessmentId?: number
  score?: number
  level?: string
  levelName?: string
  completedAt?: string
  createdAt?: string
}

export async function getResultByCode(code: string): Promise<UserAnswerResult | null> {
  const res = await apiCall<unknown>(`/userAnswer/code/code/${code}`)
  if (!res) return null
  const obj = res as Record<string, unknown>
  if (obj.succeed && obj.payload) return obj.payload as UserAnswerResult
  if (obj.code || obj.score !== undefined) return res as UserAnswerResult
  return null
}

export async function submitUserAnswers(payload: {
  assessmentId: number
  answers: Array<{ questionId: number; answerId?: number; value?: number }>
  userId?: string
}): Promise<UserAnswerResult | null> {
  const res = await apiCall<unknown>('/userAnswer', { method: 'POST', body: payload })
  if (!res) return null
  const obj = res as Record<string, unknown>
  if (obj.succeed && obj.payload) return obj.payload as UserAnswerResult
  return res as UserAnswerResult
}

export function getIconUrl(icons?: string): string {
  if (!icons) return ''
  if (icons.startsWith('http')) return icons
  return `https://api.hire.mn/uploads/${icons}`
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'өөрийн үнэлгээ': '🧠',
  'зан төлөвийн тест': '🎭',
  'психометрик тест': '📊',
  'default': '📋',
}

const CATEGORY_COLORS: Record<string, string> = {
  'өөрийн үнэлгээ': '#E8541A',
  'зан төлөвийн тест': '#7C3AED',
  'психометрик тест': '#3B82F6',
  'default': '#E8541A',
}

const TEST_IMAGES: Record<number, string> = {
  1: '/images/tests/test-1-growth-mindset.jpg',
  2: '/images/tests/test-2-work-life-balance.jpg',
  3: '/images/tests/test-3-communication-style.jpg',
  5: '/images/tests/test-5-nicotine.jpg',
  6: '/images/tests/test-6-semut.jpg',
  99: '/images/tests/test-99-audit.jpg',
}

export function formatAssessmentForWidget(a: Assessment, lang: 'mn' | 'en' = 'mn') {
  const isFree = a.price === 0
  const categoryKey = (a.category?.name || '').toLowerCase()
  return {
    id: a.id,
    name: lang === 'en' && a.nameEn ? a.nameEn : a.name,
    desc: lang === 'en' && a.descriptionEn ? a.descriptionEn : (a.description || ''),
    url: `https://hire.mn/test/${a.id}`,
    price: isFree ? 'Үнэгүй' : `${a.price.toLocaleString()}₮`,
    duration: a.duration ? `${a.duration} мин` : '10 мин',
    emoji: CATEGORY_EMOJIS[categoryKey] || CATEGORY_EMOJIS.default,
    color: CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.default,
    free: isFree,
    icon: getIconUrl(a.icons),
    image: TEST_IMAGES[a.id],
    category: a.category?.name || '',
    count: a.count || 0,
    author: a.author || '',
  }
}