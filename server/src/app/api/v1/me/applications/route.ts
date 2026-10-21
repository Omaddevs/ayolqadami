import { db } from '@/lib/db'
import { requireApiUser } from '@/lib/auth'
import { api, json } from '@/lib/http'
import { appOut, jobOut } from '@/lib/serialize'

// Ish izlovchining arizalari (vakansiya ma'lumotlari bilan — vakansiya arxivlangan bo'lsa ham ko'rinadi)
export const GET = api(async (req) => {
  const user = await requireApiUser(req)
  const rows = await db.application.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { job: { include: { _count: { select: { applications: true } } } } },
  })
  return json({ items: rows.map((a) => ({ ...appOut(a), job: jobOut(a.job) })) })
})
