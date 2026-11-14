import { db } from '@/lib/db'
import { requireApiUser } from '@/lib/auth'
import { ApiError, api, body, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { userOut } from '@/lib/serialize'
import { setPhoneSchema } from '@/lib/validators'

// Raqamsiz hisobga (Google bilan ro'yxatdan o'tgan) telefon qo'shish — vakansiyaga ariza / xabar yozishdan oldin so'raladi.
// Tasdiqlangan raqamni bu yerdan almashtirib bo'lmaydi
export const POST = api(async (req) => {
  const user = await requireApiUser(req)
  rateLimit(`set-phone:${user.id}`, 10, 3600_000)
  const { phone } = await body(req, setPhoneSchema)
  if (user.phone === phone) return json({ user: userOut(user) })
  if (user.phone && user.phoneVerifiedAt) throw new ApiError(400, 'phone_locked', "Tasdiqlangan raqamni sozlamalardan o'zgartirib bo'lmaydi")
  if (await db.user.findFirst({ where: { phone, id: { not: user.id } }, select: { id: true } })) {
    throw new ApiError(409, 'exists', "Bu raqam boshqa hisobga bog'langan")
  }
  const updated = await db.user.update({ where: { id: user.id }, data: { phone } })
  return json({ user: userOut(updated) })
})
