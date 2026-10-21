import { db } from '@/lib/db'
import { hashPassword, issueToken, requireApiUser, verifyPassword } from '@/lib/auth'
import { ApiError, api, body, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { changePasswordSchema } from '@/lib/validators'

// Parolni almashtirish: boshqa qurilmalardagi sessiyalar bekor bo'ladi, joriy qurilmaga yangi token beriladi
export const POST = api(async (req) => {
  const user = await requireApiUser(req)
  rateLimit(`pw:${user.id}`, 5, 15 * 60_000)
  const { current, next } = await body(req, changePasswordSchema)
  if (user.passwordHash && !(current && (await verifyPassword(current, user.passwordHash)))) {
    throw new ApiError(401, 'badpass', "Joriy parol noto'g'ri")
  }
  const updated = await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next), tokenVersion: { increment: 1 } },
  })
  return json({ token: await issueToken(updated, 'app') })
})
