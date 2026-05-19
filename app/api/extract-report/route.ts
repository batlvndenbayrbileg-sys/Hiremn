import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const apiBase = searchParams.get('apiBase') || 'https://hire.mn'
  const token = request.headers.get('authorization')

  if (!code) {
    return NextResponse.json(
      { error: 'code is required' },
      { status: 400, headers: CORS }
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
        { status: res.status, headers: CORS }
      )
    }

    const contentType = res.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const data = await res.json()
      return NextResponse.json(
        { success: true, data, source: 'json' },
        { headers: CORS }
      )
    }

    const pdfBuffer = await res.arrayBuffer()

    // Dynamic import only — static import-тай давхцуулахгүй
    const { default: pdfParse } = await import('pdf-parse')
    const parsed = await pdfParse(Buffer.from(pdfBuffer))

    if (!parsed.text?.trim()) {
      return NextResponse.json(
        { error: 'PDF-ээс өгөгдөл гаргаж чадсангүй' },
        { status: 422, headers: CORS }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: { text: parsed.text.trim(), pages: parsed.numpages, code },
        source: 'pdf',
      },
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