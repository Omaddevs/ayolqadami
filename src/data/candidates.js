// Demo nomzodlar — ish izlovchi rezyume ustasida to'ldiradigan maydonlar bilan bir xil tuzilmada.
// Aloqa ma'lumotlari namunaviy (demo.ayolqadami.uz domeni, 000 raqamlar).
import { EMPLOYMENT, WORK_MODES, monthText, findRegion } from './resume'

const COLORS = ['#6366F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#3B82F6', '#EC4899', '#F59E0B']
const H = 'Yuqori daraja', M = "O'rta daraja", B = "Boshlang'ich"

const RAW = [
  {
    id: 'c1', lastName: 'Rahimova', firstName: 'Malika', middleName: 'Akmal qizi', birthDate: '1996-04-12',
    phone: '+998 90 000 01 01', email: 'malika.rahimova@demo.ayolqadami.uz', telegram: '@malika_dev',
    region: 'tashkent-city', district: 'Chilonzor', mahalla: 'Novza', relocate: false,
    category: 'it', headline: 'Frontend dasturchi', expLevel: '3-5', years: 3, salary: 12000000,
    employment: ['full'], workMode: ['hybrid', 'remote'], workTime: ['flex'],
    about: "3 yildan beri React bilan ishlayman: internet-do'kon va to'lov tizimi interfeyslarini yaratganman. Kichik qizim bor, shuning uchun gibrid formatni afzal ko'raman. Toza kod va jamoada ishlashni qadrlayman.",
    experience: [
      { role: 'Frontend dasturchi', company: 'Click Soft', from: '2022-03', current: true,
        desc: "To'lov ilovasining veb-kabinetini React va TypeScript'da yozdim.\nSahifalar yuklanish tezligini 40% ga oshirdim." },
      { role: 'Frontend stajyor', company: 'IT Park', from: '2021-06', to: '2022-02', desc: 'Startaplar uchun landing sahifalar, HTML/CSS va JavaScript.' },
    ],
    careerBreak: '',
    educations: [{ level: 'Oliy — bakalavr', school: 'Toshkent axborot texnologiyalari universiteti', faculty: 'Dasturiy injiniring', from: '2014', to: '2018' }],
    certificates: [{ name: 'Meta Front-End Developer', org: 'Coursera', year: '2022' }, { name: 'IELTS 6.5', org: 'British Council', year: '2021' }],
    skillsDetail: [{ name: 'React', level: H }, { name: 'JavaScript', level: H }, { name: 'TypeScript', level: M }, { name: 'CSS', level: H }, { name: 'Figma', level: M }],
    langs: [{ lang: "O'zbek tili", level: 'native' }, { lang: 'Rus tili', level: 'C1' }, { lang: 'Ingliz tili', level: 'B2' }],
    driving: ['B'], searchStatus: 'open',
  },
  {
    id: 'c2', lastName: 'Karimova', firstName: 'Dilnoza', middleName: 'Baxtiyor qizi', birthDate: '1990-09-03',
    phone: '+998 90 000 01 02', email: 'dilnoza.karimova@demo.ayolqadami.uz', telegram: '@dilnoza_buh',
    region: 'tashkent-city', district: 'Yunusobod', mahalla: 'Bodomzor', relocate: false,
    category: 'finance', headline: 'Buxgalter, 1C mutaxassisi', expLevel: '5+', years: 6, salary: 10000000,
    employment: ['full', 'part'], workMode: ['office', 'hybrid'], workTime: ['fullday'],
    about: "6 yillik buxgalterlik tajribasi: birlamchi hujjatlardan yillik hisobotgacha. 1C:Buxgalteriya, soliq hisobotlari va Didox bilan erkin ishlayman. Tekshiruvlardan jarimasiz o'tganmiz.",
    experience: [
      { role: 'Bosh buxgalter', company: 'Agro Invest', from: '2020-02', current: true,
        desc: "3 ta yuridik shaxsning hisobini yuritaman.\nOylik va choraklik soliq hisobotlari, ish haqi hisoblash." },
      { role: 'Buxgalter', company: 'Savdo Group', from: '2018-01', to: '2020-01', desc: 'Kassa operatsiyalari, ombor hisobi, kontragentlar bilan solishtirma.' },
    ],
    careerBreak: '',
    educations: [{ level: 'Oliy — bakalavr', school: 'Toshkent davlat iqtisodiyot universiteti', faculty: 'Buxgalteriya hisobi va audit', from: '2008', to: '2012' }],
    certificates: [{ name: '1C: Buxgalteriya 8.3 — professional', org: '1C markazi', year: '2019' }, { name: 'Malakali buxgalter (DipIFR asoslari)', org: 'Raqamli Moliya', year: '2023' }],
    skillsDetail: [{ name: '1C', level: H }, { name: 'Buxgalteriya', level: H }, { name: 'Soliq hisoboti', level: H }, { name: 'Excel', level: H }, { name: 'Audit', level: M }],
    langs: [{ lang: "O'zbek tili", level: 'native' }, { lang: 'Rus tili', level: 'C1' }],
    driving: [], searchStatus: 'active',
  },
  {
    id: 'c3', lastName: 'Toshpulatova', firstName: 'Zarina', middleName: 'Olim qizi', birthDate: '1995-01-25',
    phone: '+998 90 000 01 03', email: 'zarina.t@demo.ayolqadami.uz', telegram: '',
    region: 'samarkand', district: 'Samarqand sh.', mahalla: 'Registon', relocate: false,
    category: 'med', headline: 'Hamshira', expLevel: '3-5', years: 4, salary: 6000000,
    employment: ['full'], workMode: ['shift'], workTime: ['morning', 'fullday'],
    about: "Terapiya va pediatriya bo'limlarida 4 yil ishlaganman. Ukol, tomchi dori, bemor parvarishi va tibbiy hujjatlarni yuritishni yaxshi bilaman. Faqat kunduzgi smena ma'qul.",
    experience: [
      { role: 'Hamshira (pediatriya)', company: 'Samarqand viloyat bolalar shifoxonasi', from: '2021-09', current: true, desc: "Kuniga 20–25 nafar kichik bemorga muolaja.\nOta-onalarga parvarish bo'yicha maslahat." },
      { role: 'Hamshira (terapiya)', company: 'Samarqand shahar poliklinikasi', from: '2019-08', to: '2021-08', desc: '' },
    ],
    careerBreak: '',
    educations: [{ level: "O'rta maxsus (kollej, texnikum)", school: 'Samarqand tibbiyot kolleji', faculty: 'Hamshiralik ishi', from: '2015', to: '2018' }],
    certificates: [{ name: 'Birinchi tibbiy yordam (BLS)', org: "Qizil Yarim Oy jamiyati", year: '2023' }],
    skillsDetail: [{ name: 'Hamshiralik', level: H }, { name: 'Birinchi yordam', level: H }, { name: 'Bemor parvarishi', level: H }, { name: 'Laboratoriya', level: M }],
    langs: [{ lang: "O'zbek tili", level: 'native' }, { lang: 'Rus tili', level: 'B1' }, { lang: 'Tojik tili', level: 'B2' }],
    driving: [], searchStatus: 'active',
  },
  {
    id: 'c4', lastName: 'Yusupova', firstName: 'Nodira', middleName: 'Rustam qizi', birthDate: '1993-06-18',
    phone: '+998 90 000 01 04', email: 'nodira.yusupova@demo.ayolqadami.uz', telegram: '@nodira_ielts',
    region: 'tashkent-city', district: "Mirzo Ulug'bek", mahalla: '', relocate: false,
    category: 'edu', headline: "Ingliz tili o'qituvchisi, IELTS 8.0", expLevel: '5+', years: 5, salary: 9000000,
    employment: ['part'], workMode: ['remote', 'office'], workTime: ['afternoon', 'weekend'],
    about: "IELTS 8.0. 200 dan ortiq o'quvchini imtihonga tayyorlaganman, o'rtacha natija — 6.5. Ikki farzandim bor, shuning uchun tushdan keyingi va dam olish kunlari darslari menga qulay.",
    experience: [
      { role: "Ingliz tili o'qituvchisi", company: 'Cambridge Learning Centre', from: '2019-09', current: true, desc: 'IELTS va General English guruhlari (8–12 kishi).\nMock imtihonlar tashkil qilish.' },
    ],
    careerBreak: "2017–2019 — bola parvarishi ta'tili",
    educations: [
      { level: 'Oliy — bakalavr', school: "O'zbekiston davlat jahon tillari universiteti", faculty: 'Ingliz filologiyasi', from: '2011', to: '2015' },
    ],
    certificates: [{ name: 'IELTS Academic 8.0', org: 'British Council', year: '2022' }, { name: 'CELTA', org: 'Cambridge Assessment English', year: '2020' }],
    skillsDetail: [{ name: 'Ingliz tili', level: H }, { name: 'IELTS', level: H }, { name: "O'qitish metodikasi", level: H }, { name: 'Onlayn darslar', level: M }],
    langs: [{ lang: "O'zbek tili", level: 'native' }, { lang: 'Ingliz tili', level: 'C1' }, { lang: 'Rus tili', level: 'B2' }],
    driving: [], searchStatus: 'active',
  },
  {
    id: 'c5', lastName: 'Ergasheva', firstName: 'Gulnora', middleName: 'Sobir qizi', birthDate: '1985-11-02',
    phone: '+998 90 000 01 05', email: '', telegram: '',
    region: 'fergana', district: "Marg'ilon sh.", mahalla: 'Atlas', relocate: false,
    category: 'production', headline: 'Tikuvchi-bichuvchi', expLevel: '5+', years: 8, salary: 6000000,
    employment: ['full', 'part'], workMode: ['office', 'home'], workTime: ['morning', 'flex'],
    about: "8 yillik tajriba: ayollar va bolalar kiyimlari, milliy liboslar. O'lchov bo'yicha bichaman, overlok va to'g'ri chok mashinalarida ishlayman. Uyda buyurtma olish imkonim ham bor.",
    experience: [
      { role: 'Tikuvchi-bichuvchi', company: "Farg'ona Tekstil", from: '2016-03', current: true, desc: "Kuniga 30–40 dona mahsulot, sifat nazorati bo'yicha brigada boshlig'i o'rinbosari." },
      { role: 'Tikuvchi', company: 'Atlas ustaxonasi', from: '2013-05', to: '2016-02', desc: '' },
    ],
    careerBreak: '',
    educations: [{ level: "O'rta maxsus (kollej, texnikum)", school: "Farg'ona yengil sanoat kolleji", faculty: 'Kiyim konstruksiyalash', from: '2001', to: '2004' }],
    certificates: [],
    skillsDetail: [{ name: 'Tikuvchilik', level: H }, { name: 'Bichish', level: H }, { name: 'Overlok', level: H }, { name: 'Konstruksiyalash', level: M }],
    langs: [{ lang: "O'zbek tili", level: 'native' }],
    driving: [], searchStatus: 'active',
  },
  {
    id: 'c6', lastName: 'Aliyeva', firstName: 'Sevara', middleName: 'Jamshid qizi', birthDate: '1999-02-14',
    phone: '+998 90 000 01 06', email: 'sevara.smm@demo.ayolqadami.uz', telegram: '@sevara_smm',
    region: 'bukhara', district: 'Buxoro sh.', mahalla: '', relocate: true,
    category: 'sales', headline: 'SMM va kontent menejer', expLevel: '1-3', years: 2, salary: 6000000,
    employment: ['full', 'part'], workMode: ['remote'], workTime: ['flex'],
    about: "Uydan ishlayman, 10 dan ortiq brendning Instagram va Telegram sahifalarini yuritganman. Kontent-reja, Reels, target reklama va hisobotlar. Bitta mijoz sahifasini 3 oyda 2k dan 15k obunachiga olib chiqqanman.",
    experience: [
      { role: 'SMM menejer (frilans)', company: "Mustaqil — 10+ mijoz", from: '2022-05', current: true, desc: "Kafe, go'zallik saloni va o'quv markazlari sahifalari.\nOylik kontent-reja, Reels montaj, target." },
      { role: 'Kontent yozuvchi', company: 'Buxoro Times', from: '2021-07', to: '2022-04', desc: '' },
    ],
    careerBreak: '',
    educations: [{ level: 'Oliy — bakalavr', school: 'Buxoro davlat universiteti', faculty: 'Jurnalistika', from: '2017', to: '2021' }],
    certificates: [{ name: 'SMM va shaxsiy brend', org: 'AyolQadami Academy', year: '2024' }],
    skillsDetail: [{ name: 'SMM', level: H }, { name: 'Instagram', level: H }, { name: 'Kontent', level: H }, { name: 'Canva', level: H }, { name: 'Target reklama', level: M }],
    langs: [{ lang: "O'zbek tili", level: 'native' }, { lang: 'Rus tili', level: 'B2' }, { lang: 'Ingliz tili', level: 'B1' }],
    driving: [], searchStatus: 'active',
  },
  {
    id: 'c7', lastName: 'Saidova', firstName: 'Kamola', middleName: 'Ilhom qizi', birthDate: '1994-08-30',
    phone: '+998 90 000 01 07', email: 'kamola.design@demo.ayolqadami.uz', telegram: '@kamola_ux',
    region: 'tashkent-city', district: 'Yakkasaroy', mahalla: '', relocate: false,
    category: 'it', headline: 'UI/UX dizayner', expLevel: '3-5', years: 4, salary: 14000000,
    employment: ['full'], workMode: ['remote', 'hybrid'], workTime: ['fullday', 'flex'],
    about: "Fintech va e-commerce mahsulotlari uchun interfeyslar loyihalayman: tadqiqotdan dizayn tizimigacha. Figma'da komponentlar kutubxonasini noldan qurganman. Dasturchilar bilan yaqin ishlashni yaxshi ko'raman.",
    experience: [
      { role: 'Product dizayner', company: 'Uzum Studio', from: '2021-04', current: true, desc: "Mobil ilovaning to'lov oqimini qayta loyihaladim — konversiya 18% oshdi.\nDizayn tizimi (200+ komponent)." },
      { role: 'Grafik dizayner', company: 'Samo Design', from: '2019-10', to: '2021-03', desc: 'Brending, ijtimoiy tarmoq bannerlari.' },
    ],
    careerBreak: '',
    educations: [{ level: 'Oliy — bakalavr', school: 'Kamoliddin Behzod nomidagi Milliy rassomlik va dizayn instituti', faculty: 'Grafik dizayn', from: '2012', to: '2016' }],
    certificates: [{ name: 'Google UX Design', org: 'Coursera', year: '2020' }],
    skillsDetail: [{ name: 'Figma', level: H }, { name: 'UI dizayn', level: H }, { name: 'UX tadqiqot', level: M }, { name: 'Prototiplash', level: H }, { name: 'Adobe Illustrator', level: M }],
    langs: [{ lang: "O'zbek tili", level: 'native' }, { lang: 'Ingliz tili', level: 'B2' }, { lang: 'Rus tili', level: 'C1' }],
    driving: ['B'], searchStatus: 'open',
  },
  {
    id: 'c8', lastName: 'Mirzayeva', firstName: 'Shahnoza', middleName: 'Anvar qizi', birthDate: '2001-12-05',
    phone: '+998 90 000 01 08', email: 'shahnoza.py@demo.ayolqadami.uz', telegram: '@shahnoza_py',
    region: 'samarkand', district: 'Urgut', mahalla: '', relocate: true,
    category: 'it', headline: 'Python dasturchi (Junior)', expLevel: 'lt1', years: 1, salary: 7000000,
    employment: ['full', 'intern'], workMode: ['remote', 'office'], workTime: ['fullday'],
    about: "AyolQadami «Python noldan» kursini tamomlaganman, hozir startapda stajirovka o'tyapman. Django'da REST API va Telegram botlar yozaman. Tez o'rganaman, Toshkentga ko'chishga tayyorman.",
    experience: [
      { role: 'Python stajyor', company: 'Startup Hub', from: '2025-02', current: true, desc: "Django REST API, PostgreSQL.\nBuyurtmalar uchun Telegram bot (500+ foydalanuvchi)." },
    ],
    careerBreak: '',
    educations: [
      { level: 'Oliy — bakalavr', school: 'Samarqand davlat universiteti', faculty: 'Amaliy matematika', from: '2019', to: '2023' },
      { level: 'Kasbiy kurslar', school: 'AyolQadami Academy', faculty: 'Python noldan', from: '2024', to: '2024' },
    ],
    certificates: [{ name: 'Python noldan: ayollar uchun dasturlash', org: 'AyolQadami Academy', year: '2024' }],
    skillsDetail: [{ name: 'Python', level: M }, { name: 'Django', level: M }, { name: 'SQL', level: B }, { name: 'Git', level: M }],
    langs: [{ lang: "O'zbek tili", level: 'native' }, { lang: 'Ingliz tili', level: 'B1' }, { lang: 'Rus tili', level: 'A2' }],
    driving: [], searchStatus: 'active',
  },
  {
    id: 'c9', lastName: 'Qodirova', firstName: 'Madina', middleName: 'Shavkat qizi', birthDate: '1992-03-21',
    phone: '+998 90 000 01 09', email: 'madina.cosmo@demo.ayolqadami.uz', telegram: '@madina_cosmo',
    region: 'bukhara', district: "G'ijduvon", mahalla: '', relocate: false,
    category: 'beauty', headline: 'Kosmetolog', expLevel: '5+', years: 5, salary: 9000000,
    employment: ['full', 'part'], workMode: ['office'], workTime: ['fullday', 'weekend'],
    about: "Litsenziyalangan kosmetolog, 5 yillik tajriba. Yuz tozalash, piling, teri turiga mos parvarish dasturlari. Doimiy mijozlarim bor, steril ishlash qoidalariga qat'iy amal qilaman.",
    experience: [
      { role: 'Kosmetolog', company: 'Lola Beauty', from: '2019-06', current: true, desc: "Oyiga 120+ muolaja, doimiy mijozlar ulushi 60%." },
    ],
    careerBreak: '',
    educations: [
      { level: "O'rta maxsus (kollej, texnikum)", school: 'Buxoro tibbiyot kolleji', faculty: 'Hamshiralik ishi', from: '2008', to: '2011' },
      { level: 'Kasbiy kurslar', school: 'Orzu Beauty Academy', faculty: 'Professional kosmetologiya', from: '2018', to: '2019' },
    ],
    certificates: [{ name: 'Professional kosmetologiya', org: 'Orzu Beauty Academy', year: '2019' }],
    skillsDetail: [{ name: 'Kosmetologiya', level: H }, { name: 'Yuz parvarishi', level: H }, { name: 'Mijozlar bilan ishlash', level: H }],
    langs: [{ lang: "O'zbek tili", level: 'native' }, { lang: 'Rus tili', level: 'B1' }],
    driving: [], searchStatus: 'open',
  },
  {
    id: 'c10', lastName: 'Nazarova', firstName: 'Feruza', middleName: "Qahramon qizi", birthDate: '1997-07-09',
    phone: '+998 90 000 01 10', email: 'feruza.sales@demo.ayolqadami.uz', telegram: '@feruza_sales',
    region: 'andijan', district: 'Asaka', mahalla: '', relocate: false,
    category: 'sales', headline: "Sotuv bo'yicha menejer", expLevel: '1-3', years: 3, salary: 7000000,
    employment: ['full'], workMode: ['office'], workTime: ['fullday'],
    about: "Mebel va maishiy texnika sotuvida 3 yil. Sotuv rejasini doimiy ravishda 120% bajaraman, CRM'da mijozlar bazasini yuritaman. Telefon orqali sotuv va qayta aloqa — kuchli tomonim.",
    experience: [
      { role: 'Sotuv menejeri', company: 'Mebel Market', from: '2021-10', current: true, desc: "Oylik reja 120%+, 2024-yil «Eng yaxshi menejer»." },
      { role: 'Sotuvchi-maslahatchi', company: 'Texnomart', from: '2020-06', to: '2021-09', desc: '' },
    ],
    careerBreak: '',
    educations: [{ level: 'Oliy — bakalavr', school: 'Andijon davlat universiteti', faculty: 'Iqtisodiyot', from: '2015', to: '2019' }],
    certificates: [],
    skillsDetail: [{ name: 'Sotuv', level: H }, { name: 'Muloqot', level: H }, { name: 'CRM', level: M }, { name: 'Telefon orqali sotuv', level: H }],
    langs: [{ lang: "O'zbek tili", level: 'native' }, { lang: 'Rus tili', level: 'B2' }],
    driving: ['B'], searchStatus: 'active',
  },
]

// Rezyume maydonlaridan ro'yxatlar, qidiruv va QadamAI ishlatadigan qisqa maydonlar hosil qilinadi
// (ResumeBuilder'dagi toUser bilan bir xil qoida)
const build = (c, i) => {
  const edu = c.educations[0]
  return {
    ...c,
    name: `${c.firstName} ${c.lastName}`,
    city: findRegion(c.region)?.city || 'Toshkent',
    experience: c.experience.map((e) => ({
      to: '', current: false, desc: '', ...e,
      period: `${monthText(e.from)} – ${e.current ? 'hozir' : monthText(e.to)}`,
    })),
    format: [...EMPLOYMENT, ...WORK_MODES].filter((o) => c.employment.includes(o.id) || c.workMode.includes(o.id)).map((o) => o.short),
    skills: c.skillsDetail.map((s) => s.name),
    languages: c.langs.map((l) => (l.level === 'native' ? l.lang.replace(/ tili$/, '') : `${l.lang.replace(/ tili$/, '')} (${l.level})`)),
    education: edu ? [edu.school, edu.faculty].filter(Boolean).join(', ') : '',
    color: COLORS[i % COLORS.length],
  }
}

export const CANDIDATES = RAW.map(build)
