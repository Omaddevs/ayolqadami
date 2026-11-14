import 'server-only'
import { Prisma } from '@prisma/client'
import { db } from './db'

const n = (v: unknown) => Number(v ?? 0)
const pct = (cur: number, prev: number) => (prev ? Math.round(((cur - prev) / prev) * 100) : null)

// Sahifa yo'li → tushunarli nom
export function pageLabel(path: string) {
  const map: [RegExp, string][] = [
    [/^\/$/, 'Bosh sahifa'], [/^\/jobs$/, 'Vakansiyalar'], [/^\/jobs\/.+/, 'Vakansiya sahifasi'], [/^\/companies$/, 'Kompaniyalar'],
    [/^\/companies\/.+/, 'Kompaniya sahifasi'], [/^\/courses$/, 'Kurslar'], [/^\/courses\/.+/, 'Kurs sahifasi'], [/^\/articles$|^\/blog$/, 'Maqolalar'],
    [/^\/articles\/.+|^\/blog\/.+/, 'Maqola'], [/^\/events/, 'Tadbirlar'], [/^\/dashboard/, 'Kabinet'], [/^\/resume/, 'Rezyume'],
    [/^\/settings/, 'Sozlamalar'], [/^\/ads/, "E'lonlar"], [/^\/post/, "E'lon joylash"],
  ]
  return map.find(([re]) => re.test(path))?.[1] ?? path
}

