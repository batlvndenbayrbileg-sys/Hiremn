// Static company and team data - No LLM needed

export interface TeamMember {
  id: string
  name: string
  role: string
  roleColor: string
  description: string
  image: string
  category: 'founder' | 'system' | 'test'
}

export interface CompanyInfo {
  name: string
  slogan: string
  description: string
  founded: string
  testCount: number
  categories: string[]
  features: string[]
}

export const COMPANY_INFO: CompanyInfo = {
  name: "hire.mn",
  slogan: "Зөв хүн, Зөв газарт",
  description: "Hire.mn нь хувь хүний зан төлөв, чадамж, мэргэжлийн мэдлэг, ажлын байрны төрөл бүрийн үр чадварыг шалгах зориулалттай тест, өөрийн үнэлгээний цогц платформ. Энэхүү платформыг хүний нөөцийн сургалт, судалгааны Аксиом Инк компаниас санаачлан их дээд сургуулийн багш нар болон бие даасан судлаач нартай хамтран 2024 оноос хойш хөгжүүлж байна.",
  founded: "2024",
  testCount: 40,
  categories: [
    "Ажлын байрны сонгон шалгаруулалт",
    "Хувь хүний сэтгэл зүйн байдлаа таньж ойлгох",
    "Ажилтнуудын аттестатчилал",
    "Ажлын байран дээрх зан төлөв",
    "Оюутан залуучууд өөрийгөө үнэлэх",
    "Ажлын байранд өөрийгөө бэлдэх"
  ],
  features: [
    "40+ төрлийн тест",
    "Мэргэжлийн судлаачдын боловсруулсан",
    "Шинжлэх ухааны үндэслэлтэй",
    "Монгол хэл дээр",
    "Үнэгүй болон төлбөртэй тестүүд"
  ]
}

