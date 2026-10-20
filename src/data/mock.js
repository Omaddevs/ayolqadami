export const CATEGORIES = [
  { id: 'office', name: 'Ofis ishlari', short: 'Ofis', icon: 'folder' },
  { id: 'edu', name: "Ta'lim va pedagogika", short: "Ta'lim", icon: 'gradcap' },
  { id: 'med', name: "Tibbiyot va sog'liqni saqlash", short: 'Tibbiyot', icon: 'stethoscope' },
  { id: 'nanny', name: 'Enaga va bola parvarishi', short: 'Enaga', icon: 'bottle' },
  { id: 'housekeeper', name: 'Uy xizmatchisi', short: 'Uy xizmatchisi', icon: 'house' },
  { id: 'cleaning', name: 'Tozalik xodimi', short: 'Tozalik', icon: 'spray' },
  { id: 'cook', name: 'Oshpaz (uy va oshxona)', short: 'Oshpaz', icon: 'pot' },
  { id: 'caregiver', name: 'Keksalar va bemorlar parvarishi', short: 'Parvarishchi', icon: 'heart' },
  { id: 'sales', name: 'Savdo va mijozlar bilan ishlash', short: 'Savdo', icon: 'bag' },
  { id: 'beauty', name: "Go'zallik va parvarish", short: "Go'zallik", icon: 'lipstick' },
  { id: 'it', name: 'IT va dizayn', short: 'IT va dizayn', icon: 'laptop' },
  { id: 'home', name: 'Maishiy xizmatlar', short: 'Maishiy xizmat', icon: 'building' },
  { id: 'remote', name: 'Masofaviy ish', short: 'Masofaviy', icon: 'woman' },
  { id: 'production', name: 'Ishlab chiqarish', short: 'Ishlab chiqarish', icon: 'spool' },
  { id: 'food', name: 'Restoran va mehmonxona', short: 'Restoran', icon: 'cloche' },
  { id: 'marketing', name: 'Marketing va media', short: 'Marketing', icon: 'target' },
  { id: 'finance', name: 'Moliya va buxgalteriya', short: 'Moliya', icon: 'coins' },
  { id: 'law', name: 'Huquq va yuridik', short: 'Huquq', icon: 'books' },
  { id: 'logistics', name: 'Logistika va transport', short: 'Logistika', icon: 'briefcase' },
  { id: 'other', name: 'Boshqa toifalar', short: 'Boshqa', icon: 'sparkle' },
]

export const CITIES = [
  'Toshkent', 'Samarqand', 'Buxoro', 'Andijon', "Farg'ona", 'Namangan', 'Navoiy', 'Qarshi', 'Nukus', 'Urganch', 'Jizzax', 'Guliston', 'Termiz',
]

export const JOB_TYPES = ["To'liq stavka", 'Yarim stavka', 'Masofaviy', 'Gibrid']

// eski saqlangan ma'lumotlardagi soha id'lari yangi ro'yxatga moslanadi
const LEGACY_CAT = { sew: 'production', design: 'it' }
const findCat = (id) => CATEGORIES.find((c) => c.id === (LEGACY_CAT[id] || id))
export const catName = (id) => findCat(id)?.name || id
export const catShort = (id) => findCat(id)?.short || catName(id)
export const catIcon = (id) => findCat(id)?.icon || 'briefcase'

export const formatSum = (n) => n.toLocaleString('ru-RU').replace(/,/g, ' ')
export const salaryText = (j) =>
  j.salaryFrom && j.salaryTo
    ? `${formatSum(j.salaryFrom)} – ${formatSum(j.salaryTo)} so'm`
    : j.salaryFrom ? `${formatSum(j.salaryFrom)} so'mdan` : 'Kelishilgan holda'

