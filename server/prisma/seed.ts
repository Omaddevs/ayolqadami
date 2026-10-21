// Bazani boshlang'ich ma'lumotlar bilan to'ldiradi: administrator (ADMIN_PHONE/ADMIN_PASSWORD), maqolalar va banner.
// Qayta ishga tushirish xavfsiz (upsert). Demo ma'lumotlar yo'q.
//   npm run db:seed
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const db = new PrismaClient()
const data = JSON.parse(readFileSync(path.join(__dirname, 'seed-data.json'), 'utf8'))


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

// Maqolalar — ilovaga kiritilgan tayyor kontent (admin paneldan tahrirlanadi).
// Vakansiyalar, kompaniyalar, kurslar va tadbirlar haqiqiy foydalanuvchilar/admin tomonidan qo'shiladi.
async function seedContent() {
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
  console.log(`✓ kontent: ${data.articles.length} maqola`)
}

// Bosh sahifadagi mavjud banner (rasm sayt fayllarida: public/banners/). Bannerlar bo'sh bo'lsagina qo'shiladi —
// keyin admin panel → Bannerlar orqali almashtiriladi yoki o'chiriladi
async function seedBanners() {
  if (await db.banner.count()) return
  await db.banner.create({ data: { title: 'Haydovchilik kursi', imageUrl: '/banners/haydovchilik.jpg', linkUrl: '/courses', sort: 0 } })
  console.log('✓ banner: Haydovchilik kursi')
}

async function main() {
  await seedAdmin()
  await seedContent()
  await seedBanners()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
