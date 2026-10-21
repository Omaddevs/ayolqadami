// Bazani boshlang'ich ma'lumotlar bilan to'ldiradi. Qayta ishga tushirish xavfsiz (upsert).
//   npm run db:seed                  — admin + kontent + demo foydalanuvchilar
//   SEED_DEMO=false npm run db:seed  — production: faqat admin va kontent (demo foydalanuvchi/arizalarsiz)
import { PrismaClient, type ApplicationStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const db = new PrismaClient()
const data = JSON.parse(readFileSync(path.join(__dirname, 'seed-data.json'), 'utf8'))

const HOUR = 3600_000
// "2 soat oldin" / "Kecha" / "3 kun oldin" / "1 hafta oldin" → sana
function postedToDate(s: string): Date {
  const n = Number(s.match(/\d+/)?.[0] || 1)
  const h = /soat/.test(s) ? n : /Kecha/.test(s) ? 26 : /kun/.test(s) ? n * 24 : /hafta/.test(s) ? n * 168 : 1
  return new Date(Date.now() - h * HOUR)
}

async function seedAdmin() {
  const phone = (process.env.ADMIN_PHONE || '').replace(/\D/g, '')
  const password = process.env.ADMIN_PASSWORD || ''
  if (!/^998\d{9}$/.test(phone) || password.length < 10) {
    console.warn("! ADMIN_PHONE (998XXXXXXXXX) yoki ADMIN_PASSWORD (10+ belgi) berilmagan — admin yaratilmadi")
    return
  }
  const passwordHash = await bcrypt.hash(password, 12)
  await db.user.upsert({
    where: { phone },
    create: { phone, passwordHash, name: process.env.ADMIN_NAME || 'Administrator', role: 'ADMIN' },
    update: { role: 'ADMIN', status: 'ACTIVE' },
  })
  console.log(`✓ admin: +${phone}`)
}

async function seedContent() {
  for (const [name, info] of Object.entries<{ about: string; size?: string; since?: number }>(data.companies)) {
    const color = data.jobs.find((j: { company: string }) => j.company === name)?.color
    await db.company.upsert({
      where: { name },
      create: { name, about: info.about, size: info.size, since: info.since, verified: true, ...(color && { color }) },
      update: {},
    })
  }
  const companies = new Map((await db.company.findMany()).map((c) => [c.name, c.id]))

  for (const j of data.jobs) {
    const publishedAt = postedToDate(j.posted)
    const fields = {
      title: j.title, companyName: j.company, companyId: companies.get(j.company) ?? null, color: j.color, category: j.category,
      city: j.city, salaryFrom: j.salaryFrom || 0, salaryTo: j.salaryTo || 0, type: j.type, experience: j.experience || 0,
      tags: j.tags || [], skills: j.skills || [], description: j.description || '', requirements: j.requirements || [],
      conditions: j.conditions || [], details: { applicantsBase: j.applicants || 0 }, status: 'ACTIVE' as const, source: 'SEED' as const,
      publishedAt, createdAt: publishedAt, expiresAt: new Date(publishedAt.getTime() + 60 * 24 * HOUR),
    }
    await db.job.upsert({ where: { id: j.id }, create: { id: j.id, ...fields }, update: {} })
  }

  for (const [i, c] of data.courses.entries()) {
    const { id, ...rest } = c
    await db.course.upsert({ where: { id }, create: { id, ...rest, sort: i }, update: {} })
  }
  for (const a of data.articles) {
    await db.article.upsert({
      where: { id: a.id },
      create: {
        id: a.id, tag: a.tag, icon: a.icon, cover: a.cover, img: a.img || null, title: a.title, excerpt: a.excerpt, body: a.body,
        readMinutes: a.read, dateLabel: a.date, publishedAt: new Date(),
      },
      update: {},
    })
  }
  for (const e of data.events) {
    await db.event.upsert({
      where: { id: e.id },
      create: { id: e.id, title: e.title, dateLabel: e.date, place: e.place, tag: e.tag, cover: e.cover, img: e.img || null, description: e.desc },
      update: {},
    })
  }
  console.log(`✓ kontent: ${data.jobs.length} vakansiya, ${data.courses.length} kurs, ${data.articles.length} maqola, ${data.events.length} tadbir`)
}

// --- Demo: dashboard grafiklari bo'sh ko'rinmasligi uchun so'nggi 6 oydagi faollik ---
const FIRST = ['Malika', 'Dilnoza', 'Zarina', 'Nodira', 'Gulnora', 'Sevara', 'Madina', 'Kamola', 'Shahnoza', 'Feruza', 'Lola', 'Nilufar', 'Aziza', 'Barno', 'Umida']
const LAST = ['Rahimova', 'Karimova', 'Toshpulatova', 'Yusupova', 'Aliyeva', 'Ergasheva', 'Nazarova', 'Saidova', 'Qodirova', 'Usmonova']
const CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', "Farg'ona", 'Namangan']
const CATS = ['it', 'med', 'edu', 'sales', 'finance', 'beauty', 'production', 'nanny']

// deterministik tasodif — har seed'da bir xil natija
let s = 42
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]

