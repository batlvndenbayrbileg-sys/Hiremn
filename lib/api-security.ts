import { headers } from 'next/headers'
import { RateLimiter } from 'limiter'

const limiters = new Map<string, RateLimiter>()

export async function checkRateLimit(ip: string): Promise<boolean> {
  if (!limiters.has(ip)) {
    limiters.set(ip, new RateLimiter({ tokensPerInterval: 100, interval: 'minute' }))
  }
  const remaining = await limiters.get(ip)!.removeTokens(1)
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