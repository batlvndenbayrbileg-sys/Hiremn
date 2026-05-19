import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const apiBase = searchParams.get('apiBase') || 'https://hire.mn'
  const token = request.headers.get('authorization')

  if (!code) {
    return NextResponse.json(
      { error: 'code is required' },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  try {
    const fetchHeaders: Record<string, string> = {
      Accept: 'application/pdf, application/json, */*',
    }
    if (token) fetchHeaders['Authorization'] = token

    const reportUrl = apiBase + '/api/report/' + encodeURIComponent(code)
    const res = await fetch(reportUrl, { headers: fetchHeaders })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Report татахад алдаа: ' + res.status },
        { status: res.status, headers: CORS_HEADERS }
      )
    }

    const contentType = res.headers.get('content-type') || ''

    // JSON бол шууд буцаана
    if (contentType.includes('application/json')) {
      const data = await res.json()
      return NextResponse.json(
        { success: true, data, source: 'json' },
        { headers: CORS_HEADERS }
      )
    }

    // PDF бол текст гаргана
    const pdfBuffer = await res.arrayBuffer()

    let pdfText = ''
    try {
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
      const parsed = await pdfParse(Buffer.from(pdfBuffer))
      pdfText = parsed.text || ''
    } catch (pdfErr) {
      console.error('[extract-report] pdf-parse error:', pdfErr)
      return NextResponse.json(
        { error: 'PDF уншихад алдаа гарлаа' },
        { status: 422, headers: CORS_HEADERS }
      )
    }

    if (!pdfText.trim()) {
      return NextResponse.json(
        { error: 'PDF-ээс өгөгдөл гаргаж чадсангүй' },
        { status: 422, headers: CORS_HEADERS }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: { text: pdfText.trim(), code },
        source: 'pdf',
      },
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('[extract-report]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Серверийн алдаа' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}