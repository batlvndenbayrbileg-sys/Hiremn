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
  image?: string
  // LLM-д өгөх дэлгэрэнгүй тайлбар — ямар асуудалд тохирох
  useCases: string
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
    image: "/images/tests/test-1-growth-mindset.jpg",
    useCases: "Суралцахдаа бэрхшээлтэй, өөрийгөө хөгжүүлэхийг хүсдэг, амжилтгүй болохоос айдаг, шинэ зүйл сурахад хэцүү санагддаг, бүтэлгүйтлээс сэргийлэх",
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
    image: "/images/tests/test-2-work-life-balance.jpg",
    useCases: "Ажилдаа их цаг зарцуулдаг, гэр бүлдээ цаг гаргаж чаддаггүй, ядарч түвддэг, стресстэй, burnout мэдрэмж, амралт авч чаддаггүй, ажил амьдралын хоорондох тэнцвэрээ олох",
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
    image: "/images/tests/test-3-communication-style.jpg",
    useCases: "Хүмүүстэй харилцахад хэцүү, багаар ажиллахад асуудалтай, удирдах ажилтан, менежер, санаагаа илэрхийлж чаддаггүй, зөрчилдөөн шийдэж чаддаггүй, харилцааны ур чадвараа сайжруулах",
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
    image: "/images/tests/test-99-audit.jpg",
    useCases: "Архи ууж байгаа, архины хэрэглээгээ хянах, согтууруулах ундаа хэт их хэрэглэж байгаа эсэх, архинд донтох эрсдэл, эрүүл мэндийн үзлэг",
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
    image: "/images/tests/test-5-nicotine.jpg",
    useCases: "Тамхи татдаг, тамхинаас гарах гэж байгаа, тамхины хамаарлаа шалгах, никотин донтолт, эрүүл амьдралын хэв маягт шилжих",
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
    image: "/images/tests/test-6-semut.jpg",
    useCases: "Сэтгэл санаа муу, депресс мэдрэмж, санаа зовнил, уйтгар гунигтай, стресс ихтэй, сэтгэцийн эрүүл мэндээ шалгах, урьдчилан сэргийлэх, гутрал",
  },
  // Үнэгүй сорилтүүд
  7: {
    id: 7,
    name: "Өөртөө итгэх итгэл",
    nameEn: "Self-Confidence",
    desc: "Өөрийн өөртөө итгэх чадварыг үнэл",
    descEn: "Assess your self-confidence level",
    url: "https://hire.mn/test/7",
    price: "Uneggui",
    priceEn: "Free",
    time: "10 мин",
    emoji: "💪",
    color: "#06B6D4",
    tag: "Uneggui",
    tagEn: "Free",
    category: "personality",
    useCases: "Өөртөө итгэлгүй, ичимхий, олны өмнө ярихаас айдаг, шийдвэр гаргахад эргэлздэг, бусдын санаа бодлоос хэт ихээр хамаардаг, өөрийгөө үнэлдэггүй",
  },
  8: {
    id: 8,
    name: "Түгшүүрийн үнэлгээ",
    nameEn: "Anxiety Assessment",
    desc: "Түгшүүрийн түвшнийг хэмжээрэй",
    descEn: "Measure your anxiety level",
    url: "https://hire.mn/test/8",
    price: "Uneggui",
    priceEn: "Free",
    time: "10 мин",
    emoji: "😰",
    color: "#F59E0B",
    tag: "Uneggui",
    tagEn: "Free",
    category: "health",
    useCases: "Санаа зовнилтой, түгшүүртэй, сандрах, зүрхний цохилт түргэсдэг, нойргүй, хэт их бодолтой, ирээдүйгээсээ айдаг, panic attack, anxiety",
  },
  4: {
    id: 4,
    name: "Өөрийгөө үнэлэх (RSES)",
    nameEn: "Self-Esteem Test",
    desc: "Өөрийгөө үнэлэх чадвар",
    descEn: "Rosenberg Self-Esteem Scale",
    url: "https://hire.mn/test/4",
    price: "Uneggui",
    priceEn: "Free",
    time: "10 мин",
    emoji: "🌟",
    color: "#8B5CF6",
    tag: "Uneggui",
    tagEn: "Free",
    category: "personality",
    useCases: "Өөрийгөө үнэлж чаддаггүй, бусадтай харьцуулдаг, өөрийгөө дутуу санадаг, self-esteem бага, өөрийгөө хүндлэх, өөрийнхөө үнэ цэнийг мэдэхгүй",
  },
  // Төлбөртэй сорилтүүд
  10: {
    id: 10,
    name: "Тэсвэр тэвчээр (Grit)",
    nameEn: "Grit Test",
    desc: "Хүлээлцлийн чадварыг хэмжих",
    descEn: "Measure your perseverance",
    url: "https://hire.mn/test/10",
    price: "10,000",
    priceEn: "10,000",
    time: "10 мин",
    emoji: "🎯",
    color: "#DC2626",
    tag: "Premium",
    tagEn: "Premium",
    category: "personality",
    useCases: "Зорилгодоо хүрч чаддаггүй, амархан бууж өгдөг, тууштай байх, урт хугацааны зорилготой, хэцүү үед тэвчдэггүй, шаргуу хөдөлмөрлөх",
  },
  11: {
    id: 11,
    name: "Ёс зүйн манлайлал",
    nameEn: "Ethical Leadership",
    desc: "Ёс зүйн манлайлалын үнэлгээ",
    descEn: "Ethical leadership assessment",
    url: "https://hire.mn/test/11",
    price: "20,000",
    priceEn: "20,000",
    time: "20 мин",
    emoji: "⚖️",
    color: "#059669",
    tag: "Premium",
    tagEn: "Premium",
    category: "personality",
    useCases: "Удирдах ажилтан, менежер, манлайлагч, ёс зүйн асуудал, шийдвэр гаргалт, баг удирдах, ажлын байрны ёс зүй, leadership",
  },
  12: {
    id: 12,
    name: "16-н хэв шинж (Юнгийн тест)",
    nameEn: "16 Personality Types",
    desc: "Юнгийн хувь хүний типологи",
    descEn: "Jung's personality typing",
    url: "https://hire.mn/test/12",
    price: "20,000",
    priceEn: "20,000",
    time: "10 мин",
    emoji: "🧬",
    color: "#7C3AED",
    tag: "Premium",
    tagEn: "Premium",
    category: "personality",
    useCases: "Өөрийгөө илүү сайн ойлгох, хувь хүний хэв шинж, MBTI, introvert extravert, карьер сонголт, хамтрагчаа ойлгох, харилцаагаа сайжруулах",
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
