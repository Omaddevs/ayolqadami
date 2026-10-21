import { seoUrls, sitemapXml } from '@/lib/seo'
import { siteUrl } from '@/lib/login-bot'

export const dynamic = 'force-dynamic'

// Sayt sitemap'i (Caddy deploy'da sayt domenidagi /sitemap.xml shu yerga yo'naltiriladi). Manzillar WEB_URL bo'yicha
export async function GET() {
  const base = siteUrl()
  if (!base) return new Response('WEB_URL sozlanmagan', { status: 503 })
  return new Response(sitemapXml(base, await seoUrls()), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=600, stale-while-revalidate=3600' },
  })
}
