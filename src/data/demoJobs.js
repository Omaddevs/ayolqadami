// VAQTINCHALIK demo vakansiyalar — haqiqiy e'lonlar (server, bot, o'z e'lonlari) bo'lmaganda ko'rsatiladi.
// O'chirish uchun: DEMO_JOBS_ENABLED = false (yoki shu faylni va AppContext'dagi importni olib tashlang).
// id 'demo' bilan boshlanadi — ariza, ko'rish va yoqtirish serverga yuborilmaydi.
export const DEMO_JOBS_ENABLED = true

const CO = {
  'Artel Electronics': '#2563EB', 'Korzinka': '#E11D48', 'Uzum Market': '#7C3AED', 'Akfa Medline': '#0EA5E9',
  'Cambridge Learning Centre': '#DC2626', 'Beauty Line Studio': '#DB2777', 'EPAM Uzbekistan': '#0F766E', 'Hilton Tashkent City': '#1E3A8A',
  'Makro': '#F59E0B', 'Click': '#2563EB', 'Payme': '#14B8A6', 'Shifo Nur klinikasi': '#059669', 'Bon! Cafe': '#B45309',
  'Ipak Yo\'li Bank': '#B91C1C', 'Texnomart': '#EA580C', 'Kids Planet bog\'chasi': '#F97316', 'Navoiy Tekstil': '#4F46E5',
  'Media Park': '#9333EA', 'Yandex Go': '#EAB308', 'Oila Servis': '#10B981',
}

