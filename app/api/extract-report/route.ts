import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const apiBase = searchParams.get('apiBase') || 'https://api.hire-test.cloud'
  const token = request.headers.get('authorization')

  if (!code) {
    return NextResponse.json(
      { error: 'code is required' },
      { status: 400, headers: CORS }
    )
  }

  try {
    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    if (token) fetchHeaders['Authorization'] = token

    // /full endpoint — хамгийн бүрэн өгөгдөл
    const fullUrl = apiBase + '/api/v1/userAnswer/report/' + encodeURIComponent(code) + '/full'

    console.log('[extract-report] Fetching:', fullUrl)

    const res = await fetch(fullUrl, { headers: fetchHeaders })

    console.log('[extract-report] Status:', res.status)

    if (!res.ok) {
      // /full алдаа өгвөл /report/{code} fallback
      const fallbackUrl = apiBase + '/api/v1/userAnswer/report/' + encodeURIComponent(code)
      const fallbackRes = await fetch(fallbackUrl, { headers: fetchHeaders })

      if (!fallbackRes.ok) {
        return NextResponse.json(
          { error: 'Report татахад алдаа: ' + fallbackRes.status },
          { status: fallbackRes.status, headers: CORS }
        )
      }

      const fallbackData = await fallbackRes.json()
      return NextResponse.json(
        { success: true, data: fallbackData, source: 'json' },
        { headers: CORS }
      )
    }

    const data = await res.json()
    return NextResponse.json(
      { success: true, data, source: 'json' },
      { headers: CORS }
    )
  } catch (error) {
    console.error('[extract-report]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Серверийн алдаа' },
      { status: 500, headers: CORS }
    )
  }
}