async function seedDemo() {
  if ((await db.user.count({ where: { phone: { startsWith: '99899' } } })) > 0) return console.log('· demo foydalanuvchilar allaqachon bor')
  const passwordHash = await bcrypt.hash('demo12345', 10)
  const jobs = await db.job.findMany({ select: { id: true } })
  const courses = await db.course.findMany({ select: { id: true } })
  const statuses: ApplicationStatus[] = ['NEW', 'NEW', 'REVIEWING', 'REVIEWING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']

  for (let i = 0; i < 140; i++) {
    const employer = i % 7 === 0
    // yangi foydalanuvchilar so'nggi oylarda ko'proq
    const daysAgo = Math.floor(Math.pow(rnd(), 1.6) * 180)
    const createdAt = new Date(Date.now() - daysAgo * 24 * HOUR - rnd() * 20 * HOUR)
    const name = `${pick(FIRST)} ${pick(LAST)}`
    const user = await db.user.create({
      data: {
        phone: `99899${String(1000000 + i).slice(-7)}`, passwordHash, name, role: employer ? 'EMPLOYER' : 'SEEKER',
        city: pick(CITIES), categories: [pick(CATS)], company: employer ? `${pick(LAST).replace(/a$/, '')} Group` : null,
        profile: { demo: true }, createdAt, lastLoginAt: createdAt, status: i % 37 === 5 ? 'BLOCKED' : 'ACTIVE',
      },
    })
    if (employer) continue
    const n = Math.floor(rnd() * 4)
    const used = new Set<string>()
    for (let k = 0; k < n; k++) {
      const job = pick(jobs)
      if (used.has(job.id)) continue
      used.add(job.id)
      const at = new Date(createdAt.getTime() + rnd() * Math.max(1, daysAgo) * 24 * HOUR)
      await db.application.create({ data: { jobId: job.id, userId: user.id, status: pick(statuses), createdAt: at, updatedAt: at } })
    }
    if (rnd() < 0.35) await db.enrollment.create({ data: { userId: user.id, courseId: pick(courses).id, createdAt } })
    if (rnd() < 0.08) {
      await db.supportTicket.create({
        data: {
          userId: user.id, status: rnd() < 0.5 ? 'OPEN' : 'ANSWERED', createdAt,
          messages: { create: [{ from: 'USER', authorId: user.id, text: pick(['Rezyumeni qanday yuklab olaman?', "Arizam holati o'zgarmayapti", 'Parolni unutdim', "Kursga to'lov qanday qilinadi?"]), createdAt }] },
        },
      })
    }
  }

  // moderatsiya navbati uchun bir nechta yangi vakansiya
  const employers = await db.user.findMany({ where: { role: 'EMPLOYER', phone: { startsWith: '99899' } }, take: 4 })
  for (const [i, e] of employers.entries()) {
    await db.job.create({
      data: {
        title: ['Administrator (ofis)', 'Kassir', 'Enaga (to\'liq kun)', 'Kontent menejer'][i], companyName: e.company || e.name, category: ['office', 'sales', 'nanny', 'marketing'][i],
        city: e.city || 'Toshkent', salaryFrom: 4_000_000 + i * 500_000, salaryTo: 6_000_000 + i * 700_000, type: "To'liq stavka",
        description: 'Yangi vakansiya — moderatsiyani kutmoqda.', status: 'PENDING', source: 'WEB', authorId: e.id,
        createdAt: new Date(Date.now() - (i + 1) * 3 * HOUR),
      },
    })
  }
  console.log('✓ demo: 140 foydalanuvchi, arizalar, kurs yozilishlari, murojaatlar, 4 ta moderatsiyadagi vakansiya')
}

async function main() {
  await seedAdmin()
  await seedContent()
  if (process.env.SEED_DEMO !== 'false') await seedDemo()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
