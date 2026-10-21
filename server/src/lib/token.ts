// JWT — middleware (edge) va server kodida birday ishlaydi, shuning uchun bu faylda Node API'lari yo'q
import { SignJWT, jwtVerify } from 'jose'

export type Audience = 'app' | 'admin'
export type TokenPayload = { sub: string; role: string; v: number }

export const ADMIN_COOKIE = 'aq_admin'
const TTL: Record<Audience, string> = { app: '30d', admin: '12h' }

function secret() {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) throw new Error("JWT_SECRET berilmagan yoki 32 belgidan qisqa")
  return new TextEncoder().encode(s)
}

export async function signToken(p: TokenPayload, aud: Audience) {
  return new SignJWT({ role: p.role, v: p.v })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(p.sub)
    .setAudience(aud)
    .setIssuer('ayolqadami')
    .setIssuedAt()
    .setExpirationTime(TTL[aud])
    .sign(secret())
}

export async function verifyToken(token: string, aud: Audience): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: aud, issuer: 'ayolqadami', algorithms: ['HS256'] })
    if (!payload.sub) return null
    return { sub: payload.sub, role: String(payload.role), v: Number(payload.v) || 0 }
  } catch {
    return null
  }
}

// Telefon tasdiqlanganini bildiruvchi qisqa muddatli token (ro'yxatdan o'tish / parolni tiklash uchun)
export type PhonePurpose = 'register' | 'reset'
export type PhoneTokenPayload = { phone: string; purpose: PhonePurpose; vid: string }

export async function signPhoneToken(p: PhoneTokenPayload) {
  return new SignJWT({ phone: p.phone, purpose: p.purpose })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(p.vid)
    .setAudience('phone')
    .setIssuer('ayolqadami')
    .setIssuedAt()
    .setExpirationTime('20m')
    .sign(secret())
}

export async function verifyPhoneToken(token: string): Promise<PhoneTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: 'phone', issuer: 'ayolqadami', algorithms: ['HS256'] })
    if (!payload.sub || typeof payload.phone !== 'string' || (payload.purpose !== 'register' && payload.purpose !== 'reset')) return null
    return { vid: payload.sub, phone: payload.phone, purpose: payload.purpose }
  } catch {
    return null
  }
}