const BASE_JOBS = [
  {
    id: 'j1', title: 'Frontend dasturchi (React)', company: 'NurTech', color: '#6366F6', category: 'it',
    city: 'Toshkent', salaryFrom: 9000000, salaryTo: 15000000, type: 'Gibrid', experience: 2,
    tags: ['Moslashuvchan grafik', 'Onalar uchun qulay'], posted: '2 soat oldin', applicants: 24,
    skills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'Git'],
    description: "NurTech jamoasi mahsulotimiz veb-interfeysini rivojlantirish uchun frontend dasturchi qidirmoqda. Haftada 2 kun ofisda, qolgan kunlar uydan ishlash mumkin.",
    requirements: ["React bilan kamida 2 yillik tajriba", 'TypeScript va zamonaviy CSS bilimi', "REST API bilan ishlash ko'nikmasi"],
    conditions: ["Gibrid format: 3 kun uydan", "Bolalar kasal bo'lganda qo'shimcha masofaviy kunlar", "Yillik bonus va o'qish uchun kompensatsiya"],
  },
  {
    id: 'j2', title: 'Bosh buxgalter', company: 'Raqamli Moliya', color: '#F59E0B', category: 'finance',
    city: 'Toshkent', salaryFrom: 8000000, salaryTo: 11000000, type: "To'liq stavka", experience: 3,
    tags: ['Rasmiy ishga joylash'], posted: '5 soat oldin', applicants: 41,
    skills: ['1C', 'Buxgalteriya', 'Soliq hisoboti', 'Excel'],
    description: "Kompaniyamizning moliyaviy hisobini yuritish va soliq hisobotlarini tayyorlash uchun tajribali bosh buxgalter kerak.",
    requirements: ['1C:Buxgalteriya bilan 3+ yil tajriba', "O'zbekiston soliq qonunchiligini bilish", "Excel'da ilg'or daraja"],
    conditions: ['09:00 – 18:00, dushanba – juma', 'Tushlik va transport kompensatsiyasi', 'Ijtimoiy paket'],
  },
  {
    id: 'j3', title: 'Hamshira (kunduzgi smena)', company: 'Zarafshon Med', color: '#10B981', category: 'med',
    city: 'Samarqand', salaryFrom: 5000000, salaryTo: 7000000, type: "To'liq stavka", experience: 1,
    tags: ['Faqat kunduzgi smena', 'Onalar uchun qulay'], posted: 'Kecha', applicants: 12,
    skills: ['Hamshiralik', 'Birinchi yordam', 'Bemor parvarishi'],
    description: "Xususiy klinikamizning terapiya bo'limiga mehribon va mas'uliyatli hamshira taklif qilamiz. Tungi navbatchilik yo'q.",
    requirements: ["O'rta tibbiy ma'lumot", 'Hamshiralik sertifikati', 'Kamida 1 yil tajriba'],
    conditions: ['Faqat kunduzgi smena 08:00 – 17:00', 'Bepul tibbiy xizmat oila uchun', 'Malaka oshirish kurslari'],
  },
  {
    id: 'j4', title: "Ingliz tili o'qituvchisi", company: 'Bilim Markazi', color: '#EF4444', category: 'edu',
    city: 'Toshkent', salaryFrom: 6000000, salaryTo: 10000000, type: 'Yarim stavka', experience: 1,
    tags: ['Yarim kun', 'Moslashuvchan grafik'], posted: 'Kecha', applicants: 33,
    skills: ['Ingliz tili', 'IELTS', "O'qitish metodikasi"],
    description: "Bolalar va kattalar guruhlari uchun ingliz tili o'qituvchisi kerak. Darslar jadvalini o'zingiz tanlaysiz.",
    requirements: ['IELTS 7.0 yoki undan yuqori', "O'qitish tajribasi afzallik", 'Bolalar bilan ishlashni yoqtirish'],
    conditions: ["Haftada 12–20 soat", "Darslarni o'zingiz rejalashtirasiz", "Natijaga qarab bonus"],
  },
  {
    id: 'j5', title: 'Tikuvchi-bichuvchi', company: 'Gulnor Textile', color: '#8B5CF6', category: 'production',
    city: "Farg'ona", salaryFrom: 4000000, salaryTo: 7000000, type: "To'liq stavka", experience: 0,
    tags: ["Tajribasiz qabul", "O'qitib olamiz"], posted: '2 kun oldin', applicants: 18,
    skills: ['Tikuvchilik', 'Bichish', 'Overlok'],
    description: "Ayollar kiyimlari ishlab chiqaruvchi tikuv sexiga tikuvchilar kerak. Tajribasizlarni 1 oy davomida bepul o'qitamiz.",
    requirements: ["Tikuv mashinasida ishlash istagi", 'Ehtiyotkorlik va sabr'],
    conditions: ['Ishbay + belgilangan oylik', 'Bepul tushlik', 'Bolalar bog\'chasi to\'lovi uchun yordam'],
  },
  {
    id: 'j6', title: 'SMM menejer', company: 'Orzu Beauty', color: '#EC4899', category: 'sales',
    city: 'Toshkent', salaryFrom: 5000000, salaryTo: 8000000, type: 'Masofaviy', experience: 1,
    tags: ['100% masofaviy', 'Onalar uchun qulay'], posted: '3 kun oldin', applicants: 57,
    skills: ['SMM', 'Instagram', 'Kontent', 'Canva', 'Target reklama'],
    description: "Go'zallik saloni brendimiz uchun ijtimoiy tarmoqlarni yurituvchi SMM menejer qidirmoqdamiz. To'liq uydan ishlash.",
    requirements: ['Instagram va Telegram bilan ishlash tajribasi', 'Kontent-reja tuzish', 'Target reklama asoslari'],
    conditions: ['Uydan ishlash', 'Moslashuvchan ish vaqti', 'KPI bonuslari'],
  },
  {
    id: 'j7', title: 'UI/UX dizayner', company: 'Samo Design', color: '#14B8A6', category: 'it',
    city: 'Toshkent', salaryFrom: 10000000, salaryTo: 16000000, type: 'Masofaviy', experience: 2,
    tags: ['100% masofaviy'], posted: '4 kun oldin', applicants: 29,
    skills: ['Figma', 'UI dizayn', 'UX tadqiqot', 'Prototiplash'],
    description: "Mobil va veb ilovalar uchun interfeyslar loyihalovchi dizayner kerak. Xalqaro mijozlar bilan ishlash.",
    requirements: ['Figma bilan 2+ yil tajriba', 'Portfolio', "Ingliz tili — o'rta daraja"],
    conditions: ['Masofaviy ish', "Zamonaviy texnika beriladi", 'Konferensiyalar uchun budjet'],
  },
  {
    id: 'j8', title: 'Kosmetolog', company: 'Orzu Beauty', color: '#EC4899', category: 'beauty',
    city: 'Buxoro', salaryFrom: 6000000, salaryTo: 12000000, type: "To'liq stavka", experience: 2,
    tags: ['Foizli ish haqi'], posted: '5 kun oldin', applicants: 9,
    skills: ['Kosmetologiya', 'Yuz parvarishi', 'Mijozlar bilan ishlash'],
    description: "Yangi ochilgan go'zallik salonimizga tajribali kosmetolog taklif qilamiz.",
    requirements: ['Kosmetologiya sertifikati', 'Kamida 2 yil tajriba'],
    conditions: ['Foiz + belgilangan oylik', 'Zamonaviy uskunalar', "Malaka oshirish xorijda"],
  },
  {
    id: 'j9', title: "Sotuv bo'yicha menejer", company: "Ipak Yo'li Savdo", color: '#3B82F6', category: 'sales',
    city: 'Andijon', salaryFrom: 4500000, salaryTo: 9000000, type: "To'liq stavka", experience: 0,
    tags: ["Tajribasiz qabul", 'Bonuslar'], posted: '1 hafta oldin', applicants: 22,
    skills: ['Sotuv', 'Muloqot', 'CRM', 'Telefon orqali sotuv'],
    description: "Uy-ro'zg'or buyumlari do'konlari tarmog'i sotuv menejerlarini ishga oladi.",
    requirements: ["Muloqotga kirishuvchanlik", 'Kompyuter savodxonligi'],
    conditions: ['Oylik + sotuvdan foiz', "Bepul o'qitish", "Martaba o'sishi"],
  },
  {
    id: 'j10', title: 'Python dasturchi (Junior)', company: 'NurTech', color: '#6366F6', category: 'it',
    city: 'Samarqand', salaryFrom: 6000000, salaryTo: 9000000, type: 'Masofaviy', experience: 0,
    tags: ['Junior', "Mentor bilan ishlash"], posted: '1 hafta oldin', applicants: 64,
    skills: ['Python', 'Django', 'SQL', 'Git'],
    description: "Dasturlash kursini tugatgan ayollar uchun stajirovkadan keyin doimiy ishga o'tish imkoniyati.",
    requirements: ["Python asoslari", "SQL bo'yicha boshlang'ich bilim", "O'rganishga ishtiyoq"],
    conditions: ['Shaxsiy mentor', 'Masofaviy ish', '3 oydan keyin oylik oshiriladi'],
  },
]

