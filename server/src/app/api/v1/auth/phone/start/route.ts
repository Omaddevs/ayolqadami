import { db } from '@/lib/db'
import { APP_ROLES } from '@/lib/auth'
import { ApiError, api, body, clientIp, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { getSettings } from '@/lib/settings'
import { phoneStartSchema } from '@/lib/validators'
import { activeLoginCode, createVerification, recentPhoneLink, setCode } from '@/lib/phone-verify'
import { devCodes, loginBotUsername, sendVerificationCode } from '@/lib/login-bot'

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
    // reset va login: hisob mavjud va faol bo'lishi kerak
    const user = await db.user.findUnique({ where: { phone }, select: { status: true, role: true } })
    // xodim hisobi (ADMIN/MODERATOR) bu yerda "topilmadi": paroli Telegram orqali tiklanmaydi, raqam xodimniki ekani ham oshkor bo'lmaydi
    if (!user || !APP_ROLES.includes(user.role)) throw new ApiError(404, 'nouser', 'Bu raqam bilan hisob topilmadi')
    if (user.status !== 'ACTIVE') throw new ApiError(403, 'blocked', 'Hisobingiz bloklangan')
  }

  // lokal ishlab chiqish: production boti bu serverga xabar bermaydi — kod javobda qaytadi va saytda ko'rsatiladi
  if (devCodes()) {
    const v = await createVerification(phone, purpose)
    const { code, expiresAt } = await setCode(v.id, 'dev', purpose)
    console.info(`[login-bot] lokal rejim: ${phone} uchun kod ${code}`)
    return json({ id: v.id, bot: '', botUrl: '', sent: true, devCode: code, expiresAt: expiresAt.toISOString() }, 201)
  }

  const bot = await loginBotUsername()
  if (!bot) throw new ApiError(503, 'verify_unavailable', 'Tasdiqlash xizmati vaqtincha ishlamayapti')

  // botdagi «Kirish kodi» orqali olingan kod hali amal qilsa — o'sha ishlatiladi (yangi kod yuborilmaydi)
  if (purpose === 'login') {
    const active = await activeLoginCode(phone)
    if (active) return json({ id: active.id, bot: `@${bot}`, botUrl: `https://t.me/${bot}?start=v_${active.token}`, sent: true, expiresAt: active.expiresAt.toISOString() }, 201)
  }

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