export const TEAM_MEMBERS: TeamMember[] = [
  // Founder
  {
    id: "founder-1",
    name: "Б.Нандин-Эрдэнэ",
    role: "Үүсгэн байгуулагч",
    roleColor: "#E8541A",
    description: "СЭЗИС болон Австралийн Үндэсний Их сургуульд Бизнесийн удирдлагын магистр, Маркетингийн удирдлагын магистрын зэрэг хамгаалсан. Маркетинг, хүний нөөцийн салбарт багш, зөвлөх, судлаачаар 2003 оноос хойш ажиллаж байна.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-rl1utT3lyjoDboq5m3PbYn0DGUP5ib.png",
    category: "founder"
  },
  
  // System Development Team
  {
    id: "system-1",
    name: "Н.Саранчимэг",
    role: "Системийн шинжээч",
    roleColor: "#22C55E",
    description: "СЭЗИС болон МУИС-д Мэдээллийн системийн бакалавр, магистрын зэрэг хамгаалсан. Системийн шинжилгээ, Бизнес процесс менежмент, чадамжид суурилсан боловсрол чиглэлээр багш, зөвлөх, судлаачаар 2011 оноос хойш ажиллаж байна.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4fY7Ui7iWk9EnSJMHDgZvE4i8VrmwR.png",
    category: "system"
  },
  {
    id: "system-2",
    name: "Г.Эрдэнэцэцэг",
    role: "Систем хөгжүүлэгч",
    roleColor: "#22C55E",
    description: "СЭЗИС-д Мэдээллийн системийн бакалавр, Бизнесийн удирдлагын магистрын зэрэг хамгаалсан. Програм хангамж хөгжүүлэлт, Системийн шинжилгээ, Өгөгдлийн сангийн чиглэлээр хөгжүүлэгч, багш, судлаачаар 2012 оноос хойш ажиллаж байна.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-vl9ZubXezo0mZSFGVtsKsZV9ffBJhu.png",
    category: "system"
  },
  {
    id: "system-3",
    name: "М.Доржнямбуу",
    role: "Back-end хөгжүүлэгч",
    roleColor: "#22C55E",
    description: "СЭЗИС-д Мэдээллийн системийн бакалаврын хөтөлбөр. Програм хангамжын back-end хөгжүүлэлт, Өгөгдлийн сангийн программчлалын чиглэлээр ажиллаж байна.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-K6trzOpzdyDwJjA8doMazTsdH6QiZW.png",
    category: "system"
  },
  {
    id: "system-4",
    name: "А.Өсөхбаяр",
    role: "Front-end хөгжүүлэгч",
    roleColor: "#22C55E",
    description: "СЭЗИС-д Мэдээллийн системийн бакалаврын хөтөлбөр төгссөн. Програм хангамжын front-end, UX, UI хөгжүүлэлт, өгөгдлийн шинжилгээ чиглэлээр ажиллаж байна.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Z6dZ9hCGVpslrNT4ShfdMcIv525YOE.png",
    category: "system"
  },
  
  // Test Development Team
  {
    id: "test-0",
    name: "Г.Чин-Эрдэнэ",
    role: "Тест хөгжүүлэгч",
    roleColor: "#3B82F6",
    description: "Америкийн Нэгдсэн Улсын Вашингтоны их сургуульд компьютерийн шинжлэх ухаанаар суралцаж байгаа, front-end, mobile development, backend чиглэлээр салбарын (industry) туршлагатай.",
    image: "https://hire.mn/images/team/chin-erdene.jpg",
    category: "test"
  },
  {
    id: "test-1",
    name: "Б.Үүрцайх",
    role: "Ахлах тест хөгжүүлэгч",
    roleColor: "#3B82F6",
    description: "АШУ|ИС-д Хүний их эмч мэргэжил, АНУ-ын Вашингтоны Их сургуульд Олон улсын эрүүл мэнд судлал, Нийгмийн эрүүл мэнд судлал чиглэлээр магистрын зэрэг хамгаалсан. Нийгмийн эрүүл мэнд, биостатистик, эрүүл мэндийн систем, эрүүл мэндийн их өгөгдөл, хиймэл оюун ухаан/машин сургалт зэрэг чиглэлд судлаачаар 2015 оноос хойш ажиллаж байна.",
    image: "https://hire.mn/images/team/uurtsaih.jpg",
    category: "test"
  },
  {
    id: "test-2",
    name: "С.Ишцэдэн",
    role: "Тест хөгжүүлэгч",
    roleColor: "#3B82F6",
    description: "МУИС-ийн Математикийн багш мэргэжлээр төгссөн. 1987 оноос хойш бакалаврын өдрийн хөтөлбөрийн оюутнуудын зөвлөх, хүмүүжүүлэгчээр ажиллаж байгаад гавьяаны амралтандаа гарсан. Одоо СЭЗИС болон \"Аксиом Инк\" ХХК-ийн зөвлөх багш, сургагч багшаар ажиллаж байна.",
    image: "https://hire.mn/images/team/ishtseden.jpg",
    category: "test"
  },
  {
    id: "test-3",
    name: "Ш.Эрдэнэбуян",
    role: "Тест хөгжүүлэгч",
    roleColor: "#3B82F6",
    description: "Удирдлагын Хөгжлийн Институт-д Удирдахуйн ухааны магистрын зэрэг хамгаалсан. Бүтээмж ба чанарын удирдлага, Үйлдвэрлэл үйл ажиллагааны менежмент чиглэлүүдээр дэд профессороор, багш, зөвлөх, судлаачаар 1995 оноос хойш ажиллаж байна.",
    image: "https://hire.mn/images/team/erdenbuyan.jpg",
    category: "test"
  },
  {
    id: "test-4",
    name: "О.Алтанцаг",
    role: "Төслийн зохицуулагч",
    roleColor: "#A855F7",
    description: "СЭЗИС-д Бизнесийн удирдлагын бакалаврын хөтөлбөр төгссөн. 2019 оноос хойш судлаач, зохицуулагчаар ажиллаж байна.",
    image: "https://hire.mn/images/team/altantsag.jpg",
    category: "test"
  },
  {
    id: "test-5",
    name: "Л.Золжаргал",
    role: "Тест хөгжүүлэгч",
    roleColor: "#3B82F6",
    description: "АШУУ|С-ийг Хүний их эмч мэргэжлээр, Жонс Хопкинсийн Их Сургуулийг Нийгмийн эрүүл мэндийн магистр зэрэгтэйгээр тус тус дүүргэсэн. Одоогоор Вашингтоны Их сургуульд Эрүүл мэндийн мэдээлэл зүйн чиглэлээр докторын зэрэгт суралцаж байна. 2018 оноос хойш цахим эрүүл мэнд, эрүүл мэндийн мэдээлэл зүй, өгөгдлийн шинжлэх ухааны чиглэлээр Жонс Хопкинсийн Их Сургуулийн харьяа Тооцооллын анагаах ухааны институт (Johns Hopkins Institute for Computational Medicine), Вашингтоны Их Сургуулийн Олон улсын эрүүл мэндийн тэнхимийн харьяа Эрүүл мэндийн сургалт, боловсролын олон улсын төв (International Training and Education Center for Health) зэрэг байгуулагууудад судлаачаар ажиллаж байна.",
    image: "https://hire.mn/images/team/zoljargal.jpg",
    category: "test"
  },
  {
    id: "test-6",
    name: "Ц.Тамир",
    role: "Тест хөгжүүлэгч",
    roleColor: "#3B82F6",
    description: "Японы Хижияма их сургуулийг масс коммуникейшн мэргэжлээр төгссөн. Хуурамч мэдээллийн эсрэг Монголын анхны талбар болох FactCheck.mn-ийн үүсгэн байгуулагч.",
    image: "https://hire.mn/images/team/tamir.jpg",
    category: "test"
  },
  {
    id: "test-7",
    name: "Э.Нандин-Эрдэнэ",
    role: "Тест хөгжүүлэгч",
    roleColor: "#3B82F6",
    description: "АШУУ|С-ийг Хүний эмч мэргэжлээр төгссөн, Эх барих эмэгтэйчүүд болон Нөхөн үржихүйн дотоод шүүрэл, үргүйдлийн эмчээр мэргэжил дээшлүүлсэн. Их Британи дахь Дандийгийн Их Сургуульд \"Хүний үр хөврөл судлал болон үр шилжүүлэн суулгалт\"-аар магистрын зэрэг хамгаалсан. 2017 оноос хойш CLWH үр шилжүүлэн суулгах төвд эмч, судлаачаар ажиллаж байгаа бөгөөд БНСУ, Австри, Их Британи, Ирланд зэрэг улсуудад мэргэжлийнхээ дагуу сургалт, хөтөлбөрүүдэд тогтмол хамрагдсаар байна.",
    image: "https://hire.mn/images/team/nandin-erdene-e.jpg",
    category: "test"
  },
  {
    id: "test-8",
    name: "Б.Дэлгэрсайхан",
    role: "Тест хөгжүүлэгч",
    roleColor: "#3B82F6",
    description: "СЭЗИС болон АНУ-ын Деврай Их сургуульд Нягтлан бодох бүртгэл, санхүүгийн удирдлагын магистр, докторант. Монголын мэргэшсэн нягтлан бодогч зэрэгтэй. Нягтлан бодогчдын мэргэжлийн ёс зүй, эрсдлийн удирдлага, дотоод аудит, удирдлагын бүртгэл, тогтвортой хөгжлийн тайлагнал чиглэлүүдээр багш, зөвлөх, судлаачаар 2012 оноос хойш ажиллаж байна.",
    image: "https://hire.mn/images/team/delgersaihan.jpg",
    category: "test"
  },
  {
    id: "test-9",
    name: "Т.Ганцэцэг",
    role: "Тест хөгжүүлэгч",
    roleColor: "#3B82F6",
    description: "СЭМҮТ-ийн Амбулаторийн эрхлэгч, Зөвлөх эмч. АШУУ|С, АУС, сэтгэцийн эрүүл мэндийн тэнхимийн багш, АУ-ны доктор.",
    image: "https://hire.mn/images/team/gantsetseg.jpg",
    category: "test"
  },
  {
    id: "test-10",
    name: "Б.Батгэрэл",
    role: "Тест хөгжүүлэгч",
    roleColor: "#3B82F6",
    description: "АШУУ|С-ийг хүний их эмчээр төгссөн. Сэтгэцийн эмч болон сэтгэл засалч мэргэжил эзэмшсэн. Одоогоор Япон улсын Кансай Анагаах Ухааны Их Сургуульд сэтгэц судлалын чиглэлээр докторын сургалтад суралцаж байна.",
    image: "https://hire.mn/images/team/batgerel.jpg",
    category: "test"
  },
  {
    id: "test-11",
    name: "А.Одгэрэл",
    role: "Тест хөгжүүлэгч",
    roleColor: "#3B82F6",
    description: "СЭЗИС-д Бизнесийн удирдлагын магистр зэрэг хамгаалсан. Монголын мэргэшсэн нягтлан бодогч болон Аудитор зэрэгтэй. Санхүүгийн бүртгэл, санхүүгийн дунд шатны нягтлан бодох бүртгэл, тайлагнал, Зардал, өртгийн бүртгэл, Хөндлөнгийн болон дотоод аудитын чиглэлээр багш, зөвлөх, судлаачаар 2002 оноос хойш ажиллаж байна.",
    image: "https://hire.mn/images/team/odgerel.jpg",
    category: "test"
  },
  {
    id: "test-12",
    name: "Д.Гэрэлмаа",
    role: "Тест хөгжүүлэгч",
    roleColor: "#3B82F6",
    description: "ЗХУ, Москва хотын Цахилгаан Холбооны Дээд сургуулийн магистр, Удирдлагын Академи удирдахуйн ухааны доктор зэрэгтэй. Хүний нөөц, байгууллагын зан төлөв, байгууллагын хөгжил, компаний засаглалын чиглэлээр багш, зөвлөх, судлаачаар 1992 оноос хойш ажиллаж байна.",
    image: "https://hire.mn/images/team/gerelmaa.jpg",
    category: "test"
  },
  {
    id: "test-13",
    name: "О.Зэс��мдорж",
    role: "Тест хөгжүүлэгч",
    roleColor: "#3B82F6",
    description: "АШУУИС-д Анагаах Ухааны Магистр, Японы Жичи Анагаах Ухааны Их Сургуулийн анагаах ухааны доктор зэрэгтэй.",
    image: "https://hire.mn/images/team/zesemdorj.jpg",
    category: "test"
  },
  {
    id: "test-14",
    name: "Ц.Булган",
    role: "Тест хөгжүүлэгч",
    roleColor: "#3B82F6",
    description: "СЭЗИС болон АНУ-ын Вашингтоны Их сургуульд Бизнесийн удирдлагын магистр, Боловсролын Удирдлага ба Бодлого судлалын магистрын зэрэг хамгаалсан. Байгууллагын зан төлөв, байгууллагын хөгжил, сэтгэл хөдлөлийн менежмент ба манлайлал, бүтээлч байдал ба инновац зэрэг чиглэлүүдээр багш, зөвлөх, судлаачаар 2005 оноос хойш ажиллаж байна.",
    image: "https://hire.mn/images/team/bulgan.jpg",
    category: "test"
  },
  {
    id: "test-15",
    name: "Г.Нарантунгалаг",
    role: "Тест хөгжүүлэгч",
    roleColor: "#3B82F6",
    description: "СЭЗИС-д Бизнесийн удирдлагын магистр, докторант. Байгууллагын зан төлөв, ажлын байран дахь зохисгүй зан төлөв, хүний нөөцийн стратеги, ажайл менежмент, манлайлал, төслийн удирдлага чиглэлүүдээр багш, зөвлөх, судлаачаар 2005 оноос хойш ажиллаж байна.",
    image: "https://hire.mn/images/team/narantungalag.jpg",
    category: "test"
  }
]

// Category labels
export const TEAM_CATEGORIES = {
  founder: { label: "Үүсгэн байгуулагч", icon: "🚀", color: "#E8541A" },
  system: { label: "Систем хөгжүүлэлтийн баг", icon: "💻", color: "#22C55E" },
  test: { label: "Тест хөгжүүлэлтийн баг", icon: "📝", color: "#3B82F6" }
}

// Get team by category
export function getTeamByCategory(category: 'founder' | 'system' | 'test'): TeamMember[] {
  return TEAM_MEMBERS.filter(m => m.category === category)
}

// Get all categories with members
export function getAllTeamCategories() {
  return [
    { ...TEAM_CATEGORIES.founder, members: getTeamByCategory('founder') },
    { ...TEAM_CATEGORIES.system, members: getTeamByCategory('system') },
    { ...TEAM_CATEGORIES.test, members: getTeamByCategory('test') }
  ]
}
