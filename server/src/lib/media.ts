import 'server-only'
import { db } from './db'

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024

// Fayl turi kengaytma yoki brauzer aytgan MIME bo'yicha emas, tarkibning boshidagi "sehrli baytlar" bo'yicha aniqlanadi.
// SVG (ichida skript bo'lishi mumkin), HTML va boshqa turlar qabul qilinmaydi.
export function detectImage(b: Uint8Array): 'image/png' | 'image/jpeg' | 'image/webp' | null {
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') return 'image/webp'
  return null
}

export class UploadError extends Error {}

export async function saveImage(file: File, authorId: string) {
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError('Rasm hajmi 3 MB dan oshmasin')
  const buf = new Uint8Array(await file.arrayBuffer())
  const mime = detectImage(buf)
  if (!mime) throw new UploadError('Faqat PNG, JPEG yoki WebP rasm yuklash mumkin')
  const m = await db.media.create({ data: { mime, size: buf.length, data: Buffer.from(buf), name: file.name.slice(0, 120), authorId } })
  return `/media/${m.id}`
}

// API serverning ochiq manzili (yuklangan rasmlar uchun to'liq havola): PUBLIC_URL yoki so'rov manzili
export function publicOrigin(req?: Request) {
  const env = (process.env.PUBLIC_URL || '').replace(/\/$/, '')
  if (/^https?:\/\//.test(env)) return env
  return req ? new URL(req.url).origin : ''
}

// Banner/rasm havolasi: /media/... — API serverda (to'liq manzilga aylantiriladi), qolgan / — sayt ichidagi fayl
export const absoluteMedia = (url: string, origin: string) => (url.startsWith('/media/') ? origin + url : url)
