import { db } from '@/lib/db'
import { requireApiUser } from '@/lib/auth'
import { ApiError, api, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'

type Ctx = { params: Promise<{ id: string }> }

async function activeJob(id: string) {
  const job = await db.job.findUnique({ where: { id }, select: { id: true, status: true } })
  if (!job || job.status !== 'ACTIVE') throw new ApiError(404, 'not_found', 'Vakansiya topilmadi')
  return job
}

// Yoqtirish (saqlash). Takroriy bosish hisobni oshirmaydi — hisob faqat yangi yozuv qo'shilganda o'zgaradi
export const POST = api<Ctx>(async (req, { params }) => {
  const { id } = await params
  const user = await requireApiUser(req)
  rateLimit(`like:${user.id}`, 120, 3600_000)
  await activeJob(id)
  const likes = await db.$transaction(async (tx) => {
    const { count } = await tx.jobLike.createMany({ data: [{ userId: user.id, jobId: id }], skipDuplicates: true })
    const j = count
      ? await tx.job.update({ where: { id }, data: { likes: { increment: 1 } }, select: { likes: true } })
      : await tx.job.findUniqueOrThrow({ where: { id }, select: { likes: true } })
    return j.likes
  })
  return json({ liked: true, likes })
})

export const DELETE = api<Ctx>(async (req, { params }) => {
  const { id } = await params
  const user = await requireApiUser(req)
  rateLimit(`like:${user.id}`, 120, 3600_000)
  const likes = await db.$transaction(async (tx) => {
    const { count } = await tx.jobLike.deleteMany({ where: { userId: user.id, jobId: id } })
    const j = count
      ? await tx.job.update({ where: { id }, data: { likes: { decrement: 1 } }, select: { likes: true } })
      : await tx.job.findUnique({ where: { id }, select: { likes: true } })
    return Math.max(0, j?.likes ?? 0)
  })
  return json({ liked: false, likes })
})