/* Demo vakansiyalar — sahifalashni ko'rsatish uchun ixcham ko'rinishda */
const CAT_TEXT = {
  it: { req: ["Sohada amaliy tajriba yoki portfolio", 'Git bilan ishlash', "Jamoada ishlash ko'nikmasi"], cond: ['Moslashuvchan ish vaqti', "Kurslar uchun to'lov", 'Zamonaviy texnika'] },
  med: { req: ["Tibbiy ma'lumot va sertifikat", "Mas'uliyat va e'tiborlilik", 'Bemorlar bilan muloqot madaniyati'], cond: ['Kunduzgi smena', 'Bepul tibbiy ko\'rik', 'Rasmiy ishga joylash'] },
  edu: { req: ["Pedagogik ma'lumot", "Bolalar bilan ishlash tajribasi", 'Sabr-toqat va ijodkorlik'], cond: ['Qisqa ish kuni', "Yozgi ta'til", 'Metodik yordam'] },
  production: { req: ['Tikuv mashinasida ishlash', 'Andoza bilan ishlash', 'Aniqlik va puxtalik'], cond: ['Ishbay qo\'shimcha haq', 'Bepul tushlik', 'Uyga yaqin sex'] },
  sales: { req: ["Muloqotga ochiqlik", "Sotuv yoki mijozlar bilan ishlash tajribasi", 'Kompyuterdan foydalanish'], cond: ['Oylik + foiz', 'Karyera o\'sishi', "Treninglar"] },
  beauty: { req: ['Tegishli sertifikat', 'Kamida 1 yillik amaliyot', 'Mijozlarga e\'tibor'], cond: ['Foizli ish haqi', 'Bepul malaka oshirish', "Qulay jadval"] },
  nanny: { req: ["Bolalar bilan ishlash tajribasi", "Tibbiy ma'lumotnoma", 'Mehribonlik va sabr-toqat'], cond: ["Oila bilan kelishilgan jadval", 'Tushlik oila hisobidan', "Tavsiyanoma bilan ishga olinadi"] },
  housekeeper: { req: ["Uy yumushlarida tajriba", 'Tartiblilik va ishonchlilik', 'Tavsiyanoma (afzallik)'], cond: ['Haftalik dam olish kuni', 'Tushlik beriladi', "Yo'l haqi qoplanadi"] },
  cleaning: { req: ["Tozalash vositalari bilan ishlash", "Mas'uliyat va puxtalik", 'Jismoniy chidamlilik'], cond: ['Ish vositalari beriladi', 'Qulay smena', "Har kuni yoki haftalik to'lov"] },
  cook: { req: ["Milliy va Yevropa taomlarini tayyorlash", 'Gigiyena qoidalarini bilish', 'Tibbiy daftarcha'], cond: ['Bepul ovqat', 'Qulay jadval', 'Rasmiy ishga joylash (oshxonalarda)'] },
  caregiver: { req: ["Keksalar yoki bemorlarni parvarish qilish tajribasi", 'Birinchi yordam asoslari', 'Mehribonlik va sabr'], cond: ['Kelishilgan jadval', 'Tushlik beriladi', "Tibbiy maslahat bilan qo'llab-quvvatlash"] },
  finance: { req: ["Iqtisodiy ma'lumot", '1C va Excel bilimi', 'Aniqlik va tartiblilik'], cond: ['Rasmiy ishga joylash', 'Ijtimoiy paket', 'Yillik bonus'] },
}

