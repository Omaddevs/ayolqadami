// Birinchi administrator: server ishga tushganda ADMIN_PHONE va ADMIN_PASSWORD (deploy/.env) bo'yicha hisob tekshiriladi.
//  • hisob yo'q — ADMIN yaratiladi
//  • raqam oddiy foydalanuvchiniki (ish izlovchi / ish beruvchi) — ADMIN'ga aylantiriladi, parol o'rnatiladi
//  • allaqachon ADMIN/MODERATOR — tegilmaydi (admin panelda almashtirilgan parol har qayta ishga tushishda yozib yuborilmasin)
import bcrypt from 'bcryptjs'
import { db } from './db'
import { normalizeUzPhone } from './phone'

export async function ensureBootstrapAdmin() {
  const rawPhone = process.env.ADMIN_PHONE?.trim()
  const password = process.env.ADMIN_PASSWORD || ''
  if (!rawPhone && !password) return
  const phone = normalizeUzPhone(rawPhone || '')
  if (!phone || password.length < 10) {
    console.error("[admin] ADMIN_PHONE noto'g'ri yoki ADMIN_PASSWORD 10 belgidan qisqa — administrator yaratilmadi")
    return
  }
  const name = process.env.ADMIN_NAME?.trim() || 'Administrator'
  try {
    const user = await db.user.findUnique({ where: { phone }, select: { id: true, role: true } })
    if (user && (user.role === 'ADMIN' || user.role === 'MODERATOR')) return
    const passwordHash = await bcrypt.hash(password, 12)
    if (user) {
      // ilovadagi eski sessiyalari yopiladi — xodim hisobi faqat admin panelda ishlaydi
      await db.user.update({ where: { id: user.id }, data: { role: 'ADMIN', status: 'ACTIVE', passwordHash, tokenVersion: { increment: 1 } } })
      console.log(`[admin] +${phone} administrator qilindi`)
    } else {
      await db.user.create({ data: { phone, name, passwordHash, role: 'ADMIN' } })
      console.log(`[admin] +${phone} administrator yaratildi`)
    }
  } catch (e) {
    console.error('[admin] administratorni yaratib bo\'lmadi', e)
  }
}
