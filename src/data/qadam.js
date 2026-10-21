import { CANDIDATES, CITIES, JOBS } from './mock'

/*
 * QadamAI — MVP uchun lokal moslash (matching) dvigateli.
 * Matnli so'rovdan soha, ko'nikmalar, tajriba, shahar va ish formatini ajratib oladi
 * va har bir nomzod/vakansiyaga 0–99% moslik balini hisoblaydi.
 * Keyinchalik `analyzeQuery` ni backend orqali LLM chaqiruviga almashtirish mumkin.
 */

const norm = (s) => (s || '').toLowerCase().replace(/[‘’ʼ`ʻ']/g, "'")

const CATEGORY_WORDS = {
  office: ['ofis', 'kotiba', 'sekretar', 'administrator', 'hujjat', 'kadrlar', 'ofis-menejer'],
  it: ['dasturchi', 'developer', 'frontend', 'backend', 'react', 'python', 'it ', 'programmist', 'javascript', 'django',
    'dizayner', 'figma', 'ui', 'ux', 'grafik', 'dizayn'],
  finance: ['buxgalter', 'hisobchi', '1c', 'moliya', 'audit', 'soliq', 'iqtisodchi', 'bank'],
  med: ['hamshira', 'shifokor', 'tibbiy', 'vrach', 'doktor', 'laborant', 'tibbiyot', 'farmatsevt', 'stomatolog'],
  edu: ["o'qituvchi", 'ustoz', 'ingliz', 'ielts', 'pedagog', 'repetitor', 'tarbiyachi', "ta'lim", 'logoped'],
  production: ['tikuvchi', 'bichuvchi', 'tikuv', 'overlok', 'tikuvchilik', 'ishlab chiqarish', 'zavod', 'sex', 'fabrika', 'kashtachi'],
  sales: ['sotuv', 'savdo', 'menejer', 'operator', 'kassir', 'sotuvchi', 'mijoz'],
  beauty: ['kosmetolog', 'stilist', 'sartarosh', 'vizajist', "go'zallik", 'manikur', 'manikyur'],
  home: ['maishiy', 'enaga', 'farrosh', 'tozalash', 'uy xizmat', 'hamshira-enaga'],
  remote: ['masofaviy', 'uydan', 'online', 'onlayn', 'remote'],
  food: ['oshpaz', 'restoran', 'ofitsiant', 'mehmonxona', 'qandolatchi', 'kafe', 'barista'],
  marketing: ['marketing', 'smm', 'kontent', 'media', 'jurnalist', 'reklama', 'kopirayter'],
  law: ['yurist', 'huquq', 'advokat', 'notarius', 'yuridik'],
  logistics: ['logist', 'logistika', 'haydovchi', 'transport', 'kuryer', 'ombor', 'yetkazib'],
}

const ALL_SKILLS = [...new Set([...CANDIDATES.flatMap((c) => c.skills), ...JOBS.flatMap((j) => j.skills)])]

export function analyzeQuery(text) {
  const q = norm(text) + ' '
  const categories = Object.entries(CATEGORY_WORDS)
    .filter(([, words]) => words.some((w) => q.includes(w)))
    .map(([id]) => id)
  const skills = ALL_SKILLS.filter((s) => {
    const ns = norm(s)
    return ns.length > 2 ? q.includes(ns) : new RegExp(`\\b${ns}\\b`).test(q)
  })
  const ym = q.match(/(\d+)\s*(\+|yil|yildan|yillik|years?)/)
  const years = ym ? Number(ym[1]) : null
  const city = CITIES.find((c) => q.includes(norm(c).slice(0, 5))) || null
  const remote = /masofa|uydan|onlayn|remote/.test(q)
  const junior = /junior|tajribasiz|yangi boshlovchi|stajyor/.test(q)
  return { categories, skills, years, city, remote, junior }
}

const clamp = (n) => Math.max(12, Math.min(99, Math.round(n)))

export function matchCandidates(text) {
  const a = analyzeQuery(text)
  const results = CANDIDATES.map((c) => {
    let score = 30
    const reasons = []
    if (a.categories.includes(c.category)) { score += 28; reasons.push('Soha mos') }
    const hits = c.skills.filter((s) => a.skills.includes(s))
    if (hits.length) { score += Math.min(hits.length * 9, 27); reasons.push(`Ko'nikmalar: ${hits.join(', ')}`) }
    if (a.years != null) {
      if (c.years >= a.years) { score += 10; reasons.push(`${c.years} yil tajriba`) }
      else score -= (a.years - c.years) * 4
    } else if (a.junior && c.years <= 1) { score += 8; reasons.push("Junior darajaga mos") }
    if (a.city && c.city === a.city) { score += 8; reasons.push(c.city) }
    else if (a.city && !a.remote) score -= 6
    if (a.remote && c.format.includes('Masofaviy')) { score += 8; reasons.push('Masofaviy ishlashga tayyor') }
    if (!a.categories.length && !hits.length) score -= 10
    return { item: c, score: clamp(score), reasons }
  })
  return { analysis: a, results: results.sort((x, y) => y.score - x.score).filter((r) => r.score >= 55).slice(0, 5) }
}

