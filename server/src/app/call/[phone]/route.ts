// Qo'ng'iroq havolasi: /call/998901234567
// Telegram inline tugmalari tel: havolani qabul qilmaydi — bot tugmaga shu https sahifani qo'yadi,
// sahifa esa darhol tel: ga o'tkazadi (telefon terish oynasi ochiladi). Avtomatik o'tmasa — katta tugma bor.
import { esc } from '@/lib/telegram/format'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ phone: string }> }) {
  const { phone } = await params
  let digits = decodeURIComponent(phone).replace(/\D/g, '')
  if (digits.length === 9) digits = '998' + digits
  if (digits.length < 9 || digits.length > 15) return new Response('Not found', { status: 404 })

  const tel = `tel:+${digits}`
  const shown = digits.length === 12 && digits.startsWith('998')
    ? `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`
    : `+${digits}`

  const html = `<!doctype html>
<html lang="uz"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(shown)}</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, -apple-system, sans-serif; background: #F4F3FF; color: #1B1856; }
  main { text-align: center; padding: 24px; }
  p { margin: 0 0 18px; font-size: 22px; font-weight: 700; letter-spacing: .01em; }
  a { display: inline-block; padding: 16px 32px; border-radius: 14px; background: #5B57F0; color: #fff; font-size: 17px; font-weight: 700; text-decoration: none; }
</style>
</head><body>
<main><p>${esc(shown)}</p><a href="${tel}">📞 Qo'ng'iroq qilish</a></main>
<script>location.href = ${JSON.stringify(tel)}</script>
</body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } })
}
