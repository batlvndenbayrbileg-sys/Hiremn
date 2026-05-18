// lib/api-security.ts
import { headers } from 'next/headers'
import { RateLimiter } from 'limiter'

// Rate limiter - 100 requests per minute per IP
const limiters = new Map<string, RateLimiter>()

export async function checkRateLimit(ip: string): Promise<boolean> {
  if (!limiters.has(ip)) {
    limiters.set(ip, new RateLimiter({ tokensPerInterval: 100, interval: 'minute' }))
  }
  const remaining = await limiters.get(ip)!.removeTokens(1)
  return remaining >= 0
}

export function getClientIP(): string {
  const headersList = headers()
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

export function getAuthToken(): string | null {
  const headersList = headers()
  const auth = headersList.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}
