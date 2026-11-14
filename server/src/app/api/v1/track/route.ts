import { z } from 'zod'
import { db } from '@/lib/db'
import { getApiUser } from '@/lib/auth'
import { api, body, clientIp } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { countryOf } from '@/lib/countries'

const schema = z.object({
  path: z.string().min(1).max(300),
  vid: z.string().regex(/^[a-z0-9]{8,40}$/i),
  sid: z.string().regex(/^[a-z0-9]{8,40}$/i),
  ref: z.string().max(500).optional().default(''),
  tz: z.string().max(60).optional().default(''),
  lang: z.string().max(20).optional().default(''),
})

const BOT_RE = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|telegrambot/i

function device(ua: string) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'tablet'
  return /mobi|iphone|android/i.test(ua) ? 'mobile' : 'desktop'
}
function browser(ua: string) {
  if (/telegram/i.test(ua)) return 'Telegram'
  if (/instagram/i.test(ua)) return 'Instagram'
  if (/edg\//i.test(ua)) return 'Edge'
  if (/opr\/|opera/i.test(ua)) return 'Opera'
  if (/yabrowser/i.test(ua)) return 'Yandex'
  if (/samsungbrowser/i.test(ua)) return 'Samsung'
  if (/firefox|fxios/i.test(ua)) return 'Firefox'
  if (/chrome|crios/i.test(ua)) return 'Chrome'
  if (/safari/i.test(ua)) return 'Safari'
  return 'Boshqa'
}
function refHost(ref: string) {
  try {
    const h = new URL(ref).hostname.replace(/^www\./, '')
    return /(^|\.)ayolqadami\.uz$/.test(h) ? null : h || null
  } catch { return null }
}

// Sahifa ko'rilishi (web ilova har bir o'tishda yuboradi). Botlar va tez-tez takrorlar hisobga olinmaydi
export const POST = api(async (req) => {
  const ua = req.headers.get('user-agent') || ''
  if (BOT_RE.test(ua)) return new Response(null, { status: 204 })
  try { rateLimit(`track:${clientIp(req)}`, 120, 60_000) } catch { return new Response(null, { status: 204 }) }
  const d = await body(req, schema)
  const user = await getApiUser(req).catch(() => null)
  await db.pageView.create({
    data: {
      path: d.path.split('?')[0].replace(/\/+$/, '') || '/',
      visitor: d.vid, session: d.sid, userId: user?.id ?? null,
      country: countryOf(d.tz, d.lang), device: device(ua), browser: browser(ua), referrer: refHost(d.ref),
    },
  })
  return new Response(null, { status: 204 })
})
