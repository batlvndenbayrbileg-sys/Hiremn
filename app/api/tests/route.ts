// Fetch all tests from hire.mn API
import { getAllAssessments, formatAssessmentForWidget } from '@/lib/hire-api'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const lang = (url.searchParams.get('lang') || 'mn') as 'mn' | 'en'
    
    const assessments = await getAllAssessments()
    
    if (assessments.length === 0) {
      return Response.json({ 
        tests: [], 
        source: 'api_empty',
        message: 'No assessments found or API unavailable' 
      })
    }
    
    const tests = assessments
      .filter(a => a.isActive !== false) // Only active tests
      .map(a => formatAssessmentForWidget(a, lang))
    
    return Response.json({ 
      tests, 
      source: 'api',
      count: tests.length 
    })
  } catch (err) {
    console.error('[api/tests] error:', err)
    return Response.json({ 
      tests: [], 
      source: 'error',
      error: err instanceof Error ? err.message : 'Unknown error' 
    }, { status: 500 })
  }
}
