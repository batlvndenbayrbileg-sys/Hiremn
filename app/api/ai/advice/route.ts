import { NextRequest, NextResponse } from 'next/server'
import { getAIAdvice } from '@/lib/ai-advice'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { examResult, consent } = body

    // Consent баталгаажуулах
    if (!consent) {
      return NextResponse.json(
        { error: 'Consent required' },
        { status: 400 }
      )
    }

    // AI зөвлөгөө авах
    const advice = await getAIAdvice(examResult)

    if (!advice.success) {
      return NextResponse.json(
        { error: advice.error },
        { status: 500 }
      )
    }

    // Log for compliance (GDPR / Privacy)
    console.log('[v0] AI Advice generated', {
      timestamp: new Date().toISOString(),
      assessmentId: examResult.assessmentId,
      // Хэрэглэгчийн ID байвал энд оруулна
    })

    return NextResponse.json({
      success: true,
      assessmentName: advice.assessmentName,
      score: advice.score,
      interpretation: advice.interpretation,
      advice: advice.advice,
    })
  } catch (error) {
    console.error('Error in AI advice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
