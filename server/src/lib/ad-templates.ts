// Botdagi «📢 E'lon berish» shablonlari — yagona manba.
// Bot (ayolqadam-bot) savollarni shu yerdan oladi (GET /api/v1/bot/ad-templates), server esa javoblarni
// tekshiradi, kanal postini yasaydi va firibgarlik belgilarini qidiradi.
import { CATEGORIES, CITIES, catName } from './catalog'
import { normalizeUzPhone, formatUzPhone } from './phone'

export type FieldType = 'text' | 'long' | 'phone' | 'tg' | 'choice' | 'category' | 'city' | 'age'
export type Opt = { v: string; uz: string; ru: string }
export type Field = {
  key: string
  type: FieldType
  emoji: string
  label: string // kanal postidagi nom (uz)
  ask: { uz: string; ru: string } // botdagi savol
  example?: string
  required?: boolean
  max?: number
  options?: Opt[]
  quick?: Opt[] // matnli maydon uchun tezkor javob tugmalari (masalan, «Kelishiladi»)
  title?: boolean // post sarlavhasi
}
export type AdTemplate = {
  id: string
  emoji: string
  name: { uz: string; ru: string }
  hint: { uz: string; ru: string } // tanlashda qisqa izoh
  headline: string // kanal postidagi bosh qator: "Xodim kerak"
  roles: ('employer' | 'seeker')[] // qaysi rolga birinchi navbatda ko'rsatiladi
  tag: string // #vakansiya, #xizmat...
  job?: boolean // tasdiqlanganda saytda vakansiya sifatida ham chiqadi
  layout?: 'card' // kartochka: "📢 ISHCHI KERAK!" sarlavhasi va har qatorda "emoji <b>Nom:</b> qiymat"
  fields: Field[]
}

const o = (v: string, uz: string, ru: string): Opt => ({ v, uz, ru })
const WORK_FORMAT = [o('Oflayn', 'Oflayn (ish joyida)', 'Офлайн (в офисе)'), o('Masofaviy', 'Masofaviy', 'Удалённо'), o('Gibrid', 'Gibrid', 'Гибрид')]
const EMPLOYMENT = [o("To'liq stavka", "To'liq stavka", 'Полная занятость'), o('Yarim stavka', 'Yarim stavka', 'Частичная занятость'), o('Smenali', 'Smenali', 'Сменный график')]
const EXPERIENCE = [o('Tajribasiz', 'Tajriba shart emas', 'Без опыта'), o('1 yildan', '1 yildan', 'От 1 года'), o('3 yildan', '3 yildan', 'От 3 лет'), o('5 yildan', '5 yildan ortiq', 'Более 5 лет')]
const HOME_SERVICE = [
  o('Enaga', '👩‍🍼 Enaga', '👩‍🍼 Няня'), o('Uy bekasi', '🏠 Uy bekasi / tozalik', '🏠 Домработница / уборка'),
  o('Oshpaz', '🍲 Oshpaz', '🍲 Повар'), o('Parvarishchi', '🩺 Keksa/bemor parvarishi', '🩺 Уход за пожилыми/больными'),
  o('Repetitor', "📚 Repetitor / tarbiyachi", '📚 Репетитор / воспитатель'), o('Boshqa', '✨ Boshqa', '✨ Другое'),
]
const NEGOTIABLE = [o('Kelishiladi', '🤝 Kelishiladi', '🤝 Договорная')]

const q = (uz: string, ru: string) => ({ uz, ru })

// --- umumiy aloqa maydonlari ---
const PHONE: Field = { key: 'phone', type: 'phone', emoji: '📞', label: 'Aloqa', ask: q("Aloqa uchun telefon raqami?", 'Телефон для связи?'), example: '+998 90 123 45 67' }
const TG: Field = { key: 'tg', type: 'tg', emoji: '✈️', label: 'Telegram', ask: q('Telegram manzil? (masalan @username)', 'Telegram для связи? (например @username)') }

