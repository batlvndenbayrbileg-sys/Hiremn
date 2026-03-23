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
    answer_mn: `**hire.mn тестийн үнэ** 💰

🎁 **Үнэгүй тестүүд:**
• AUDIT (Архины хэрэглээ) — 10 мин
• СЭМУТ (Урьдчилан сэргийлэх) — 25 мин
• Никотин хамаарлын тест — 10 мин

💳 **Төлбөртэй тестүүд:**
• Mindset тест — 10,000₮ (10 мин)
• Ажил-амьдрал тэнцвэр — 20,000₮ (10 мин)
• Харилцааны хэв шинж — 30,000₮ (10 мин)

✨ Анхны тестэд бүртгэлтэй хэрэглэгчид хөнгөлөлт эдэлнэ!`,
    answer_en: `**hire.mn Test Pricing** 💰

🎁 **Free Tests:**
• AUDIT (Alcohol assessment) — 10 min
• SEMUT (Preventive screening) — 25 min
• Nicotine dependency test — 10 min

💳 **Paid Tests:**
• Mindset test — 10,000₮ (10 min)
• Work-life balance — 20,000₮ (10 min)
• Communication style — 30,000₮ (10 min)

✨ Registered users get a discount on their first test!`
  },
  {
    id: 'test_list',
    keywords: ['ямар тест', 'тестүүд', 'жагсаалт', 'байдаг тест', 'what tests', 'list', 'available tests', 'test list'],
    category: 'tests',
    answer_mn: `**hire.mn дээрх тестүүд** 📋

🎯 **Зан чанар & Хандлага**
• Өсөлтийн сэтгэлгээ (Mindset)
• Харилцааны хэв шинж
• Зан төлөвийн үнэлгээ

🧠 **Оюун ухаан & Чадвар**
• Танин мэдэхүйн тест
• Удирдлагын ур чадвар

💼 **Ажил & Карьер**
• Ажил-амьдрал тэнцвэр
• Мэргэжлийн гүйцэтгэл

🏥 **Эрүүл мэнд** (Үнэгүй)
• AUDIT, СЭМУТ, Никотин

Аль тестийн талаар дэлгэрэнгүй мэдмээр байна вэ? 🤔`,
    answer_en: `**Available Tests on hire.mn** 📋

🎯 **Personality & Mindset**
• Growth mindset (Mindset)
• Communication style
• Behavioral assessment

🧠 **Cognitive & Skills**
• Cognitive ability test
• Leadership skills

💼 **Work & Career**
• Work-life balance
• Job performance predictor

🏥 **Health & Wellness** (Free)
• AUDIT, SEMUT, Nicotine

Which test would you like to know more about? 🤔`
  },
  {
    id: 'register',
    keywords: ['бүртгүүл', 'яаж бүртгүүл', 'хэрхэн бүртгүүл', 'нэвтрэх', 'register', 'sign up', 'how to register', 'create account'],
    category: 'register',
    answer_mn: `**Бүртгүүлэх заавар** 🎉

① hire.mn сайт руу орно
② "Нэвтрэх" товч дарна
③ И-мэйл хаяг оруулна
④ Нууц үг үүсгэнэ
⑤ И-мэйл баталгаажуулна
⑥ Тест сонгоод эхэлнэ!

**Тусламж хэрэгтэй бол:**
📧 info@axiominc.mn
📞 7511-1111`,
    answer_en: `**How to Register** 🎉

① Visit hire.mn
② Click "Login" button
③ Enter your email address
④ Create a password
⑤ Verify your email
⑥ Choose a test and start!

**Need help?**
📧 info@axiominc.mn
📞 7511-1111`
  },
  {
    id: 'test_duration',
    keywords: ['хэдэн минут', 'хугацаа', 'удаан', 'хэр их цаг', 'how long', 'duration', 'minutes', 'time'],
    category: 'time',
    answer_mn: `**Тестийн үргэлжлэх хугацаа** ⏱️

**10 минут:**
• Mindset, Ажил-амьдрал, AUDIT, Никотин

**25 минут:**
• СЭМУТ (урьдчилан сэргийлэх)

**30+ минут:**
• Харилцааны хэв шинж
• Зан төлөвийн үнэлгээ

💡 Тестийг тасалдуулалгүй, тайван газар өгөхийг зөвлөж байна.`,
    answer_en: `**Test Durations** ⏱️

**10 minutes:**
• Mindset, Work-life, AUDIT, Nicotine

**25 minutes:**
• SEMUT (preventive screening)

**30+ minutes:**
• Communication style
• Behavioral assessment

💡 We recommend taking tests in a quiet, uninterrupted environment.`
  },
  {
    id: 'company_info',
    keywords: ['хэн', 'компани', 'axiom', 'байршил', 'холбоо барих', 'about', 'company', 'contact', 'address', 'who'],
    category: 'company',
    answer_mn: `**hire.mn тухай** 🏢

**Аксиом Инк ХХК**
📍 СЭЗИС, Б байр, 7-р давхар
   Энхтайвны өргөн чөлөө-5
   Баянзүрх дүүрэг, УБ

📞 7511-1111 / 9909-9371
📧 info@axiominc.mn

🌐 hire.mn
📘 facebook.com/hire.mn
📸 instagram.com/hire.mn

*"Зөв хүн, зөв газарт"* ✨`,
    answer_en: `**About hire.mn** 🏢

**Axiom Inc LLC**
📍 MUBS, Building B, 7th floor
   Enkhtaivny Urgon Choloo-5
   Bayanzurkh District, UB

📞 7511-1111 / 9909-9371
📧 info@axiominc.mn

🌐 hire.mn

*"Right person, right place"* ✨`
  },
  {
    id: 'free_tests',
    keywords: ['үнэгүй', 'төлбөргүй', 'free', 'no cost', 'without paying'],
    category: 'price',
    answer_mn: `**Үнэгүй тестүүд** 🎁

✅ **AUDIT** — Архины хэрэглээг үнэлэх (10 мин)
✅ **Никотин хамаарлын тест** (10 мин)
✅ **СЭМУТ** — Урьдчилан сэргийлэх үзлэг (25 мин)

Эдгээр тестийг бүртгэлгүйгээр ч өгч болно.
Шууд hire.mn руу орж эхлээрэй! 🚀`,
    answer_en: `**Free Tests** 🎁

✅ **AUDIT** — Alcohol use assessment (10 min)
✅ **Nicotine dependency test** (10 min)
✅ **SEMUT** — Preventive health screening (25 min)

These tests are available without registration.
Visit hire.mn to get started! 🚀`
  },
  {
    id: 'result_validity',
    keywords: ['хэр зөв', 'найдвартай', 'accurate', 'valid', 'reliable', 'итгэж болох уу'],
    category: 'tests',
    answer_mn: `**hire.mn тестийн найдвартай байдал** ✅

• Олон улсын стандартад нийцсэн
• Эрдэм шинжилгээний үндэслэлтэй
• Мичиганы их сургууль, ДЭМБ-тай хамтарсан
• 3,500+ хэрэглэгч амжилттай тест өгсөн

⚠️ **Анхаар:** Тестийн үр дүн нь зөвхөн лавлагаа болно — эмнэлгийн оношлогоог орлохгүй.`,
    answer_en: `**hire.mn Test Reliability** ✅

• Meets international standards
• Evidence-based assessments
• Developed with University of Michigan, WHO
• 3,500+ users have completed tests

⚠️ **Note:** Test results are for reference only and do not replace medical diagnosis.`
  },
  {
    id: 'greeting',
    keywords: ['сайн байна уу', 'сайн уу', 'hello', 'hi', 'hey', 'сайна', 'sain baina'],
    category: 'howto',
    answer_mn: `Сайн байна уу! 👋

Би **hire.mn**-ийн туслах AI байна. Би танд дараах зүйлсээр туслах боломжтой:

• 📋 Тестүүдийн талаар мэдээлэл
• 💰 Үнийн мэдээлэл
• 🎯 Танд тохирох тест санал болгох
• 📊 Үр дүнгээ тайлбарлуулах

Юу асуумаар байна вэ?`,
    answer_en: `Hello! 👋

I'm the **hire.mn** AI assistant. I can help you with:

• 📋 Information about tests
• 💰 Pricing details
• 🎯 Recommending the right test for you
• 📊 Explaining your results

What would you like to know?`
  },
  {
    id: 'mindset_test',
    keywords: ['mindset', 'майндсет', 'өсөлтийн сэтгэлгээ', 'growth mindset'],
    category: 'tests',
    answer_mn: `**Өсөлтийн сэтгэлгээ (Mindset) тест** 🧠

📖 **Тухай:** Энэ тест таны сэтгэлгээний хэв маягийг (fixed vs growth) тодорхойлно.

👨‍🔬 **Зохиогч:** Hermundur Sigmundsson, Monica Haga
💰 **Үнэ:** 10,000₮
⏱️ **Хугацаа:** 10 минут

✨ **Юу мэдэх вэ:**
• Таны бэрхшээлд хандах хандлага
• Амжилтын хандлага
• Хөгжлийн боломж

Энэ тест танд тохирох уу? Дэлгэрэнгүй асууя!`,
    answer_en: `**Mindset Test** 🧠

📖 **About:** This test identifies your mindset pattern (fixed vs growth).

👨‍🔬 **Author:** Hermundur Sigmundsson, Monica Haga
💰 **Price:** 10,000₮
⏱️ **Duration:** 10 minutes

✨ **What you'll learn:**
• Your approach to challenges
• Success orientation
• Growth potential

Would this test be right for you? Let's find out!`
  },
  {
    id: 'work_life_test',
    keywords: ['ажил амьдрал', 'work life', 'тэнцвэр', 'balance', 'burnout', 'stress'],
    category: 'tests',
    answer_mn: `**Ажил-амьдрал тэнцвэр тест** ⚖️

📖 **Тухай:** Таны ажил, амьдралын тэнцвэр, стресс түвшинг хэмжинэ.

👨‍🔬 **Зохиогч:** University of Michigan, USA
💰 **Үнэ:** 20,000₮
⏱️ **Хугацаа:** 10 минут

✨ **Юу мэдэх вэ:**
• Burnout эрсдэл
• Стресс түвшин
• Сэтгэл санааны тэнцвэр
• Ажил-амьдралын зохицол

Burnout-ийг эрт илрүүлж, урьдчилан сэргийлээрэй!`,
    answer_en: `**Work-Life Balance Test** ⚖️

📖 **About:** Measures your work-life balance and stress levels.

👨‍🔬 **Author:** University of Michigan, USA
💰 **Price:** 20,000₮
⏱️ **Duration:** 10 minutes

✨ **What you'll learn:**
• Burnout risk
• Stress levels
• Emotional balance
• Work-life integration

Detect burnout early and take preventive action!`
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
