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
    name: "Өсөлтийн сэтгэлгээ (Mindset)",
    nameEn: "Growth Mindset Test",
    desc: "Өсөлтийн сэтгэлгээгээ мэдээрэх",
    descEn: "Discover your growth mindset potential",
    url: "https://hire.mn/test/1",
    price: "10,000",
    priceEn: "10,000",
    time: "10 мин",
    emoji: "🧗",
    color: "#E8541A",
    tag: "Aldartai",
    tagEn: "Popular",
    category: "personality",
  },
  2: {
    id: 2,
    name: "Ажил-амьдрал тэнцвэр",
    nameEn: "Work-Life Balance",
    desc: "Амьдралын тэнцвэрээр тайлбар ав",
    descEn: "Assess your work-life harmony",
    url: "https://hire.mn/test/2",
    price: "20,000",
    priceEn: "20,000",
    time: "10 мин",
    emoji: "⚖️",
    color: "#F0A830",
    tag: "Shine",
    tagEn: "New",
    category: "personality",
  },
  3: {
    id: 3,
    name: "Харилцааны хэв шинж",
    nameEn: "Communication Style",
    desc: "Харилцааны өөрийн хэв шинжийг ойлго",
    descEn: "Understand your communication patterns",
    url: "https://hire.mn/test/3",
    price: "30,000",
    priceEn: "30,000",
    time: "10 мин",
    emoji: "💬",
    color: "#7C3AED",
    tag: "Udidrlagad",
    tagEn: "For Leaders",
    category: "behavior",
  },
  99: {
    id: 99,
    name: "AUDIT тест",
    nameEn: "AUDIT Test",
    desc: "Архины хэрэглээний үнэлгээ (WHO)",
    descEn: "Alcohol use assessment by WHO",
    url: "https://hire.mn/test/99",
    price: "Uneggui",
    priceEn: "Free",
    time: "10 мин",
    emoji: "🏥",
    color: "#E8A870",
    tag: "Uneggui",
    tagEn: "Free",
    category: "health",
  },
  5: {
    id: 5,
    name: "Никотин хамаарал",
    nameEn: "Nicotine Dependency",
    desc: "Тамхины хамаарлыг шалга",
    descEn: "Check your nicotine dependency level",
    url: "https://hire.mn/test/5",
    price: "Uneggui",
    priceEn: "Free",
    time: "10 мин",
    emoji: "🚭",
    color: "#64748B",
    tag: "Uneggui",
    tagEn: "Free",
    category: "health",
  },
  6: {
    id: 6,
    name: "СЭМУТ урьдчилан сэргийлэх",
    nameEn: "SEMUT Screening",
    desc: "Сэтгэцийн эрүүл мэндийн шалгаруулалт",
    descEn: "Mental health preventive screening",
    url: "https://hire.mn/test/6",
    price: "Uneggui",
    priceEn: "Free",
    time: "25 мин",
    emoji: "🧘",
    color: "#EC4899",
    tag: "Chukhul",
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

  const cleanText = text.replace(/\s*\[TEST:\d+\]/g, "").trim()
  return { cleanText, testIds }
}

export function getTestById(id: number): TestInfo | undefined {
  return TEST_DATABASE[id]
}

export function getTestsByCategory(category: TestInfo["category"]): TestInfo[] {
  return Object.values(TEST_DATABASE).filter((t) => t.category === category)
}

export function getFreeTests(): TestInfo[] {
  return Object.values(TEST_DATABASE).filter(
    (t) => t.price === "Uneggui" || t.priceEn === "Free"
  )
}
