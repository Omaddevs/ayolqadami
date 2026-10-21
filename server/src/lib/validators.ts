import { z } from 'zod'
import { normalizeUzPhone } from './phone'

const str = (max: number) => z.string().trim().max(max)
const strList = (maxItems: number, maxLen = 200) => z.array(str(maxLen)).max(maxItems).default([])
// Rasm faqat https havola yoki data:image (png/jpeg/webp) — javascript:, data:text/html va h.k. qabul qilinmaydi
const photoUrl = (max: number) =>
  z.string().trim().max(max).refine((v) => v === '' || /^https:\/\/[^\s"'<>]+$/i.test(v) || /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(v), {
    message: "Rasm manzili noto'g'ri",
  })
const money = z.coerce.number().int().min(0).max(2_000_000_000).default(0)

export const phoneSchema = z.string().transform((v, ctx) => {
  const d = normalizeUzPhone(v)
  if (!d) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Telefon raqami noto'g'ri (+998 XX XXX XX XX)" })
    return z.NEVER
  }
  return d
})

export const passwordSchema = z.string().min(6, 'Parol kamida 6 belgi').max(128)

export const registerSchema = z
  .object({
    role: z.enum(['seeker', 'employer']),
    name: str(80).min(3, 'Ism kamida 3 harf'),
    phone: phoneSchema,
    password: passwordSchema.optional(),
    googleAccessToken: z.string().max(4096).optional(),
    email: z.string().trim().toLowerCase().email().max(120).optional().or(z.literal('')),
    photo: photoUrl(1000).optional(),
    city: str(60).optional(),
    region: str(60).optional(),
    company: str(120).optional(),
    categories: z.array(str(40)).max(3).default([]),
    otherCategory: str(80).optional(),
    phoneToken: z.string().max(2000).optional(),
    acceptTerms: z.boolean().optional(),
  })
  .refine((v) => v.password || v.googleAccessToken, { message: 'Parol kiriting', path: ['password'] })
  .refine((v) => v.role !== 'employer' || (v.company && v.company.length > 0), { message: 'Kompaniya nomini kiriting', path: ['company'] })

export const phoneStartSchema = z.object({ phone: phoneSchema, purpose: z.enum(['register', 'reset']) })
export const phoneVerifySchema = z.object({ id: z.string().min(1).max(64), code: z.string().trim().regex(/^\d{6}$/, '6 xonali kod') })
export const resetPasswordSchema = z.object({ phone: phoneSchema, phoneToken: z.string().min(10).max(2000), password: passwordSchema })

export const loginSchema = z.object({ phone: phoneSchema, password: z.string().min(1).max(128) })
export const googleLoginSchema = z.object({ accessToken: z.string().min(10).max(4096) })

// Profil: asosiy ustunlar alohida, qolgani (rezyume) profile JSON'ga — hajmi route'da cheklanadi
export const profilePatchSchema = z
  .object({
    name: str(80).min(2).optional(),
    city: str(60).optional(),
    region: str(60).optional(),
    company: str(120).optional(),
    photo: photoUrl(400_000).optional(), // data: URL ham bo'lishi mumkin
    categories: z.array(str(40)).max(5).optional(),
    email: z.string().trim().toLowerCase().email().max(120).optional().or(z.literal('')),
  })
  .passthrough()

export const changePasswordSchema = z.object({ current: z.string().max(128).optional(), next: passwordSchema })

export const jobInputSchema = z
  .object({
    title: str(120).min(3),
    category: str(40).min(1),
    city: str(60).min(1),
    region: str(60).optional(),
    district: str(80).optional(),
    company: str(120).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    salaryFrom: money,
    salaryTo: money,
    type: str(40).default("To'liq stavka"),
    experience: z.coerce.number().int().min(0).max(50).default(0),
    tags: strList(20, 80),
    skills: strList(30, 60),
    description: str(5000).default(''),
    requirements: strList(30, 500),
    conditions: strList(30, 500),
    expires: z.string().datetime().optional(),
  })
  .passthrough()

// Web shakldan keladigan, ustun bo'lmagan maydonlar details JSON'ga tushadi
export const JOB_COLUMNS = new Set([...Object.keys(jobInputSchema._def.shape()), 'id', 'status', 'posted', 'applicants', 'own'])

export const applySchema = z.object({ letter: str(3000).default('') })
export const supportSchema = z.object({ text: str(2000).min(1) })
export const inviteSchema = z.object({ candidateId: str(64).min(1), jobId: str(64).optional() })
