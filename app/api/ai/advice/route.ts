import { NextRequest, NextResponse } from 'next/server'
import { getAIAdvice } from '@/lib/ai-advice'
import { checkRateLimit, getClientIP, validateAPIKey } from '@/lib/api-security'
import { sanitizeExamResult, validateScore, validateAssessmentName } from '@/lib/input-validation'
import { validateCSRFToken } from '@/lib/csrf-protection'

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const ip = await getClientIP()
    const allowed = await checkRateLimit(ip)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // 2. API Key validation (if configured)
    const apiKey = request.headers.get('x-api-key')
    if (apiKey && !validateAPIKey(apiKey)) {
      console.warn(`[SECURITY] Invalid API key attempt from IP: ${ip}`)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 3. CSRF Token validation (for browser requests)
    const csrfToken = request.headers.get('x-csrf-token')
    if (csrfToken) {
      const isCsrfValid = await validateCSRFToken(csrfToken)
      if (!isCsrfValid) {
        console.warn(`[SECURITY] CSRF token validation failed from IP: ${ip}`)
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }
    }
    const body = await request.json()
    const { examResult, consent } = body

    // Consent баталгаажуулах
    if (!consent) {
      return NextResponse.json(
        { error: 'Consent required' },
        { status: 400 }
      )
    }

    // 4. Sanitize input
    const sanitizedResult = sanitizeExamResult(examResult)

    // 5. Validate sanitized data
    if (!validateAssessmentName(sanitizedResult.assessmentName)) {
      return NextResponse.json(
        { error: 'Invalid assessment name' },
        { status: 400 }
      )
    }

    if (!validateScore(sanitizedResult.score, sanitizedResult.maxScore)) {
      return NextResponse.json(
        { error: 'Invalid score values' },
        { status: 400 }
      )
    }

    // 6. Generate AI advice with sanitized data
    const advice = await getAIAdvice({
      assessmentId: String(sanitizedResult.assessmentId ?? ''),
      assessmentName: sanitizedResult.assessmentName,
      score: Number(sanitizedResult.score) || 0,
      scoreRange: { min: 0, max: Number(sanitizedResult.maxScore) || 0 },
      interpretation: sanitizedResult.interpretation,
      userResponses: (examResult?.userResponses as any[]) ?? [],
      timestamp: new Date().toISOString(),
    })

    if (!advice.success) {
      return NextResponse.json(
        { error: advice.error },
        { status: 500 }
      )
    }

    // 7. Compliance logging (no sensitive data)
    console.log('[COMPLIANCE] AI Advice generated', {
      timestamp: new Date().toISOString(),
      assessmentId: sanitizedResult.assessmentId,
      ip: ip,
    })

    // 8. Add security headers
    const response = NextResponse.json({
      success: true,
      assessmentName: advice.assessmentName,
      score: advice.score,
      interpretation: advice.interpretation,
      advice: advice.advice,
    })

    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

    return response
  } catch (error) {
    console.error('[ERROR] AI advice generation failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
