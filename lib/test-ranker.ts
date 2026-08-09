// lib/test-ranker.ts — relevance ranking for test recommendations
//
// The chat used to hand the model an unordered test list (plus few-shot example
// ids it would copy), so recommendations felt hardcoded and repetitive. This
// ranks the LIVE assessments against the user's actual problem so the model —
// and the fallback — start from genuinely relevant candidates.

import type { Assessment } from './hire-api'
import { TEST_DATABASE } from './test-db'

export interface RankedTest {
  assessment: Assessment
  score: number
  reason: string   // matched terms, for the prompt's "why" line
}

// Synonym clusters bridge how a user phrases a problem and how a test is
// described. Each key is a concept; matching ANY member pulls in the whole
// cluster so "ядарч байна" also reaches a burnout scale, "өөртөө итгэхгүй"
// reaches a self-efficacy/self-esteem scale, etc. Terms are lowercase.
const SYNONYM_CLUSTERS: string[][] = [
  ['стресс', 'stress', 'дарамт', 'ачаалал', 'хурцадмал', 'сэтгэл түгших'],
  ['ядрах', 'ядарч', 'burnout', 'шатсан', 'сульдал', 'эцэж', 'туйлдал', 'ажлын ачаалал'],
  ['түгшүүр', 'anxiety', 'сандрал', 'айдас', 'зовнил', 'gad', 'panic', 'тайван бус'],
  ['гутрал', 'депресс', 'depression', 'уйтгар', 'гуниг', 'phq', 'сэтгэл гутрал', 'найдваргүй', 'дэмпресс'],
  ['өөртөө итгэх', 'өөртөө итгэл', 'self-efficacy', 'self-esteem', 'итгэлгүй', 'өөрийгөө үнэлэх', 'магадлашгүй', 'эргэлзэх'],
  ['архи', 'alcohol', 'audit', 'согтууруулах', 'уух', 'ундаа'],
  ['тамхи', 'nicotine', 'никотин', 'fagerstrom', 'татах', 'донтолт'],
  ['харилцаа', 'communication', 'disc', 'нийгэм', 'хамт олон', 'багийн', 'зөрчил', 'хамтрагч'],
  ['манлайлал', 'leadership', 'удирдлага', 'манлайлагч', 'ёс зүй', 'ethics', 'удирдах'],
  ['хэв шинж', 'personality', 'mbti', 'зан төлөв', 'зан чанар', '16 хэв', 'introvert', 'extravert'],
  ['тэсвэр', 'grit', 'тэвчээр', 'тууштай', 'зорилго', 'perseverance', 'бууж өгөх'],
  ['ажил', 'карьер', 'career', 'мэргэжил', 'ажлын байр', 'ажилд орох', 'сонголт'],
  ['тэнцвэр', 'balance', 'work-life', 'амьдралын тэнцвэр', 'амралт', 'цаг хуваарь'],
  ['өсөлт', 'growth mindset', 'mindset', 'сэтгэлгээ', 'хөгжил', 'суралцах'],
  ['оюун', 'iq', 'cognitive', 'логик', 'танин мэдэхүй', 'аналитик', 'сэтгэн бодох'],
  ['сэтгэл зүй', 'сэтгэц', 'mental', 'эрүүл мэнд'],
]

// Words too generic to carry meaning — matching them would make every test look
// relevant, which is exactly the "generic recommendation" problem.
const STOPWORDS = new Set([
  'би', 'миний', 'надад', 'надаас', 'бид', 'та', 'тест', 'тестүүд', 'тестийн', 'тесттэй',
  'вэ', 'юу', 'юм', 'байна', 'болов', 'уу', 'үү', 'санал', 'болго', 'болгоорой', 'хэрэгтэй',
  'хүсч', 'хүсэж', 'авмаар', 'авах', 'ямар', 'яаж', 'хэрхэн', 'надтай', 'болох', 'гэж',
  'бол', 'нь', 'ч', 'мөн', 'дээр', 'доор', 'тухай', 'талаар', 'өгөх', 'туслаач', 'тусал',
  'the', 'and', 'for', 'with', 'test', 'tests', 'want', 'need', 'give', 'recommend', 'about',
  'me', 'my', 'you', 'your', 'что', 'help',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w))
}

// Expand query tokens through the synonym clusters into a term set to match on.
function expandTerms(tokens: string[]): string[] {
  const terms = new Set<string>(tokens)
  for (const token of tokens) {
    for (const cluster of SYNONYM_CLUSTERS) {
      const inCluster = cluster.some(member =>
        member.includes(token) || token.includes(member.split(' ')[0])
      )
      if (inCluster) for (const member of cluster) terms.add(member)
    }
  }
  return [...terms].filter(t => t.length >= 3)
}

/**
 * Rank live assessments by relevance to the user's message.
 * Returns only tests with a positive score, best first (ties: free before paid).
 */
export function rankAssessments(
  query: string,
  assessments: Assessment[],
  opts?: { category?: string }
): RankedTest[] {
  const tokens = tokenize(query)
  if (tokens.length === 0) return []
  const terms = expandTerms(tokens)
  const categoryNeedle = opts?.category?.toLowerCase() || ''

  const results: RankedTest[] = []
  for (const a of assessments) {
    // Field, weight — the name/what-it-measures matter far more than the blurb.
    const fields: Array<[string, number]> = [
      [a.name ?? '', 6],
      [a.nameEn ?? '', 4],
      [a.measure ?? '', 5],
      [a.usage ?? '', 4],
      [a.category?.name ?? '', 3],
      [a.description ?? '', 2],
      [a.descriptionEn ?? '', 1.5],
      [TEST_DATABASE[a.id]?.useCases ?? '', 4],
    ]

    let score = 0
    const hits = new Set<string>()
    for (const [text, weight] of fields) {
      const hay = text.toLowerCase()
      if (!hay) continue
      for (const term of terms) {
        if (hay.includes(term)) {
          score += weight
          hits.add(term)
        }
      }
    }

    // Soft category boost — never a hard filter, so a strong cross-category
    // match can still win (avoids collapsing every query to one bucket).
    if (categoryNeedle && (a.category?.name ?? '').toLowerCase().includes(categoryNeedle)) {
      score += 3
    }

    if (score > 0) {
      results.push({ assessment: a, score, reason: [...hits].slice(0, 3).join(', ') })
    }
  }

  results.sort((x, y) => y.score - x.score || x.assessment.price - y.assessment.price)
  return results
}