const EXTRA = [
  ['Mobil dasturchi (Flutter)', 'NurTech', '#6366F6', 'it', 'Toshkent', 10000000, 16000000, 'Gibrid', 2, ['Onalar uchun qulay'], '3 soat oldin', 18, ['Flutter', 'Dart', 'Firebase']],
  ['QA muhandis (manual)', 'SoftLine', '#3B82F6', 'it', 'Toshkent', 6000000, 9000000, 'Masofaviy', 1, ['Uydan ishlash'], '4 soat oldin', 33, ['Testlash', 'Jira', 'Postman']],
  ['Ma\'lumotlar tahlilchisi', 'DataHub', '#14B8A6', 'it', 'Toshkent', 9000000, 14000000, 'Gibrid', 1, ['Moslashuvchan grafik'], '6 soat oldin', 27, ['SQL', 'Python', 'Power BI']],
  ['IT yordam mutaxassisi', 'Bank Ishonch', '#0EA5E9', 'it', 'Buxoro', 5000000, 7000000, "To'liq stavka", 0, ['Rasmiy ishga joylash'], 'Kecha', 15, ['Windows', 'Tarmoqlar', 'Helpdesk']],
  ['Backend dasturchi (Node.js)', 'PayGo', '#8B5CF6', 'it', 'Toshkent', 12000000, 20000000, 'Masofaviy', 3, ['Uydan ishlash'], 'Kecha', 22, ['Node.js', 'PostgreSQL', 'Docker']],
  ['Pediatr hamshira', 'Shifo Plus', '#10B981', 'med', 'Andijon', 4500000, 6500000, "To'liq stavka", 1, ['Faqat kunduzgi smena'], '2 soat oldin', 9, ['Pediatriya', 'Emlash', 'Bemor parvarishi']],
  ['Farmatsevt', 'Dori-Darmon', '#22C55E', 'med', 'Namangan', 4000000, 6000000, 'Yarim stavka', 0, ['Yarim kunlik'], '5 soat oldin', 14, ['Farmatsevtika', 'Kassa', 'Maslahat berish']],
  ['Laborant', 'MedLab', '#059669', 'med', 'Toshkent', 5000000, 7500000, "To'liq stavka", 1, ['Rasmiy ishga joylash'], '2 kun oldin', 11, ['Laboratoriya tahlili', 'Gigiyena']],
  ['Stomatolog yordamchisi', 'Dental Art', '#06B6D4', 'med', 'Samarqand', 4000000, 5500000, "To'liq stavka", 0, ['Tajriba shart emas'], '3 kun oldin', 19, ['Sterilizatsiya', 'Asboblar bilan ishlash']],
  ['Boshlang\'ich sinf o\'qituvchisi', 'Kelajak maktabi', '#EF4444', 'edu', "Farg'ona", 5000000, 7000000, "To'liq stavka", 2, ['Onalar uchun qulay'], '1 soat oldin', 21, ['Pedagogika', 'Metodika']],
  ['Matematika repetitori', 'Bilim Markazi', '#F43F5E', 'edu', 'Toshkent', 4000000, 8000000, 'Yarim stavka', 1, ['Moslashuvchan grafik'], '7 soat oldin', 30, ['Matematika', 'DTM tayyorlov']],
  ['Bog\'cha tarbiyachisi', 'Quvonch MTT', '#FB7185', 'edu', 'Jizzax', 3500000, 5000000, "To'liq stavka", 0, ['Uyga yaqin'], 'Kecha', 16, ['Tarbiya', 'Ijodiy mashg\'ulotlar']],
  ['Rus tili o\'qituvchisi (online)', 'LingvoUz', '#E11D48', 'edu', 'Nukus', 4500000, 7000000, 'Masofaviy', 2, ['Uydan ishlash'], '4 kun oldin', 12, ['Rus tili', 'Zoom', 'Metodika']],
  ['Logoped', 'Nutq markazi', '#BE123C', 'edu', 'Toshkent', 6000000, 9000000, 'Yarim stavka', 2, ['Yarim kunlik'], '5 kun oldin', 7, ['Logopediya', 'Bolalar psixologiyasi']],
  ['Tikuvchi (ayollar kiyimi)', 'Gulnor Textile', '#8B5CF6', 'production', 'Namangan', 3500000, 6000000, "To'liq stavka", 1, ['Ishbay haq'], '3 soat oldin', 25, ['Tikuvchilik', 'Overlok']],
  ['Konstruktor-modelyer', 'Atlas Moda', '#A855F7', 'production', 'Toshkent', 7000000, 10000000, "To'liq stavka", 3, ['Rasmiy ishga joylash'], 'Kecha', 8, ['Konstruksiya', 'Andoza', 'Gerber']],
  ['Kashtachi (uydan)', 'Suzana Art', '#C084FC', 'production', 'Buxoro', 2500000, 4500000, 'Masofaviy', 0, ['Uydan ishlash', 'Onalar uchun qulay'], '2 kun oldin', 34, ['Kashtachilik', 'Qo\'l mehnati']],
  ['Sifat nazoratchisi (tikuv)', 'Uz Denim', '#7C3AED', 'production', 'Andijon', 4000000, 5500000, "To'liq stavka", 1, ['Bepul tushlik'], '6 kun oldin', 10, ['Sifat nazorati', 'Tikuvchilik']],
  ['Kassir-sotuvchi', 'Makro', '#3B82F6', 'sales', 'Toshkent', 3500000, 4500000, 'Yarim stavka', 0, ['Tajriba shart emas'], '1 soat oldin', 52, ['Kassa', 'Muloqot']],
  ['Call-markaz operatori', 'Uzum Market', '#7C3AED', 'sales', 'Toshkent', 4000000, 6000000, 'Masofaviy', 0, ['Uydan ishlash', 'Onalar uchun qulay'], '2 soat oldin', 68, ["Telefon orqali muloqot", 'CRM']],
  ['Do\'kon administratori', 'Ipak Yo\'li Savdo', '#2563EB', 'sales', 'Qarshi', 5000000, 7000000, "To'liq stavka", 2, ['Rasmiy ishga joylash'], 'Kecha', 13, ['Boshqaruv', 'Hisobot', 'Savdo']],
  ['Instagram-do\'kon menejeri', 'Orzu Beauty', '#EC4899', 'sales', 'Samarqand', 4000000, 7000000, 'Masofaviy', 1, ['Uydan ishlash'], '3 kun oldin', 29, ['SMM', 'Instagram', 'Savdo']],
  ['Sartarosh-stilist', 'Lola Salon', '#EC4899', 'beauty', 'Toshkent', 5000000, 10000000, "To'liq stavka", 2, ['Foizli haq'], '4 soat oldin', 17, ['Soch turmagi', 'Bo\'yash']],
  ['Manikyur ustasi', 'Nail Studio', '#F472B6', 'beauty', 'Urganch', 3000000, 6000000, 'Yarim stavka', 1, ['Moslashuvchan grafik'], 'Kecha', 23, ['Manikyur', 'Gel-lak']],
  ['Vizajist', 'Glamour', '#DB2777', 'beauty', 'Toshkent', 4000000, 8000000, 'Yarim stavka', 1, ['Moslashuvchan grafik'], '1 hafta oldin', 15, ['Makiyaj', 'Fotosessiya']],
  ['Buxgalter yordamchisi', 'Raqamli Moliya', '#F59E0B', 'finance', 'Toshkent', 4500000, 6500000, "To'liq stavka", 0, ['Tajriba shart emas'], '2 soat oldin', 38, ['1C', 'Excel', 'Hujjatlar']],
  ['Bank operatsionisti', 'Bank Ishonch', '#D97706', 'finance', 'Termiz', 5000000, 7000000, "To'liq stavka", 1, ['Rasmiy ishga joylash'], '2 kun oldin', 26, ['Bank xizmatlari', 'Kassa']],
  ['Moliyaviy tahlilchi', 'Invest Group', '#B45309', 'finance', 'Toshkent', 10000000, 15000000, 'Gibrid', 3, ['Moslashuvchan grafik'], '4 kun oldin', 9, ['Moliyaviy model', 'Excel', 'IFRS']],
  ['Grafik dizayner', 'Samo Design', '#14B8A6', 'it', 'Toshkent', 6000000, 10000000, 'Masofaviy', 1, ['Uydan ishlash'], '5 soat oldin', 31, ['Photoshop', 'Illustrator', 'Brending']],
  ['Interyer dizayner', 'Uy Dizayn', '#0D9488', 'it', 'Navoiy', 7000000, 12000000, 'Gibrid', 2, ['Moslashuvchan grafik'], '6 kun oldin', 11, ['3ds Max', 'AutoCAD', 'SketchUp']],
  ['Enaga (2 yoshli bolaga)', 'Xususiy oila', '#F472B6', 'nanny', 'Toshkent', 4000000, 6000000, "To'liq stavka", 1, ['Onalar uchun qulay'], '1 soat oldin', 19, ['Bola parvarishi', "O'yin mashg'ulotlari", 'Ovqatlantirish']],
  ['Enaga (yarim kun)', 'Xususiy oila', '#EC4899', 'nanny', 'Samarqand', 2500000, 3500000, 'Yarim stavka', 0, ['Yarim kunlik', 'Uyga yaqin'], '5 soat oldin', 11, ['Bola parvarishi', 'Sayr', 'Uy vazifalari']],
  ['Uy xizmatchisi', 'Xususiy oila', '#8B5CF6', 'housekeeper', 'Toshkent', 3500000, 5000000, "To'liq stavka", 1, ['Tushlik beriladi'], '3 soat oldin', 14, ['Tozalash', 'Dazmollash', 'Ovqat tayyorlash']],
  ["Uy yumushlari bo'yicha yordamchi", 'Xususiy oila', '#A855F7', 'housekeeper', 'Namangan', 2500000, 3500000, 'Yarim stavka', 0, ['Haftada 3 kun'], 'Kecha', 8, ['Tozalash', 'Kir yuvish']],
  ['Ofis tozalik xodimi', 'Clean Pro', '#14B8A6', 'cleaning', 'Toshkent', 3000000, 4000000, 'Yarim stavka', 0, ['Tajriba shart emas', 'Ertalabki smena'], '2 soat oldin', 27, ['Tozalash', 'Tartib']],
  ['Tozalik xodimi (savdo markazi)', 'Toza Makon', '#0D9488', 'cleaning', 'Toshkent', 3200000, 4200000, "To'liq stavka", 0, ['Rasmiy ishga joylash'], '6 soat oldin', 31, ['Tozalash', 'Gigiyena']],
  ['Uy oshpazi', 'Xususiy oila', '#F59E0B', 'cook', 'Toshkent', 4500000, 7000000, "To'liq stavka", 2, ['Tushlik beriladi'], '4 soat oldin', 9, ['Milliy taomlar', 'Shirinliklar']],
  ['Oshpaz yordamchisi', 'Lazzat Oshxonasi', '#EA580C', 'cook', 'Andijon', 3000000, 4000000, "To'liq stavka", 0, ['Bepul ovqat', 'Tajriba shart emas'], 'Kecha', 22, ['Taom tayyorlash', 'Gigiyena']],
  ['Keksalar parvarishchisi', 'Xususiy oila', '#10B981', 'caregiver', 'Buxoro', 3500000, 5000000, "To'liq stavka", 1, ['Uyga yaqin'], '2 kun oldin', 6, ['Parvarish', 'Dori berish', 'Birinchi yordam']],
  ['Bemor parvarishchisi (sidelka)', 'Mehr uyi', '#059669', 'caregiver', 'Toshkent', 4000000, 6000000, 'Yarim stavka', 1, ['Moslashuvchan grafik'], '3 kun oldin', 10, ['Parvarish', 'Gigiyena', 'Muloqot']],
]

