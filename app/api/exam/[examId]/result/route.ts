import { NextRequest, NextResponse } from 'next/server'

// hire.mn exposes results at /api/v1/userAnswer/code/code/{code}. The previous
// URLs here (api.hire.mn/exam/{id}/result and /meta) do not exist on the
// platform — they returned 404, which this route passed straight through to the
// caller as "Тайлан татахад алдаа гарлаа (HTTP 404)".
const API_BASE = process.env.HIRE_API_URL || 'https://api.hire.mn/api/v1'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params
    if (!examId) {
      return NextResponse.json({ error: 'examId required' }, { status: 400 })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    if (process.env.HIRE_API_KEY) {
      headers.Authorization = `Bearer ${process.env.HIRE_API_KEY}`
    }

    const res = await fetch(
      `${API_BASE}/userAnswer/code/code/${encodeURIComponent(examId)}`,
      { headers, cache: 'no-store' }
    )

    if (!res.ok) {
      console.error(`[exam/result] upstream ${res.status} for code ${examId}`)
      return NextResponse.json(
        { error: `Тайлангийн мэдээлэл авахад алдаа гарлаа (${res.status})` },
        { status: res.status }
      )
    }

    const json = await res.json().catch(() => null)
    // The endpoint answers { succeed, payload }. An unknown code yields an empty
    // payload rather than an error status, so surface that as a clear 404.
    const payload = json?.payload ?? json
    const empty =
      payload == null ||
      (Array.isArray(payload) && payload.length === 0) ||
      (typeof payload === 'object' && !Array.isArray(payload) && Object.keys(payload).length === 0)

    if (empty) {
      return NextResponse.json(
        { error: 'Энэ кодоор тайлан олдсонгүй' },
        { status: 404 }
      )
    }

    const result = Array.isArray(payload) ? payload[0] : payload

    return NextResponse.json({
      success: true,
      examResult: result,
      data: {
        code: examId,
        assessmentId: result?.assessmentId,
        assessmentName: result?.assessmentName,
        score: result?.score ?? result?.point ?? result?.value,
        level: result?.level ?? result?.levelName ?? result?.result,
        completedAt: result?.completedAt ?? result?.createdAt,
      },
    })
  } catch (error) {
    console.error('[exam/result] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
