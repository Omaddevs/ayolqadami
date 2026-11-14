// Kanal postidagi «📞 +998 ...» tugmasi: Telegram inline tugmada tel: havolani qabul qilmaydi,
// shuning uchun shu sahifa ochiladi va telefon ilovasiga o'tkazadi (o'tmasa — bosiladigan raqam ko'rinadi)
import { db } from '@/lib/db'
import { esc, jobContact } from '@/lib/telegram/format'
import { jobNumberFromRef } from '@/lib/slug'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const num = jobNumberFromRef((await params).id)
  const job = num ? await db.job.findUnique({ where: { number: num }, select: { title: true, companyName: true, details: true, status: true } }) : null
  const c = job ? jobContact(job) : {}
  const digits = (c.phone || '').replace(/\D/g, '')
  if (!job || !/^998\d{9}$/.test(digits)) return new Response('Raqam topilmadi', { status: 404 })
  const tel = `tel:+${digits}`
  const html = `<!doctype html>
<html lang="uz"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0;url=${tel}">
<title>Qo'ng'iroq — ${esc(job.title)}</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:90vh;margin:0;text-align:center;color:#1f1b2e}
a{display:inline-block;margin-top:14px;padding:14px 26px;border-radius:14px;background:#6d4aff;color:#fff;font-size:20px;font-weight:700;text-decoration:none}</style>
</head><body><div>
<div>${esc(job.title)} — ${esc(job.companyName)}</div>
<a href="${tel}">📞 ${esc(c.phone)}</a>
</div></body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}
