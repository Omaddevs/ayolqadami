// Lokal sinov uchun demo ish izlovchi (web ilovaga kirish): +998 90 123 45 67 / demo1234
//   npx tsx --env-file=.env scripts/create-demo-user.ts
// Faol vakansiyalar bo'lsa — dashboard bo'sh ko'rinmasligi uchun bir nechta ariza va yoqtirish qo'shiladi.
// Production bazasida ishga tushirmang.
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const PHONE = '998901234567'
const PASSWORD = 'demo1234'

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo hisob production uchun emas')
  const db = new PrismaClient()
  const existing = await db.user.findUnique({ where: { phone: PHONE } })
  if (existing && existing.role !== 'SEEKER') throw new Error(`+${PHONE} — ${existing.role} hisobi, demo uchun boshqa raqam tanlang`)

  const profile = {
    headline: 'UI/UX dizayner',
    about: '3 yillik tajribaga ega mahsulot dizayneri. Figma, prototiplash va foydalanuvchi tadqiqotlari.',
    skills: ['Figma', 'Prototiplash', 'UX tadqiqot'],
    languages: ["O'zbek", 'Rus', 'Ingliz'],
  }
  const data = { name: 'Malika Karimova', city: 'Toshkent', categories: ['it', 'marketing', 'office'], profile, status: 'ACTIVE' as const }
  const user = await db.user.upsert({
    where: { phone: PHONE },
    create: { phone: PHONE, passwordHash: await bcrypt.hash(PASSWORD, 12), role: 'SEEKER', phoneVerifiedAt: new Date(), termsAcceptedAt: new Date(), ...data },
    update: { passwordHash: await bcrypt.hash(PASSWORD, 12), ...data },
  })

  const jobs = await db.job.findMany({ where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' }, take: 8, select: { id: true } })
  const statuses = ['REVIEWING', 'INTERVIEW', 'NEW', 'REJECTED'] as const
  for (const [i, job] of jobs.slice(0, 4).entries()) {
    await db.application.upsert({
      where: { jobId_userId: { jobId: job.id, userId: user.id } },
      create: { jobId: job.id, userId: user.id, status: statuses[i] },
      update: {},
    })
  }
  for (const job of jobs.slice(2)) {
    await db.jobLike.upsert({ where: { userId_jobId: { userId: user.id, jobId: job.id } }, create: { userId: user.id, jobId: job.id }, update: {} })
  }
  console.log(`✓ Demo ish izlovchi: +${PHONE} / ${PASSWORD} (${user.name}); arizalar: ${Math.min(4, jobs.length)}, saqlanganlar: ${Math.max(0, jobs.length - 2)}`)
  await db.$disconnect()
}

main().catch((e) => { console.error(e.message || e); process.exit(1) })
