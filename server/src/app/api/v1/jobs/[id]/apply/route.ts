import { db } from '@/lib/db'
import { requireApiUser } from '@/lib/auth'
import { ApiError, api, body, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { appOut } from '@/lib/serialize'
import { applySchema } from '@/lib/validators'

type Ctx = { params: Promise<{ id: string }> }

// Ariza topshirish. Qayta topshirilsa — xat yangilanadi va ariza "yangi" holatiga qaytadi
export const POST = api<Ctx>(async (req, { params }) => {
  const { id } = await params
  const user = await requireApiUser(req, ['SEEKER'])
  rateLimit(`apply:${user.id}`, 60, 24 * 3600_000)
  const { letter } = await body(req, applySchema)

  const job = await db.job.findUnique({ where: { id }, select: { status: true } })
  if (!job || job.status !== 'ACTIVE') throw new ApiError(404, 'not_found', 'Vakansiya topilmadi yoki yopilgan')

  const app = await db.application.upsert({
    where: { jobId_userId: { jobId: id, userId: user.id } },
    create: { jobId: id, userId: user.id, letter },
    update: { letter, status: 'NEW' },
  })
  return json({ application: appOut(app) }, 201)
})
