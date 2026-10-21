import { db } from '@/lib/db'
import { hashPassword, issueToken } from '@/lib/auth'
import { verifyGoogleToken } from '@/lib/google'
import { ApiError, api, body, clientIp, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { userOut } from '@/lib/serialize'
import { getSettings } from '@/lib/settings'
import { registerSchema } from '@/lib/validators'
import { consumePhoneToken } from '@/lib/phone-verify'

export const POST = api(async (req) => {
  rateLimit(`register:${clientIp(req)}`, 10, 60 * 60_000)
  const settings = await getSettings()
  if (!settings.registrationOpen) throw new ApiError(403, 'registration_closed', "Ro'yxatdan o'tish vaqtincha yopiq")
  const input = await body(req, registerSchema)
  if (input.acceptTerms !== true) throw new ApiError(400, 'terms', 'Foydalanish shartlari va maxfiylik siyosatiga rozilik bering')

  if (await db.user.findUnique({ where: { phone: input.phone }, select: { id: true } })) {
    throw new ApiError(409, 'exists', "Bu raqam bilan hisob allaqachon ochilgan. Kirish bo'limidan foydalaning")
  }

  const google = input.googleAccessToken ? await verifyGoogleToken(input.googleAccessToken) : null
  const email = google?.email || input.email || null
  if (email && (await db.user.findUnique({ where: { email }, select: { id: true } }))) {
    throw new ApiError(409, 'email_exists', 'Bu email bilan hisob allaqachon ochilgan')
  }

  // raqam egasi ekanligi kirish boti orqali isbotlangan bo'lishi kerak (token bir martalik)
  if (settings.phoneVerification) await consumePhoneToken(input.phoneToken, input.phone, 'register')

  const employer = input.role === 'employer'
  const now = new Date()
  const user = await db.user.create({
    data: {
      role: employer ? 'EMPLOYER' : 'SEEKER',
      phone: input.phone,
      email,
      googleSub: google?.sub ?? null,
      passwordHash: input.password ? await hashPassword(input.password) : null,
      name: input.name,
      city: input.city,
      region: input.region,
      company: employer ? input.company : null,
      categories: input.categories,
      photo: google?.photo || input.photo || null,
      profile: { skills: [], experience: [], languages: ["O'zbek"], ...(input.otherCategory && { otherCategory: input.otherCategory }) },
      lastLoginAt: now,
      termsAcceptedAt: now,
      phoneVerifiedAt: settings.phoneVerification ? now : null,
    },
  })
  return json({ token: await issueToken(user, 'app'), user: userOut(user) }, 201)
})