// Botdagi «📢 E'lon berish» rolga qarab shulardan birini darhol boshlaydi: ish beruvchi — worker_need, ish izlovchi — job_wanted
const CONTACT: Field = { ...PHONE, emoji: '📩', label: 'Murojaat uchun', required: true, ask: q('Murojaat uchun telefon raqami?', 'Телефон для связи?') }
const EXTRA = (ex: string): Field => ({ key: 'extra', type: 'long', emoji: '📝', label: "Qo'shimcha ma'lumot", max: 1000, ask: q("Qo'shimcha ma'lumot", 'Дополнительная информация'), example: ex })

export const AD_TEMPLATES: AdTemplate[] = [
  {
    id: 'worker_need', emoji: '📢', name: q('Ishchi kerak', 'Нужен работник'),
    hint: q('Xodim yoki ishchi qidirayotgan bo\'lsangiz', 'Если ищете сотрудника'),
    headline: 'ISHCHI KERAK!', roles: ['employer'], tag: 'vakansiya', job: true, layout: 'card',
    fields: [
      { key: 'title', type: 'text', emoji: '💼', label: 'Ish turi / Lavozim', title: true, required: true, max: 120, ask: q('Ish turi yoki lavozim?', 'Вид работы или должность?'), example: 'Sotuvchi' },
      { key: 'company', type: 'text', emoji: '🏢', label: 'Ish joyi', required: true, max: 120, ask: q('Ish joyi (kompaniya, do\'kon, tashkilot)?', 'Место работы (компания, магазин, организация)?'), example: '"Baraka" supermarketi' },
      { key: 'city', type: 'city', emoji: '📍', label: 'Manzil', required: true, max: 160, ask: q("Manzil? Shaharni tanlang yoki to'liq manzilni yozing", 'Адрес? Выберите город или напишите адрес'), example: 'Toshkent, Chilonzor tumani' },
      { key: 'schedule', type: 'text', emoji: '🕐', label: 'Ish vaqti', required: true, max: 120, ask: q('Ish vaqti?', 'Время работы?'), example: '09:00–18:00, 6/1' },
      { key: 'salary', type: 'text', emoji: '💰', label: 'Maosh', required: true, max: 80, quick: NEGOTIABLE, ask: q('Maosh qancha?', 'Какая зарплата?'), example: "4 000 000 so'm" },
      { key: 'requirements', type: 'long', emoji: '📋', label: 'Talablar', required: true, max: 1000, ask: q('Talablar?', 'Требования?'), example: '20–35 yosh, tajriba shart emas' },
      EXTRA('Tushlik va yo\'l haqi beriladi'),
      CONTACT,
    ],
  },
  {
    id: 'job_wanted', emoji: '🔎', name: q('Ish izlayman', 'Ищу работу'),
    hint: q("O'zingiz haqingizda qisqa e'lon — ish beruvchilar siz bilan bog'lanadi", 'Короткое объявление о себе — работодатели свяжутся с вами'),
    headline: 'ISH IZLAYMAN!', roles: ['seeker'], tag: 'rezyume', layout: 'card',
    fields: [
      { key: 'name', type: 'text', emoji: '👩', label: 'Ism / Yosh', required: true, max: 80, ask: q('Ismingiz va yoshingiz?', 'Ваше имя и возраст?'), example: 'Malika, 24 yosh' },
      { key: 'title', type: 'text', emoji: '💼', label: 'Kasb / Mutaxassislik', title: true, required: true, max: 120, ask: q('Kasbingiz yoki mutaxassisligingiz?', 'Ваша профессия или специальность?'), example: 'Hisobchi' },
      { key: 'city', type: 'city', emoji: '📍', label: 'Yashash manzili', required: true, max: 160, ask: q('Yashash manzilingiz?', 'Где вы живёте?'), example: 'Toshkent, Yunusobod tumani' },
      { key: 'schedule', type: 'text', emoji: '🕐', label: 'Ish vaqti', required: true, max: 120, ask: q('Qaysi vaqtda ishlay olasiz?', 'В какое время можете работать?'), example: "To'liq kun yoki 09:00–14:00" },
      { key: 'salary', type: 'text', emoji: '💰', label: 'Kutilayotgan maosh', required: true, max: 80, quick: NEGOTIABLE, ask: q('Kutilayotgan maosh?', 'Ожидаемая зарплата?'), example: "5 000 000 so'm" },
      { key: 'skills', type: 'long', emoji: '🎓', label: "Tajriba va ko'nikmalar", required: true, max: 1000, ask: q("Tajribangiz va ko'nikmalaringiz?", 'Ваш опыт и навыки?'), example: '3 yil hisobchi, 1C, Excel' },
      EXTRA('Masofaviy ishlashga ham tayyorman'),
      CONTACT,
    ],
  },
  {
    id: 'vacancy', emoji: '💼', name: q('Xodim kerak (vakansiya)', 'Нужен сотрудник (вакансия)'),
    hint: q("Har qanday soha: ofis, savdo, ta'lim, tibbiyot, xizmat ko'rsatish…", 'Любая сфера: офис, продажи, образование, медицина…'),
    headline: 'Xodim kerak', roles: ['employer'], tag: 'vakansiya', job: true,
    fields: [
      { key: 'title', type: 'text', emoji: '💼', label: 'Lavozim', title: true, required: true, max: 120, ask: q('Qanday xodim kerak? (lavozim)', 'Какой сотрудник нужен? (должность)'), example: 'Marketolog' },
      { key: 'company', type: 'text', emoji: '🏢', label: 'Kompaniya', required: true, max: 120, ask: q('Kompaniya yoki tashkilot nomi?', 'Название компании или организации?'), example: '"WESTER School" o\'quv markazi' },
      { key: 'category', type: 'category', emoji: '🗂', label: 'Soha', required: true, ask: q('Qaysi soha?', 'Какая сфера?') },
      { key: 'city', type: 'city', emoji: '📍', label: 'Manzil', required: true, max: 160, ask: q("Ish joyi qayerda? Shaharni tanlang yoki to'liq manzilni yozing", 'Где работа? Выберите город или напишите адрес'), example: 'Andijon shahri' },
      { key: 'format', type: 'choice', emoji: '🏬', label: 'Ish formati', required: true, options: WORK_FORMAT, ask: q('Ish formati?', 'Формат работы?') },
      { key: 'employment', type: 'choice', emoji: '🕒', label: 'Bandlik', options: EMPLOYMENT, ask: q('Bandlik turi?', 'Тип занятости?') },
      { key: 'schedule', type: 'text', emoji: '⏰', label: 'Ish vaqti', max: 100, ask: q('Ish vaqti va jadvali?', 'Время и график работы?'), example: '09:00–18:00, 6/1' },
      { key: 'salary', type: 'text', emoji: '💰', label: 'Maosh', required: true, max: 80, quick: NEGOTIABLE, ask: q('Maosh qancha?', 'Какая зарплата?'), example: "5 000 000 – 8 000 000 so'm" },
      { key: 'experience', type: 'choice', emoji: '🎓', label: 'Tajriba', options: EXPERIENCE, ask: q('Qancha tajriba kerak?', 'Какой нужен опыт?') },
      { key: 'requirements', type: 'long', emoji: '✅', label: 'Talablar', max: 1500, ask: q("Talablar (har birini yangi qatordan yozing)", 'Требования (каждое с новой строки)') },
      { key: 'conditions', type: 'long', emoji: '🎁', label: 'Sharoitlar', max: 1500, ask: q("Biz nima taklif qilamiz? (sharoitlar, bonuslar)", 'Что мы предлагаем? (условия, бонусы)') },
      { key: 'contact_person', type: 'text', emoji: '👤', label: "Mas'ul shaxs", max: 80, ask: q("Mas'ul shaxs ismi?", 'Имя ответственного лица?') },
      PHONE, TG,
    ],
  },
  {
    id: 'it_vacancy', emoji: '💻', name: q('IT vakansiya', 'IT-вакансия'),
    hint: q('Dasturchi, dizayner, tester, DevOps…', 'Разработчик, дизайнер, тестировщик, DevOps…'),
    headline: 'IT vakansiya', roles: ['employer'], tag: 'vakansiya', job: true,
    fields: [
      { key: 'title', type: 'text', emoji: '💻', label: 'Lavozim', title: true, required: true, max: 120, ask: q('Lavozim? (daraja bilan)', 'Должность? (с уровнем)'), example: 'Middle Fullstack JavaScript Developer' },
      { key: 'company', type: 'text', emoji: '🏢', label: 'Kompaniya', required: true, max: 120, ask: q('Kompaniya nomi va qisqacha tavsifi?', 'Название компании и кратко о ней?'), example: 'PROSIGHT DEV — IT Park rezidenti' },
      { key: 'tech', type: 'long', emoji: '📚', label: 'Texnologiyalar', required: true, max: 600, ask: q('Texnologiyalar (stack)?', 'Технологии (стек)?'), example: 'JavaScript, TypeScript, React, Node.js, NestJS, PostgreSQL' },
      { key: 'experience', type: 'choice', emoji: '💼', label: 'Tajriba', required: true, options: [o('Amaliyotchi', 'Amaliyotchi (intern)', 'Стажёр'), o('1–3 yil', '1–3 yil', '1–3 года'), o('3–5 yil', '3–5 yil', '3–5 лет'), o('5+ yil', '5+ yil', '5+ лет')], ask: q('Tajriba?', 'Опыт?') },
      { key: 'format', type: 'choice', emoji: '🏢', label: 'Ish formati', required: true, options: WORK_FORMAT, ask: q('Ish formati?', 'Формат работы?') },
      { key: 'schedule', type: 'text', emoji: '⏰', label: 'Jadval', max: 100, ask: q('Ish jadvali?', 'График работы?'), example: '5/2, 8 soat' },
      { key: 'salary', type: 'text', emoji: '💰', label: 'Maosh', required: true, max: 80, quick: NEGOTIABLE, ask: q('Maosh?', 'Зарплата?'), example: "$1 500–2 000, qo'lga" },
      { key: 'languages', type: 'text', emoji: '🗣', label: 'Tillar', max: 120, ask: q('Qaysi tillar kerak?', 'Какие языки нужны?'), example: 'Ingliz tili: B2, rus tili: C1' },
      { key: 'requirements', type: 'long', emoji: '✅', label: 'Talablar', max: 1500, ask: q('Talablar (har birini yangi qatordan)', 'Требования (каждое с новой строки)') },
      { key: 'tasks', type: 'long', emoji: '🛠', label: 'Vazifalar', max: 1500, ask: q('Vazifalar (har birini yangi qatordan)', 'Обязанности (каждая с новой строки)') },
      { key: 'conditions', type: 'long', emoji: '🎁', label: 'Sharoitlar', max: 1500, ask: q('Sharoitlar va imtiyozlar', 'Условия и бонусы') },
      { key: 'city', type: 'city', emoji: '📍', label: 'Manzil', required: true, max: 160, ask: q('Ofis manzili?', 'Адрес офиса?'), example: 'Toshkent, Shayxontohur tumani' },
      PHONE, TG,
    ],
  },
  {
    id: 'home_need', emoji: '🏠', name: q('Uy xizmati kerak (enaga, uy bekasi…)', 'Нужна помощь по дому (няня, домработница…)'),
    hint: q('Oilangizga enaga, uy bekasi, oshpaz yoki parvarishchi kerak bo\'lsa', 'Если семье нужна няня, домработница, повар или сиделка'),
    headline: 'Uy xizmati kerak', roles: ['employer'], tag: 'uy_xizmati',
    fields: [
      { key: 'service', type: 'choice', emoji: '👩‍🍼', label: 'Kim kerak', title: true, required: true, options: HOME_SERVICE, ask: q('Kim kerak?', 'Кто нужен?') },
      { key: 'details', type: 'long', emoji: '📝', label: 'Batafsil', required: true, max: 1000, ask: q('Kimga va qanday yordam kerak?', 'Кому и какая помощь нужна?'), example: '3 yoshli qizimizga kunduzi qarash kerak' },
      { key: 'city', type: 'city', emoji: '📍', label: 'Manzil', required: true, max: 160, ask: q('Manzil?', 'Адрес?'), example: 'Toshkent, Sergeli tumani' },
      { key: 'schedule', type: 'text', emoji: '🕐', label: 'Ish vaqti', required: true, max: 120, ask: q('Ish vaqti?', 'Время работы?'), example: 'Dushanba–juma, 09:00–17:00' },
      { key: 'salary', type: 'text', emoji: '💵', label: "To'lov", required: true, max: 80, quick: NEGOTIABLE, ask: q("To'lov qancha?", 'Какая оплата?'), example: "6 000 000 so'm yoki kuniga 350 000" },
      { key: 'requirements', type: 'long', emoji: '✅', label: 'Talablar', max: 1000, ask: q('Talablar (yosh, tajriba…)', 'Требования (возраст, опыт…)') },
      PHONE, TG,
    ],
  },
  {
    id: 'service_offer', emoji: '👩‍🍼', name: q('Xizmat taklif qilaman (enaga, uy xizmati…)', 'Предлагаю услуги (няня, помощь по дому…)'),
    hint: q('Enaga, uy bekasi, oshpaz, parvarishchi sifatida ish qidirayotgan bo\'lsangiz', 'Если ищете работу няней, домработницей, поваром, сиделкой'),
    headline: 'Xizmat taklif qilaman', roles: ['seeker'], tag: 'xizmat',
    fields: [
      { key: 'service', type: 'choice', emoji: '👩‍🍼', label: 'Xizmat', title: true, required: true, options: HOME_SERVICE, ask: q('Qanday xizmat taklif qilasiz?', 'Какую услугу предлагаете?') },
      { key: 'age', type: 'age', emoji: '🎂', label: 'Yosh', required: true, ask: q('Yoshingiz?', 'Ваш возраст?'), example: '25' },
      { key: 'city', type: 'city', emoji: '📍', label: 'Manzil', required: true, max: 160, ask: q('Manzilingiz (qaysi hududda ishlay olasiz)?', 'Ваш адрес (где можете работать)?'), example: 'Toshkent, Sergeli' },
      { key: 'schedule', type: 'text', emoji: '🕐', label: 'Ish vaqti', required: true, max: 120, ask: q('Qaysi vaqtda ishlay olasiz?', 'В какое время можете работать?'), example: '09:00–17:00, dushanba–juma' },
      { key: 'salary', type: 'text', emoji: '💵', label: 'Xizmat haqi', required: true, max: 80, quick: NEGOTIABLE, ask: q('Xizmat haqi?', 'Стоимость услуг?'), example: "6 000 000 so'm yoki kuniga 350 000" },
      { key: 'experience', type: 'long', emoji: '🌟', label: 'Tajriba va malakalar', required: true, max: 1000, ask: q('Tajribangiz va malakalaringiz haqida yozing', 'Расскажите о своём опыте и навыках') },
      PHONE, TG,
    ],
  },
  {
    id: 'job_seek', emoji: '🙋‍♀️', name: q('Ish joyi kerak (rezyume)', 'Ищу работу (резюме)'),
    hint: q("O'zingiz haqingizda qisqa e'lon — ish beruvchilar siz bilan bog'lanadi", 'Короткое объявление о себе — работодатели свяжутся с вами'),
    headline: 'Ish joyi kerak', roles: ['seeker'], tag: 'rezyume',
    fields: [
      { key: 'name', type: 'text', emoji: '👤', label: 'Ism', required: true, max: 80, ask: q('Ism-familiyangiz?', 'Ваше имя и фамилия?') },
      { key: 'age', type: 'age', emoji: '🕑', label: 'Yosh', required: true, ask: q('Yoshingiz?', 'Ваш возраст?') },
      { key: 'title', type: 'text', emoji: '👩‍💻', label: 'Kasbi', title: true, required: true, max: 120, ask: q('Kasbingiz yoki qidirayotgan lavozim?', 'Ваша профессия или желаемая должность?'), example: 'Frontend dasturchi' },
      { key: 'skills', type: 'long', emoji: '📚', label: "Ko'nikmalar", required: true, max: 600, ask: q("Ko'nikmalar / texnologiyalar?", 'Навыки / технологии?'), example: 'HTML, CSS, React, Next.js, TypeScript, Git' },
      { key: 'city', type: 'city', emoji: '🌐', label: 'Hudud', required: true, max: 160, ask: q('Qaysi hududda?', 'В каком регионе?') },
      { key: 'salary', type: 'text', emoji: '💰', label: 'Kutilayotgan maosh', max: 80, quick: [...NEGOTIABLE, o('Amaliyot uchun', '🎓 Amaliyot uchun', '🎓 Для стажировки')], ask: q('Kutilayotgan maosh?', 'Ожидаемая зарплата?') },
      { key: 'contact_time', type: 'text', emoji: '🕰', label: 'Murojaat vaqti', max: 60, ask: q("Qaysi vaqtda bog'lanish mumkin?", 'Когда можно связаться?'), example: '09:00–20:00' },
      { key: 'goal', type: 'long', emoji: '🔎', label: 'Maqsad', max: 600, ask: q('Maqsadingiz?', 'Ваша цель?'), example: "Amaliyot o'tab tajriba orttirmoqchiman" },
      PHONE, TG,
    ],
  },
  {
    id: 'mentor', emoji: '🎓', name: q('Shogird kerak (ustoz)', 'Ищу учеников (наставник)'),
    hint: q("Bilimingizni o'rgatmoqchi bo'lsangiz — shogird qidirish", 'Если хотите обучать — поиск учеников'),
    headline: 'Shogird kerak', roles: ['employer', 'seeker'], tag: 'ustoz',
    fields: [
      { key: 'name', type: 'text', emoji: '🎓', label: 'Ustoz', required: true, max: 80, ask: q('Ism-familiyangiz?', 'Ваше имя и фамилия?') },
      { key: 'title', type: 'text', emoji: '👩‍🏫', label: "Yo'nalish", title: true, required: true, max: 120, ask: q("Qaysi yo'nalishda o'rgatasiz?", 'По какому направлению обучаете?'), example: 'Frontend dasturlash' },
      { key: 'skills', type: 'long', emoji: '📚', label: 'Texnologiyalar', max: 600, ask: q('Qaysi mavzu/texnologiyalarni o\'rgatasiz?', 'Какие темы/технологии преподаёте?') },
      { key: 'city', type: 'city', emoji: '🌐', label: 'Hudud', required: true, max: 160, ask: q('Hudud (yoki onlayn)?', 'Регион (или онлайн)?') },
      { key: 'salary', type: 'text', emoji: '💰', label: 'Narxi', required: true, max: 80, quick: [o('Bepul', '🆓 Bepul', '🆓 Бесплатно')], ask: q("O'qish narxi?", 'Стоимость обучения?'), example: "450 000 so'm / oy" },
      { key: 'goal', type: 'long', emoji: '🔎', label: 'Maqsad', max: 600, ask: q('Qisqacha: kimlar uchun, qanday natija?', 'Коротко: для кого и какой результат?') },
      PHONE, TG,
    ],
  },
]

