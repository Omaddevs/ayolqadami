// /sitemap.xml (vercel.json rewrite) — manzillar API serverdan (VITE_API_URL/api/v1/seo/urls):
// faol vakansiyalar, kompaniyalar, maqolalar, kurslar. Server javob bermasa — asosiy bo'limlar.
import { STATIC_URLS, siteBase } from './_seo.js'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export default async function handler(req, res) {
  const base = siteBase(req)
  let urls = STATIC_URLS
  const apiBase = (process.env.VITE_API_URL || '').replace(/\/$/, '')
  if (apiBase) {
    try {
      const r = await fetch(`${apiBase}/api/v1/seo/urls`, { signal: AbortSignal.timeout(8000) })
      if (r.ok) {
        const d = await r.json()
        if (Array.isArray(d.items) && d.items.length) urls = d.items
      }
    } catch {
      // server ishlamayapti — statik ro'yxat
    }
  }
  const body = urls
    .filter((u) => typeof u.path === 'string' && u.path.startsWith('/'))
    .map((u) => `  <url><loc>${esc(base + u.path)}</loc>${u.lastmod ? `<lastmod>${esc(u.lastmod)}</lastmod>` : ''}` +
      `${u.changefreq ? `<changefreq>${esc(u.changefreq)}</changefreq>` : ''}${u.priority != null ? `<priority>${Number(u.priority).toFixed(1)}</priority>` : ''}</url>`)
    .join('\n')
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600')
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`)
}
