// lib/knowledge-base.ts — RAG Knowledge Base for hire.mn AI
// Contains comprehensive information about tests, authors, platform, and methodologies

export interface TestKnowledge {
  id: number
  name: string
  fullDescription: string
  methodology: string
  author: string
  authorBio: string
  targetAudience: string[]
  benefits: string[]
  duration: string
  questionCount: number
  scientificBasis: string
  useCases: string[]
  relatedTests: number[]
  keywords: string[]
}

export interface PlatformKnowledge {
  topic: string
  content: string
  keywords: string[]
}

// Detailed test knowledge for RAG
export const TEST_KNOWLEDGE: Record<number, TestKnowledge> = {
  1: {
    id: 1,
    name: "Өсөлтийн сэтгэлгээ (Growth Mindset)",
    fullDescription: "Кэрол Двекийн судалгаанд суурилсан энэхүү тест нь таны өсөлтийн сэтгэлгээний түвшинг тодорхойлно. Өсөлтийн сэтгэлгээтэй хүмүүс бэрхшээлийг суралцах боломж гэж хардаг бол тогтмол сэтгэлгээтэй хүмүүс чадвараа төрөлхийн, өөрчлөгдөхгүй гэж үздэг.",
    methodology: "Likert scale үнэлгээ, 20 асуулт",
    author: "Кэрол Двек (Carol Dweck)",
    authorBio: "Стэнфордын Их Сургуулийн сэтгэл зүйн профессор, 'Mindset: The New Psychology of Success' номын зохиогч. 30+ жилийн судалгааны туршлагатай.",
    targetAudience: ["Оюутан", "Ажилтан", "Удирдах ажилтан", "Хүүхэд (12+)"],
    benefits: ["Суралцах чадвараа сайжруулах", "Бэрхшээлд тэсвэртэй болох", "Амжилтын түлхүүрийг ойлгох"],
    duration: "10 минут",
    questionCount: 20,
    scientificBasis: "Implicit Theories of Intelligence судалгаа, 1988-оноос хойшхи олон улсын судалгаанууд",
    useCases: ["Суралцахдаа бэрхшээлтэй", "Өөрийгөө хөгжүүлэх", "Амжилтгүй болохоос айх", "Шинэ зүйл сурах"],
    relatedTests: [4, 7, 10],
    keywords: ["өсөлт", "growth", "сэтгэлгээ", "mindset", "suraltsah", "suralcach", "хөгжил", "development", "амжилт", "success", "двек", "dweck"]
  },
  2: {
    id: 2,
    name: "Ажил-амьдралын тэнцвэр",
    fullDescription: "Мичиганы Их Сургуулийн боловсруулсан энэхүү тест нь таны ажил ба хувийн амьдралын хоорондын тэнцвэрийг үнэлнэ. Burnout-аас урьдчилан сэргийлж, эрүүл мэндээ хамгаалахад тусална.",
    methodology: "Work-Life Balance Scale, 15 асуулт",
    author: "Мичиганы Их Сургууль",
    authorBio: "АНУ-ын тэргүүлэх судалгааны их сургуулиудын нэг, ажлын байрны сэтгэл зүйн чиглэлээр олон арван жилийн судалгааны туршлагатай.",
    targetAudience: ["Ажилтан", "Менежер", "Бизнес эрхлэгч", "Гэр бүлтэй хүмүүс"],
    benefits: ["Burnout-аас урьдчилан сэргийлэх", "Гэр бүлийн харилцаа сайжруулах", "Бүтээмжээ нэмэгдүүлэх"],
    duration: "10 минут",
    questionCount: 15,
    scientificBasis: "Work-Family Conflict theory, Maslach Burnout Inventory",
    useCases: ["Ажилдаа их цаг зарцуулах", "Гэр бүлдээ цаг гаргахгүй байх", "Ядрах", "Стресс"],
    relatedTests: [6, 8],
    keywords: ["ажил", "амьдрал", "тэнцвэр", "burnout", "стресс", "гэр бүл", "ядрал"]
  },
  3: {
    id: 3,
    name: "Харилцааны хэв шинж (DISC)",
    fullDescription: "DISC загварт суурилсан энэхүү тест нь таны харилцааны хэв шинжийг тодорхойлж, бусадтай хэрхэн илүү үр дүнтэй харилцахыг зааварчилна. D-Dominant, I-Influential, S-Steady, C-Conscientious.",
    methodology: "DISC Assessment Model, 28 асуулт",
    author: "Уильям Марстон (William Marston)",
    authorBio: "АНУ-ын сэтгэл зүйч, DISC онолын үндэслэгч, мөн худал илрүүлэгчийн зохион бүтээгч.",
    targetAudience: ["Удирдах ажилтан", "Менежер", "Борлуулагч", "HR мэргэжилтэн"],
    benefits: ["Багийн үр дүнтэй ажиллагаа", "Зөрчилдөөн шийдвэрлэх", "Манлайллын чадвар"],
    duration: "15 минут",
    questionCount: 28,
    scientificBasis: "DISC theory (1928), олон улсад өргөн хэрэглэгддэг",
    useCases: ["Багаар ажиллах", "Удирдах", "Харилцаа сайжруулах", "Зөрчилдөөн"],
    relatedTests: [11, 12],
    keywords: ["харилцаа", "disc", "манлайлал", "баг", "communication", "удирдлага"]
  },
  4: {
    id: 4,
    name: "Өөрийгөө үнэлэх (Rosenberg Self-Esteem Scale)",
    fullDescription: "Моррис Розенбергийн 1965 онд боловсруулсан, дэлхийд хамгийн өргөн хэрэглэгддэг өөрийгөө үнэлэх тест. Таны өөртөө хандах хандлага, өөрийгөө хүндэтгэх түвшинг хэмжинэ.",
    methodology: "Rosenberg Self-Esteem Scale (RSES), 10 асуулт",
    author: "Моррис Розенберг (Morris Rosenberg)",
    authorBio: "АНУ-ын нийгмийн сэтгэл зүйч, Мэрилэндийн Их Сургуулийн профессор.",
    targetAudience: ["Залуучууд", "Оюутан", "Насанд хүрэгчид"],
    benefits: ["Өөрийгөө ойлгох", "Сэтгэлийн эрүүл мэнд", "Итгэл нэмэгдүүлэх"],
    duration: "5 минут",
    questionCount: 10,
    scientificBasis: "1965 оноос хойш 50+ жилийн судалгаа, 50+ хэлнээ орчуулагдсан",
    useCases: ["Өөрийгөө үнэлэхгүй байх", "Бусадтай харьцуулах", "Итгэл дутмаг"],
    relatedTests: [7, 1],
    keywords: ["self-esteem", "өөрийгөө үнэлэх", "итгэл", "розенберг", "хүндэтгэл"]
  },
  5: {
    id: 5,
    name: "Никотин хамаарал (Fagerström Test)",
    fullDescription: "Карл-Олоф Фагерстромын боловсруулсан олон улсын стандарт тест. Тамхины хамаарлын түвшинг тодорхойлж, тамхинаас гарах стратегийг төлөвлөхөд тусална.",
    methodology: "Fagerström Test for Nicotine Dependence (FTND), 6 асуулт",
    author: "Карл-Олоф Фагерстром (Karl-Olov Fagerström)",
    authorBio: "Шведийн сэтгэл зүйч, тамхины донтолтын судалгааны тэргүүлэх мэргэжилтэн.",
    targetAudience: ["Тамхичин", "Тамхинаас гарах хүсэлтэй хүмүүс"],
    benefits: ["Хамаарлын түвшин мэдэх", "Гарах стратеги төлөвлөх", "Эмчилгээ сонгох"],
    duration: "5 минут",
    questionCount: 6,
    scientificBasis: "WHO болон олон улсын эрүүл мэндийн байгууллагуудын зөвлөмж",
    useCases: ["Тамхи татах", "Тамхинаас гарах", "Никотин хамаарал"],
    relatedTests: [99],
    keywords: ["тамхи", "никотин", "хамаарал", "донтолт", "fagerström", "эрүүл мэнд"]
  },
  6: {
    id: 6,
    name: "СЭМУТ урьдчилан сэргийлэх шалгаруулалт",
    fullDescription: "Сэтгэцийн Эрүүл Мэндийн Үндэсний Төвийн боловсруулсан Монголд зориулсан шалгаруулалт. Депресс, түгшүүр, стрессийн түвшинг үнэлж, эрт илрүүлэхэд тусална.",
    methodology: "DASS-21 болон PHQ-9 дээр суурилсан, 25 асуулт",
    author: "СЭМҮТ (Сэтгэцийн Эрүүл Мэндийн Үндэсний Төв)",
    authorBio: "Монгол Улсын сэтгэцийн эрүүл мэндийн тэргүүлэх байгууллага, 2002 оноос үйл ажиллагаа явуулж байна.",
    targetAudience: ["Бүх насны хүмүүс", "Стресстэй хүмүүс", "Сэтгэлийн дарамттай хүмүүс"],
    benefits: ["Эрт илрүүлэлт", "Мэргэжлийн тусламж авах", "Урьдчилан сэргийлэх"],
    duration: "25 минут",
    questionCount: 25,
    scientificBasis: "DSM-5, ICD-11 стандарт, Монголын нөхцөлд тохируулсан",
    useCases: ["Депресс", "Түгшүүр", "Стресс", "Сэтгэл санаа муу", "Уйтгар гуниг", "Сэтгэл гутрал", "Амиа хорлох бодол", "Амьдрахаас залхах", "Цөхрөл, найдваргүй байдал", "Байнга гуниглах"],
    relatedTests: [8, 4],
    keywords: ["сэмүт", "сэтгэц", "депресс", "депрессия", "depression", "сэтгэл гутрал", "түгшүүр", "mental health", "стресс", "гуниг", "уйтгар", "цөхрөл", "найдваргүй", "амиа хорлох", "суицид", "suicide", "phq", "dass"]
  },
  7: {
    id: 7,
    name: "Өөртөө итгэх итгэл",
    fullDescription: "Өөртөө итгэх итгэлийн түвшинг хэмжих стандартчилсан тест. Нийгмийн болон мэргэжлийн амьдралд өөртөө итгэлтэй байх чадварыг үнэлнэ.",
    methodology: "Self-Confidence Inventory, 15 асуулт",
    author: "Сэтгэл зүйн судалгааны баг",
    authorBio: "Олон улсын сэтгэл зүйчдийн хамтарсан судалгааны үр дүн.",
    targetAudience: ["Оюутан", "Ажилтан", "Илтгэл тавьдаг хүмүүс"],
    benefits: ["Итгэлийн түвшин мэдэх", "Сул талаа илрүүлэх", "Хөгжүүлэх чиглэл"],
    duration: "10 минут",
    questionCount: 15,
    scientificBasis: "Social Cognitive Theory, Bandura-ийн Self-Efficacy онол",
    useCases: ["Өөртөө итгэлгүй", "Ичимхий", "Олны өмнө ярих", "Шийдвэр гаргах"],
    relatedTests: [4, 1],
    keywords: ["итгэл", "өөртөө итгэх", "confidence", "ичих", "илтгэл"]
  },
  8: {
    id: 8,
    name: "Түгшүүрийн үнэлгээ (GAD-7)",
    fullDescription: "Generalized Anxiety Disorder 7 (GAD-7) тест нь түгшүүрийн эмгэгийн түвшинг хэмжих олон улсад хүлээн зөвшөөрөгдсөн арга хэрэгсэл.",
    methodology: "GAD-7 Scale, 7 асуулт",
    author: "Спитцер, Кроенке, Уильямс нар",
    authorBio: "АНУ-ын сэтгэл зүй, сэтгэц эмнэлгийн тэргүүлэх судлаачид.",
    targetAudience: ["Түгшүүртэй хүмүүс", "Санаа зовнилтой хүмүүс"],
    benefits: ["Түгшүүрийн түвшин мэдэх", "Эмчилгээ шаардлагатай эсэх", "Хяналт"],
    duration: "5 минут",
    questionCount: 7,
    scientificBasis: "2006 онд нийтлэгдсэн, олон улсад баталгаажсан",
    useCases: ["Санаа зовнил", "Түгшүүр", "Panic attack", "Нойргүйдэл", "Байнга айх, сандрах", "Тайван бус байдал"],
    relatedTests: [6, 2],
    keywords: ["түгшүүр", "anxiety", "санаа зовнил", "gad", "panic", "сандрал", "айдас", "болгоомжлол", "нойргүйдэл", "тайван бус"]
  },
  10: {
    id: 10,
    name: "Тэсвэр тэвчээр (Grit Scale)",
    fullDescription: "Анжела Дакворт-ын боловсруулсан Grit Scale нь урт хугацааны зорилгод хүрэх тэсвэр тэвчээр, хүсэл эрмэлзлийг хэмжинэ. Амжилтын чухал хүчин зүйл.",
    methodology: "Grit Scale, 12 асуулт",
    author: "Анжела Дакворт (Angela Duckworth)",
    authorBio: "Пенсильваний Их Сургуулийн профессор, 'Grit: The Power of Passion and Perseverance' номын зохиогч, MacArthur Fellowship шагналт.",
    targetAudience: ["Оюутан", "Спортын тамирчин", "Бизнес эрхлэгч"],
    benefits: ["Амжилтын урьдчилсан үнэлгээ", "Тууштай байдлаа мэдэх", "Хөгжүүлэх чиглэл"],
    duration: "10 минут",
    questionCount: 12,
    scientificBasis: "2007 оноос хойшхи судалгаа, TED Talk 25+ сая үзэлттэй",
    useCases: ["Зорилгодоо хүрэхгүй", "Амархан бууж өгөх", "Тууштай байх"],
    relatedTests: [1, 11],
    keywords: ["grit", "тэсвэр", "тэвчээр", "тууштай", "зорилго", "амжилт"]
  },
  11: {
    id: 11,
    name: "Ёс зүйн манлайлал",
    fullDescription: "Удирдах ажилтнуудын ёс зүйн манлайллын чадварыг үнэлэх тест. Шударга, ил тод, хариуцлагатай удирдлагын зарчмуудыг хэмжинэ.",
    methodology: "Ethical Leadership Scale, 20 асуулт",
    author: "Браун, Тревиньо нар",
    authorBio: "Бизнесийн ёс зүй, байгууллагын зан төлөвийн судлаачид.",
    targetAudience: ["Удирдах ажилтан", "Менежер", "HR"],
    benefits: ["Ёс зүйн манлайллын түвшин", "Сул талаа илрүүлэх", "Хөгжүүлэх чиглэл"],
    duration: "15 минут",
    questionCount: 20,
    scientificBasis: "Ethical Leadership Scale (2005), олон судалгаагаар баталгаажсан",
    useCases: ["Удирдах", "Шийдвэр гаргах", "Ёс зүйн асуудал", "Баг удирдах"],
    relatedTests: [3, 12],
    keywords: ["ёс зүй", "манлайлал", "удирдлага", "leadership", "ethics", "шударга"]
  },
  12: {
    id: 12,
    name: "16 хэв шинж (MBTI загвар)",
    fullDescription: "Карл Юнгийн онолд суурилсан 16 хэв шинжийн тест. Introvert/Extravert, Sensing/Intuition, Thinking/Feeling, Judging/Perceiving хэмжигдэхүүнүүдээр таны хувь хүний типийг тодорхойлно.",
    methodology: "Myers-Briggs Type Indicator загвар, 60 асуулт",
    author: "Изабел Майерс, Кэтрин Бриггс",
    authorBio: "Карл Юнгийн онолыг практикт нэвтрүүлсэн АНУ-ын судлаачид.",
    targetAudience: ["Бүх насны хүмүүс", "Карьер төлөвлөгч", "Хосууд"],
    benefits: ["Өөрийгөө ойлгох", "Карьер сонголт", "Харилцаа сайжруулах"],
    duration: "20 минут",
    questionCount: 60,
    scientificBasis: "Юнгийн сэтгэл зүйн онол (1921), 70+ жилийн хэрэглээ",
    useCases: ["Өөрийгөө ойлгох", "MBTI", "Карьер сонголт", "Хамтрагч ойлгох"],
    relatedTests: [3, 11],
    keywords: ["mbti", "16 хэв шинж", "юнг", "introvert", "extravert", "personality"]
  },
  99: {
    id: 99,
    name: "AUDIT тест (Архины хэрэглээ)",
    fullDescription: "Дэлхийн Эрүүл Мэндийн Байгууллагын боловсруулсан AUDIT (Alcohol Use Disorders Identification Test) нь архины хэрэглээний эрсдэлийг илрүүлэх олон улсын стандарт арга хэрэгсэл.",
    methodology: "AUDIT Scale, 10 асуулт",
    author: "Дэлхийн Эрүүл Мэндийн Байгууллага (WHO)",
    authorBio: "НҮБ-ын дэргэдэх олон улсын эрүүл мэндийн байгууллага, 1948 оноос үйл ажиллагаа явуулж байна.",
    targetAudience: ["Архи хэрэглэдэг хүмүүс", "Эрүүл мэндийн ажилтан"],
    benefits: ["Эрсдэлийн түвшин мэдэх", "Эрт илрүүлэлт", "Зөвлөмж авах"],
    duration: "5 минут",
    questionCount: 10,
    scientificBasis: "WHO-гоос 1982 онд боловсруулсан, 40+ хэлнээ орчуулагдсан",
    useCases: ["Архи ууж байгаа", "Архинд донтох эрсдэл", "Эрүүл мэндийн үзлэг"],
    relatedTests: [5, 6],
    keywords: ["audit", "архи", "alcohol", "донтолт", "who", "эрүүл мэнд"]
  }
}

