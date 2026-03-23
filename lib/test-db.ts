// hire.mn Test Database
// When AI recommends a test, it includes [TEST:id] markers
// The widget parses these and renders beautiful test cards

export interface TestInfo {
  id: number
  name: string
  nameEn: string
  desc: string
  descEn: string
  url: string
  price: string
  priceEn: string
  time: string
  emoji: string
  color: string
  tag: string
  tagEn: string
  category: "personality" | "health" | "behavior"
}

export const TEST_DATABASE: Record<number, TestInfo> = {
  1: {
    id: 1,
    name: "Өсөлтийн сэтгэлгээ",
    nameEn: "Mindset Test",
    desc: "Өөрийн хөгжлийн сэтгэлгээг мэдээрэй",
    descEn: "Discover your growth mindset potential",
    url: "https://hire.mn/test/mindset",
    price: "10,000₮",
    priceEn: "10,000₮",
    time: "10 мин",
    emoji: "🧠",
    color: "linear-gradient(135deg, #E8541A 0%, #FF8C5A 100%)",
    tag: "Алдартай",
    tagEn: "Popular",
    category: "personality",
  },
  2: {
    id: 2,
    name: "Ажил амьдралын тэнцвэр",
    nameEn: "Work-Life Balance",
    desc: "Амьдралын тэнцвэрт байдлаа шалгаарай",
    descEn: "Assess your work-life harmony",
    url: "https://hire.mn/test/worklife",
    price: "20,000₮",
    priceEn: "20,000₮",
    time: "10 мин",
    emoji: "⚖️",
    color: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
    tag: "Шинэ",
    tagEn: "New",
    category: "personality",
  },
  3: {
    id: 3,
    name: "Харилцааны хэв шинж",
    nameEn: "Communication Style",
    desc: "Харилцааны өөрийн хэв шинжийг ойлго",
    descEn: "Understand your communication patterns",
    url: "https://hire.mn/test/communication",
    price: "30,000₮",
    priceEn: "30,000₮",
    time: "10 мин",
    emoji: "💬",
    color: "linear-gradient(135deg, #6366F1 0%, #A78BFA 100%)",
    tag: "Удирдлагад",
    tagEn: "For Leaders",
    category: "behavior",
  },
  4: {
    id: 4,
    name: "AUDIT тест",
    nameEn: "AUDIT Test",
    desc: "Архины хэрэглээний үнэлгээ (WHO)",
    descEn: "Alcohol use assessment by WHO",
    url: "https://hire.mn/test/audit",
    price: "Үнэгүй",
    priceEn: "Free",
    time: "10 мин",
    emoji: "🍷",
    color: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
    tag: "Үнэгүй",
    tagEn: "Free",
    category: "health",
  },
  5: {
    id: 5,
    name: "Никотин хамаарал",
    nameEn: "Nicotine Dependency",
    desc: "Тамхины хамааралтай эсэхийг шалгах",
    descEn: "Check your nicotine dependency level",
    url: "https://hire.mn/test/nicotine",
    price: "Үнэгүй",
    priceEn: "Free",
    time: "10 мин",
    emoji: "🚬",
    color: "linear-gradient(135deg, #64748B 0%, #94A3B8 100%)",
    tag: "Үнэгүй",
    tagEn: "Free",
    category: "health",
  },
  6: {
    id: 6,
    name: "SEMUT урьдчилан сэргийлэх",
    nameEn: "SEMUT Screening",
    desc: "Сэтгэцийн эрүүл мэндийн шалгаруулалт",
    descEn: "Mental health preventive screening",
    url: "https://hire.mn/test/semut",
    price: "Үнэгүй",
    priceEn: "Free",
    time: "25 мин",
    emoji: "🧘",
    color: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)",
    tag: "Чухал",
    tagEn: "Important",
    category: "health",
  },
}

// Parse [TEST:id] markers from AI response and extract test IDs
export function parseTestMarkers(text: string): { cleanText: string; testIds: number[] } {
  const testIds: number[] = []
  const regex = /\[TEST:(\d+)\]/g
  let match

  while ((match = regex.exec(text)) !== null) {
    const id = parseInt(match[1], 10)
    if (TEST_DATABASE[id]) {
      testIds.push(id)
    }
  }

  // Remove the markers from the text for display
  const cleanText = text.replace(/\s*\[TEST:\d+\]/g, "").trim()

  return { cleanText, testIds }
}

// Get test by ID
export function getTestById(id: number): TestInfo | undefined {
  return TEST_DATABASE[id]
}

// Get all tests in a category
export function getTestsByCategory(category: TestInfo["category"]): TestInfo[] {
  return Object.values(TEST_DATABASE).filter((t) => t.category === category)
}

// Get free tests
export function getFreeTests(): TestInfo[] {
  return Object.values(TEST_DATABASE).filter(
    (t) => t.price === "Үнэгүй" || t.priceEn === "Free"
  )
}
