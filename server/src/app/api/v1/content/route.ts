import { db } from '@/lib/db'
import { api, json } from '@/lib/http'
import { articleOut, courseOut, eventOut } from '@/lib/serialize'
import { activeBanners, bannerOut } from '@/lib/banners'
import { activePartners, partnerOut } from '@/lib/partners'
import { publicOrigin } from '@/lib/media'

export const dynamic = 'force-dynamic'

// Kurslar, maqolalar, tadbirlar, bannerlar va hamkorlar — web ilova bitta so'rovda oladi (admin paneldan boshqariladi)
export const GET = api(async (req) => {
  const [courses, articles, events, banners, partners] = await Promise.all([
    db.course.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }] }),
    db.article.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }] }),
    db.event.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ startsAt: 'asc' }, { createdAt: 'asc' }] }),
    activeBanners(),
    activePartners(),
  ])
  const origin = publicOrigin(req)
  return json(
    { courses: courses.map(courseOut), articles: articles.map(articleOut), events: events.map(eventOut), banners: banners.map((b) => bannerOut(b, origin)), partners: partners.map((x) => partnerOut(x, origin)) },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  )
})
