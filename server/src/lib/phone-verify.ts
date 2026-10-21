// Telefon raqamini Telegram kirish boti orqali tasdiqlash (SMS o'rniga).
//
// 1) Sayt: POST /auth/phone/start → yozuv + t.me/<bot>?start=v_<token> havolasi
// 2) Bot: havolani ochgan Telegram hisobi yozuvga bog'lanadi; foydalanuvchi o'z kontaktini ulashadi.
//    Telegram kontaktdagi user_id'ni o'zi qo'yadi — boshqa odamning raqamini "o'zimniki" deb yuborib bo'lmaydi.
//    Raqam saytda kiritilganiga mos kelsa — 6 xonali kod yuboriladi.
// 3) Sayt: POST /auth/phone/verify → kod to'g'ri bo'lsa qisqa muddatli phoneToken
// 4) Ro'yxatdan o'tish / parolni tiklash phoneToken'ni bir marta ishlatadi (consumePhoneToken)
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { db } from './db'
import { ApiError } from './http'
import { signPhoneToken, verifyPhoneToken, type PhonePurpose } from './token'

export const VERIFY_TTL_MS = 10 * 60_000
export const MAX_CODE_ATTEMPTS = 5
// Kontakt orqali isbotlangan raqam shuncha vaqt eslab qolinadi (keyin yana kontakt so'raladi)
export const PHONE_LINK_TTL_MS = 180 * 24 * 3600_000

const hashCode = (vid: string, code: string) => createHash('sha256').update(`${vid}:${code}`).digest('hex')
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0')
export const newLinkToken = () => randomBytes(24).toString('base64url') // 32 belgi: Telegram start payload ≤ 64

export function createVerification(phone: string, purpose: PhonePurpose) {
  return db.phoneVerification.create({
    data: { phone, purpose, token: newLinkToken(), expiresAt: new Date(Date.now() + VERIFY_TTL_MS) },
  })
}

// Yangi kod: xeshi saqlanadi, kodning o'zi faqat botga yuboriladi
export async function setCode(vid: string, telegramId: string) {
  const code = newCode()
  await db.phoneVerification.update({ where: { id: vid }, data: { telegramId, codeHash: hashCode(vid, code), attempts: 0 } })
  return code
}

export async function checkCode(vid: string, code: string) {
  const v = await db.phoneVerification.findUnique({ where: { id: vid } })
  if (!v || v.usedAt || v.expiresAt < new Date()) throw new ApiError(410, 'code_expired', "Kod muddati o'tgan. Qaytadan kod oling")
  if (!v.codeHash) throw new ApiError(400, 'code_not_sent', 'Avval Telegram botdan kodni oling')
  // urinishlar soni atomar oshiriladi — parallel so'rovlar bilan ham 5 tadan oshmaydi
  const { count } = await db.phoneVerification.updateMany({
    where: { id: vid, attempts: { lt: MAX_CODE_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  })
  if (!count) throw new ApiError(429, 'code_attempts', "Urinishlar tugadi. Qaytadan kod oling")
  if (!same(hashCode(vid, code), v.codeHash)) throw new ApiError(400, 'code_invalid', "Kod noto'g'ri")
  await db.phoneVerification.update({ where: { id: vid }, data: { verifiedAt: v.verifiedAt ?? new Date() } })
  return signPhoneToken({ phone: v.phone, purpose: v.purpose as PhonePurpose, vid })
}

// phoneToken'ni tekshiradi va bir martalik qilib "ishlatilgan" deb belgilaydi
export async function consumePhoneToken(token: string | undefined, phone: string, purpose: PhonePurpose) {
  const p = token ? await verifyPhoneToken(token) : null
  if (!p || p.phone !== phone || p.purpose !== purpose) throw new ApiError(400, 'phone_unverified', 'Telefon raqamingizni tasdiqlang')
  const { count } = await db.phoneVerification.updateMany({
    where: { id: p.vid, phone, purpose, usedAt: null, verifiedAt: { not: null } },
    data: { usedAt: new Date() },
  })
  if (!count) throw new ApiError(400, 'phone_unverified', 'Tasdiqlash muddati tugagan. Raqamni qaytadan tasdiqlang')
}

// Bu raqamni yaqinda kontakt orqali isbotlagan Telegram hisobi (kodni darhol yuborish uchun)
export function recentPhoneLink(phone: string) {
  return db.telegramPhone.findFirst({
    where: { phone, updatedAt: { gt: new Date(Date.now() - PHONE_LINK_TTL_MS) } },
    orderBy: { updatedAt: 'desc' },
  })
}

export const maskPhone = (d: string) => (/^998\d{9}$/.test(d) ? `+998 ${d.slice(3, 5)} *** ** ${d.slice(10, 12)}` : d)
