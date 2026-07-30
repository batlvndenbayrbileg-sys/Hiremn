// lib/agent-tools.ts — Agent Tools for hire.mn AI
// Provides specialized tools that the AI can use to fetch information and perform actions

import { TEST_KNOWLEDGE, PLATFORM_KNOWLEDGE, searchKnowledge } from './knowledge-base'
import { TEST_DATABASE } from './test-db'
import type { Assessment } from './hire-api'

// Tool definitions for the agent
export interface ToolResult {
  success: boolean
  data: any
  error?: string
}

// ══════════════════════════════════════════════════════════════════════════════
// Tool: Search Tests by Problem/Use Case
// ══════════════════════════════════════════════════════════════════════════════

export function searchTestsByProblem(problem: string, assessments: Assessment[]): ToolResult {
  const problemLower = problem.toLowerCase()
  const problemWords = problemLower.split(/\s+/).filter(w => w.length > 2)

  const matchingTests: { id: number; name: string; score: number; reason: string }[] = []

  // 1. Score the LIVE assessments directly. This is the authoritative source —
  //    the widget only shows tests that exist in the live API, so matches MUST
  //    carry live ids. (The static KB below uses different ids and previously
  //    never resolved against live data, which let unrelated tests slip in.)
  for (const a of assessments ?? []) {
    const haystack = [
      a.name, a.nameEn ?? '', a.description ?? '', a.usage ?? '', a.measure ?? '',
      a.category?.name ?? '', TEST_DATABASE[a.id]?.useCases ?? '',
    ].join(' ').toLowerCase()

    let score = 0
    for (const w of problemWords) {
      if (haystack.includes(w)) score += 2
    }
    if (score > 0) {
      matchingTests.push({ id: a.id, name: a.name, score, reason: '' })
    }
  }

  // 2. Supplement with the static knowledge base ONLY for ids that also exist in
  //    the live set (so a match can actually be rendered).
  const liveIds = new Set((assessments ?? []).map(a => a.id))
  const { tests: knowledgeMatches } = searchKnowledge(problem)
  for (const t of knowledgeMatches) {
    if (!liveIds.has(t.id) || matchingTests.some(m => m.id === t.id)) continue
    matchingTests.push({
      id: t.id,
      name: t.name,
      score: 4,
      reason: `${t.useCases.slice(0, 2).join(', ')}`,
    })
  }

  // Sort by score
  matchingTests.sort((a, b) => b.score - a.score)

  return {
    success: true,
    data: {
      matches: matchingTests.slice(0, 8),
      query: problem,
      totalFound: matchingTests.length,
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Tool: Get Test Details
// ══════════════════════════════════════════════════════════════════════════════

export function getTestDetails(testId: number): ToolResult {
  const knowledge = TEST_KNOWLEDGE[testId]
  const staticInfo = TEST_DATABASE[testId]
  
  if (!knowledge && !staticInfo) {
    return {
      success: false,
      data: null,
      error: `Test ID ${testId} not found`,
    }
  }
  
  if (knowledge) {
    return {
      success: true,
      data: {
        id: knowledge.id,
        name: knowledge.name,
        description: knowledge.fullDescription,
        author: knowledge.author,
        authorBio: knowledge.authorBio,
        methodology: knowledge.methodology,
        duration: knowledge.duration,
        questionCount: knowledge.questionCount,
        scientificBasis: knowledge.scientificBasis,
        targetAudience: knowledge.targetAudience,
        benefits: knowledge.benefits,
        useCases: knowledge.useCases,
        relatedTests: knowledge.relatedTests,
      }
    }
  }
  
  // Fallback to static info
  return {
    success: true,
    data: {
      id: staticInfo!.id,
      name: staticInfo!.name,
      description: staticInfo!.desc,
      price: staticInfo!.price,
      duration: staticInfo!.time,
      category: staticInfo!.category,
      useCases: staticInfo!.useCases.split(', '),
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Tool: Get Platform Information
// ══════════════════════════════════════════════════════════════════════════════

export function getPlatformInfo(topic: string): ToolResult {
  const topicLower = topic.toLowerCase()
  
  // Search platform knowledge
  const matches = PLATFORM_KNOWLEDGE.filter(p => 
    p.keywords.some(k => topicLower.includes(k) || k.includes(topicLower)) ||
    p.topic.toLowerCase().includes(topicLower)
  )
  
  if (matches.length === 0) {
    return {
      success: false,
      data: null,
      error: `No platform information found for "${topic}"`,
    }
  }
  
  return {
    success: true,
    data: {
      topics: matches.map(m => ({
        topic: m.topic,
        content: m.content,
      }))
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Tool: Get Tests by Category
// ══════════════════════════════════════════════════════════════════════════════

export function getTestsByCategory(category: string, assessments: Assessment[]): ToolResult {
  const categoryLower = category.toLowerCase()
  
  const matches = assessments.filter(a => 
    (a.category?.name || '').toLowerCase().includes(categoryLower) ||
    categoryLower.includes((a.category?.name || '').toLowerCase())
  )
  
  if (matches.length === 0) {
    return {
      success: false,
      data: null,
      error: `No tests found in category "${category}"`,
    }
  }
  
  return {
    success: true,
    data: {
      category,
      tests: matches.map(a => ({
        id: a.id,
        name: a.name,
        price: a.price,
        duration: a.duration,
      })),
      totalCount: matches.length,
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Tool: Get Free Tests
// ══════════════════════════════════════════════════════════════════════════════

export function getFreeTests(assessments: Assessment[]): ToolResult {
  const freeTests = assessments.filter(a => a.price === 0)
  
  return {
    success: true,
    data: {
      tests: freeTests.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description?.slice(0, 100),
        duration: a.duration,
        category: a.category?.name,
      })),
      totalCount: freeTests.length,
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Tool: Get Paid Tests
// ══════════════════════════════════════════════════════════════════════════════

export function getPaidTests(assessments: Assessment[]): ToolResult {
  const paidTests = assessments.filter(a => a.price > 0)
  
  return {
    success: true,
    data: {
      tests: paidTests.map(a => ({
        id: a.id,
        name: a.name,
        price: a.price,
        duration: a.duration,
        category: a.category?.name,
      })),
      totalCount: paidTests.length,
      priceRange: {
        min: Math.min(...paidTests.map(a => a.price)),
        max: Math.max(...paidTests.map(a => a.price)),
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Tool: Get Test Author Info
// ══════════════════════════════════════════════════════════════════════════════

export function getTestAuthorInfo(testId: number): ToolResult {
  const knowledge = TEST_KNOWLEDGE[testId]
  
  if (!knowledge) {
    return {
      success: false,
      data: null,
      error: `Detailed author information not available for test ID ${testId}`,
    }
  }
  
  return {
    success: true,
    data: {
      testName: knowledge.name,
      author: knowledge.author,
      authorBio: knowledge.authorBio,
      methodology: knowledge.methodology,
      scientificBasis: knowledge.scientificBasis,
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Tool: Get Related Tests
// ══════════════════════════════════════════════════════════════════════════════

export function getRelatedTests(testId: number): ToolResult {
  const knowledge = TEST_KNOWLEDGE[testId]
  
  if (!knowledge || !knowledge.relatedTests.length) {
    return {
      success: false,
      data: null,
      error: `No related tests found for test ID ${testId}`,
    }
  }
  
  const related = knowledge.relatedTests
    .map(id => TEST_KNOWLEDGE[id])
    .filter(Boolean)
    .map(t => ({
      id: t.id,
      name: t.name,
      description: t.fullDescription.slice(0, 100) + '...',
    }))
  
  return {
    success: true,
    data: {
      sourceTest: knowledge.name,
      relatedTests: related,
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Tool: Analyze User Problem and Recommend
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// Master tool executor
// ══════════════════════════════════════════════════════════════════════════════

export type ToolName = 
  | 'searchTestsByProblem'
  | 'getTestDetails'
  | 'getPlatformInfo'
  | 'getTestsByCategory'
  | 'getFreeTests'
  | 'getPaidTests'
  | 'getTestAuthorInfo'
  | 'getRelatedTests'

export function executeTool(
  toolName: ToolName, 
  params: Record<string, any>,
  assessments: Assessment[] = []
): ToolResult {
  switch (toolName) {
    case 'searchTestsByProblem':
      return searchTestsByProblem(params.problem, assessments)
    case 'getTestDetails':
      return getTestDetails(params.testId)
    case 'getPlatformInfo':
      return getPlatformInfo(params.topic)
    case 'getTestsByCategory':
      return getTestsByCategory(params.category, assessments)
    case 'getFreeTests':
      return getFreeTests(assessments)
    case 'getPaidTests':
      return getPaidTests(assessments)
    case 'getTestAuthorInfo':
      return getTestAuthorInfo(params.testId)
    case 'getRelatedTests':
      return getRelatedTests(params.testId)
    default:
      return {
        success: false,
        data: null,
        error: `Unknown tool: ${toolName}`,
      }
  }
}