// Platform knowledge for FAQ and general questions
export const PLATFORM_KNOWLEDGE: PlatformKnowledge[] = [
  {
    topic: "hire.mn тухай",
    content: `hire.mn бол Монголын анхны сэтгэл зүй, зан төлөв, мэргэжлийн чадварын үнэлгээний платформ. 
    
Үндсэн мэдээлэл:
- Байгуулагдсан: 2020 он
- Уриа: "Зөв хүн, зөв газарт"
- Тестийн тоо: 40+ төрлийн мэргэжлийн тест
- Хэрэглэгчид: 50,000+ бүртгэлтэй хэрэглэгч
- Байгууллагууд: 200+ компани хамтран ажилладаг

Үйлчилгээ:
1. Хувь хүний үнэлгээ - Өөрийгөө таних, хөгжүүлэх
2. Ажил горилогчийн үнэлгээ - Ажилд орохын өмнөх шалгаруулалт
3. Байгууллагын үнэлгээ - Ажилтны чадварын үнэлгээ
4. Сэтгэл зүйн зөвлөгөө - Мэргэжилтнүүдийн зөвлөмж`,
    keywords: ["hire.mn", "платформ", "тухай", "компани", "байгууллага", "үйлчилгээ"]
  },
  {
    topic: "Тестийн төрлүүд",
    content: `hire.mn дээр дараах төрлийн тестүүд байдаг:

1. ХУВЬ ХҮНИЙ ХЭВ ШИНЖ (Personality)
- 16 хэв шинж (MBTI)
- Өсөлтийн сэтгэлгээ
- Өөрийгөө үнэлэх
- Тэсвэр тэвчээр (Grit)

2. ЭРҮҮЛ МЭНД (Health)
- СЭМУТ шалгаруулалт
- Түгшүүрийн үнэлгээ
- AUDIT тест
- Никотин хамаарал

3. ЗАН ТӨЛӨВ (Behavior)
- Харилцааны хэв шинж (DISC)
- Ёс зүйн манлайлал
- Ажил-амьдралын тэнцвэр

4. МЭРГЭЖЛИЙН ЧАДВАР
- Англи хэлний түвшин
- Логик сэтгэлгээ
- Тоон боловсруулалт`,
    keywords: ["тест", "төрөл", "категори", "personality", "health", "behavior"]
  },
  {
    topic: "Үнэ төлбөр",
    content: `hire.mn-ийн тестүүд дараах үнэтэй:

ҮНЭГҮЙ ТЕСТҮҮД:
- AUDIT тест (Архины хэрэглээ)
- Никотин хамаарал
- СЭМУТ урьдчилан сэргийлэх
- Өөртөө итгэх итгэл
- Түгшүүрийн үнэлгээ
- Өөрийгөө үнэлэх (RSES)
+ бусад олон үнэгүй тестүүд

ТӨЛБӨРТЭЙ ТЕСТҮҮД:
- 10,000₮ - 50,000₮ хооронд
- Өсөлтийн сэтгэлгээ: 10,000₮
- Ажил-амьдралын тэнцвэр: 20,000₮
- 16 хэв шинж: 20,000₮
- Харилцааны хэв шинж: 30,000₮

ТӨЛБӨРИЙН АРГА:

ХУВЬ ХҮНД:
- QPay ашиглан өөрийн ашигладаг банкны апп-аар төлөх боломжтой
- Төлбөр шилжсэний дараа тестийг эхлүүлэх цонх нээгдэнэ

БАЙГУУЛЛАГАД:
- Байгууллагаас таныг тестэнд оролцохоор урьсан бол таны бүртгэлтэй имэйл хаяг тестийн линк очно
- Төлбөр нь байгууллагын хэтэвчнээс хасагдана`,
    keywords: ["үнэ", "төлбөр", "үнэгүй", "free", "paid", "төлбөртэй", "qpay", "байгууллага", "хувь хүн"]
  },
  {
    topic: "Тест сонгох заавар",
    content: `ТЕСТ, ӨӨРИЙН ҮНЭЛГЭЭГЭЭ ХЭРХЭН СОНГОХ ВЭ?

Төрөл бүрийн тест болон өөрийн үнэлгээнүүдээс сонгохдоо:
1. Өөрийн сонирхож буй тестийн дэлгэрэнгүй гэсэн товч дээр дарна
2. Тестийн товч тайлбар, хэмжих зүйлс, хэрэглээг унших
3. "Тест авах" товч дарна

Мөн түүнчлэн тухайн тестийн үр дүнд хүлээн авах жишиг тайлантай урьдчилан танилцаж болно.`,
    keywords: ["сонгох", "хэрхэн", "заавар", "үнэлгээ"]
  },
  {
    topic: "Бүх тестүүд төлбөртэй юу",
    content: `БҮХ ТЕСТҮҮД ТӨЛБӨРТЭЙ ЮУ?

Үгүй. Тест бүрийн айкон зургийн зүүн доод хэсэгт тухайн тест, өөрийн үнэлгээний төлбөрийн дүн эсвэл төлбөргүй гэсэн тэмдэглэл байгаа.

Мөн түүнчлэн та тестийн шүүлтүүр хэсэг рүү орж төлбөргүй гэсэн сонголтыг дарвал Hire.mn-с санал болгож төлбөргүй тестүүдийг харах боломжтой.`,
    keywords: ["төлбөртэй", "үнэгүй", "бүх тест", "төлбөргүй"]
  },
  {
    topic: "Тестийн асуумжид хариулах",
    content: `ХЭРХЭН ТЕСТ, ӨӨРИЙН ҮНЭЛГЭЭНИЙ АСУУМЖИД ХАРИУЛАХ ВЭ?

Таны сонгосон тест, өөрийн үнэлгээний төрлөөс хамаарах заавар тестийг эхлүүлэх гэсэн товчыг дарсны дараа нэмэлт цонхоор харагдах болно.

Та тус заавартай сайтар танилцсаны дараа ойлголоо гэсэн товчыг дарснаар тест эхлэх болно.

Мөн түүнчлэн тестэнд хариулж байх явцад зааврыг зүүн хэсэгт байгаа асуумжид хариулах заавар гэсэн товчийг дарж харах боломжтой.`,
    keywords: ["хариулах", "асуумж", "заавар", "хэрхэн"]
  },
  {
    topic: "Тест өгөх заавар",
    content: `Тест өгөх алхамууд:

1. БҮРТГҮҮЛЭХ
- hire.mn сайтад орно
- Утасны дугаар эсвэл и-мэйлээр бүртгүүлнэ
- Код баталгаажуулна

2. ТЕСТ СОНГОХ
- Категориор шүүж харах
- Тестийн дэлгэрэнгүй мэдээлэл унших
- "Тест авах" товч дарах

3. ТЕСТ ӨГӨХ
- Асуултуудад үнэнч хариулах
- Цагийн хязгаар байхгүй (ихэнх тестэнд)
- Бүх асуултад хариулах

4. ҮР ДҮН АВАХ
- Шууд үр дүн харах
- PDF татаж авах боломжтой
- Код-оор дахин харах боломжтой`,
    keywords: ["заавар", "хэрхэн", "өгөх", "бүртгүүлэх", "алхам", "guide"]
  },
  {
    topic: "Үр дүнгийн код",
    content: `Тест өгсний дараа танд 6-12 тэмдэгтийн КОД өгөгдөнө.

КОД-ын хэрэглээ:
- Үр дүнгээ дахин харах
- Байгууллагад илгээх
- Хэвлэж авах

КОД-оо хаанаас олох:
- Тест өгсний дараа дэлгэцэнд
- И-мэйлээр илгээгдэнэ
- Миний тестүүд хэсэгт

АНХААР:
- Код хадгалж авах хэрэгтэй
- Бусдад өгөхгүй байх
- Нэг удаагийн үр дүн`,
    keywords: ["код", "code", "үр дүн", "result", "хаанаас", "олох"]
  },
  {
    topic: "Байгууллагуудад зориулсан",
    content: `Байгууллагуудад зориулсан үйлчилгээ:

1. АЖИЛ ГОРИЛОГЧИЙН ШАЛГАРУУЛАЛТ
- Олон хүнийг нэг дор шалгах
- Тайлан автоматаар үүсэх
- Харьцуулах боломж

2. АЖИЛТНЫ ҮНЭЛГЭЭ
- Чадварын үнэлгээ
- 360 градусын үнэлгээ
- Манлайллын үнэлгээ

3. БАГИЙН ҮНЭЛГЭЭ
- Багийн динамик
- Харилцааны хэв шинж
- Багийн сул/давуу тал

ХОЛБОО БАРИХ:
- И-мэйл: b2b@hire.mn
- Утас: 7000-0000`,
    keywords: ["байгууллага", "компани", "ажил олгогч", "b2b", "enterprise", "багц"]
  },
  {
    topic: "Нэвтрэх ба нууц үг сэргээх",
    content: `НЭВТРЭХ:
- hire.mn сайтад бүртгэлтэй и-мэйл эсвэл утасны дугаар, нууц үгээрээ нэвтэрнэ.

НУУЦ ҮГ СЭРГЭЭХ:
- "Нууц үг сэргээх" хэсгээр орж, бүртгэлтэй И-МЭЙЛ хаягаа оруулна.
- Таны и-мэйл хаяг руу баталгаажуулах код илгээгдэнэ. Кодоо оруулж, шинэ нууц үгээ тохируулна.
- ⚠️ Нууц үгийг ЗӨВХӨН и-мэйл хаягаар сэргээнэ. Утасны дугаараар нууц үг сэргээх боломжгүй.

АНХААР: Дээрх функцийн нэр, урсгалыг яг байгаагаар нь ашигла. Товч, функцийн нэрийг өөрөө зохиож нэрлэхгүй.`,
    keywords: ["нэвтрэх", "login", "нууц үг", "нууц үг сэргээх", "мартсан", "password", "и-мэйл", "код"]
  }
]

