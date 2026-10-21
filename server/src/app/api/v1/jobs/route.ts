import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireApiUser } from '@/lib/auth'
import { api, body, json, pageParams } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { jobOut } from '@/lib/serialize'
import { getSettings } from '@/lib/settings'
import { JOB_COLUMNS, jobInputSchema } from '@/lib/validators'
import { autoPostJob } from '@/lib/telegram/service'

export const dynamic = 'force-dynamic'

// Faol vakansiyalar: ?q=&category=&city=&type=&page=&limit= (limit 500 gacha — web ilova filtrlashni o'zida bajaradi)
export const GET = api(async (req) => {
  const url = new URL(req.url)
  const { limit, skip, page } = pageParams(url, 50, 500)
  const q = url.searchParams.get('q')?.trim()
  const where: Prisma.JobWhereInput = {
    status: 'ACTIVE',
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    ...(url.searchParams.get('category') && { category: url.searchParams.get('category')! }),
    ...(url.searchParams.get('city') && { city: url.searchParams.get('city')! }),
    ...(url.searchParams.get('type') && { type: url.searchParams.get('type')! }),
    ...(q && {
      AND: [{ OR: [{ title: { contains: q, mode: 'insensitive' } }, { companyName: { contains: q, mode: 'insensitive' } }, { skills: { has: q } }] }],
    }),
  }
  const [items, total] = await Promise.all([
    db.job.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      include: { _count: { select: { applications: true } } },
    }),
    db.job.count({ where }),
  ])
  return json(
    { items: items.map(jobOut), total, page, limit },
    { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' } },
  )
})

// Ish beruvchi vakansiya joylaydi. Moderatsiya yoqilgan bo'lsa — PENDING holatida, admin tasdiqlagach saytda chiqadi
export const POST = api(async (req) => {
  const user = await requireApiUser(req, ['EMPLOYER'])
  rateLimit(`job:${user.id}`, 20, 24 * 3600_000)
  const input = await body(req, jobInputSchema)
  const { jobModeration } = await getSettings()

  const companyName = user.company || input.company || user.name
  const company = await db.company.findUnique({ where: { name: companyName }, select: { id: true } })
  const details = Object.fromEntries(Object.entries(input).filter(([k]) => !JOB_COLUMNS.has(k))) as Prisma.InputJsonValue
  const now = new Date()

  const job = await db.job.create({
    data: {
      title: input.title,
      companyName,
      companyId: company?.id ?? null,
      color: input.color || '#6366F6',
      category: input.category,
      city: input.city,
      region: input.region,
      district: input.district,
      salaryFrom: input.salaryFrom,
      salaryTo: input.salaryTo,
      type: input.type,
      experience: input.experience,
      tags: input.tags,
      skills: input.skills,
      description: input.description,
      requirements: input.requirements,
      conditions: input.conditions,
      details,
      status: jobModeration ? 'PENDING' : 'ACTIVE',
      publishedAt: jobModeration ? null : now,
      expiresAt: input.expires ? new Date(input.expires) : new Date(now.getTime() + 30 * 24 * 3600_000),
      source: 'WEB',
      authorId: user.id,
    },
    include: { _count: { select: { applications: true } } },
  })
  // moderatsiya o'chiq bo'lsa — darhol Telegram kanallariga (javobni kutdirmaydi)
  if (job.status === 'ACTIVE') void autoPostJob(job.id)
  return json({ job: { ...jobOut(job), own: true } }, 201)
})
