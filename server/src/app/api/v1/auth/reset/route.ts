import { db } from '@/lib/db'
import { assertAppRole, hashPassword, issueToken } from '@/lib/auth'
import { ApiError, api, body, clientIp, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { userOut } from '@/lib/serialize'
import { consumePhoneToken } from '@/lib/phone-verify'
import { resetPasswordSchema } from '@/lib/validators'
import { notifyLogin } from '@/lib/login-bot'

// Parolni tiklash: raqam kirish boti orqali tasdiqlangan bo'lishi kerak. Barcha eski sessiyalar bekor bo'ladi
export const POST = api(async (req) => {
  rateLimit(`reset:${clientIp(req)}`, 10, 60 * 60_000)
  const { phone, phoneToken, password } = await body(req, resetPasswordSchema)
  const user = await db.user.findUnique({ where: { phone } })
  if (!user) throw new ApiError(404, 'nouser', 'Bu raqam bilan hisob topilmadi')
  if (user.status !== 'ACTIVE') throw new ApiError(403, 'blocked', 'Hisobingiz bloklangan')
  assertAppRole(user) // xodim paroli faqat admin panelda almashtiriladi
  await consumePhoneToken(phoneToken, phone, 'reset')

  const now = new Date()
  const updated = await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password), tokenVersion: { increment: 1 }, phoneVerifiedAt: now, lastLoginAt: now },
  })
  notifyLogin(updated, req, 'reset', clientIp(req))
  return json({ token: await issueToken(updated, 'app'), user: userOut(updated) })
})
