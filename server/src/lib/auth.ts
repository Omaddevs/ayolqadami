import 'server-only'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Role, User } from '@prisma/client'
import { db } from './db'
import { ApiError } from './http'
import { ADMIN_COOKIE, signToken, verifyToken, type Audience } from './token'

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12)
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash)

// Mavjud bo'lmagan foydalanuvchi uchun ham bcrypt ishlaydi — javob vaqtidan raqam bor-yo'qligini bilib bo'lmasin
const DUMMY_HASH = '$2b$12$kZyERU/wBArBc4EY6Avc/uKDWF9yAJQgFIzWs1IBi4VPQK2hBGXtm'
export const burnPasswordCheck = (pw: string) => bcrypt.compare(pw, DUMMY_HASH).catch(() => false)

export const issueToken = (u: Pick<User, 'id' | 'role' | 'tokenVersion'>, aud: Audience) =>
  signToken({ sub: u.id, role: u.role, v: u.tokenVersion }, aud)

async function userFromToken(token: string | undefined | null, aud: Audience) {
  if (!token) return null
  const p = await verifyToken(token, aud)
  if (!p) return null
  const user = await db.user.findUnique({ where: { id: p.sub } })
  // bloklangan yoki tokenlari bekor qilingan foydalanuvchi
  if (!user || user.status !== 'ACTIVE' || user.tokenVersion !== p.v) return null
  return user
}

// --- Web ilova API: Authorization: Bearer <token> ---
export async function getApiUser(req: Request) {
  const h = req.headers.get('authorization') || ''
  return userFromToken(h.startsWith('Bearer ') ? h.slice(7) : null, 'app')
}

export async function requireApiUser(req: Request, roles?: Role[]) {
  const user = await getApiUser(req)
  if (!user) throw new ApiError(401, 'unauthorized', 'Avval tizimga kiring')
  if (roles && !roles.includes(user.role)) throw new ApiError(403, 'forbidden', "Bu amal uchun ruxsat yo'q")
  return user
}

// --- Admin panel: httpOnly cookie ---
export const ADMIN_ROLES: Role[] = ['ADMIN', 'MODERATOR']

export async function getAdmin() {
  const store = await cookies()
  const user = await userFromToken(store.get(ADMIN_COOKIE)?.value, 'admin')
  return user && ADMIN_ROLES.includes(user.role) ? user : null
}

// Sahifa va server action'lar boshida chaqiriladi. roles — faqat ADMIN talab qilinadigan amallar uchun
export async function requireAdmin(roles: Role[] = ADMIN_ROLES) {
  const admin = await getAdmin()
  if (!admin) redirect('/admin/login')
  if (!roles.includes(admin.role)) throw new Error("Bu amal uchun ruxsat yo'q")
  return admin
}

export async function setAdminCookie(user: User) {
  const store = await cookies()
  store.set(ADMIN_COOKIE, await issueToken(user, 'admin'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 12 * 3600,
  })
}

export async function clearAdminCookie() {
  const store = await cookies()
  store.delete(ADMIN_COOKIE)
}
