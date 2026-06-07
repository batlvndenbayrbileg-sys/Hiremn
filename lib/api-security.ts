// lib/api-security.ts
import { headers } from 'next/headers'
import { RateLimiter } from 'limiter'

// Rate limiter - 100 requests per minute per IP
const limiter = new RateLimiter({ tokensPerInterval: 100, interval: 'minute' })

export async function checkRateLimit(ip: string): Promise<boolean> {
  const remaining = await limiter.removeTokens(1)
  return remaining >= 0
}

export async function getClientIP(): Promise<string> {
  const headersList = await headers()
  return (
    headersList.get('x-forwarded-for')?.split(',')[0] ||
    headersList.get('x-real-ip') ||
    'unknown'
  )
}

export function validateAPIKey(apiKey: string): boolean {
  const validKey = process.env.API_SECRET_KEY
  if (!validKey) {
    console.error('[SECURITY] API_SECRET_KEY not configured')
    return false
  }
  return apiKey === validKey
}

export async function getAuthToken(): Promise<string | null> {
  const headersList = await headers()
  const auth = headersList.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}
