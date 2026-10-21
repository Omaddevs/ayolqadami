import type { ApplicationStatus, JobStatus, Prisma, Role } from '@prisma/client'
import { db } from '@/lib/db'
import { getAdmin } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { APP_STATUS, JOB_STATUS, ROLE, catName } from '@/lib/catalog'
import { dateTime } from '@/lib/format'
import { formatUzPhone, phoneDigits } from '@/lib/phone'

export const dynamic = 'force-dynamic'
const MAX = 50_000

// Excel formulasi sifatida bajarilmasligi uchun (CSV injection) = + - @ bilan boshlangan qiymatlar himoyalanadi
function cell(v: unknown) {
  let s = v === null || v === undefined ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csv = (rows: unknown[][]) => '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n')

export async function GET(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  const admin = await getAdmin()
  if (!admin) return new Response('Unauthorized', { status: 401 })
  const { entity } = await params
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim() || ''
  const status = url.searchParams.get('status') || ''
  let rows: unknown[][]

  if (entity === 'users') {
    const role = url.searchParams.get('role') || ''
    const d = phoneDigits(q)
    const where: Prisma.UserWhereInput = {
      ...(role && { role: role as Role }),
      ...(status && { status: status as 'ACTIVE' | 'BLOCKED' }),
      ...(q && { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, ...(d.length >= 3 ? [{ phone: { contains: d } }] : [])] }),
    }
    const users = await db.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: MAX, include: { _count: { select: { applications: true, jobs: true } } } })
    rows = [['Ism', 'Telefon', 'Email', 'Rol', 'Holat', 'Shahar', 'Kompaniya', 'Sohalar', 'Arizalar', 'Vakansiyalar', "Ro'yxatdan o'tgan", 'Oxirgi kirish'],
      ...users.map((u) => [u.name, formatUzPhone(u.phone), u.email, ROLE[u.role].label, u.status === 'ACTIVE' ? 'Faol' : 'Bloklangan', u.city, u.company,
        u.categories.map(catName).join('; '), u._count.applications, u._count.jobs, dateTime(u.createdAt), u.lastLoginAt ? dateTime(u.lastLoginAt) : ''])]
  } else if (entity === 'jobs') {
    const category = url.searchParams.get('category') || ''
    const where: Prisma.JobWhereInput = {
      ...(status && { status: status as JobStatus }),
      ...(category && { category }),
      ...(q && { OR: [{ title: { contains: q, mode: 'insensitive' } }, { companyName: { contains: q, mode: 'insensitive' } }] }),
    }
    const jobs = await db.job.findMany({ where, orderBy: { createdAt: 'desc' }, take: MAX, include: { _count: { select: { applications: true } } } })
    rows = [['Lavozim', 'Kompaniya', 'Soha', 'Shahar', 'Turi', 'Maosh dan', 'Maosh gacha', 'Holat', 'Arizalar', "Ko'rishlar", 'Yaratilgan'],
      ...jobs.map((j) => [j.title, j.companyName, catName(j.category), j.city, j.type, j.salaryFrom, j.salaryTo, JOB_STATUS[j.status].label, j._count.applications, j.views, dateTime(j.createdAt)])]
  } else if (entity === 'applications') {
    const where: Prisma.ApplicationWhereInput = {
      ...(status && { status: status as ApplicationStatus }),
      ...(q && { OR: [{ job: { title: { contains: q, mode: 'insensitive' } } }, { user: { name: { contains: q, mode: 'insensitive' } } }] }),
    }
    const apps = await db.application.findMany({ where, orderBy: { createdAt: 'desc' }, take: MAX, include: { user: true, job: true } })
    rows = [['Nomzod', 'Telefon', 'Vakansiya', 'Kompaniya', 'Holat', 'Xat', 'Sana'],
      ...apps.map((a) => [a.user.name, formatUzPhone(a.user.phone), a.job.title, a.job.companyName, APP_STATUS[a.status].label, a.letter, dateTime(a.createdAt)])]
  } else {
    return new Response('Not found', { status: 404 })
  }

  await audit(admin.id, 'export', entity, null, { count: rows.length - 1, q, status })
  const name = `ayolqadami-${entity}-${new Date().toISOString().slice(0, 10)}.csv`
  return new Response(csv(rows), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' },
  })
}
