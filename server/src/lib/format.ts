// Ko'rinish uchun yordamchilar (API va admin UI)
export const formatSum = (n: number | null | undefined) =>
  (Number(n) || 0).toLocaleString('ru-RU').replace(/[,  ]/g, ' ')

export const salaryText = (from: number, to: number) =>
  from && to ? `${formatSum(from)} – ${formatSum(to)} so'm` : from ? `${formatSum(from)} so'mdan` : 'Kelishilgan holda'

export const compactSum = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)} mln` : n >= 1e3 ? `${Math.round(n / 1e3)} ming` : String(n)

// Web ilova ko'rsatadigan "2 soat oldin" ko'rinishi
export function timeAgo(d: Date | string | null | undefined, now = Date.now()): string {
  if (!d) return ''
  const s = Math.max(0, Math.round((now - new Date(d).getTime()) / 1000))
  if (s < 60) return 'Hozirgina'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} daqiqa oldin`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} soat oldin`
  const days = Math.floor(h / 24)
  if (days === 1) return 'Kecha'
  if (days < 7) return `${days} kun oldin`
  if (days < 30) return `${Math.floor(days / 7)} hafta oldin`
  return shortDate(d)
}

export const shortDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Tashkent' })

export const dateTime = (d: Date | string) =>
  new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' })
