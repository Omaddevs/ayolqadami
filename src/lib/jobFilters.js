// Vakansiya filtrlari — bosh sahifa qidiruvi, mobil filtr oynasi va /jobs sahifasi uchun bitta qoida.
// Holat URL'da saqlanadi (?q=&cat=&sub=&city=&type=&min=&exp=&period=&sort=; sub — soha bo'limi, masalan frontend): havolani ulashish va Google uchun qulay
import { tx } from '../i18n'
import { inPeriod } from './time'

// minimal maosh (so'm, oyiga)
export const SALARY_STEPS = [
  { value: '', label: 'Har qanday maosh' },
  { value: '3000000', label: '3 mln+' },
  { value: '5000000', label: '5 mln+' },
  { value: '8000000', label: '8 mln+' },
  { value: '12000000', label: '12 mln+' },
  { value: '20000000', label: '20 mln+' },
]

// talab qilinadigan tajriba: e'londagi talab tanlangandan oshmasin
export const EXP_STEPS = [
  { value: '', label: 'Har qanday tajriba' },
  { value: '0', label: 'Tajribasiz' },
  { value: '1', label: '1 yilgacha' },
  { value: '3', label: '3 yilgacha' },
  { value: '5', label: '5 yilgacha' },
]

const KEYS = ['q', 'cat', 'sub', 'city', 'type', 'min', 'exp', 'period', 'sort']
export const EMPTY = { q: '', cat: '', sub: '', city: '', type: '', min: '', exp: '', period: '', sort: 'new' }

export const norm = (s) => String(s || '').toLowerCase().replace(/[‘’ʼ`ʻ]/g, "'")

export function readFilters(params) {
  const f = { ...EMPTY }
  for (const k of KEYS) { const v = params.get(k); if (v != null) f[k] = v }
  if (!SALARY_STEPS.some((s) => s.value === f.min)) f.min = ''
  if (!EXP_STEPS.some((s) => s.value === f.exp)) f.exp = ''
  if (!f.cat) f.sub = '' // bo'lim faqat soha ichida
  return f
}

// bo'sh va standart qiymatlar URL'ga yozilmaydi
export function filtersToSearch(f) {
  const p = new URLSearchParams()
  for (const k of KEYS) {
    const v = String(f[k] ?? '').trim()
    if (v && !(k === 'sort' && v === 'new')) p.set(k, v)
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

// qidiruv so'zidan tashqari nechta filtr tanlangan (tugma ustidagi raqam uchun)
export const activeCount = (f) => ['cat', 'city', 'type', 'min', 'exp', 'period'].filter((k) => f[k]).length

// maosh: e'lonning yuqori chegarasi (yoki «...dan» bo'lsa — quyi chegarasi) tanlangan minimumdan kam bo'lmasin.
// «Kelishilgan holda» (maosh ko'rsatilmagan) e'lonlar maosh filtri tanlanganda chiqmaydi
const salaryOk = (j, min) => {
  if (!min) return true
  const top = Number(j.salaryTo || j.salaryFrom || 0)
  return top >= Number(min)
}
const expOk = (j, exp) => exp === '' || (Number(j.experience) || 0) <= Number(exp)

export function matchJob(j, f) {
  const nq = norm(f.q.trim())
  return (!f.cat || j.category === f.cat) &&
    (!f.sub || j.subcategory === f.sub) &&
    (!f.city || norm(j.city).includes(norm(f.city)) || norm(j.region).includes(norm(f.city))) &&
    (!f.type || j.type === f.type) &&
    salaryOk(j, f.min) &&
    expOk(j, f.exp) &&
    inPeriod(j, f.period) &&
    (!nq || norm(`${j.title} ${j.company} ${(j.skills || []).join(' ')} ${(j.tags || []).join(' ')} ${j.city}`).includes(nq) || norm(tx(j.title)).includes(nq))
}

export function filterJobs(jobs, f, time) {
  const r = jobs.filter((j) => matchJob(j, f))
  const ts = (j) => time(j)?.getTime() || 0
  if (f.sort === 'popular') return r.sort((a, b) => (b.views || 0) - (a.views || 0) || ts(b) - ts(a))
  if (f.sort === 'liked') return r.sort((a, b) => (b.likes || 0) - (a.likes || 0) || ts(b) - ts(a))
  if (f.sort === 'salary') return r.sort((a, b) => (b.salaryTo || b.salaryFrom || 0) - (a.salaryTo || a.salaryFrom || 0))
  if (f.sort === 'few') return r.sort((a, b) => (a.applicants || 0) - (b.applicants || 0))
  return r.sort((a, b) => ts(b) - ts(a))
}
