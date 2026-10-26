// Lokal sinov uchun demo hisob (faqat `npm run dev`, oflayn rejim — VITE_API_URL yo'q).
// Kirish: +998 90 123 45 67 / demo1234. Server bazasida esa: server/ → npx tsx scripts/create-demo-user.ts
export const DEMO_PHONE = '998901234567'
export const DEMO_PASSWORD = 'demo1234'

export const DEMO_USER = {
  role: 'seeker',
  demo: true,
  name: 'Malika Karimova',
  phone: DEMO_PHONE,
  city: 'Toshkent',
  category: 'it',
  categories: ['it', 'marketing', 'office'],
  headline: 'UI/UX dizayner',
  about: "3 yillik tajribaga ega mahsulot dizayneri. Figma, prototiplash va foydalanuvchi tadqiqotlari.",
  skills: ['Figma', 'Prototiplash', 'UX tadqiqot'],
  experience: [{ title: 'UI/UX dizayner', company: 'Media Park', from: '2023-02', to: '' }],
  languages: ["O'zbek", 'Rus', 'Ingliz'],
}

const HOUR = 3600 * 1000
// Kirgandan keyin dashboard bo'sh ko'rinmasin: bir nechta ariza va saqlangan demo vakansiyalar (src/data/demoJobs.js)
export function demoActivity(now = Date.now()) {
  const app = (jobId, hours, status) => ({ jobId, letter: '', date: new Date(now - hours * HOUR).toISOString(), status })
  return {
    saved: ['demo7', 'demo10', 'demo18', 'demo25', 'demo39', 'demo11', 'demo21'],
    applications: [
      app('demo39', 0.2, "Ko'rib chiqilmoqda"),
      app('demo18', 0.75, 'Suhbatga taklif'),
      app('demo10', 5, "Ko'rib chiqilmoqda"),
      app('demo7', 26, 'Rad etildi'),
      app('demo28', 50, "Ko'rib chiqilmoqda"),
    ],
  }
}
