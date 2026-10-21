import { db } from '@/lib/db'
import { getApiUser, requireApiUser } from '@/lib/auth'
import { ApiError, api, json } from '@/lib/http'
import { jobOut } from '@/lib/serialize'
import { jobNumberFromRef } from '@/lib/slug'

type Ctx = { params: Promise<{ id: string }> }

// Faol vakansiya hammaga; moderatsiyadagi/rad etilgani faqat muallifga ko'rinadi
export const GET = api<Ctx>(async (req, { params }) => {
  const { id } = await params
  // /jobs/1001-frontend-dasturchi → raqam bo'yicha; eski havolalar (cuid) ham ishlaydi
  const num = jobNumberFromRef(id)
  const job = await db.job.findUnique({ where: num ? { number: num } : { id }, include: { _count: { select: { applications: true } } } })
  if (!job) throw new ApiError(404, 'not_found', 'Vakansiya topilmadi')
  if (job.status !== 'ACTIVE') {
    const user = await getApiUser(req)
    if (!user || user.id !== job.authorId) throw new ApiError(404, 'not_found', 'Vakansiya topilmadi')
  } else {
    await db.job.update({ where: { id: job.id }, data: { views: { increment: 1 } } }).catch(() => {})
  }
  return json({ job: jobOut(job) })
})

// Ish beruvchi o'z vakansiyasini olib tashlaydi (arxivga — arizalar tarixi saqlanadi)
export const DELETE = api<Ctx>(async (req, { params }) => {
  const { id } = await params
  const user = await requireApiUser(req, ['EMPLOYER'])
  const job = await db.job.findUnique({ where: { id }, select: { authorId: true } })
  if (!job || job.authorId !== user.id) throw new ApiError(404, 'not_found', 'Vakansiya topilmadi')
  await db.job.update({ where: { id }, data: { status: 'ARCHIVED' } })
  return json({ ok: true })
})
