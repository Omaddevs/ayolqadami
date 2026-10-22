import { db } from '@/lib/db'
import { assertAppRole, issueToken } from '@/lib/auth'
import { ApiError, api, body, clientIp, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { userOut } from '@/lib/serialize'
import { consumePhoneToken } from '@/lib/phone-verify'
import { phoneLoginSchema } from '@/lib/validators'
import { notifyLogin } from '@/lib/login-bot'

// Parolsiz kirish: kirish botidan olingan kod tasdiqlangach (POST /auth/phone/verify → phoneToken) sessiya beriladi
export const POST = api(async (req) => {
  const ip = clientIp(req)
  rateLimit(`phone-login:${ip}`, 20, 15 * 60_000)
  const { phone, phoneToken } = await body(req, phoneLoginSchema)
  const user = await db.user.findUnique({ where: { phone } })
  if (!user) throw new ApiError(404, 'nouser', 'Bu raqam bilan hisob topilmadi')
  if (user.status !== 'ACTIVE') throw new ApiError(403, 'blocked', 'Hisobingiz bloklangan')
  assertAppRole(user)
  await consumePhoneToken(phoneToken, phone, 'login')

  const now = new Date()
  const updated = await db.user.update({ where: { id: user.id }, data: { lastLoginAt: now, phoneVerifiedAt: user.phoneVerifiedAt ?? now } })
  notifyLogin(updated, req, 'code', ip)
  return json({ token: await issueToken(updated, 'app'), user: userOut(updated) })
})
