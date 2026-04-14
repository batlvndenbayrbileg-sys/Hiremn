// lib/agent.ts — AI Agent Framework for hire.mn Chatbot
// Implements tool-based reasoning for intelligent test recommendations

import Anthropic from '@anthropic-ai/sdk'
import { searchKnowledge, formatTestKnowledgeForLLM, formatPlatformKnowledgeForLLM, getTestKnowledge, TEST_KNOWLEDGE } from './knowledge-base'
import { getOrCreateMemory, updateMemoryFromMessage, generateMemoryContext, type UserMemory } from './memory'
import { formatAssessmentForWidget, type Assessment } from './hire-api'

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT TOOLS DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_tests',
    description: `Тестийн мэдээллийн сангаас хайлт хийнэ. Хэрэглэгчийн асуудал, сонирхол, 
хэрэгцээнд тохирох тестүүдийг олно. Keyword, use case, category-аар хайна.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Хайлтын түлхүүр үг эсвэл асуудлын тодорхойлолт'
        },
        category: {
          type: 'string',
          enum: ['personality', 'health', 'behavior', 'all'],
          description: 'Тестийн категори (заавал биш)'
        },
        priceFilter: {
          type: 'string',
          enum: ['free', 'paid', 'all'],
          description: 'Үнийн шүүлт (заавал биш)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_test_details',
    description: `Тодорхой тестийн дэлгэрэнгүй мэдээлэл авна: зохиогч, арга зүй, 
