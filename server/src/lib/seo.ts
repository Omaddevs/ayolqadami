import 'server-only'
import { db } from './db'
import { jobPath } from './slug'

export type SeoUrl = { path: string; lastmod?: string; changefreq?: 'hourly' | 'daily' | 'weekly' | 'monthly'; priority?: number }

// Qidiruv tizimlari uchun sahifalar ro'yxati: asosiy bo'limlar + faol vakansiyalar, maqolalar, kurslar, kompaniyalar
const STATIC: SeoUrl[] = [
  { path: '/', changefreq: 'daily', priority: 1 },
  { path: '/ish-beruvchilar', changefreq: 'weekly', priority: 0.9 },
  { path: '/jobs', changefreq: 'hourly', priority: 0.9 },
  { path: '/companies', changefreq: 'daily', priority: 0.7 },
  { path: '/courses', changefreq: 'weekly', priority: 0.7 },
  { path: '/articles', changefreq: 'weekly', priority: 0.6 },
  { path: '/categories', changefreq: 'weekly', priority: 0.6 },
  { path: '/map', changefreq: 'daily', priority: 0.5 },
  { path: '/qadam-ai', changefreq: 'monthly', priority: 0.5 },
  { path: '/events', changefreq: 'weekly', priority: 0.4 },
  { path: '/support', changefreq: 'monthly', priority: 0.3 },
  { path: '/privacy', changefreq: 'monthly', priority: 0.2 },
  { path: '/terms', changefreq: 'monthly', priority: 0.2 },
]

export async function seoUrls(): Promise<SeoUrl[]> {
  const now = new Date()
  const [jobs, articles, courses, companies] = await Promise.all([
    db.job.findMany({
      where: { status: 'ACTIVE', OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      select: { number: true, title: true, city: true, updatedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 45_000, // sitemap chegarasi 50 000 ta manzil
    }),
    db.article.findMany({ where: { status: 'PUBLISHED' }, select: { id: true, updatedAt: true } }),
    db.course.findMany({ where: { status: 'PUBLISHED' }, select: { id: true, updatedAt: true } }),
    db.job.groupBy({ by: ['companyName'], where: { status: 'ACTIVE', OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, _max: { updatedAt: true } }),
  ])
  const iso = (d: Date | null | undefined) => d?.toISOString()
  // bo'sh bo'limlar (kontent qo'shilmagan) sitemap'ga kirmaydi
  const eventCount = await db.event.count({ where: { status: 'PUBLISHED' } })
  const empty = new Set([!articles.length && '/articles', !courses.length && '/courses', !eventCount && '/events'].filter(Boolean))
  return [
    ...STATIC.filter((u) => !empty.has(u.path)),
    ...jobs.map((j) => ({ path: jobPath(j), lastmod: iso(j.updatedAt), changefreq: 'daily' as const, priority: 0.8 })),
    ...companies.map((c) => ({ path: `/companies/${encodeURIComponent(c.companyName)}`, lastmod: iso(c._max.updatedAt), changefreq: 'daily' as const, priority: 0.6 })),
    ...articles.map((a) => ({ path: `/articles/${encodeURIComponent(a.id)}`, lastmod: iso(a.updatedAt), changefreq: 'monthly' as const, priority: 0.5 })),
    ...courses.map((c) => ({ path: `/courses/${encodeURIComponent(c.id)}`, lastmod: iso(c.updatedAt), changefreq: 'weekly' as const, priority: 0.5 })),
  ]
}

const xmlEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function sitemapXml(base: string, urls: SeoUrl[]) {
  const b = base.replace(/\/$/, '')
  const body = urls.map((u) =>
    `  <url><loc>${xmlEsc(b + u.path)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}` +
    `${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}${u.priority != null ? `<priority>${u.priority.toFixed(1)}</priority>` : ''}</url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}
