// Kompaniyalar vakansiyalardan yig'iladi: har bir ish beruvchi — o'z e'lonlari bilan.
// Qo'shimcha tavsif (backend bo'lmagani uchun) shu yerda saqlanadi.
export const COMPANY_INFO = {
  NurTech: { about: "Mahalliy biznes uchun veb va mobil ilovalar yaratadigan IT kompaniya. Jamoaning yarmidan ko'pi — ayollar.", size: '50–100', since: 2016 },
  'Raqamli Moliya': { about: "Kichik va o'rta biznesga buxgalteriya va moliyaviy autsorsing xizmatlari.", size: '20–50', since: 2012 },
  'Zarafshon Med': { about: "Samarqanddagi ko'p tarmoqli xususiy klinika. Xodimlarga oilaviy tibbiy xizmat bepul.", size: '100–250', since: 2009 },
  'Bilim Markazi': { about: "Bolalar va kattalar uchun til va fan kurslari. Darslar jadvalini o'qituvchilar o'zi tanlaydi.", size: '20–50', since: 2015 },
  'Gulnor Textile': { about: "Farg'ona vodiysidagi tikuvchilik fabrikasi: bolalar va ayollar kiyimi eksporti.", size: '250+', since: 2005 },
  'Orzu Beauty': { about: "Kosmetika do'konlari tarmog'i va go'zallik saloni. 3 shaharda filiallar.", size: '100–250', since: 2014 },
  'Samo Design': { about: 'Brending, UI/UX va reklama dizayni studiyasi. Masofaviy va gibrid ish formati.', size: '10–20', since: 2018 },
  "Ipak Yo'li Savdo": { about: "Maishiy texnika va oziq-ovqat savdosi bilan shug'ullanuvchi distribyutor.", size: '100–250', since: 2010 },
  'Bank Ishonch': { about: "Tijorat banki. Ayollar tadbirkorligini qo'llab-quvvatlash dasturlari mavjud.", size: '250+', since: 1994 },
  Makro: { about: "Supermarketlar tarmog'i. Smenali va yarim stavkali ish o'rinlari.", size: '250+', since: 2007 },
  'Uzum Market': { about: "O'zbekistonning yirik onlayn savdo platformasi.", size: '250+', since: 2022 },
  'Clean Pro': { about: 'Ofis va xonadonlarni professional tozalash xizmati.', size: '20–50', since: 2017 },
  'Mehr uyi': { about: "Keksalar va bemorlarga uyda parvarish ko'rsatuvchi xizmat.", size: '20–50', since: 2019 },
}

// Shaxsiy (kompaniya bo'lmagan) ish beruvchilar ro'yxatga kirmaydi
const PRIVATE = ['Xususiy oila']

export const companySlug = (name) => encodeURIComponent(name)

// jobs → [{ name, color, jobs, categories, cities, applicants, perks, verified, own, ...info }]
export function buildCompanies(jobs, owner) {
  const map = new Map()
  for (const j of jobs) {
    if (!j.company || PRIVATE.includes(j.company)) continue
    const c = map.get(j.company) || { name: j.company, color: j.color, jobs: [], own: false }
    c.jobs.push(j)
    if (j.own) c.own = true
    map.set(j.company, c)
  }
  return [...map.values()].map((c) => {
    const info = COMPANY_INFO[c.name] || {}
    return {
      ...c,
      ...info,
      about: info.about || (c.own && owner?.company === c.name ? owner.about : ''),
      verified: !c.own,
      categories: [...new Set(c.jobs.map((j) => j.category))],
      cities: [...new Set(c.jobs.map((j) => j.city))],
      applicants: c.jobs.reduce((n, j) => n + (j.applicants || 0), 0),
      perks: [...new Set(c.jobs.flatMap((j) => j.tags || []))],
    }
  })
}
