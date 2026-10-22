import { tr } from '../i18n'

// Vakansiya qachon joylangani: serverdagi publishedAt bo'yicha brauzerda hisoblanadi (har doim yangi, joriy tilda).
// publishedAt bo'lmasa (bot/oflayn e'lonlar) — tayyor matn (job.posted)
export const postedAt = (job) => {
  const d = job?.publishedAt ? new Date(job.publishedAt) : null
  return d && !Number.isNaN(d.getTime()) ? d : null
}

export function timeAgo(d, now = Date.now()) {
  const s = Math.max(0, Math.round((now - d.getTime()) / 1000))
  if (s < 60) return tr('Hozirgina')
  const m = Math.floor(s / 60)
  if (m < 60) return tr('{n} daqiqa oldin', { n: m })
  const h = Math.floor(m / 60)
  if (h < 24) return tr('{n} soat oldin', { n: h })
  const days = Math.floor(h / 24)
  if (days === 1) return tr('Kecha')
  if (days < 7) return tr('{n} kun oldin', { n: days })
  if (days < 30) return tr('{n} hafta oldin', { n: Math.floor(days / 7) })
  return fullDate(d)
}

export const postedText = (job) => {
  const d = postedAt(job)
  return d ? timeAgo(d) : tr(job?.posted || '')
}

const pad = (n) => String(n).padStart(2, '0')
export const fullDate = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
export const fullDateTime = (d) => `${fullDate(d)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`

// 1200 → 1,2k — kartadagi kichik hisoblagichlar uchun
export const compactNum = (n) => {
  const v = Number(n) || 0
  if (v < 1000) return String(v)
  if (v < 1e6) return `${(v / 1000).toFixed(v < 1e4 ? 1 : 0).replace(/\.0$/, '').replace('.', ',')}k`
  return `${(v / 1e6).toFixed(1).replace(/\.0$/, '').replace('.', ',')}M`
}

// "Joylangan vaqti" filtri: kalit → soatlar
export const PERIODS = [
  { value: '', label: 'Istalgan vaqt' },
  { value: '24h', label: 'Oxirgi 24 soat', hours: 24 },
  { value: '3d', label: 'Oxirgi 3 kun', hours: 72 },
  { value: '7d', label: 'Oxirgi hafta', hours: 168 },
  { value: '30d', label: 'Oxirgi oy', hours: 720 },
]

// e'lon tanlangan davr ichida joylanganmi (vaqti noma'lum e'lonlar faqat "Istalgan vaqt"da)
export const inPeriod = (job, period, now = Date.now()) => {
  const p = PERIODS.find((x) => x.value === period)
  if (!p?.hours) return true
  const d = postedAt(job)
  return !!d && now - d.getTime() <= p.hours * 3600_000
}