const EXTRA_JOBS = EXTRA.map(([title, company, color, category, city, salaryFrom, salaryTo, type, experience, tags, posted, applicants, skills], i) => ({
  id: `j${11 + i}`, title, company, color, category, city, salaryFrom, salaryTo, type, experience, tags, posted, applicants, skills,
  description: `${company} jamoasiga «${title}» lavozimiga xodim taklif qilinadi. ${city} shahrida, ${type.toLowerCase()} formatda ishlash.`,
  requirements: CAT_TEXT[category].req,
  conditions: CAT_TEXT[category].cond,
}))

export const JOBS = [...BASE_JOBS, ...EXTRA_JOBS]


// To'liq rezyumeli demo nomzodlar
export { CANDIDATES } from './candidates'

export const COURSES = [
  {
    id: 'k1', title: 'Python noldan: ayollar uchun dasturlash', provider: 'AyolQadami Academy', category: 'it', icon: 'laptop',
    price: 0, duration: '8 hafta', lessons: 32, level: "Boshlang'ich", rating: 4.9, students: 1840, certificate: true, format: 'Onlayn',
    description: "Dasturlashni noldan o'rganing: Python asoslari, ma'lumotlar bilan ishlash va birinchi loyihangiz. Kurs oxirida hamkor kompaniyalarda stajirovka.",
    modules: ['Python asoslari', "O'zgaruvchilar va shartlar", 'Funksiyalar', "Ro'yxatlar va lug'atlar", 'Fayllar bilan ishlash', 'Yakuniy loyiha'],
  },
  {
    id: 'k2', title: 'UI/UX dizayn: Figma bilan', provider: 'Samo Design School', category: 'it', icon: 'palette',
    price: 1490000, duration: '10 hafta', lessons: 40, level: "O'rta", rating: 4.8, students: 920, certificate: true, format: 'Onlayn',
    description: "Mobil va veb interfeyslarni loyihalashni amaliyot orqali o'rganing. Portfolio uchun 3 ta real loyiha.",
    modules: ['Dizayn asoslari', 'Figma interfeysi', 'Auto layout', 'Dizayn tizimlari', 'Prototiplash', 'Portfolio'],
  },
  {
    id: 'k3', title: "SMM va shaxsiy brend", provider: 'Orzu Media', category: 'sales', icon: 'bag',
    price: 0, duration: '4 hafta', lessons: 16, level: "Boshlang'ich", rating: 4.7, students: 3210, certificate: true, format: 'Onlayn',
    description: "Instagram va Telegramda sahifa yuritish, kontent-reja va uydan daromad topish.",
    modules: ['Platformalar', 'Kontent-reja', 'Canva bilan ishlash', 'Target reklama asoslari'],
  },
  {
    id: 'k4', title: '1C: Buxgalteriya amaliy kursi', provider: 'Raqamli Moliya', category: 'finance', icon: 'coins',
    price: 890000, duration: '6 hafta', lessons: 24, level: "O'rta", rating: 4.8, students: 640, certificate: true, format: 'Gibrid',
    description: "1C dasturida buxgalteriya hisobi, soliq hisobotlari va ish haqi hisoblash.",
    modules: ['1C interfeysi', 'Birlamchi hujjatlar', 'Ish haqi', 'Soliq hisobotlari'],
  },
  {
    id: 'k5', title: "Ingliz tili: IELTS 6.5+", provider: 'Bilim Markazi', category: 'edu', icon: 'books',
    price: 1200000, duration: '12 hafta', lessons: 48, level: "O'rta", rating: 4.9, students: 1520, certificate: false, format: 'Onlayn',
    description: "IELTS imtihonining barcha 4 qismi bo'yicha intensiv tayyorgarlik.",
    modules: ['Listening', 'Reading', 'Writing Task 1 & 2', 'Speaking', 'Mock imtihonlar'],
  },
  {
    id: 'k6', title: 'Tikuvchilik asoslari', provider: 'Gulnor Textile', category: 'production', icon: 'spool',
    price: 0, duration: '5 hafta', lessons: 20, level: "Boshlang'ich", rating: 4.6, students: 780, certificate: true, format: 'Oflayn',
    description: "Tikuv mashinasida ishlash, bichish va oddiy kiyimlar tikish. Bitiruvchilarga ish taklifi.",
    modules: ['Mashina bilan tanishuv', "O'lchov olish", 'Bichish', 'Tikish texnikalari'],
  },
  {
    id: 'k7', title: "Rezyume va suhbatga tayyorgarlik", provider: 'AyolQadami Academy', category: 'edu', icon: 'resume',
    price: 0, duration: '1 hafta', lessons: 6, level: "Boshlang'ich", rating: 4.9, students: 5400, certificate: false, format: 'Onlayn',
    description: "Kuchli rezyume yozish, ish suhbatidan muvaffaqiyatli o'tish va ish haqi bo'yicha kelishish.",
    modules: ['Rezyume tuzilmasi', "Qo'shimcha xat", 'Suhbat savollari', 'Maosh muzokarasi'],
  },
  {
    id: 'k8', title: 'Professional kosmetologiya', provider: 'Orzu Beauty Academy', category: 'beauty', icon: 'lipstick',
    price: 2500000, duration: '3 oy', lessons: 36, level: "Boshlang'ich", rating: 4.7, students: 410, certificate: true, format: 'Oflayn',
    description: 'Yuz parvarishi, teri turlari va zamonaviy kosmetologik muolajalar.',
    modules: ['Teri anatomiyasi', 'Gigiyena', 'Yuz parvarishi', 'Amaliyot'],
  },
]

