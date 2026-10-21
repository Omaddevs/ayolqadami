import { db } from '@/lib/db'
import { issueToken } from '@/lib/auth'
import { verifyGoogleToken } from '@/lib/google'
import { ApiError, api, body, clientIp, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { userOut } from '@/lib/serialize'
import { googleLoginSchema } from '@/lib/validators'

// Google hisobi bilan kirish. Hisob topilmasa 404 — web ilova ro'yxatdan o'tishni davom ettiradi
export const POST = api(async (req) => {
  rateLimit(`google:${clientIp(req)}`, 20, 15 * 60_000)
  const { accessToken } = await body(req, googleLoginSchema)
  const g = await verifyGoogleToken(accessToken)

  let user = await db.user.findFirst({ where: { OR: [{ googleSub: g.sub }, { email: g.email }] } })
  if (!user) return json({ error: { code: 'nouser', message: 'Hisob topilmadi' }, profile: { email: g.email, name: g.name, photo: g.photo } }, 404)
  if (user.status !== 'ACTIVE') throw new ApiError(403, 'blocked', 'Hisobingiz bloklangan')

  user = await db.user.update({
    where: { id: user.id },
    data: { googleSub: user.googleSub || g.sub, photo: user.photo || g.photo || null, lastLoginAt: new Date() },
  })
  return json({ token: await issueToken(user, 'app'), user: userOut(user) })
})
