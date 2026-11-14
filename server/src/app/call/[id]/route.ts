// Qo'ng'iroq havolasi. Telegram inline tugmada tel: havola ishlamaydi, shuning uchun shu sahifa ochiladi
// va telefon ilovasiga o'tkazadi (o'tmasa — bosiladigan raqam ko'rinadi). Ikki ko'rinish:
//   /call/1001          — vakansiya raqami (yangi kanal postlari)
//   /call/998901234567  — to'g'ridan-to'g'ri telefon raqami (eski postlar)
import { db } from '@/lib/db'
import { esc, jobContact } from '@/lib/telegram/format'
import { jobNumberFromRef } from '@/lib/slug'

export const dynamic = 'force-dynamic'

function page(title: string, subtitle: string, digits: string) {
  const tel = `tel:+${digits}`
  const shown = digits.length === 12 && digits.startsWith('998')
    ? `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`
    : `+${digits}`
  const html = `<!doctype html>
<html lang="uz"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0;url=${tel}">
<title>${esc(title)}</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:90vh;margin:0;text-align:center;color:#1f1b2e}
a{display:inline-block;margin-top:14px;padding:14px 26px;border-radius:14px;background:#6d4aff;color:#fff;font-size:20px;font-weight:700;text-decoration:none}</style>
</head><body><div>
${subtitle ? `<div>${esc(subtitle)}</div>` : ''}
<a href="${tel}">📞 ${esc(shown)}</a>
</div></body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const ref = decodeURIComponent((await params).id)

  // Eski havolalar: parametr o'zi telefon raqami (9+ raqam)
  const raw = ref.replace(/\D/g, '')
  if (/^\+?[\d\s()-]+$/.test(ref) && raw.length >= 9) {
    const digits = raw.length === 9 ? '998' + raw : raw
    if (digits.length > 15) return new Response('Not found', { status: 404 })
    return page(`Qo'ng'iroq`, '', digits)
  }

  const num = jobNumberFromRef(ref)
  const job = num ? await db.job.findUnique({ where: { number: num }, select: { title: true, companyName: true, details: true, status: true } }) : null
  const c = job ? jobContact(job) : {}
  const digits = (c.phone || '').replace(/\D/g, '')
  if (!job || !/^998\d{9}$/.test(digits)) return new Response('Raqam topilmadi', { status: 404 })
  return page(`Qo'ng'iroq — ${job.title}`, `${job.title} — ${job.companyName}`, digits)
}
