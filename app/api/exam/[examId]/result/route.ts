import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const examId = params.examId

    // Hire.mn API-аас exam результат авах
    const resultResponse = await fetch(
      `https://api.hire.mn/exam/${examId}/result`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.HIRE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!resultResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch exam result' },
        { status: resultResponse.status }
      )
    }

    const examResult = await resultResponse.json()

    // Exam metadata авах (тестийн нэр, тайлбар гэх мэт)
    const examMetaResponse = await fetch(
      `https://api.hire.mn/exam/${examId}/meta`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.HIRE_API_KEY}`,
        },
      }
    )

    const examMeta = examMetaResponse.ok 
      ? await examMetaResponse.json() 
      : null

    return NextResponse.json({
      success: true,
      examResult,
      examMeta,
      // LLM-д илгээхээр үйл ажиллагаа нь энэ структур
      data: {
        assessmentId: examMeta?.assessmentId,
        assessmentName: examMeta?.name,
        userResponses: examResult.responses,
        score: examResult.score,
        scoreRange: examResult.scoreRange,
        interpretation: examResult.interpretation,
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Error fetching exam result:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