export const templateById = (id: string) => AD_TEMPLATES.find((t) => t.id === id)

// ---- tekshirish ----

export type AdFields = Record<string, string>
const CAT_IDS = new Set(CATEGORIES.map((c) => c.id))

export function normalizeTg(v: string) {
  const s = v.trim().replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '')
  return /^[A-Za-z][A-Za-z0-9_]{3,31}$/.test(s) ? '@' + s : null
}

// Bot yuborgan javoblarni shablon bo'yicha tozalaydi; xato bo'lsa — maydon kaliti va sababi
export function cleanFields(tpl: AdTemplate, raw: Record<string, unknown>): { fields: AdFields; errors: Record<string, string> } {
  const fields: AdFields = {}
  const errors: Record<string, string> = {}
  for (const f of tpl.fields) {
    let v = String(raw[f.key] ?? '').replace(/\r/g, '').trim()
    if (!v) {
      if (f.required) errors[f.key] = "to'ldirilishi shart"
      continue
    }
    if (f.max && v.length > f.max) { errors[f.key] = `${f.max} belgidan oshmasin`; continue }
    if (f.type === 'phone') {
      const p = normalizeUzPhone(v)
      if (!p) { errors[f.key] = "telefon raqami noto'g'ri"; continue }
      v = formatUzPhone(p)
    } else if (f.type === 'tg') {
      const t = normalizeTg(v)
      if (!t) { errors[f.key] = "Telegram manzil noto'g'ri"; continue }
      v = t
    } else if (f.type === 'choice') {
      if (!f.options!.some((x) => x.v === v)) { errors[f.key] = "ro'yxatdan tanlang"; continue }
    } else if (f.type === 'category') {
      if (!CAT_IDS.has(v)) { errors[f.key] = "ro'yxatdan tanlang"; continue }
    } else if (f.type === 'age') {
      const n = Number(v)
      if (!Number.isInteger(n) || n < 14 || n > 80) { errors[f.key] = 'yosh 14–80 oralig\'ida'; continue }
      v = String(n)
    }
    fields[f.key] = v
  }
  if (!fields.phone && !fields.tg && !errors.phone) errors.phone = 'telefon yoki Telegram — kamida bittasi kerak'
  return { fields, errors }
}

