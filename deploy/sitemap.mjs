// Build paytida dist/sitemap.xml yaratadi va robots.txt'ga havolasini qo'shadi (WEB_DOMAIN kerak)
import { appendFileSync, writeFileSync } from 'node:fs'

const domain = process.env.WEB_DOMAIN
if (!domain) {
  console.log('[sitemap] WEB_DOMAIN berilmagan — o\'tkazib yuborildi')
  process.exit(0)
}
const base = `https://${domain}`
const routes = ['', 'jobs', 'map', 'courses', 'qadam-ai', 'events', 'articles', 'companies', 'categories', 'candidates', 'support', 'privacy', 'terms']
const today = new Date().toISOString().slice(0, 10)
const urls = routes.map((r) => `  <url><loc>${base}/${r}</loc><lastmod>${today}</lastmod></url>`).join('\n')
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
appendFileSync('dist/robots.txt', `\nSitemap: ${base}/sitemap.xml\n`)
console.log(`[sitemap] ${routes.length} ta sahifa → dist/sitemap.xml`)
