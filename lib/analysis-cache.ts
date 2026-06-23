// Analysis result cache (localStorage) — keyed by the exam result CODE.
//
// Each exam submission has a unique, immutable code. The same code always
// represents the same result, so re-analyzing it must NOT hit the LLM again —
// we return the previously generated output. When the user retakes the test,
// they get a NEW code → cache miss → a fresh analysis is produced.
//
// This makes "click Analyze again" instant and free, while still producing a
// new analysis whenever the underlying result actually changes.

const CACHE_KEY = 'hiremn_analysis_cache_v1'
const MAX_ENTRIES = 60                 // keep the most recent N analyses
const TTL_MS = 60 * 24 * 60 * 60 * 1000 // 60 days

interface CacheEntry {
  data: any        // the /api/analyze "data" payload
  title: string    // test name
  fp: string       // result fingerprint (label) — guards against rare code reuse
  at: number       // stored-at timestamp
}

type CacheMap = Record<string, CacheEntry>

function read(): CacheMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as CacheMap) : {}
  } catch {
    return {}
  }
}

function write(map: CacheMap) {
  if (typeof window === 'undefined') return
  try {
    // Evict expired + cap to the newest MAX_ENTRIES
    const now = Date.now()
    const entries = Object.entries(map)
      .filter(([, e]) => now - e.at < TTL_MS)
      .sort((a, b) => b[1].at - a[1].at)
      .slice(0, MAX_ENTRIES)
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)))
  } catch {
    // localStorage full / unavailable — fail silently, caching is best-effort
  }
}

// A small, stable fingerprint of the result so we can detect when the same code
// somehow carries a different result (defensive; codes are normally immutable).
function fingerprint(reportData: any): string {
  const r = reportData?.report?.payload?.result ?? reportData?.report?.result ?? {}
  const label = r?.result ?? ''
  const value = r?.value ?? r?.point ?? ''
  return `${label}|${value}`
}

export function getResultCode(reportData: any): string {
  return String(reportData?.code ?? reportData?.report?.payload?.result?.code ?? '').trim()
}

// Returns the cached analysis for this exact result, or null on miss.
export function getCachedAnalysis(reportData: any): { data: any; title: string } | null {
  const code = getResultCode(reportData)
  if (!code) return null
  const map = read()
  const entry = map[code]
  if (!entry) return null
  if (Date.now() - entry.at >= TTL_MS) return null
  // If the result changed for the same code, treat as miss (re-analyze).
  if (entry.fp !== fingerprint(reportData)) return null
  return { data: entry.data, title: entry.title }
}

// Store a freshly generated analysis keyed by the result code.
export function setCachedAnalysis(reportData: any, data: any, title: string) {
  const code = getResultCode(reportData)
  if (!code || !data) return
  const map = read()
  map[code] = { data, title, fp: fingerprint(reportData), at: Date.now() }
  write(map)
}
