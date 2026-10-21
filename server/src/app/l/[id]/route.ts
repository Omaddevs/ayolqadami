// Vakansiyaning qisqa havolasi: /l/:id
// Telegram (va boshqa messenjerlar) shu sahifadagi Open Graph teglaridan rasmli kartochka chizadi,
// odam bossa — web ilovadagi vakansiya sahifasiga yo'naltiriladi.
import { db } from '@/lib/db'
import { salaryText } from '@/lib/format'
import { getTelegramConfig } from '@/lib/telegram/config'
import { esc, jobUrl } from '@/lib/telegram/format'
import { jobNumberFromRef } from '@/lib/slug'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cfg = await getTelegramConfig()
  const origin = (cfg.publicUrl || new URL(req.url).origin).replace(/\/$/, '')
  // qisqa havola: /l/1001 (raqam); eski /l/<id> havolalar ham ishlaydi
  const num = jobNumberFromRef(id)
  const job = await db.job.findUnique({ where: num ? { number: num } : { id } })
  const site = cfg.webAppUrl.replace(/\/$/, '')
  if (!job || job.status !== 'ACTIVE') return Response.redirect(site ? `${site}/jobs` : origin, 302)

  const target = jobUrl(job, cfg) || origin
  const place = [job.city, job.district].filter(Boolean).join(', ')
  const salary = job.salaryFrom || job.salaryTo ? salaryText(job.salaryFrom, job.salaryTo) : 'Kelishilgan'
  const title = `${job.title}, ${place} — ${job.companyName}`
  const desc = `${job.title} vakansiyasi ${job.companyName} kompaniyasida, ${place}. Maosh: ${salary}.`
  const image = `${origin}/l/${job.number}/og?v=${job.updatedAt.getTime()}`
  const a = (s: string) => esc(s).replace(/"/g, '&quot;')

  const html = `<!doctype html>
<html lang="uz"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${a(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="AyolQadami">
<meta property="og:title" content="${a(title)}">
<meta property="og:description" content="${a(desc)}">
<meta property="og:url" content="${a(`${origin}/l/${job.number}`)}">
<meta property="og:image" content="${a(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${a(target)}">
<meta http-equiv="refresh" content="0;url=${a(target)}">
</head><body>
<p><a href="${a(target)}">${esc(job.title)}</a></p>
<script>location.replace(${JSON.stringify(target).replace(/</g, '\u003c')})</script>
</body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } })
}