// Semantic search function for RAG
export function searchKnowledge(query: string): { tests: TestKnowledge[], platform: PlatformKnowledge[] } {
  const queryLower = query.toLowerCase()
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2)
  
  // Search tests
  const testResults: { test: TestKnowledge, score: number }[] = []
  for (const test of Object.values(TEST_KNOWLEDGE)) {
    let score = 0
    
    // Check keywords
    for (const keyword of test.keywords) {
      if (queryLower.includes(keyword)) score += 3
      for (const word of queryWords) {
        if (keyword.includes(word) || word.includes(keyword)) score += 1
      }
    }
    
    // Check use cases
    for (const useCase of test.useCases) {
      if (queryLower.includes(useCase.toLowerCase())) score += 2
      for (const word of queryWords) {
        if (useCase.toLowerCase().includes(word)) score += 1
      }
    }
    
    // Check name and description
    if (queryLower.includes(test.name.toLowerCase())) score += 5
    if (test.fullDescription.toLowerCase().includes(queryLower)) score += 2
    
    if (score > 0) {
      testResults.push({ test, score })
    }
  }
  
  // Search platform knowledge
  const platformResults: { platform: PlatformKnowledge, score: number }[] = []
  for (const platform of PLATFORM_KNOWLEDGE) {
    let score = 0
    
    for (const keyword of platform.keywords) {
      if (queryLower.includes(keyword)) score += 3
      for (const word of queryWords) {
        if (keyword.includes(word) || word.includes(keyword)) score += 1
      }
    }
    
    if (platform.content.toLowerCase().includes(queryLower)) score += 2
    if (queryLower.includes(platform.topic.toLowerCase())) score += 5
    
    if (score > 0) {
      platformResults.push({ platform, score })
    }
  }
  
  // Sort by score and return top results
  testResults.sort((a, b) => b.score - a.score)
  platformResults.sort((a, b) => b.score - a.score)
  
  return {
    tests: testResults.slice(0, 5).map(r => r.test),
    platform: platformResults.slice(0, 3).map(r => r.platform)
  }
}

// Get test by ID with full knowledge
export function getTestKnowledge(id: number): TestKnowledge | undefined {
  return TEST_KNOWLEDGE[id]
}

// Get related tests
export function getRelatedTests(id: number): TestKnowledge[] {
  const test = TEST_KNOWLEDGE[id]
  if (!test) return []
  return test.relatedTests
    .map(relatedId => TEST_KNOWLEDGE[relatedId])
    .filter(Boolean)
}

// Format test knowledge for LLM context
export function formatTestKnowledgeForLLM(tests: TestKnowledge[]): string {
  return tests.map(t => `
[TEST:${t.id}] ${t.name}
Тайлбар: ${t.fullDescription}
Зохиогч: ${t.author} - ${t.authorBio}
Арга зүй: ${t.methodology}
Хугацаа: ${t.duration} (${t.questionCount} асуулт)
Шинжлэх ухааны үндэс: ${t.scientificBasis}
Тохирох асуудлууд: ${t.useCases.join(', ')}
`).join('\n---\n')
}

// Format platform knowledge for LLM context
export function formatPlatformKnowledgeForLLM(platforms: PlatformKnowledge[]): string {
  return platforms.map(p => `
## ${p.topic}
${p.content}
`).join('\n---\n')
}
