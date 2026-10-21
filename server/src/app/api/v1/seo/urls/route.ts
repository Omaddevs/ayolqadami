import { api, json } from '@/lib/http'
import { seoUrls } from '@/lib/seo'

export const dynamic = 'force-dynamic'

// Sayt sitemap'i uchun manzillar (Vercel funksiyasi va /sitemap.xml shu ro'yxatdan quradi)
export const GET = api(async () =>
  json({ items: await seoUrls() }, { headers: { 'Cache-Control': 'public, max-age=600, stale-while-revalidate=3600' } }))
