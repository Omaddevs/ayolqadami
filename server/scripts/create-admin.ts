// Administrator yoki moderator yaratish / parolini tiklash:
//   npm run admin:create -- +998901234567 "Parol123!" "Ism Familiya" [ADMIN|MODERATOR]
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { normalizeUzPhone } from '../src/lib/phone'

const [rawPhone, password, name = 'Administrator', role = 'ADMIN'] = process.argv.slice(2)

async function main() {
  const phone = normalizeUzPhone(rawPhone || '')
  if (!phone || !password || password.length < 10 || !['ADMIN', 'MODERATOR'].includes(role)) {
    console.error('Foydalanish: npm run admin:create -- +998901234567 "Kamida10Belgi" "Ism" [ADMIN|MODERATOR]')
    process.exit(1)
  }
  const db = new PrismaClient()
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await db.user.upsert({
    where: { phone },
    create: { phone, passwordHash, name, role: role as 'ADMIN' | 'MODERATOR' },
    // mavjud hisob: rol beriladi, parol yangilanadi, eski sessiyalar yopiladi
    update: { passwordHash, role: role as 'ADMIN' | 'MODERATOR', status: 'ACTIVE', tokenVersion: { increment: 1 } },
  })
  console.log(`✓ ${user.role}: +${phone} (${user.name})`)
  await db.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
