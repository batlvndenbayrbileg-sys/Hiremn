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

export async function POST(request: NextRequest) {
  try {
    const { pdf, code } = await request.json()

    if (!pdf) {
      return NextResponse.json(
        { error: 'pdf is required' },
        { status: 400, headers: CORS }
      )
    }

    const pdfBuffer = Buffer.from(pdf, 'base64')

    // PDF magic bytes шалгана (%PDF-)
    if (
      pdfBuffer[0] !== 0x25 ||
      pdfBuffer[1] !== 0x50 ||
      pdfBuffer[2] !== 0x44 ||
      pdfBuffer[3] !== 0x46
    ) {
      const preview = pdfBuffer.slice(0, 200).toString('utf8')
      console.error('[extract-report] Not a PDF:', preview)
      return NextResponse.json(
        { error: 'PDF биш өгөгдөл ирлээ: ' + preview.slice(0, 100) },
        { status: 422, headers: CORS }
      )
    }

    const { default: pdfParse } = await import('pdf-parse')
    const parsed = await pdfParse(pdfBuffer)

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

export async function GET() {
  return NextResponse.json(
    { error: 'POST method ашиглана уу' },
    { status: 405, headers: CORS }
  )
}