шинжлэх ухааны үндэслэл, хэний хэрэгцээнд тохирох гэх мэт.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        testId: {
          type: 'number',
          description: 'Тестийн ID дугаар'
        }
      },
      required: ['testId']
    }
  },
  {
    name: 'get_platform_info',
    description: `hire.mn платформын талаарх мэдээлэл: үнэ, төлбөр, заавар, 
байгууллагын тухай гэх мэт ерөнхий асуултад хариулна.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: {
          type: 'string',
          description: 'Мэдээлэл авах сэдэв: price, howto, about, categories гэх мэт'
        }
      },
      required: ['topic']
    }
  },
  {
    name: 'recommend_tests',
    description: `Хэрэглэгчийн context, өмнөх яриа, дурдсан асуудлууд дээр үндэслэн 
хамгийн тохирох тестүүдийг санал болгоно.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        userIssues: {
          type: 'array',
          items: { type: 'string' },
          description: 'Хэрэглэгчийн дурдсан асуудлуудын жагсаалт'
        },
        prefersFree: {
          type: 'boolean',
          description: 'Үнэгүй тест хүсч байгаа эсэх'
        },
        maxResults: {
          type: 'number',
          description: 'Хамгийн ихдээ хэдэн тест санал болгох'
        }
      },
      required: ['userIssues']
    }
  },
  {
    name: 'analyze_user_context',
    description: `Хэрэглэгчийн өмнөх яриа, дурдсан асуудлуудыг шинжилж, 
илүү зөв зөвлөмж өгөхөд ашиглана.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        sessionId: {
          type: 'string',
          description: 'Хэрэглэгчийн session ID'
        }
      },
      required: ['sessionId']
    }
  }
]

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

interface ToolInput {
  query?: string
  category?: string
  priceFilter?: string
  testId?: number
  topic?: string
  userIssues?: string[]
  prefersFree?: boolean
  maxResults?: number
  sessionId?: string
}

export function executeTool(
  toolName: string, 
  input: ToolInput,
  assessments: Assessment[],
  memory?: UserMemory
): string {
  switch (toolName) {
    case 'search_tests': {
      const { tests, platform } = searchKnowledge(input.query || '')
      
      // Apply filters
      let filteredTests = tests
      if (input.priceFilter === 'free') {
        filteredTests = tests.filter(t => {
          const testInfo = Object.values(TEST_KNOWLEDGE).find(tk => tk.id === t.id)
          return testInfo?.keywords.includes('үнэгүй') || t.useCases.some(u => u.includes('үнэгүй'))
        })
      }
      
      if (filteredTests.length === 0) {
        return 'Хайлтад тохирох тест олдсонгүй. Өөр түлхүүр үгээр хайж үзнэ үү.'
      }
      
      return `Олдсон тестүүд (${filteredTests.length}):\n${formatTestKnowledgeForLLM(filteredTests)}`
    }
    
    case 'get_test_details': {
      const testKnowledge = getTestKnowledge(input.testId || 0)
      if (!testKnowledge) {
        return `ID ${input.testId} тест олдсонгүй.`
      }
      
      return `
ТЕСТ: ${testKnowledge.name} [TEST:${testKnowledge.id}]
Бүтэн нэр: ${testKnowledge.fullName || testKnowledge.name}
Зохиогч: ${testKnowledge.author}
Зохиогчийн тухай: ${testKnowledge.authorBio}
Арга зүй: ${testKnowledge.methodology}
Хугацаа: ${testKnowledge.duration} (${testKnowledge.questionCount} асуулт)
Шинжлэх ухааны үндэс: ${testKnowledge.scientificBasis}
Зорилтот бүлэг: ${testKnowledge.targetAudience.join(', ')}
Ашиг тус: ${testKnowledge.benefits.join(', ')}
Тохирох асуудлууд: ${testKnowledge.useCases.join(', ')}
Холбоотой тестүүд: ${testKnowledge.relatedTests.map(id => `[TEST:${id}]`).join(', ')}
`
    }
    
    case 'get_platform_info': {
      const { platform } = searchKnowledge(input.topic || '')
      if (platform.length === 0) {
        return 'Энэ сэдвийн талаар мэдээлэл олдсонгүй.'
      }
      return formatPlatformKnowledgeForLLM(platform)
    }
    
    case 'recommend_tests': {
      const issues = input.userIssues || []
      const maxResults = input.maxResults || 5
      
      // Search for each issue and combine results
      const allResults: Map<number, { test: any; score: number }> = new Map()
      
      for (const issue of issues) {
        const { tests } = searchKnowledge(issue)
        for (const test of tests) {
          const existing = allResults.get(test.id)
          if (existing) {
            existing.score += 1
          } else {
            allResults.set(test.id, { test, score: 1 })
          }
        }
      }
      
      // Sort by relevance score
      const sorted = [...allResults.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
      
      if (sorted.length === 0) {
        return 'Тохирох тест олдсонгүй.'
      }
      
      const recommendations = sorted.map(({ test, score }) => 
        `[TEST:${test.id}] ${test.name} (тохирох түвшин: ${score}/${issues.length})`
      ).join('\n')
      
      return `Санал болгох тестүүд:\n${recommendations}`
    }
    
    case 'analyze_user_context': {
      if (!memory) {
        return 'Хэрэглэгчийн мэдээлэл байхгүй.'
      }
      
      return `
ХЭРЭГЛЭГЧИЙН CONTEXT:
- Мессежийн тоо: ${memory.messageCount}
- Дурдсан асуудлууд: ${memory.mentionedIssues.join(', ') || 'байхгүй'}
- Сэтгэл зүйн байдал: ${memory.emotionalState || 'тодорхойгүй'}
- Яаралтай байдал: ${memory.urgency || 'тодорхойгүй'}
- Үнэгүй тест хүсч байгаа: ${memory.prefersFree === true ? 'тийм' : memory.prefersFree === false ? 'үгүй' : 'тодорхойгүй'}
- Сонирхсон категориуд: ${memory.interestedCategories.join(', ') || 'байхгүй'}
- Өмнө санал болгосон: ${memory.recommendedTests.map(id => `[TEST:${id}]`).join(', ') || 'байхгүй'}
- Гол мэдээллүүд: ${memory.keyFacts.join('; ') || 'байхгүй'}
`
    }
    
    default:
      return `Тодорхойгүй tool: ${toolName}`
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

export function buildAgentSystemPrompt(
  lang: 'mn' | 'en',
  assessments: Assessment[],
  memory?: UserMemory
): string {
  const totalTests = assessments.length
  const freeTests = assessments.filter(a => a.price === 0).length
  const paidTests = totalTests - freeTests
  
  // Get all test IDs for reference
  const freeTestIds = assessments.filter(a => a.price === 0).map(a => `[TEST:${a.id}]`).join(' ')
  const paidTestIds = assessments.filter(a => a.price > 0).map(a => `[TEST:${a.id}]`).join(' ')
  
  const memoryContext = memory ? generateMemoryContext(memory) : ''

  return `Та hire.mn платформын ADVANCED AI зөвлөх.

═══════════════════════════════════════════════════════════════════
HIRE.MN ПЛАТФОРМ
═══════════════════════════════════════════════════════════════════
- Монголын анхны сэтгэл зүй, зан төлөвийн үнэлгээний платформ
- Уриа: "Зөв хүн, зөв газарт"
- Нийт ${totalTests} тест (${freeTests} үнэгүй, ${paidTests} төлбөртэй)
- 50,000+ хэрэглэгч, 200+ байгууллага

═══════════════════════════════════════════════════════════════════
ТАНЫ ЧАДВАРУУД (TOOLS)
═══════════════════════════════════════════════════════════════════
1. search_tests - Хэрэглэгчийн асуудалд тохирох тест хайх
2. get_test_details - Тестийн дэлгэрэнгүй мэдээлэл (зохиогч, арга зүй)
3. get_platform_info - Платформын мэдээлэл (үнэ, заавар)
4. recommend_tests - Олон асуудалд үндэслэн тест санал болгох
5. analyze_user_context - Хэрэглэгчийн context шинжлэх

═══════════════════════════════════════════════════════════════════
ХАРИУЛАХ ЗАРЧИМ
═══════════════════════════════════════════════════════════════════
1. ЭМПАТИ: Хэрэглэгчийн асуудлыг ойлгосноо илэрхийл
2. МЭРГЭЖЛИЙН: Шинжлэх ухаанд суурилсан мэдээлэл өг
3. ЗӨВЛӨМЖ: Тохирох тестүүдийг [TEST:id] маркераар санал болго
4. ТОВЧ: 2-4 өгүүлбэрт багтаа, жагсаалт бичэхгүй
5. CONTEXT: Өмнөх яриаг санаж, үргэлжлүүлэн ярилц

═══════════════════════════════════════════════════════════════════
ТЕСТИЙН МАРКЕР
═══════════════════════════════════════════════════════════════════
ҮНЭГҮЙ: ${freeTestIds}
ТӨЛБӨРТЭЙ: ${paidTestIds}

Хэрэглэгч "үнэгүй тест" гэвэл → БҮГД үнэгүй тестийн marker
Хэрэглэгч "төлбөртэй тест" гэвэл → БҮГД төлбөртэй тестийн marker

═══════════════════════════════════════════════════════════════════
ЖИШЭЭ ХАРИЛЦАА
═══════════════════════════════════════════════════════════════════
Хэрэглэгч: "Би сүүлийн үед их стресстэй байна"
Агент: Стресс нь олон шалтгаантай байж болох ба цаг тухайд нь анхаарал хандуулах хэрэгтэй. 
Таны байдлыг илүү сайн ойлгохын тулд эдгээр тестүүдийг санал болгоё. [TEST:2] [TEST:6] [TEST:8]

Хэрэглэгч: "AUDIT тест гэж юу вэ?"
Агент: AUDIT (Alcohol Use Disorders Identification Test) нь ДЭМБ-ын боловсруулсан 
архины хэрэглээний эрсдэлийг илрүүлэх олон улсын стандарт сорилт юм. 10 асуулттай, 
5 минутад бөглөнө. [TEST:99]
${memoryContext}

═══════════════════════════════════════════════════════════════════
ХЭЛНИЙ ТОХИРГОО: ${lang === 'mn' ? 'Монгол (Кирилл)' : 'English'}
═══════════════════════════════════════════════════════════════════`
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN AGENT FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

export interface AgentResponse {
  reply: string
  testIds: number[]
  toolsUsed: string[]
  reasoning?: string
}

export async function runAgent(
  anthropic: Anthropic,
  messages: { role: string; content: string }[],
  assessments: Assessment[],
  sessionId: string,
  lang: 'mn' | 'en' = 'mn',
  extractedData: {
    detectedCategory?: string
    priceFilter?: 'free' | 'paid'
    intent?: string
  } = {}
): Promise<AgentResponse> {
  // Get or create memory
  const memory = getOrCreateMemory(sessionId)
  
  // Update memory with latest message
  const lastMessage = messages[messages.length - 1]?.content || ''
  updateMemoryFromMessage(sessionId, lastMessage, extractedData)
  
  // Build system prompt
  const systemPrompt = buildAgentSystemPrompt(lang, assessments, memory)
  
  // Format messages for API
  const formattedMessages = messages
    .filter(m => ['user', 'assistant', 'bot'].includes(m.role))
    .map(m => ({
      role: (m.role === 'bot' ? 'assistant' : m.role) as 'user' | 'assistant',
      content: String(m.content),
    }))
  
  const toolsUsed: string[] = []
  let finalResponse = ''
  
  // Initial API call with tools
  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: systemPrompt,
    messages: formattedMessages,
    tools: AGENT_TOOLS,
  })
  
  // Process tool calls iteratively
  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    )
    
    const toolResults: Anthropic.ToolResultBlockParam[] = []
    
    for (const toolUse of toolUseBlocks) {
      toolsUsed.push(toolUse.name)
      const result = executeTool(
        toolUse.name, 
        toolUse.input as ToolInput, 
        assessments, 
        memory
      )
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result,
      })
    }
    
    // Continue conversation with tool results
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        ...formattedMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ],
      tools: AGENT_TOOLS,
    })
  }
  
  // Extract final text response
  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  )
  finalResponse = textBlock?.text || ''
  
  // Parse test IDs from response
  const testIdRegex = /\[TEST:(\d+)\]/g
  const testIds: number[] = []
  let match
  while ((match = testIdRegex.exec(finalResponse)) !== null) {
    testIds.push(parseInt(match[1], 10))
  }
  
  // Update memory with recommended tests
  updateMemoryFromMessage(sessionId, '', { recommendedTestIds: testIds })
  
  // Clean response (remove [TEST:id] markers for display)
  const cleanReply = finalResponse.replace(/\s*\[TEST:\d+\]/g, '').trim()
  
  return {
    reply: cleanReply,
    testIds,
    toolsUsed,
  }
}
