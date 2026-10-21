import { db } from '@/lib/db'
import { requireApiUser } from '@/lib/auth'
import { api, json } from '@/lib/http'
import { jobOut } from '@/lib/serialize'

// Ish beruvchining o'z vakansiyalari — barcha holatlarda (moderatsiyada, rad etilgan ham)
export const GET = api(async (req) => {
  const user = await requireApiUser(req, ['EMPLOYER'])
  const jobs = await db.job.findMany({
    where: { authorId: user.id, status: { not: 'ARCHIVED' } },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { applications: true } } },
  })
  return json({ items: jobs.map((j) => ({ ...jobOut(j), own: true })) })
})