// [nom, kompaniya, soha, shahar, ish turi, maosh dan, maosh gacha, tajriba (yil, 0 — shart emas), teglar]
const ROWS = [
  ['Ofis menejeri', 'Artel Electronics', 'office', 'Toshkent', "To'liq stavka", 5000000, 7000000, 1, ['Rasmiy ishga joylashtirish', 'Tushlik']],
  ['Kassir', 'Korzinka', 'sales', 'Toshkent', "To'liq stavka", 4000000, 5000000, 0, ['Smenali jadval', 'Bepul forma']],
  ['Operator (call-markaz)', 'Uzum Market', 'remote', 'Toshkent', 'Masofaviy', 4500000, 6000000, 0, ['Uydan ishlash', "O'qitish"]],
  ['Hamshira', 'Akfa Medline', 'med', 'Toshkent', "To'liq stavka", 6000000, 8000000, 1, ['Rasmiy ishga joylashtirish', 'Tibbiy sug\'urta']],
  ["Ingliz tili o'qituvchisi", 'Cambridge Learning Centre', 'edu', 'Samarqand', 'Yarim stavka', 5000000, 9000000, 1, ['Moslashuvchan jadval']],
  ['Manikyur ustasi', 'Beauty Line Studio', 'beauty', 'Toshkent', "To'liq stavka", 6000000, 10000000, 1, ['Foizli haq', 'Mijozlar bazasi']],
  ['Frontend dasturchi (React)', 'EPAM Uzbekistan', 'it', 'Toshkent', 'Gibrid', 15000000, 25000000, 3, ['Gibrid', 'Ingliz tili kurslari']],
  ['Administrator (resepshn)', 'Hilton Tashkent City', 'food', 'Toshkent', "To'liq stavka", 7000000, 9000000, 1, ['Tushlik', 'Transport']],
  ['Sotuvchi-konsultant', 'Makro', 'sales', 'Buxoro', "To'liq stavka", 3500000, 4500000, 0, ['Bepul forma', "O'qitish"]],
  ['SMM mutaxassis', 'Click', 'marketing', 'Toshkent', 'Gibrid', 8000000, 12000000, 1, ['Gibrid', 'Zamonaviy ofis']],
  ['Buxgalter', 'Payme', 'finance', 'Toshkent', "To'liq stavka", 9000000, 13000000, 3, ['Rasmiy ishga joylashtirish']],
  ['Laborant', 'Shifo Nur klinikasi', 'med', 'Andijon', "To'liq stavka", 4500000, 6000000, 1, ['Tushlik']],
  ['Oshpaz yordamchisi', 'Bon! Cafe', 'cook', 'Toshkent', "To'liq stavka", 4000000, 5500000, 0, ['Tushlik', 'Smenali jadval']],
  ['Bank operatsionisti', "Ipak Yo'li Bank", 'finance', "Farg'ona", "To'liq stavka", 5500000, 7000000, 1, ['Rasmiy ishga joylashtirish', 'Bonuslar']],
  ['Onlayn-do\'kon menejeri', 'Texnomart', 'remote', 'Namangan', 'Masofaviy', 5000000, 7500000, 1, ['Uydan ishlash']],
  ['Tarbiyachi', "Kids Planet bog'chasi", 'nanny', 'Toshkent', "To'liq stavka", 4500000, 6000000, 1, ['Tushlik', 'Rasmiy ishga joylashtirish']],
  ['Tikuvchi', 'Navoiy Tekstil', 'production', 'Navoiy', "To'liq stavka", 4000000, 6500000, 0, ['Ishbay haq', 'Transport']],
  ['Grafik dizayner', 'Media Park', 'it', 'Toshkent', 'Gibrid', 9000000, 14000000, 1, ['Gibrid', 'Zamonaviy ofis']],
  ["Qo'llab-quvvatlash operatori", 'Yandex Go', 'remote', 'Toshkent', 'Masofaviy', 5000000, 6500000, 0, ['Uydan ishlash', 'Smenali jadval']],
  ['Uy xizmatchisi', 'Oila Servis', 'housekeeper', 'Toshkent', "To'liq stavka", 4000000, 5000000, 1, ['Tushlik']],
  ['HR menejer', 'Uzum Market', 'office', 'Toshkent', "To'liq stavka", 10000000, 14000000, 3, ['Rasmiy ishga joylashtirish', 'Bonuslar']],
  ['Farmatsevt', 'Akfa Medline', 'med', 'Samarqand', "To'liq stavka", 5000000, 7000000, 1, ['Rasmiy ishga joylashtirish']],
  ["Boshlang'ich sinf o'qituvchisi", 'Cambridge Learning Centre', 'edu', 'Toshkent', "To'liq stavka", 6000000, 8000000, 1, ['Tushlik']],
  ['Sartarosh', 'Beauty Line Studio', 'beauty', 'Buxoro', "To'liq stavka", 5000000, 9000000, 1, ['Foizli haq']],
  ['QA muhandis', 'EPAM Uzbekistan', 'it', 'Toshkent', 'Masofaviy', 12000000, 18000000, 1, ['Uydan ishlash', 'Ingliz tili kurslari']],
  ['Ofitsiant', 'Hilton Tashkent City', 'food', 'Toshkent', 'Yarim stavka', 3500000, 5000000, 0, ['Choychaqa', 'Tushlik']],
  ['Merchandayzer', 'Korzinka', 'sales', 'Qarshi', "To'liq stavka", 3500000, 4500000, 0, ['Transport']],
  ['Kontent-menejer', 'Media Park', 'marketing', 'Toshkent', 'Masofaviy', 6000000, 9000000, 1, ['Uydan ishlash']],
  ['Kassir-buxgalter', 'Makro', 'finance', 'Jizzax', "To'liq stavka", 4500000, 6000000, 1, ['Rasmiy ishga joylashtirish']],
  ['Enaga (kunduzgi)', 'Oila Servis', 'nanny', 'Toshkent', 'Yarim stavka', 3500000, 5000000, 1, ['Moslashuvchan jadval']],
  ['Keksalar parvarishchisi', 'Oila Servis', 'caregiver', 'Toshkent', "To'liq stavka", 5000000, 6500000, 1, ['Tushlik']],
  ['Tozalik xodimi', 'Hilton Tashkent City', 'cleaning', 'Toshkent', "To'liq stavka", 3500000, 4500000, 0, ['Bepul forma', 'Tushlik']],
  ['Yurist-maslahatchi', "Ipak Yo'li Bank", 'law', 'Toshkent', "To'liq stavka", 10000000, 15000000, 3, ['Rasmiy ishga joylashtirish']],
  ['Logist', 'Uzum Market', 'logistics', 'Toshkent', "To'liq stavka", 7000000, 10000000, 1, ['Bonuslar']],
  ['Qandolatchi', 'Bon! Cafe', 'cook', 'Samarqand', "To'liq stavka", 5000000, 7000000, 1, ['Tushlik']],
  ['Kosmetolog', 'Beauty Line Studio', 'beauty', 'Toshkent', 'Yarim stavka', 6000000, 11000000, 1, ['Foizli haq']],
  ['Sifat nazoratchisi', 'Navoiy Tekstil', 'production', 'Navoiy', "To'liq stavka", 5000000, 7000000, 1, ['Transport', 'Tushlik']],
  ['Kotiba-referent', 'Artel Electronics', 'office', 'Toshkent', "To'liq stavka", 5000000, 6500000, 0, ['Rasmiy ishga joylashtirish']],
  ['Mobil dizayner (UI/UX)', 'Payme', 'it', 'Toshkent', 'Gibrid', 14000000, 20000000, 3, ['Gibrid', 'Bonuslar']],
  ['Maishiy texnika maslahatchisi', 'Texnomart', 'home', 'Urganch', "To'liq stavka", 4000000, 5500000, 0, ["O'qitish"]],
]

