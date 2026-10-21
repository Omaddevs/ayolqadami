import 'server-only'
import { db } from './db'
import { catName } from './catalog'

const DAY = 86400_000
const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
const WEEKDAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']

const growth = (cur: number, prev: number): number | null => (prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : null)
// Toshkent vaqti (UTC+5, yozgi vaqt yo'q): SQL'da createdAt + 5 soat, JS'da getUTC* — kalitlar bir xil bo'ladi
const TZ = 5 * 3600_000
const startOfDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

type Row = { k: Date; n: bigint }
type StatusRow = { k: Date; s: string; n: bigint }

// Dashboard uchun barcha ko'rsatkichlar bitta joyda — so'rovlar parallel bajariladi
export async function dashboardStats() {
  const real = new Date()
  const now = new Date(real.getTime() + TZ)
  const today = startOfDay(now)
  const weekAgo = new Date(real.getTime() - 7 * DAY)
  const twoWeeksAgo = new Date(real.getTime() - 14 * DAY)
  const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1) - TZ)
  const weeksFrom = new Date(today.getTime() - 21 * 7 * DAY)
  const jobWeeksFrom = new Date(today.getTime() - 8 * 7 * DAY)
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  const prevMonthStartWall = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
  const prevMonthStart = new Date(prevMonthStartWall - TZ)
  // o'tgan oy qisqaroq bo'lsa (31-mart → 28-fevral) — oy oxirida to'xtaydi
  const prevMonthSameDay = new Date(Math.min(prevMonthStartWall + (now.getTime() - monthStart), monthStart) - TZ)

  const [
    roleCounts, blocked, usersThisWeek, usersPrevWeek,
    jobStatus, jobsThisWeek, signupsPrevMonthSamePeriod,
    appsThisWeek, appsPrevWeek, appsDaily,
    signupWeekly, appsWeekly, jobsWeekly,
    signupMonthly, appsMonthly, enrollMonthly,
    recentApps, activeByCat, hired, catThis, catPrev, expiredActive,
  ] = await Promise.all([
    db.user.groupBy({ by: ['role'], where: { status: 'ACTIVE' }, _count: true }),
    db.user.count({ where: { status: 'BLOCKED', role: { in: ['SEEKER', 'EMPLOYER'] } } }),
    db.user.count({ where: { createdAt: { gte: weekAgo }, role: { in: ['SEEKER', 'EMPLOYER'] } } }),
    db.user.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo }, role: { in: ['SEEKER', 'EMPLOYER'] } } }),
    db.job.groupBy({ by: ['status'], _count: true }),
    db.job.count({ where: { publishedAt: { gte: weekAgo } } }),
    // o'tgan oyning xuddi shu davri (1-sanadan bugungi kungacha) — adolatli solishtirish
    db.user.count({ where: { role: { in: ['SEEKER', 'EMPLOYER'] }, createdAt: { gte: prevMonthStart, lt: prevMonthSameDay } } }),
    db.application.count({ where: { createdAt: { gte: weekAgo } } }),
    db.application.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    db.$queryRaw<Row[]>`SELECT date_trunc('day', "createdAt" + interval '5 hours') k, count(*) n FROM "Application" WHERE "createdAt" >= ${new Date(today.getTime() - 6 * DAY)} GROUP BY 1`,
    db.$queryRaw<Row[]>`SELECT date_trunc('week', "createdAt" + interval '5 hours') k, count(*) n FROM "User" WHERE "createdAt" >= ${weeksFrom} AND role IN ('SEEKER','EMPLOYER') GROUP BY 1`,
    db.$queryRaw<Row[]>`SELECT date_trunc('week', "createdAt" + interval '5 hours') k, count(*) n FROM "Application" WHERE "createdAt" >= ${weeksFrom} GROUP BY 1`,
    db.$queryRaw<StatusRow[]>`SELECT date_trunc('week', "createdAt" + interval '5 hours') k, status::text s, count(*) n FROM "Job" WHERE "createdAt" >= ${jobWeeksFrom} GROUP BY 1, 2`,
    db.$queryRaw<Row[]>`SELECT date_trunc('month', "createdAt" + interval '5 hours') k, count(*) n FROM "User" WHERE "createdAt" >= ${sixMonthsAgo} AND role IN ('SEEKER','EMPLOYER') GROUP BY 1`,
    db.$queryRaw<Row[]>`SELECT date_trunc('month', "createdAt" + interval '5 hours') k, count(*) n FROM "Application" WHERE "createdAt" >= ${sixMonthsAgo} GROUP BY 1`,
    db.$queryRaw<Row[]>`SELECT date_trunc('month', "createdAt" + interval '5 hours') k, count(*) n FROM "Enrollment" WHERE "createdAt" >= ${sixMonthsAgo} GROUP BY 1`,
    db.application.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, photo: true } }, job: { select: { title: true, companyName: true, color: true } } },
    }),
    db.job.groupBy({ by: ['category'], where: { status: 'ACTIVE', OR: [{ expiresAt: null }, { expiresAt: { gt: real } }] }, _count: true }),
    db.application.count({ where: { status: 'HIRED' } }),
    db.$queryRaw<{ c: string; n: bigint }[]>`SELECT j.category c, count(*) n FROM "Application" a JOIN "Job" j ON j.id = a."jobId" WHERE a."createdAt" >= ${weekAgo} GROUP BY 1`,
    db.$queryRaw<{ c: string; n: bigint }[]>`SELECT j.category c, count(*) n FROM "Application" a JOIN "Job" j ON j.id = a."jobId" WHERE a."createdAt" >= ${twoWeeksAgo} AND a."createdAt" < ${weekAgo} GROUP BY 1`,
    // ACTIVE, lekin muddati o'tgan — saytda ko'rinmaydi, "faol" hisoblanmaydi
    db.job.count({ where: { status: 'ACTIVE', expiresAt: { lte: real } } }),
  ])

  const role = (r: string) => roleCounts.find((x) => x.role === r)?._count ?? 0
  const status = (s: string) => jobStatus.find((x) => x.status === s)?._count ?? 0
  const keyOf = (d: Date) => startOfDay(new Date(d)).getTime()
  const toMap = (rows: Row[]) => new Map(rows.map((r) => [keyOf(r.k), Number(r.n)]))

  // 7 kunlik arizalar
  const daily = toMap(appsDaily)
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() - (6 - i) * DAY)
    return { label: WEEKDAYS[d.getUTCDay()], value: daily.get(d.getTime()) ?? 0 }
  })

  // 22 haftalik to'lqin (Postgres haftasi dushanbadan boshlanadi)
  const monday = new Date(today.getTime() - ((today.getUTCDay() + 6) % 7) * DAY)
  const weekStarts = Array.from({ length: 22 }, (_, i) => new Date(monday.getTime() - (21 - i) * 7 * DAY))
  const su = toMap(signupWeekly), ap = toMap(appsWeekly)
  const wave = {
    up: weekStarts.map((d) => su.get(d.getTime()) ?? 0),
    down: weekStarts.map((d) => ap.get(d.getTime()) ?? 0),
    labels: weekStarts.map((d) => MONTHS[d.getUTCMonth()]),
  }

  // 8 haftalik vakansiyalar holati bo'yicha
  const jobWeek = (statuses: string[]) => Array.from({ length: 8 }, (_, i) => {
    const t = monday.getTime() - (7 - i) * 7 * DAY
    return jobsWeekly.filter((r) => keyOf(r.k) === t && statuses.includes(r.s)).reduce((n, r) => n + Number(r.n), 0)
  })

  // 6 oylik oqim
  const monthStarts = Array.from({ length: 6 }, (_, i) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1)))
  const monthly = (rows: Row[]) => { const m = toMap(rows); return monthStarts.map((d) => m.get(d.getTime()) ?? 0) }
  const signupsM = monthly(signupMonthly)

  // sohalar bo'yicha faol vakansiyalar: top-4 + boshqalar
  const cats = [...activeByCat].sort((a, b) => b._count - a._count)
  const COLORS = ['#7c5cfa', '#2f6bff', '#1f9d48', '#f2b632', '#c9ccd6']
  const donut = [
    ...cats.slice(0, 4).map((c, i) => ({ label: catName(c.category), value: c._count, color: COLORS[i] })),
    ...(cats.length > 4 ? [{ label: 'Boshqalar', value: cats.slice(4).reduce((n, c) => n + c._count, 0), color: COLORS[4] }] : []),
  ]

  // eng tez o'sgan soha (arizalar bo'yicha) — AI kartasi uchun
  const prevMap = new Map(catPrev.map((r) => [r.c, Number(r.n)]))
  const trend = catThis
    .map((r) => ({ category: r.c, now: Number(r.n), prev: prevMap.get(r.c) ?? 0 }))
    .filter((r) => r.now >= 2)
    .map((r) => ({ ...r, growth: growth(r.now, r.prev) }))
    .sort((a, b) => (b.growth ?? Infinity) - (a.growth ?? Infinity) || b.now - a.now)[0]

  return {
    users: {
      // segmentlar kesishmaydi: faol ish izlovchi + faol ish beruvchi + bloklangan = jami
      total: role('SEEKER') + role('EMPLOYER') + blocked, seekers: role('SEEKER'), employers: role('EMPLOYER'), blocked,
      // jami sonning bir haftadagi o'sishi: yangi qo'shilganlar / hafta oldingi jami
      growth: growth(role('SEEKER') + role('EMPLOYER') + blocked, role('SEEKER') + role('EMPLOYER') + blocked - usersThisWeek), thisWeek: usersThisWeek, prevWeek: usersPrevWeek,
    },
    jobs: {
      active: status('ACTIVE') - expiredActive, expired: expiredActive, pending: status('PENDING'), archived: status('ARCHIVED') + status('REJECTED'),
      publishedThisWeek: jobsThisWeek,
      weeks: { active: jobWeek(['ACTIVE']), pending: jobWeek(['PENDING']), archived: jobWeek(['ARCHIVED', 'REJECTED']) },
    },
    apps: { week, total: appsThisWeek, growth: growth(appsThisWeek, appsPrevWeek), hired },
    wave,
    signupsThisMonth: signupsM[5],
    signupsGrowth: growth(signupsM[5], signupsPrevMonthSamePeriod),
    flow: {
      months: monthStarts.map((d) => MONTHS[d.getUTCMonth()]),
      signups: signupsM, apps: monthly(appsMonthly), enrolls: monthly(enrollMonthly),
    },
    recentApps,
    donut,
    activeJobs: status('ACTIVE') - expiredActive,
    trend: trend ? { ...trend, name: catName(trend.category) } : null,
  }
}
