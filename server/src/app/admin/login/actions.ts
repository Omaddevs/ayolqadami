'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { ADMIN_ROLES, burnPasswordCheck, clearAdminCookie, getAdmin, setAdminCookie, verifyPassword } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { normalizeUzPhone } from '@/lib/phone'
import { rateLimit } from '@/lib/rate-limit'
import { ipFromHeaders } from '@/lib/http'

export type LoginState = { error?: string }

const schema = z.object({ phone: z.string().max(40), password: z.string().min(1).max(128), next: z.string().max(200).optional() })

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const ip = ipFromHeaders(await headers())
  try {
    rateLimit(`admin-login:${ip}`, 10, 15 * 60_000)
  } catch {
    return { error: "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring" }
  }
  const parsed = schema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { error: "Telefon va parolni kiriting" }
  const phone = normalizeUzPhone(parsed.data.phone)
  const user = phone ? await db.user.findUnique({ where: { phone } }) : null

  // Xato sababi oshkor qilinmaydi: "raqam yo'q" va "parol xato" bir xil javob
  const ok = user?.passwordHash ? await verifyPassword(parsed.data.password, user.passwordHash) : await burnPasswordCheck(parsed.data.password)
  if (!user || !ok || !ADMIN_ROLES.includes(user.role)) return { error: "Telefon yoki parol noto'g'ri" }
  if (user.status !== 'ACTIVE') return { error: 'Hisob bloklangan' }

  await setAdminCookie(user)
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  await audit(user.id, 'admin.login', 'user', user.id)
  // faqat ichki manzilga qaytarish (open redirect'dan himoya)
  const next = parsed.data.next && /^\/admin(\/[\w\-/]*)?$/.test(parsed.data.next) ? parsed.data.next : '/admin'
  redirect(next)
}

export async function logout() {
  const admin = await getAdmin()
  if (admin) await audit(admin.id, 'admin.logout', 'user', admin.id)
  await clearAdminCookie()
  redirect('/admin/login')
}