export const EVENTS = [
  { id: 'e1', title: 'Ayollar karyera forumi 2026', date: '14 noyabr', place: 'Toshkent / Onlayn', desc: "50+ kompaniya, master-klasslar va jonli ish suhbatlari." },
  { id: 'e2', title: 'Women in Tech meetup', date: '28 noyabr', place: 'IT Park, Toshkent', desc: "IT sohasidagi ayollar uchun tajriba almashish uchrashuvi." },
  { id: 'e3', title: "Bo'sh ish o'rinlari yarmarkasi", date: '5 dekabr', place: 'Samarqand', desc: "Viloyat korxonalari bilan to'g'ridan-to'g'ri uchrashuv." },
]

export const NOTIFICATIONS = [
  { id: 'n1', title: 'Yangi vakansiya', text: "Siz uchun mos 3 ta yangi vakansiya qo'shildi", time: '10 daqiqa oldin', icon: 'briefcase' },
  { id: 'n2', title: 'QadamAI tavsiyasi', text: "Profilingiz «Frontend dasturchi» vakansiyasiga 92% mos", time: '1 soat oldin', icon: 'sparkle' },
  { id: 'n3', title: 'Kurs boshlanmoqda', text: "«Python noldan» kursi 1-noyabrda boshlanadi", time: 'Kecha', icon: 'cap' },
  { id: 'n4', title: 'Tadbir', text: 'Ayollar karyera forumi 2026 ga ro\'yxatdan o\'ting', time: '2 kun oldin', icon: 'calendar' },
]
