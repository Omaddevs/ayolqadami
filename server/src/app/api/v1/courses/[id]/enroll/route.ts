import { db } from '@/lib/db'
import { requireApiUser } from '@/lib/auth'
import { ApiError, api, json } from '@/lib/http'

type Ctx = { params: Promise<{ id: string }> }

export const POST = api<Ctx>(async (req, { params }) => {
  const { id } = await params
  const user = await requireApiUser(req)
  const course = await db.course.findUnique({ where: { id }, select: { status: true } })
  if (!course || course.status !== 'PUBLISHED') throw new ApiError(404, 'not_found', 'Kurs topilmadi')
  await db.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId: id } },
    create: { userId: user.id, courseId: id },
    update: {},
  })
  return json({ ok: true }, 201)
})
