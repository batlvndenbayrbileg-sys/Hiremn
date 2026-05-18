import DOMPurify from 'isomorphic-dompurify'

export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim()
}

export function validateExamId(examId: string): boolean {
  if (typeof examId !== 'string' || examId.length === 0) return false
  // hire.mn numeric ID (10-20 digits) эсвэл UUID аль алийг хүлээнэ
  const numericId = /^\d{10,20}$/.test(examId)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return numericId || uuidPattern.test(examId)
}

export function validateScore(score: number, maxScore: number): boolean {
  return (
    typeof score === 'number' &&
    typeof maxScore === 'number' &&
    score >= 0 &&
    score <= maxScore &&
    maxScore > 0 &&
    maxScore <= 1000
  )
}

export function validateAssessmentName(name: string): boolean {
  return (
    typeof name === 'string' &&
    name.length > 0 &&
    name.length <= 200 &&
    !/[<>{}]/g.test(name)
  )
}

export function sanitizeExamResult(data: any) {
  return {
    assessmentId: typeof data.assessmentId === 'number' ? data.assessmentId : 0,
    assessmentName: sanitizeString(data.assessmentName || ''),
    score: typeof data.score === 'number' ? data.score : 0,
    maxScore: typeof data.maxScore === 'number' ? data.maxScore : 100,
    interpretation: sanitizeString(data.interpretation || ''),
    completedAt: new Date(data.completedAt || Date.now()).toISOString(),
  }
}