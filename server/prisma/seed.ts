// Bazani boshlang'ich ma'lumotlar bilan to'ldiradi: administrator (ADMIN_PHONE/ADMIN_PASSWORD) va bosh sahifa banneri.
// Vakansiya, kurs, maqola va tadbirlar admin paneldan qo'shiladi.
// Qayta ishga tushirish xavfsiz (upsert). Demo ma'lumotlar yo'q.
//   npm run db:seed
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()


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

// Bosh sahifadagi mavjud banner (rasm sayt fayllarida: public/banners/). Bannerlar bo'sh bo'lsagina qo'shiladi —
// keyin admin panel → Bannerlar orqali almashtiriladi yoki o'chiriladi
async function seedBanners() {
  if (await db.banner.count()) return
  await db.banner.create({ data: { title: 'Haydovchilik kursi', imageUrl: '/banners/haydovchilik.jpg', linkUrl: '/courses', sort: 0 } })
  console.log('✓ banner: Haydovchilik kursi')
}

async function main() {
  await seedAdmin()
  await seedBanners()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
