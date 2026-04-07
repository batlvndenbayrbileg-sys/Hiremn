export interface FAQEntry {
  id: string
  keywords: string[]
  answer_mn: string
  answer_en: string
  category: 'price' | 'tests' | 'register' | 'howto' | 'company' | 'time'
}

export const FAQ_DB: FAQEntry[] = [
  {
    id: 'price_general',
    keywords: ['үнэ', 'төлбөр', 'хэд', 'мөнгө', 'price', 'cost', 'fee', 'how much'],
    category: 'price',
    answer_mn: `hire.mn тестийн үнэ:\n\n💰 Үнэгүй тестүүд:\n• AUDIT (Архины хэрэглээ) — 10 мин\n• СЭМУТ (Урьдчилан сэргийлэх) — 25 мин\n• Никотин хамаарлын тест — 10 мин\n\n🟠 Төлбөртэй тестүүд:\n• Mindset тест — 10,000₮ (10 мин)\n• Ажил-амьдрал тэнцвэр — 20,000₮ (10 мин)\n• Харилцааны хэв шинж — 30,000₮ (10 мин)\n\n✨ Бүртгэлтэй хэрэглэгчид анхны тестэд хөнгөлөлт эдэлнэ!`,
    answer_en: `hire.mn test pricing:\n\n💰 Free tests:\n• AUDIT (Alcohol assessment) — 10 min\n• SEMUT (Preventive screening) — 25 min\n• Nicotine dependency test — 10 min\n\n🟠 Paid tests:\n• Mindset test — 10,000₮ (10 min)\n• Work-life balance — 20,000₮ (10 min)\n• Communication style — 30,000₮ (10 min)\n\n✨ Registered users get a discount on their first test!`
  },
  {
    id: 'test_list',
    keywords: ['ямар тест', 'тестүүд', 'жагсаалт', 'байдаг тест', 'what tests', 'list', 'available tests', 'test list'],
    category: 'tests',
    answer_mn: `hire.mn дээр дараах тестүүд байна:\n\n🎯 Зан чанар & Хандлага\n• Өсөлтийн сэтгэлгээ (Mindset)\n• Харилцааны хэв шинж\n• Зан төлөвийн үнэлгээ\n\n🧠 Оюун ухаан & Чадвар\n• Танин мэдэхүйн тест\n• Удирдлагын ур чадвар\n\n💼 Ажил & Карьер\n• Ажил-амьдрал тэнцвэр\n• Мэргэжлийн гүйцэтгэл\n\n🏥 Эрүүл мэнд\n• AUDIT, СЭМУТ, Никотин\n\nАль тестийн тухай дэлгэрэнгүй мэдмээр байна вэ?`,
    answer_en: `hire.mn offers these assessments:\n\n🎯 Personality & Mindset\n• Growth mindset (Mindset)\n• Communication style\n• Behavioral assessment\n\n🧠 Cognitive & Skills\n• Cognitive ability test\n• Leadership skills\n\n💼 Work & Career\n• Work-life balance\n• Job performance predictor\n\n🏥 Health & Wellness\n• AUDIT, SEMUT, Nicotine\n\nWhich test would you like to know more about?`
  },
  {
    id: 'register',
    keywords: ['бүртгүүл', 'яаж бүртгүүл', 'хэрхэн бүртгүүл', 'нэвтрэх', 'register', 'sign up', 'how to register', 'create account'],
    category: 'register',
    answer_mn: `Бүртгүүлэх маш хялбар! 🎉\n\n① hire.mn сайт руу орно\n② "Нэвтрэх" товч дарна\n③ И-мэйл хаяг оруулна\n④ Нууц үг үүсгэнэ\n⑤ И-мэйл баталгаажуулна\n⑥ Тест сонгоод эхэлнэ!\n\n📧 Асуудал гарвал: info@axiominc.mn\n📞 Утас: 7511-1111`,
    answer_en: `Registration is easy! 🎉\n\n① Visit hire.mn\n② Click "Login" button\n③ Enter your email address\n④ Create a password\n⑤ Verify your email\n⑥ Choose a test and start!\n\n📧 Support: info@axiominc.mn\n📞 Phone: 7511-1111`
  },
  {
    id: 'test_duration',
    keywords: ['хэдэн минут', 'хугацаа', 'удаан', 'хэр их цаг', 'how long', 'duration', 'minutes', 'time'],
    category: 'time',
    answer_mn: `Тестүүдийн үргэлжлэх хугацаа:\n\n⏱️ 10 минут:\n• Mindset, Ажил-амьдрал, AUDIT, Никотин\n\n⏱️ 25 минут:\n• СЭМУТ (урьдчилан сэргийлэх)\n\n⏱️ 30+ минут:\n• Харилцааны хэв шинж\n• Зан төлөвийн үнэлгээ\n\nТестийг тасалдуулалгүй, тайван газар өгөхийг зөвлөж байна.`,
    answer_en: `Test durations:\n\n⏱️ 10 minutes:\n• Mindset, Work-life, AUDIT, Nicotine\n\n⏱️ 25 minutes:\n• SEMUT (preventive screening)\n\n⏱️ 30+ minutes:\n• Communication style\n• Behavioral assessment\n\nWe recommend taking tests in a quiet, uninterrupted environment.`
  },
  {
    id: 'company_info',
    keywords: ['хэн', 'компани', 'axiom', 'байршил', 'холбоо барих', 'about', 'company', 'contact', 'address', 'who'],
    category: 'company',
    answer_mn: `hire.mn тухай:\n\n🏢 Аксиом Инк ХХК\n📍 СЭЗИС, Б байр, 7-р давхар\n   Энхтайвны өргөн чөлөө-5\n   Баянзүрх дүүрэг, УБ\n\n📞 7511-1111 / 9909-9371\n📧 info@axiominc.mn\n\n🌐 hire.mn\n📘 facebook.com/hire.mn\n📸 instagram.com/hire.mn`,
    answer_en: `About hire.mn:\n\n🏢 Axiom Inc LLC\n📍 MUBS, Building B, 7th floor\n   Enkhtaivny Urgon Choloo-5\n   Bayanzurkh District, UB\n\n📞 7511-1111 / 9909-9371\n📧 info@axiominc.mn\n\n🌐 hire.mn`
  },
  {
    id: 'free_tests',
    keywords: ['үнэгүй', 'төлбөргүй', 'free', 'no cost', 'without paying'],
    category: 'price',
    answer_mn: `Үнэгүй тестүүд 🎁\n\n✅ AUDIT — Архины хэрэглээг үнэлэх (10 мин)\n✅ Никотин хамаарлын тест (10 мин)\n✅ СЭМУТ — Урьдчилан сэргийлэх үзлэг (25 мин)\n\nЭдгээр тестийг бүртгэлгүйгээр ч өгч болно.\nШууд hire.mn руу орж эхэлнэ үү!`,
    answer_en: `Free tests 🎁\n\n✅ AUDIT — Alcohol use assessment (10 min)\n✅ Nicotine dependency test (10 min)\n✅ SEMUT — Preventive health screening (25 min)\n\nThese tests are available without registration.\nVisit hire.mn to get started!`
  },
  {
    id: 'result_validity',
    keywords: ['хэр зөв', 'найдвартай', 'accurate', 'valid', 'reliable', 'итгэж болох уу'],
    category: 'tests',
    answer_mn: `hire.mn тестүүдийн найдвартай байдал:\n\n✅ Олон улсын стандартад нийцсэн\n✅ Эрдэм шинжилгээний үндэслэлтэй\n✅ Мичиганы ИС, ДЭМБ зэрэг байгууллагуудтай хамтран хөгжүүлсэн\n✅ 3,500+ хэрэглэгч амжилттай тест өгсөн\n\n⚠️ Тэмдэглэл: Тестийн үр дүн нь\nзөвхөн лавлагаа болно — эмнэлгийн\nоношлогоог орлохгүй.`,
    answer_en: `hire.mn test reliability:\n\n✅ Meets international standards\n✅ Evidence-based assessments\n✅ Developed with University of Michigan, WHO and others\n✅ 3,500+ users have successfully completed tests\n\n⚠️ Note: Test results are for reference only\nand do not replace medical diagnosis.`
  }
]

export function findFAQ(message: string, lang: 'mn' | 'en'): string | null {
  const lower = message.toLowerCase()
  
  for (const entry of FAQ_DB) {
    const matched = entry.keywords.some(kw => lower.includes(kw.toLowerCase()))
    if (matched) {
      return lang === 'mn' ? entry.answer_mn : entry.answer_en
    }
  }
  return null
}