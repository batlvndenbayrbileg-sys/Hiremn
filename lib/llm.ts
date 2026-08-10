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

// Overridable without a code change. 2.5-flash is fast, cheap and strong
// multilingually; set GEMINI_MODEL to a pro model if more quality is needed.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

export function geminiModel(model: string = GEMINI_MODEL) {
  return google(model)
}

export function hasGeminiKey(): boolean {
  return apiKey.length > 0
}
