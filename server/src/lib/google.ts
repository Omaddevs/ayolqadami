import 'server-only'
import { ApiError } from './http'

export type GoogleProfile = { sub: string; email: string; name: string; photo: string }

const invalid = () => new ApiError(401, 'google_invalid', 'Google hisobini tasdiqlab bo\'lmadi')

async function getJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(8000) }).catch(() => null)
  if (!res?.ok) throw invalid()
  return res.json()
}

// Web ilova Google'dan olgan access token server tomonda tekshiriladi — mijoz yuborgan email'ga ishonilmaydi.
// Token aynan bizning OAuth client'imizga berilganmi (aud) — tekshiriladi: aks holda boshqa saytga berilgan
// token bilan ham shu odam nomidan kirish mumkin bo'lardi.
export async function verifyGoogleToken(accessToken: string): Promise<GoogleProfile> {
  const clientIds = (process.env.GOOGLE_CLIENT_ID || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!clientIds.length) throw new ApiError(503, 'google_disabled', 'Google orqali kirish sozlanmagan')

  const info = await getJson(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`)
  if (!clientIds.includes(String(info.aud || info.azp || ''))) throw invalid()

  const u = await getJson('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!u.sub || !u.email || u.email_verified !== true || (info.sub && String(u.sub) !== String(info.sub))) {
    throw new ApiError(401, 'google_invalid', 'Google hisobi tasdiqlanmagan')
  }
  const photo = typeof u.picture === 'string' && u.picture.startsWith('https://') ? u.picture : ''
  return { sub: String(u.sub), email: String(u.email).toLowerCase(), name: u.name || '', photo }
}
