import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireApiUser } from '@/lib/auth'
import { ApiError, api, body, json } from '@/lib/http'
import { appOut, userOut } from '@/lib/serialize'
import { profilePatchSchema } from '@/lib/validators'

// Ustun sifatida saqlanadigan yoki mijoz o'zgartira olmaydigan kalitlar profile JSON'ga tushmaydi
const COLUMNS = ['name', 'city', 'region', 'company', 'photo', 'categories', 'email'] as const
const PROTECTED = new Set(['id', 'role', 'phone', 'google', 'googleSub', 'status', 'passwordHash', 'tokenVersion', 'createdAt', 'category', 'industry'])
const MAX_PROFILE_BYTES = 200 * 1024

// Joriy foydalanuvchi + uning holati (arizalar, kurslar, joylagan vakansiyalari id'lari)
export const GET = api(async (req) => {
  const user = await requireApiUser(req)
  const [applications, enrollments, invites] = await Promise.all([
    db.application.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
    db.enrollment.findMany({ where: { userId: user.id }, select: { courseId: true } }),
    db.invite.findMany({ where: { employerId: user.id }, select: { candidateRef: true } }),
  ])
  return json({
    user: userOut(user),
    applications: applications.map(appOut),
    courses: enrollments.map((e) => e.courseId),
    invites: invites.map((i) => i.candidateRef),
  })
})

export const PATCH = api(async (req) => {
  const user = await requireApiUser(req)
  const patch = await body(req, profilePatchSchema)

  const data: Prisma.UserUpdateInput = {}
  for (const k of COLUMNS) if (patch[k] !== undefined) (data as Record<string, unknown>)[k] = patch[k] === '' && k === 'email' ? null : patch[k]

  const extra = Object.fromEntries(Object.entries(patch).filter(([k]) => !PROTECTED.has(k) && !(COLUMNS as readonly string[]).includes(k)))
  if (Object.keys(extra).length) {
    const profile = { ...(user.profile as Record<string, unknown>), ...extra }
    if (Buffer.byteLength(JSON.stringify(profile)) > MAX_PROFILE_BYTES) throw new ApiError(413, 'too_large', 'Profil hajmi juda katta')
    data.profile = profile as Prisma.InputJsonValue
  }
  if (patch.categories?.length) data.categories = patch.categories

  const updated = await db.user.update({ where: { id: user.id }, data })
  return json({ user: userOut(updated) })
})

// Hisobni o'chirish (foydalanuvchi talabi bo'yicha — shaxsiy ma'lumotlar qonunchiligi)
export const DELETE = api(async (req) => {
  const user = await requireApiUser(req)
  if (user.role === 'ADMIN') throw new ApiError(400, 'forbidden', "Administrator hisobini bu yerdan o'chirib bo'lmaydi")
  await db.user.delete({ where: { id: user.id } })
  return json({ ok: true })
})
