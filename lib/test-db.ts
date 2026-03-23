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
    name: "Ogsoltiyn setgelgee (Mindset)",
    nameEn: "Growth Mindset Test",
    desc: "Ogsoltiyn setgelgeegee medeereh",
    descEn: "Discover your growth mindset potential",
    url: "https://hire.mn/test/1",
    price: "10,000",
    priceEn: "10,000",
    time: "10 min",
    emoji: "🧗",
    color: "linear-gradient(135deg, #F4A87C 0%, #E8541A 100%)",
    tag: "Aldartai",
    tagEn: "Popular",
    category: "personality",
  },
  2: {
    id: 2,
    name: "Ajil-amidral tentsver",
    nameEn: "Work-Life Balance",
    desc: "Amidralyn tentstsereer tailbaar av",
    descEn: "Assess your work-life harmony",
    url: "https://hire.mn/test/2",
    price: "20,000",
    priceEn: "20,000",
    time: "10 min",
    emoji: "⚖️",
    color: "linear-gradient(135deg, #F9C784 0%, #F0A830 100%)",
    tag: "Shine",
    tagEn: "New",
    category: "personality",
  },
  3: {
    id: 3,
    name: "Khariltsiany khev shinj",
    nameEn: "Communication Style",
    desc: "Khariltsiany ooriin khev shinjiig oilgo",
    descEn: "Understand your communication patterns",
    url: "https://hire.mn/test/3",
    price: "30,000",
    priceEn: "30,000",
    time: "10 min",
    emoji: "💬",
    color: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)",
    tag: "Udidrlagad",
    tagEn: "For Leaders",
    category: "behavior",
  },
  99: {
    id: 99,
    name: "AUDIT test",
    nameEn: "AUDIT Test",
    desc: "Arkhiny kherlegeenii unelgee (WHO)",
    descEn: "Alcohol use assessment by WHO",
    url: "https://hire.mn/test/99",
    price: "Uneggui",
    priceEn: "Free",
    time: "10 min",
    emoji: "🏥",
    color: "linear-gradient(135deg, #F5D5B0 0%, #E8A870 100%)",
    tag: "Uneggui",
    tagEn: "Free",
    category: "health",
  },
  5: {
    id: 5,
    name: "Nikotin khamaraal",
    nameEn: "Nicotine Dependency",
    desc: "Tamkhiny khamaarlaltai esekhiig shalga",
    descEn: "Check your nicotine dependency level",
    url: "https://hire.mn/test/5",
    price: "Uneggui",
    priceEn: "Free",
    time: "10 min",
    emoji: "🚭",
    color: "linear-gradient(135deg, #94A3B8 0%, #64748B 100%)",
    tag: "Uneggui",
    tagEn: "Free",
    category: "health",
  },
  6: {
    id: 6,
    name: "SEMUT urridchilan sergiilekh",
    nameEn: "SEMUT Screening",
    desc: "Settsiin eruul mendiin shalgaruulalt",
    descEn: "Mental health preventive screening",
    url: "https://hire.mn/test/6",
    price: "Uneggui",
    priceEn: "Free",
    time: "25 min",
    emoji: "🧘",
    color: "linear-gradient(135deg, #F472B6 0%, #EC4899 100%)",
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
