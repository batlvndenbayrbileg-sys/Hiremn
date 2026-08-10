// lib/llm.ts — single place the app talks to its LLM provider (Google Gemini).
//
// The chat + analyze routes were on Anthropic Claude; we standardised on Gemini
// for Mongolian output. Keeping the provider wiring here means the model id and
// key handling live in one spot.

import { createGoogleGenerativeAI } from '@ai-sdk/google'

// Accept either name so deployment isn't fussy: GEMINI_API_KEY is what we ask for
// in .env.example; GOOGLE_GENERATIVE_AI_API_KEY is the SDK's own default.
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''

const google = createGoogleGenerativeAI({ apiKey })

// Overridable without a code change. Default is the `gemini-flash-latest` alias,
// which always resolves to a current, generally-available flash model — this
// survives Google's model deprecations (e.g. the 2.5 series became "not
// available to new users" once the 3.x series shipped). Per Gemini API docs
// (ai.google.dev/gemini-api/docs/models). Set GEMINI_MODEL to pin a specific id.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'

// Candidate models, tried in order. The env override / default is first; the
// rest are concrete current fallbacks so a gated or deprecated id never takes
// the app down. De-duplicated, order preserved. Model ids from the Gemini API
// models doc (3.x is current; 2.x kept as last-resort fallbacks).
export const MODEL_CANDIDATES: string[] = [...new Set([
  GEMINI_MODEL,
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
])]

export function geminiModel(model: string = GEMINI_MODEL) {
  return google(model)
}

// NOTE: we deliberately do NOT send `thinkingConfig`. Newer models
// (gemini-flash-latest → 3.x) reject `thinkingBudget: 0` with
// "Request contains an invalid argument", and older ones don't support the
// field at all. Thinking tokens count against maxOutputTokens, so instead of
// disabling thinking we just give each call a generous token budget so the
// real answer / JSON never truncates.

// True when an error means "this model id can't be used" (gated / deprecated /
// missing) — as opposed to a real failure (quota, key, safety) we must surface.
function isModelUnavailable(err: unknown): boolean {
  const m = err instanceof Error ? err.message : String(err)
  return /no longer available|not available|not found|NOT_FOUND|does not exist|unsupported|is not supported/i.test(m)
}

// Run an LLM call, falling back through MODEL_CANDIDATES if a model id is
// unavailable. Non-availability errors are rethrown immediately.
export async function withGeminiFallback<T>(run: (model: ReturnType<typeof google>) => Promise<T>): Promise<T> {
  let lastErr: unknown
  for (const id of MODEL_CANDIDATES) {
    try {
      return await run(google(id))
    } catch (err) {
      if (isModelUnavailable(err)) {
        console.warn(`[llm] model "${id}" unavailable, trying next candidate`)
        lastErr = err
        continue
      }
      throw err
    }
  }
  throw lastErr
}

export function hasGeminiKey(): boolean {
  return apiKey.length > 0
}
