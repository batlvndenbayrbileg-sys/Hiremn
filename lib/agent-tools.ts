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
  
  // Search patterns
  const matchingTests: { id: number; name: string; score: number; reason: string }[] = []
  
  // Check knowledge base first
  const { tests: knowledgeMatches } = searchKnowledge(problem)
  for (const t of knowledgeMatches) {
    matchingTests.push({
      id: t.id,
      name: t.name,
      score: 10,
      reason: `${t.useCases.slice(0, 2).join(', ')}`,
    })
  }
  
  // Also check static database
  for (const test of Object.values(TEST_DATABASE)) {
    if (matchingTests.some(m => m.id === test.id)) continue
    
    const useCasesLower = test.useCases.toLowerCase()
    if (useCasesLower.includes(problemLower) || problemLower.split(' ').some(w => useCasesLower.includes(w))) {
      matchingTests.push({
        id: test.id,
        name: test.name,
        score: 5,
        reason: test.useCases.slice(0, 50),
      })
    }
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

export function analyzeAndRecommend(
  userProblem: string, 
  assessments: Assessment[]
): ToolResult {
  const problemLower = userProblem.toLowerCase()
  
  // Problem → Test mapping with reasoning
  const recommendations: { 
    id: number
    name: string
    reason: string
    priority: 'high' | 'medium' | 'low'
  }[] = []
  
  // Pattern matching for common problems
  const problemPatterns = [
    {
      pattern: /стресс|ядар|burnout|түвд|ачаалал/i,
      tests: [2, 6, 8],
      reason: 'Стресс, burnout-ын үнэлгээ',
      priority: 'high' as const,
    },
    {
      pattern: /өөртөө итгэ|confidence|ичим|айдас/i,
      tests: [7, 4],
      reason: 'Өөртөө итгэлийн үнэлгээ',
      priority: 'high' as const,
    },
    {
      pattern: /харилц|communicat|баг|хамт ажилла/i,
      tests: [3, 12],
      reason: 'Харилцааны хэв шинжийн үнэлгээ',
      priority: 'medium' as const,
    },
    {
      pattern: /удирд|манлай|менежер|boss/i,
      tests: [11, 3],
      reason: 'Манлайллын үнэлгээ',
      priority: 'medium' as const,
    },
    {
      pattern: /депресс|гуниг|уйтгар|сэтгэл санаа муу/i,
      tests: [6, 8],
      reason: 'Сэтгэцийн эрүүл мэндийн үнэлгээ',
      priority: 'high' as const,
    },
    {
      pattern: /тамхи|никотин/i,
      tests: [5],
      reason: 'Тамхины хамаарлын үнэлгээ',
      priority: 'medium' as const,
    },
    {
      pattern: /архи|согтууруу/i,
      tests: [99],
      reason: 'Архины хэрэглээний үнэлгээ',
      priority: 'medium' as const,
    },
    {
      pattern: /карьер|ажил хай|мэргэжил/i,
      tests: [12, 1, 10],
      reason: 'Карьер төлөвлөлтийн үнэлгээ',
      priority: 'medium' as const,
    },
    {
      pattern: /өсөлт|сура|хөгж/i,
      tests: [1, 10],
      reason: 'Хувь хүний хөгжлийн үнэлгээ',
      priority: 'low' as const,
    },
  ]
  
  for (const { pattern, tests, reason, priority } of problemPatterns) {
    if (pattern.test(problemLower)) {
      for (const testId of tests) {
        const knowledge = TEST_KNOWLEDGE[testId]
        if (knowledge && !recommendations.some(r => r.id === testId)) {
          recommendations.push({
            id: testId,
            name: knowledge.name,
            reason,
            priority,
          })
        }
      }
    }
  }
  
  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  
  return {
    success: true,
    data: {
      analyzedProblem: userProblem,
      recommendations: recommendations.slice(0, 6),
      totalRecommendations: recommendations.length,
    }
  }
}

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
  | 'analyzeAndRecommend'

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
    case 'analyzeAndRecommend':
      return analyzeAndRecommend(params.problem, assessments)
    default:
      return {
        success: false,
        data: null,
        error: `Unknown tool: ${toolName}`,
      }
  }
}
