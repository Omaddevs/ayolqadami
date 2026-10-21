// /robots.txt (vercel.json rewrite): shaxsiy bo'limlar yopiq, sitemap — asosiy domendagi to'liq manzil
import { PRIVATE, requestHost, siteBase } from './_seo.js'

export default function handler(req, res) {
  const base = siteBase(req)
  // asosiy domen (SITE_URL) ulangan bo'lsa, boshqa manzillar (masalan *.vercel.app) indekslanmasin — dublikat bo'lmasin
  const mirror = Boolean(process.env.SITE_URL) && new URL(base).host !== requestHost(req)
  const lines = mirror
    ? ['User-agent: *', 'Disallow: /']
    : ['User-agent: *', 'Allow: /', ...PRIVATE.map((p) => `Disallow: ${p}`), 'Disallow: /*?auth=', '', `Sitemap: ${base}/sitemap.xml`]
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600')
  res.status(200).send(lines.join('\n') + '\n')
}
