import { db } from '@/lib/db'
import { requireApiUser } from '@/lib/auth'
import { api, json } from '@/lib/http'

export const GET = api(async (req) => {
  const user = await requireApiUser(req)
  const rows = await db.enrollment.findMany({ where: { userId: user.id }, select: { courseId: true } })
  return json({ items: rows.map((r) => r.courseId) })
})