export function matchJobs(text, profile, jobs = JOBS) {
  const a = analyzeQuery(`${text} ${profile?.headline || ''} ${(profile?.skills || []).join(' ')}`)
  const results = jobs.map((j) => {
    let score = 30
    const reasons = []
    if (a.categories.includes(j.category)) { score += 26; reasons.push('Sohangizga mos') }
    const hits = (j.skills || []).filter((s) => a.skills.includes(s))
    if (hits.length) { score += Math.min(hits.length * 9, 27); reasons.push(`Ko'nikmalar: ${hits.join(', ')}`) }
    if (a.city && j.city === a.city) { score += 8; reasons.push(j.city) }
    if (a.remote && (j.type === 'Masofaviy' || j.type === 'Gibrid')) { score += 8; reasons.push(j.type) }
    if (j.tags.some((t) => /onalar|moslashuvchan/i.test(t))) { score += 4; reasons.push('Moslashuvchan sharoit') }
    return { item: j, score: clamp(score), reasons }
  })
  return { analysis: a, results: results.sort((x, y) => y.score - x.score).filter((r) => r.score >= 45).slice(0, 5) }
}

// Misol so'rovlar: pre + hl (ajratilgan qism) + post = to'liq matn; icon/tone — UI uchun
const P = (icon, tone, pre, hl, post = '') => ({ icon, tone, pre, hl, post, text: pre + hl + post })

export const EMPLOYER_PROMPTS = [
  P('briefcase', 'violet', 'Toshkentda 3 yillik tajribali ', 'React dasturchi', ' kerak'),
  P('calculator', 'pink', '', 'Buxgalter', ', 1C va soliq hisobotini biladigan, 5 yil tajriba'),
  P('megaphone', 'sky', 'Masofaviy ', 'SMM menejer', ', Instagram va Canva'),
  P('cap', 'indigo', "IELTS bo'yicha ", "Ingliz tili o'qituvchisi"),
  P('stethoscope', 'mint', 'Klinikaga tajribali ', 'hamshira', ', smenali ish'),
  P('scissors', 'amber', 'Tikuv sexiga ', 'tikuvchi', ', overlok bilan ishlay oladigan'),
  P('palette', 'pink', 'Figma biladigan ', 'UI/UX dizayner', ', portfolio bilan'),
  P('headset', 'sky', 'Call-markazga ', 'operator', ", rus va o'zbek tilida"),
]

export const SEEKER_PROMPTS = [
  P('house', 'violet', '', 'Uydan ishlash', " mumkin bo'lgan ish"),
  P('code', 'indigo', '', 'Frontend dasturchi', ', React'),
  P('cap', 'sky', 'Toshkentda ', "ingliz tili o'qituvchisi"),
  P('sprout', 'mint', '', 'Tajribasiz', ' qabul qilinadigan ish'),
  P('clock', 'amber', '', 'Yarim stavka', ', kunduzgi smena'),
  P('megaphone', 'pink', 'Masofaviy ', 'SMM', ' yoki kontent ishi'),
]

// Joylanayotgan vakansiyaga mos nomzodlar (tuzilgan ma'lumot bo'yicha, matnsiz)
export function matchForVacancy(job) {
  const want = (job.skills || []).map((s) => s.toLowerCase())
  const remote = job.type === 'Masofaviy'
  return CANDIDATES.map((c) => {
    let score = 30
    const reasons = []
    if (job.category && c.category === job.category) { score += 30; reasons.push('Soha mos') }
    const hits = c.skills.filter((s) => want.includes(s.toLowerCase()))
    if (hits.length) { score += Math.min(hits.length * 9, 27); reasons.push(`Ko'nikmalar: ${hits.join(', ')}`) }
    const need = job.experience || 0
    if (c.years >= need) { score += 6; if (need) reasons.push(`${c.years} yil tajriba`) } else score -= (need - c.years) * 5
    if (job.city && c.city === job.city) { score += 8; reasons.push(c.city) } else if (!remote) score -= 8
    if (remote && c.format.includes('Masofaviy')) { score += 6; reasons.push('Masofaviy ishlashga tayyor') }
    if (job.salaryTo && c.salary > job.salaryTo * 1.2) score -= 8
    return { item: c, score: clamp(score), reasons }
  }).filter((r) => r.score >= 55).sort((x, y) => y.score - x.score)
}
