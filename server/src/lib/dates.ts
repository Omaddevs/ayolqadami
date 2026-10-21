// <input type="date"> ↔ Date, Toshkent vaqti bo'yicha (UTC+5).
// Aks holda UTC ishlatilib, sana bir kunga siljiydi va muddat ertalab soat 5 da tugaydi.

// Date → "YYYY-MM-DD" (Toshkent kalendari bo'yicha)
export const toDateInput = (d: Date | null | undefined) =>
  d ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d) : ''

const valid = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))

// Muddat tugashi: o'sha kunning oxirigacha amal qiladi
export const endOfDayTashkent = (s: string) => (valid(s) ? new Date(`${s}T23:59:59+05:00`) : null)
// Tadbir boshlanishi: o'sha kun boshi
export const startOfDayTashkent = (s: string) => (valid(s) ? new Date(`${s}T00:00:00+05:00`) : null)
