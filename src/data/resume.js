// Rezyume yaratish ustasi uchun ma'lumotnomalar

// Viloyatlar va tumanlar. city — vakansiyalar/xarita bilan bog'lash uchun markaz shahar (CITIES ro'yxatidan)
export const REGIONS = [
  { id: 'tashkent-city', name: 'Toshkent shahri', city: 'Toshkent', districts: [
    'Bektemir', 'Chilonzor', 'Mirobod', "Mirzo Ulug'bek", 'Olmazor', 'Sergeli', 'Shayxontohur', 'Uchtepa', 'Yakkasaroy', 'Yangihayot', 'Yashnobod', 'Yunusobod'] },
  { id: 'tashkent', name: 'Toshkent viloyati', city: 'Toshkent', districts: [
    'Angren sh.', 'Bekobod sh.', 'Chirchiq sh.', 'Nurafshon sh.', 'Olmaliq sh.', 'Ohangaron sh.', "Yangiyo'l sh.",
    'Bekobod', "Bo'ka", "Bo'stonliq", 'Chinoz', 'Ohangaron', "Oqqo'rg'on", "O'rtachirchiq", 'Parkent', 'Piskent', 'Qibray', 'Quyichirchiq',
    'Toshkent tumani', 'Yangiyo\'l', 'Yuqorichirchiq', 'Zangiota'] },
  { id: 'andijan', name: 'Andijon viloyati', city: 'Andijon', districts: [
    'Andijon sh.', 'Xonobod sh.', 'Andijon', 'Asaka', 'Baliqchi', "Bo'z", 'Buloqboshi', 'Izboskan', 'Jalaquduq', 'Marhamat', "Oltinko'l",
    'Paxtaobod', "Qo'rg'ontepa", 'Shahrixon', "Ulug'nor", "Xo'jaobod"] },
  { id: 'bukhara', name: 'Buxoro viloyati', city: 'Buxoro', districts: [
    'Buxoro sh.', 'Kogon sh.', 'Buxoro', "G'ijduvon", 'Jondor', 'Kogon', 'Olot', 'Peshku', "Qorako'l", 'Qorovulbozor', 'Romitan', 'Shofirkon', 'Vobkent'] },
  { id: 'fergana', name: "Farg'ona viloyati", city: "Farg'ona", districts: [
    "Farg'ona sh.", "Marg'ilon sh.", "Qo'qon sh.", 'Quvasoy sh.', 'Beshariq', "Bog'dod", 'Buvayda', "Dang'ara", "Farg'ona", 'Furqat', 'Oltiariq',
    "Qo'shtepa", 'Quva', 'Rishton', "So'x", 'Toshloq', "Uchko'prik", "O'zbekiston", 'Yozyovon'] },
  { id: 'jizzakh', name: 'Jizzax viloyati', city: 'Jizzax', districts: [
    'Jizzax sh.', 'Arnasoy', 'Baxmal', "Do'stlik", 'Forish', "G'allaorol", "Mirzacho'l", 'Paxtakor', 'Sharof Rashidov', 'Yangiobod', 'Zafarobod', 'Zarbdor', 'Zomin'] },
  { id: 'khorezm', name: 'Xorazm viloyati', city: 'Urganch', districts: [
    'Urganch sh.', 'Xiva sh.', "Bog'ot", 'Gurlan', 'Hazorasp', "Qo'shko'pir", 'Shovot', "Tuproqqal'a", 'Urganch', 'Xiva', 'Xonqa', 'Yangiariq', 'Yangibozor'] },
  { id: 'namangan', name: 'Namangan viloyati', city: 'Namangan', districts: [
    'Namangan sh.', 'Chortoq', 'Chust', 'Davlatobod', 'Kosonsoy', 'Mingbuloq', 'Namangan', 'Norin', 'Pop', "To'raqo'rg'on", "Uchqo'rg'on", 'Uychi', "Yangiqo'rg'on"] },
  { id: 'navoi', name: 'Navoiy viloyati', city: 'Navoiy', districts: [
    'Navoiy sh.', 'Zarafshon sh.', "G'ozg'on sh.", 'Karmana', 'Konimex', 'Navbahor', 'Nurota', 'Qiziltepa', 'Tomdi', 'Uchquduq', 'Xatirchi'] },
  { id: 'kashkadarya', name: 'Qashqadaryo viloyati', city: 'Qarshi', districts: [
    'Qarshi sh.', 'Shahrisabz sh.', 'Chiroqchi', 'Dehqonobod', "G'uzor", 'Kasbi', 'Kitob', 'Koson', "Ko'kdala", 'Mirishkor', 'Muborak', 'Nishon',
    'Qamashi', 'Qarshi', 'Shahrisabz', "Yakkabog'"] },
  { id: 'karakalpak', name: "Qoraqalpog'iston Respublikasi", city: 'Nukus', districts: [
    'Nukus sh.', 'Amudaryo', 'Beruniy', "Bo'zatov", 'Chimboy', "Ellikqal'a", 'Kegeyli', "Mo'ynoq", 'Nukus', "Qanliko'l", "Qo'ng'irot", "Qorao'zak",
    'Shumanay', 'Taxiatosh', "Taxtako'pir", "To'rtko'l", "Xo'jayli"] },
  { id: 'samarkand', name: 'Samarqand viloyati', city: 'Samarqand', districts: [
    'Samarqand sh.', "Kattaqo'rg'on sh.", "Bulung'ur", 'Ishtixon', 'Jomboy', "Kattaqo'rg'on", 'Narpay', 'Nurobod', 'Oqdaryo', "Past darg'om",
    'Paxtachi', 'Payariq', "Qo'shrabot", 'Samarqand', 'Toyloq', 'Urgut'] },
  { id: 'syrdarya', name: 'Sirdaryo viloyati', city: 'Guliston', districts: [
    'Guliston sh.', 'Shirin sh.', 'Yangiyer sh.', 'Boyovut', 'Guliston', 'Mirzaobod', 'Oqoltin', 'Sardoba', 'Sayxunobod', 'Sirdaryo', 'Xovos'] },
  { id: 'surkhandarya', name: 'Surxondaryo viloyati', city: 'Termiz', districts: [
    'Termiz sh.', 'Angor', 'Bandixon', 'Boysun', 'Denov', "Jarqo'rg'on", 'Muzrabot', 'Oltinsoy', 'Qiziriq', "Qumqo'rg'on", 'Sariosiyo', 'Sherobod',
    "Sho'rchi", 'Termiz', 'Uzun'] },
]