const DUTIES = {
  default: ["Kundalik vazifalarni o'z vaqtida bajarish", "Mijozlar va hamkasblar bilan samarali muloqot", 'Ish hujjatlarini tartibda yuritish'],
  it: ['Yangi funksiyalarni ishlab chiqish va sinash', "Jamoa bilan kod/dizayn sharhlarida qatnashish", 'Mahsulot sifatini oshirish'],
  med: ["Bemorlarga sifatli xizmat ko'rsatish", 'Tibbiy hujjatlarni yuritish', 'Sanitariya qoidalariga rioya qilish'],
  sales: ['Xaridorlarga mahsulot tanlashda yordam berish', "Kassa va savdo hisobotini yuritish", "Vitrina va tokchalarni tartibda saqlash"],
  edu: ["Dars rejalarini tuzish va o'tkazish", "O'quvchilar natijalarini kuzatib borish", 'Ota-onalar bilan aloqa'],
}
const REQS = {
  default: ["Mas'uliyatlilik va aniqlik", 'Muloqot qobiliyati', "O'zbek tilini yaxshi bilish (rus tili afzallik)"],
  it: ['Tegishli texnologiyalar bo\'yicha amaliy tajriba', "Ingliz tilida texnik hujjatlarni o'qiy olish", 'Jamoada ishlash ko\'nikmasi'],
}
const CONDS = ['Rasmiy ishga joylashtirish', "Ish haqi o'z vaqtida", 'Qulay ish muhiti va do\'stona jamoa']

const HOUR = 3600 * 1000

export function buildDemoJobs(now = Date.now()) {
  return ROWS.map(([title, company, category, city, type, salaryFrom, salaryTo, experience, tags], i) => ({
    id: `demo${i + 1}`,
    demo: true,
    title, company, category, city, type, salaryFrom, salaryTo, experience, tags,
    color: CO[company] || '#5B57F0',
    // joylangan vaqt: so'nggi ~10 kun ichida, yangilari tepada
    publishedAt: new Date(now - (i * 6 + 2) * HOUR).toISOString(),
    applicants: (i * 7) % 23,
    views: 40 + ((i * 37) % 260),
    likes: (i * 5) % 17,
    description: `${company} jamoasiga «${title}» lavozimiga xodim qidirilmoqda. Ayollar uchun qulay sharoit va barqaror daromad.`,
    duties: DUTIES[category] || DUTIES.default,
    requirements: REQS[category] || REQS.default,
    conditions: CONDS,
  }))
}
