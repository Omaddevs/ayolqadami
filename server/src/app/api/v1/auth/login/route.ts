import { db } from '@/lib/db'
import { burnPasswordCheck, issueToken, verifyPassword } from '@/lib/auth'
import { ApiError, api, body, clientIp, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { userOut } from '@/lib/serialize'
import { loginSchema } from '@/lib/validators'

// Javob kodlari web ilovadagi signIn() natijalariga mos: nouser | badpass | google | blocked
export const POST = api(async (req) => {
  const ip = clientIp(req)
  rateLimit(`login:${ip}`, 20, 15 * 60_000)
  const { phone, password } = await body(req, loginSchema)
  rateLimit(`login:${phone}`, 8, 15 * 60_000) // bitta raqamga parol tanlab urinishdan himoya

  const user = await db.user.findUnique({ where: { phone } })
  if (!user) {
    await burnPasswordCheck(password)
    throw new ApiError(404, 'nouser', 'Bu raqam bilan hisob topilmadi')
  }
  if (!user.passwordHash) throw new ApiError(400, user.googleSub ? 'google' : 'badpass', 'Bu hisobga Google orqali kiring')
  if (!(await verifyPassword(password, user.passwordHash))) throw new ApiError(401, 'badpass', "Parol noto'g'ri")
  if (user.status !== 'ACTIVE') throw new ApiError(403, 'blocked', 'Hisobingiz bloklangan. Qo\'llab-quvvatlash xizmatiga murojaat qiling')

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  return json({ token: await issueToken(user, 'app'), user: userOut(user) })
})