export const findRegion = (id) => REGIONS.find((r) => r.id === id)
// eski profillarda faqat shahar bor — shu bo'yicha viloyatni topamiz
export const regionByCity = (city) => REGIONS.find((r) => r.city === city && r.id !== 'tashkent')

export const EXP_LEVELS = [
  { id: 'none', label: "Tajribam yo'q", years: 0 },
  { id: 'lt1', label: '1 yilgacha', years: 0 },
  { id: '1-3', label: '1–3 yil', years: 1 },
  { id: '3-5', label: '3–5 yil', years: 3 },
  { id: '5+', label: '5 yildan ortiq', years: 5 },
]

// short — profil va qidiruvda ko'rinadigan "Ish formati" yorlig'i (JOB_TYPES bilan mos)
export const EMPLOYMENT = [
  { id: 'full', label: "Doimiy (to'liq stavka)", short: "To'liq stavka" },
  { id: 'part', label: 'Yarim stavka', short: 'Yarim stavka' },
  { id: 'season', label: 'Mavsumiy', short: 'Mavsumiy' },
  { id: 'intern', label: 'Stajirovka / amaliyot', short: 'Stajirovka' },
  { id: 'daily', label: 'Kunlik / bir martalik', short: 'Kunlik' },
]

export const WORK_MODES = [
  { id: 'office', label: 'Ish joyida', short: 'Ish joyida' },
  { id: 'shift', label: 'Smenali ish', short: 'Smenali' },
  { id: 'remote', label: 'Masofaviy', short: 'Masofaviy' },
  { id: 'hybrid', label: 'Gibrid (ofis + uy)', short: 'Gibrid' },
  { id: 'home', label: 'Kasanachilik (uyda)', short: 'Kasanachilik' },
  { id: 'mobile', label: "Ish joyi o'zgaruvchan", short: 'Mobil' },
]

// Farzandli onalar uchun muhim: qaysi vaqtda ishlay oladi
export const WORK_TIME = [
  { id: 'fullday', label: "To'liq kun" },
  { id: 'morning', label: 'Faqat ertalab' },
  { id: 'afternoon', label: 'Faqat tushdan keyin' },
  { id: 'flex', label: 'Moslashuvchan grafik' },
  { id: 'weekend', label: 'Dam olish kunlari' },
]

export const EDU_LEVELS = [
  "O'rta (maktab)", "O'rta maxsus (kollej, texnikum)", 'Oliy — bakalavr', 'Oliy — magistr', 'Doktorantura (PhD)', 'Kasbiy kurslar',
]

export const LANGUAGES = [
  "O'zbek tili", 'Rus tili', 'Ingliz tili', 'Qoraqalpoq tili', 'Tojik tili', 'Qozoq tili', 'Turk tili', 'Koreys tili', 'Arab tili',
  'Nemis tili', 'Fransuz tili', 'Xitoy tili', 'Yapon tili', 'Ispan tili', 'Italyan tili',
]

export const LANG_LEVELS = [
  { value: 'native', label: 'Ona tili' },
  { value: 'A1', label: "A1 — Boshlang'ich" },
  { value: 'A2', label: 'A2 — Elementar' },
  { value: 'B1', label: "B1 — O'rta" },
  { value: 'B2', label: "B2 — O'rtadan yuqori" },
  { value: 'C1', label: "C1 — Ilg'or" },
  { value: 'C2', label: 'C2 — Mukammal' },
]

