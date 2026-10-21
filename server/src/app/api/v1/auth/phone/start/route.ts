import { db } from '@/lib/db'
import { ApiError, api, body, clientIp, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { getSettings } from '@/lib/settings'
import { phoneStartSchema } from '@/lib/validators'
import { createVerification, recentPhoneLink } from '@/lib/phone-verify'
import { loginBotUsername, sendVerificationCode } from '@/lib/login-bot'

// Telefonni tasdiqlashni boshlash: bot havolasi qaytadi. Raqam shu botda avval ulangan bo'lsa — kod darhol yuboriladi
export const POST = api(async (req) => {
  rateLimit(`phone-start:${clientIp(req)}`, 30, 60 * 60_000)
  const { phone, purpose } = await body(req, phoneStartSchema)
  rateLimit(`phone-start:${phone}`, 6, 60 * 60_000) // birovning Telegram'iga kod yog'dirishdan himoya

  if (purpose === 'register') {
    const settings = await getSettings()
    if (!settings.registrationOpen) throw new ApiError(403, 'registration_closed', "Ro'yxatdan o'tish vaqtincha yopiq")
    if (!settings.phoneVerification) return json({ skip: true })
    if (await db.user.findUnique({ where: { phone }, select: { id: true } })) {
      throw new ApiError(409, 'exists', "Bu raqam bilan hisob allaqachon ochilgan. Kirish bo'limidan foydalaning")
    }
  } else {
    const user = await db.user.findUnique({ where: { phone }, select: { status: true } })
    if (!user) throw new ApiError(404, 'nouser', 'Bu raqam bilan hisob topilmadi')
    if (user.status !== 'ACTIVE') throw new ApiError(403, 'blocked', 'Hisobingiz bloklangan')
  }

  const bot = await loginBotUsername()
  if (!bot) throw new ApiError(503, 'verify_unavailable', 'Tasdiqlash xizmati vaqtincha ishlamayapti')

  const v = await createVerification(phone, purpose)
  let sent = false
  const link = await recentPhoneLink(phone)
  if (link) {
    // havola shu Telegram hisobiga bog'lanadi — boshqasi ocha olmaydi
    await db.phoneVerification.update({ where: { id: v.id }, data: { telegramId: link.telegramId } })
    sent = await sendVerificationCode(v, link.telegramId)
  }
  return json({ id: v.id, bot: `@${bot}`, botUrl: `https://t.me/${bot}?start=v_${v.token}`, sent, expiresAt: v.expiresAt.toISOString() }, 201)
})
