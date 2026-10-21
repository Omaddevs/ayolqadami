import { db } from '@/lib/db'
import { api, json } from '@/lib/http'
import { articleOut, courseOut, eventOut } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

// Kurslar, maqolalar va tadbirlar — web ilova bitta so'rovda oladi (admin paneldan boshqariladi)
export const GET = api(async () => {
  const [courses, articles, events] = await Promise.all([
    db.course.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }] }),
    db.article.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }] }),
    db.event.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ startsAt: 'asc' }, { createdAt: 'asc' }] }),
  ])
  return json(
    { courses: courses.map(courseOut), articles: articles.map(articleOut), events: events.map(eventOut) },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  )
})
