// Shaharlar markazlari [lat, lng] — vakansiyalarni xaritada joylash uchun
export const CITY_COORDS = {
  Toshkent: [41.3111, 69.2797],
  'Toshkent viloyati': [41.0, 69.6],
  Samarqand: [39.6542, 66.9597],
  Buxoro: [39.7681, 64.4556],
  Andijon: [40.7821, 72.3442],
  "Farg'ona": [40.3864, 71.7864],
  Namangan: [40.9983, 71.6726],
  Navoiy: [40.0844, 65.3792],
  Qarshi: [38.8606, 65.7891],
  Nukus: [42.4531, 59.6103],
  Urganch: [41.55, 60.6333],
  Jizzax: [40.1158, 67.8422],
  Guliston: [40.4897, 68.7842],
  Termiz: [37.2242, 67.2783],
}

export const UZ_CENTER = [41.2, 66.0]

// id'dan barqaror son (har safar bir xil joy chiqishi uchun)
const hash = (s) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967295
}

/*
 * Vakansiyalarda aniq manzil yo'q (MVP), shuning uchun har birini o'z shahri atrofida
 * "oltin burchak" spirali bo'yicha tarqatamiz — bir-birining ustiga tushmaydi va joyi o'zgarmaydi.
 * Backend manzil bersa, job.lat / job.lng to'g'ridan-to'g'ri ishlatiladi.
 */
export function placeJobs(jobs) {
  const perCity = {}
  return jobs
    .map((j) => {
      if (j.lat && j.lng) return { ...j, pos: [j.lat, j.lng] }
      const c = CITY_COORDS[j.city]
      if (!c) return null
      const i = (perCity[j.city] = (perCity[j.city] ?? -1) + 1)
      const big = j.city === 'Toshkent'
      const r = (big ? 0.016 : 0.009) * Math.sqrt(i + 0.6) * (0.85 + hash(j.id) * 0.3)
      const a = i * 2.39996 + hash(j.id + 'a') * 0.6
      // longitude kengligi bo'yicha to'g'rilash (41° kenglikda ~1.33)
      return { ...j, pos: [c[0] + r * Math.sin(a), c[1] + r * Math.cos(a) * 1.33] }
    })
    .filter(Boolean)
}

// 3 500 000 → "3,5" (mln)
const mln = (n) => (Math.round((n / 1e6) * 10) / 10).toString().replace('.', ',')

export const salaryShort = (j) =>
  j.salaryFrom && j.salaryTo ? `${mln(j.salaryFrom)}–${mln(j.salaryTo)} mln`
    : j.salaryFrom ? `${mln(j.salaryFrom)} mln+` : 'Kelishiladi'

export const rangeShort = (list) => {
  const from = Math.min(...list.map((j) => j.salaryFrom || Infinity))
  const to = Math.max(...list.map((j) => j.salaryTo || j.salaryFrom || 0))
  return Number.isFinite(from) && to ? `${mln(from)}–${mln(to)} mln` : 'Kelishiladi'
}