export const SKILL_LEVELS = ["Boshlang'ich", "O'rta daraja", 'Yuqori daraja']

export const DRIVING = ['A', 'B', 'C', 'D', 'BE', 'CE']

export const SOCIAL = [
  { id: 'disability', label: "Nogironligi bo'lgan shaxs" },
  { id: 'registry', label: "Ijtimoiy himoya yagona reestridagi oila a'zosi" },
  { id: 'manykids', label: "Ko'p bolali ona" },
  { id: 'single', label: 'Yolg\'iz ona (boquvchisini yo\'qotgan)' },
]

export const SEARCH_OPTIONS = [
  { id: 'active', label: 'Faol ish qidiryapman', hint: "Ish beruvchilar sizni birinchi ko'radi" },
  { id: 'open', label: "Ishlayapman, takliflarni ko'rib chiqaman", hint: 'Yangi takliflarga ochiqman' },
  { id: 'off', label: 'Hozircha izlamayapman', hint: "Rezyume qidiruvda ko'rinmaydi" },
]

// soha bo'yicha ko'nikma takliflari
export const SKILL_SUGGEST = {
  office: ['MS Word', 'MS Excel', 'Hujjat aylanishi', 'Ish yuritish', 'Telefon muloqoti', 'Tez yozish'],
  edu: ['Dars rejalashtirish', 'Bolalar psixologiyasi', 'Onlayn darslar', 'Ota-onalar bilan ishlash', 'Repetitorlik'],
  med: ['Birinchi yordam', 'Ukol qilish', 'Bemor parvarishi', 'Tibbiy hujjatlar', 'Steril ishlash'],
  nanny: ['Chaqaloq parvarishi', 'Erta rivojlantirish', 'Bolalar ovqati', 'Birinchi yordam', 'Ertak va o\'yinlar'],
  housekeeper: ['Uy tozalash', 'Kir yuvish va dazmollash', 'Ovqat tayyorlash', 'Xarid qilish', 'Tartib saqlash'],
  cleaning: ['Ofis tozalash', 'Tozalash vositalari', 'Gilam tozalash', 'Deraza yuvish'],
  cook: ['Milliy taomlar', 'Shirinliklar', 'Parhez taomlar', 'Menyu tuzish', 'Sanitariya qoidalari'],
  caregiver: ['Keksalar parvarishi', 'Bemor parvarishi', 'Dori berish', 'Massaj', 'Birinchi yordam'],
  sales: ['Mijozlar bilan muloqot', 'Kassa', 'Sotuv texnikasi', 'CRM', 'Telefon orqali sotuv'],
  beauty: ['Soch turmagi', 'Manikyur', 'Pardoz', 'Qosh va kiprik', 'Teri parvarishi'],
  it: ['HTML/CSS', 'JavaScript', 'React', 'Figma', 'Python', 'SQL', 'Git'],
  home: ['Tikuvchilik', 'Uy jihozlari ta\'miri', 'Bichish', 'Kashtachilik'],
  remote: ['Onlayn muloqot', 'Google Docs', 'Kontent yozish', 'Telegram SMM', 'Mustaqil ishlash'],
  production: ['Tikuv mashinasi', 'Sifat nazorati', 'Qadoqlash', 'Bichish'],
  food: ['Ofitsiantlik', 'Barista', 'Xostes', 'Mehmonlarni kutib olish'],
  marketing: ['SMM', 'Kopirayting', 'Canva', 'Targeting', 'Mobilografiya'],
  finance: ['1C: Buxgalteriya', 'MS Excel', 'Soliq hisoboti', 'Didox', 'Kassa operatsiyalari'],
  law: ['Shartnomalar', 'Mehnat huquqi', 'Hujjatlar tayyorlash', 'Lex.uz'],
  logistics: ['Ombor hisobi', 'Yetkazib berish', '1C: Savdo', 'Hujjatlar'],
  other: ['Muloqot', 'Jamoada ishlash', 'Mas\'uliyat', 'Vaqtni boshqarish'],
}

export const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

// '2022-03' → 'Mart 2022'
export const monthText = (ym) => {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  return m ? `${MONTHS[Number(m) - 1]} ${y}` : y
}

// tajriba davomiyligi: '1 yil 4 oy'
export function duration(from, to) {
  if (!from) return ''
  const [y1, m1] = from.split('-').map(Number)
  const end = to ? to.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1]
  const n = (end[0] - y1) * 12 + (end[1] - (m1 || 1)) + 1
  if (n <= 0) return ''
  const y = Math.floor(n / 12), m = n % 12
  return [y && `${y} yil`, m && `${m} oy`].filter(Boolean).join(' ')
}