// ---- avtomatik ogohlantirishlar (admin panelda ko'rinadi) ----
const RULES: [RegExp, string][] = [
  [/(to['ʻ‘’`]?lov|pul)\s*(qilib|to['ʻ‘’`]?lab|to['ʻ‘’`]?laysiz|to['ʻ‘’`]?lash\s+kerak)|pullik\s+amaliyot|amaliyot\s+(narxi|pullik|uchun\s+to['ʻ‘’`]?lov)|oldindan\s+to['ʻ‘’`]?lov|depozit|zalog|предоплат|платн\w+\s+стажир/i,
    "Nomzoddan pul so'ralmoqda — firibgarlik belgisi (Foydalanish shartlari 4-band)"],
  [/(t\.me\/(?!joinchat)|@)[a-z0-9_]{4,}\s*(kanal|guruh|канал)|kanaliga\s+(ulan|qo['ʻ]shil|obuna)/i, 'Boshqa kanal/guruh reklamasi bor'],
  [/xorij(ga)?\s+(ish|ishga)|chet\s*el(ga)?\s+ish|за\s*границ/i, "Xorijga ishga jo'natish — litsenziyani tekshiring"],
  [/(yosh|возраст)\s*:?\s*(1[0-5])\b/i, "Voyaga yetmagan bo'lishi mumkin"],
]

export function adWarnings(fields: AdFields): string[] {
  const text = Object.values(fields).join('\n')
  return RULES.filter(([re]) => re.test(text)).map(([, msg]) => msg)
}

// ---- kanal posti ----

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const hashtag = (s: string) => '#' + s.replace(/['ʻʼ‘’`]/g, '').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '')
const bullets = (v: string) => v.split('\n').map((l) => l.replace(/^[\s\-•*✅😊▫️◽️]+/u, '').trim()).filter(Boolean).map((l) => `• ${esc(l)}`).join('\n')

export function valueLabel(tpl: AdTemplate, key: string, v: string) {
  const f = tpl.fields.find((x) => x.key === key)
  if (f?.type === 'category') return catName(v)
  return v // tanlov qiymatlari emojisiz o'zbekcha nom (Enaga, Masofaviy…)
}

export function adTitle(tpl: AdTemplate, fields: AdFields) {
  const f = tpl.fields.find((x) => x.title)
  return f && fields[f.key] ? valueLabel(tpl, f.key, fields[f.key]) : tpl.headline
}

// Kanalga yuboriladigan HTML: sarlavha, qisqa maydonlar, ro'yxatlar, aloqa, havola, heshteglar
export function renderAdPost(tpl: AdTemplate, fields: AdFields, opts: { number?: number; link?: string; footer?: string } = {}) {
  if (tpl.layout === 'card') return renderCard(tpl, fields, opts)
  const head = `${tpl.emoji} <b>${esc(tpl.headline)}: ${esc(adTitle(tpl, fields))}</b>`
  const short: string[] = []
  const long: string[] = []
  const contact: string[] = []
  for (const f of tpl.fields) {
    const v = fields[f.key]
    if (!v || f.title) continue
    if (f.key === 'phone' || f.key === 'tg' || f.key === 'contact_person') contact.push(`${f.emoji} ${f.label}: ${esc(v)}`)
    else if (f.type === 'long') long.push(`${f.emoji} <b>${f.label}:</b>\n${bullets(v)}`)
    else short.push(`${f.emoji} ${f.label}: ${esc(valueLabel(tpl, f.key, v))}`)
  }
  const tags = [hashtag(tpl.tag), fields.category && hashtag(catName(fields.category)), fields.city && hashtag(fields.city.split(/[,\s]/)[0])].filter(Boolean)
  const blocks = [head, short.join('\n'), ...long, contact.join('\n'), opts.link ? `🔗 Batafsil: ${esc(opts.link)}` : '', tags.join(' '), opts.footer || '']
  return blocks.filter(Boolean).join('\n\n')
}

// Kartochka: sarlavha, har maydon "emoji <b>Nom:</b> qiymat" (ko'p qatorli javob — keyingi qatordan), oxirida murojaat
function renderCard(tpl: AdTemplate, fields: AdFields, opts: { link?: string; footer?: string }) {
  const line = (f: Field) => {
    const v = esc(valueLabel(tpl, f.key, fields[f.key]))
    return `${f.emoji} <b>${esc(f.label)}:</b>${v.includes('\n') ? '\n' : ' '}${v}`
  }
  const body = tpl.fields.filter((f) => fields[f.key] && f.key !== 'phone' && f.key !== 'tg').map(line)
  const contact = tpl.fields.filter((f) => fields[f.key] && (f.key === 'phone' || f.key === 'tg')).map(line)
  const tags = [hashtag(tpl.tag), fields.city && hashtag(fields.city.split(/[,\s]/)[0])].filter(Boolean)
  const blocks = [`${tpl.emoji} <b>${esc(tpl.headline)}</b>`, body.join('\n'), contact.join('\n'), opts.link ? `🔗 Batafsil: ${esc(opts.link)}` : '', tags.join(' '), opts.footer || '']
  return blocks.filter(Boolean).join('\n\n')
}

// Vakansiya turidagi e'londan saytdagi vakansiya maydonlari
export function adToJob(tpl: AdTemplate, f: AdFields) {
  const nums = (f.salary || '').replace(/(\d)[\s.,](?=\d{3}\b)/g, '$1').match(/\d{5,}/g)?.map(Number) || []
  const usd = /\$|usd|dollar/i.test(f.salary || '')
  const city = CITIES.find((c) => (f.city || '').toLowerCase().startsWith(c.toLowerCase().slice(0, 4))) || (f.city || '').split(',')[0].trim() || 'Toshkent'
  const type = f.format === 'Masofaviy' ? 'Masofaviy' : f.format === 'Gibrid' ? 'Gibrid' : f.employment === 'Yarim stavka' ? 'Yarim stavka' : "To'liq stavka"
  const lines = (v?: string) => (v ? v.split('\n').map((l) => l.replace(/^[\s\-•*✅😊]+/u, '').trim()).filter(Boolean).slice(0, 30) : [])
  const desc = [f.company && tpl.id === 'it_vacancy' ? f.company : '', f.tech && `Texnologiyalar: ${f.tech}`, f.tasks && `Vazifalar:\n${f.tasks}`, f.schedule && `Ish vaqti: ${f.schedule}`, f.languages && `Tillar: ${f.languages}`]
    .filter(Boolean).join('\n\n')
  return {
    title: f.title,
    companyName: (f.company || 'AyolQadami').split('—')[0].trim().slice(0, 120),
    category: tpl.id === 'it_vacancy' ? 'it' : f.category || 'other',
    city,
    district: f.city && f.city !== city ? f.city.slice(0, 80) : null,
    salaryFrom: usd ? 0 : nums[0] || 0,
    salaryTo: usd ? 0 : nums[1] || 0,
    type,
    experience: Number((f.experience || '').match(/\d/)?.[0] || 0),
    skills: (f.tech || '').split(/[,;\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 30),
    description: desc.slice(0, 5000),
    requirements: lines(f.requirements),
    conditions: lines(f.conditions),
    details: { contact: { name: f.contact_person, phone: f.phone, telegram: f.tg }, salaryText: f.salary, schedule: f.schedule },
  }
}

// Botga yuboriladigan shakl (savollar, variantlar). Kategoriya va shaharlar ham shu yerdan
export function templatesForBot() {
  return {
    templates: AD_TEMPLATES.map(({ id, emoji, name, hint, headline, roles, layout, fields }) => ({ id, emoji, name, hint, headline, roles, layout: layout || null, fields })),
    categories: CATEGORIES.map((c) => ({ v: c.id, uz: c.name, ru: c.name })),
    cities: CITIES,
  }
}
