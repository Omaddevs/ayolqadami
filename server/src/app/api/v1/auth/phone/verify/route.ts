import { api, body, clientIp, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { phoneVerifySchema } from '@/lib/validators'
import { checkCode } from '@/lib/phone-verify'

// Botdan olingan kodni tekshirish → phoneToken (ro'yxatdan o'tish yoki parolni tiklashda bir marta ishlatiladi)
export const POST = api(async (req) => {
  rateLimit(`phone-verify:${clientIp(req)}`, 40, 60 * 60_000)
  const { id, code } = await body(req, phoneVerifySchema)
  return json({ phoneToken: await checkCode(id, code) })
})