export async function siteAnalytics(days: number) {
  const now = new Date()
  const from = new Date(now.getTime() - days * 86400_000)
  const prevFrom = new Date(from.getTime() - days * 86400_000)
  const range = Prisma.sql`"createdAt" >= ${from}`
  const prevRange = Prisma.sql`"createdAt" >= ${prevFrom} AND "createdAt" < ${from}`

  const totals = (where: Prisma.Sql) => db.$queryRaw<{ views: bigint; visitors: bigint; sessions: bigint; users: bigint }[]>`
    SELECT count(*) views, count(DISTINCT visitor) visitors, count(DISTINCT session) sessions, count(DISTINCT "userId") users
    FROM "PageView" WHERE ${where}`

  const [[cur], [prev], daily, pages, countries, devices, browsers, refs, online, bounce,
    regTotal, regByMethod, regRole, regDaily] = await Promise.all([
    totals(range), totals(prevRange),
    db.$queryRaw<{ d: Date; views: bigint; visitors: bigint }[]>`
      SELECT date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Tashkent') d, count(*) views, count(DISTINCT visitor) visitors
      FROM "PageView" WHERE ${range} GROUP BY 1 ORDER BY 1`,
    db.$queryRaw<{ path: string; views: bigint; visitors: bigint }[]>`
      SELECT path, count(*) views, count(DISTINCT visitor) visitors FROM "PageView" WHERE ${range} GROUP BY path ORDER BY views DESC LIMIT 15`,
    db.$queryRaw<{ country: string | null; visitors: bigint; views: bigint }[]>`
      SELECT country, count(DISTINCT visitor) visitors, count(*) views FROM "PageView" WHERE ${range} GROUP BY country ORDER BY visitors DESC LIMIT 15`,
    db.$queryRaw<{ k: string | null; v: bigint }[]>`SELECT device k, count(DISTINCT visitor) v FROM "PageView" WHERE ${range} GROUP BY 1 ORDER BY 2 DESC`,
    db.$queryRaw<{ k: string | null; v: bigint }[]>`SELECT browser k, count(DISTINCT visitor) v FROM "PageView" WHERE ${range} GROUP BY 1 ORDER BY 2 DESC LIMIT 8`,
    db.$queryRaw<{ k: string | null; v: bigint }[]>`
      SELECT COALESCE(referrer, '') k, count(DISTINCT session) v FROM "PageView" WHERE ${range} GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
    db.$queryRaw<{ v: bigint }[]>`SELECT count(DISTINCT visitor) v FROM "PageView" WHERE "createdAt" >= ${new Date(now.getTime() - 5 * 60_000)}`,
    db.$queryRaw<{ single: bigint; total: bigint }[]>`
      SELECT count(*) FILTER (WHERE c = 1) single, count(*) total FROM (SELECT count(*) c FROM "PageView" WHERE ${range} GROUP BY session) s`,
    db.user.count({ where: { role: { in: ['SEEKER', 'EMPLOYER'] } } }),
    db.$queryRaw<{ method: string; total: bigint; period: bigint }[]>`
      SELECT CASE WHEN u."googleSub" IS NOT NULL THEN 'google'
                  WHEN t.id IS NOT NULL OR u."phoneVerifiedAt" IS NOT NULL THEN 'telegram'
                  ELSE 'phone' END method,
             count(*) total, count(*) FILTER (WHERE u."createdAt" >= ${from}) period
      FROM "User" u LEFT JOIN "TelegramUser" t ON t."userId" = u.id
      WHERE u.role IN ('SEEKER', 'EMPLOYER') GROUP BY 1`,
    db.$queryRaw<{ role: string; v: bigint }[]>`
      SELECT role::text, count(*) v FROM "User" WHERE role IN ('SEEKER', 'EMPLOYER') AND "createdAt" >= ${from} GROUP BY 1`,
    db.$queryRaw<{ d: Date; v: bigint }[]>`
      SELECT date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Tashkent') d, count(*) v FROM "User"
      WHERE role IN ('SEEKER', 'EMPLOYER') AND "createdAt" >= ${from} GROUP BY 1 ORDER BY 1`,
  ])

  // Kunlik qatorlar — bo'sh kunlar 0 bilan
  const key = (d: Date) => d.toISOString().slice(0, 10)
  const vMap = new Map(daily.map((r) => [key(r.d), r]))
  const rMap = new Map(regDaily.map((r) => [key(r.d), n(r.v)]))
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getTime() + 5 * 3600_000 - (days - 1 - i) * 86400_000)
    const k = d.toISOString().slice(0, 10)
    return { label: `${d.getUTCDate()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}`, views: n(vMap.get(k)?.views), visitors: n(vMap.get(k)?.visitors), regs: rMap.get(k) ?? 0 }
  })

  const c = { views: n(cur.views), visitors: n(cur.visitors), sessions: n(cur.sessions), users: n(cur.users) }
  const p = { views: n(prev.views), visitors: n(prev.visitors), sessions: n(prev.sessions) }
  const methods = Object.fromEntries(regByMethod.map((r) => [r.method, { total: n(r.total), period: n(r.period) }]))
  const regPeriod = regByMethod.reduce((s, r) => s + n(r.period), 0)

  return {
    totals: {
      ...c,
      online: n(online[0]?.v),
      perSession: c.sessions ? +(c.views / c.sessions).toFixed(1) : 0,
      bounce: n(bounce[0]?.total) ? Math.round((n(bounce[0].single) / n(bounce[0].total)) * 100) : 0,
      growth: { views: pct(c.views, p.views), visitors: pct(c.visitors, p.visitors), sessions: pct(c.sessions, p.sessions) },
      conversion: c.visitors ? +((regPeriod / c.visitors) * 100).toFixed(1) : 0,
    },
    series,
    pages: pages.map((r) => ({ path: r.path, label: pageLabel(r.path), views: n(r.views), visitors: n(r.visitors) })),
    countries: countries.map((r) => ({ code: r.country || '', visitors: n(r.visitors), views: n(r.views) })),
    devices: devices.map((r) => ({ k: r.k || '—', v: n(r.v) })),
    browsers: browsers.map((r) => ({ k: r.k || '—', v: n(r.v) })),
    referrers: refs.map((r) => ({ k: r.k, v: n(r.v) })),
    reg: {
      total: regTotal, period: regPeriod,
      google: methods.google ?? { total: 0, period: 0 },
      telegram: methods.telegram ?? { total: 0, period: 0 },
      phone: methods.phone ?? { total: 0, period: 0 },
      seekers: n(regRole.find((r) => r.role === 'SEEKER')?.v), employers: n(regRole.find((r) => r.role === 'EMPLOYER')?.v),
    },
  }
}
