import { createHash } from 'node:crypto'
import { db } from '@/lib/db'
import { getApiUser } from '@/lib/auth'
import { api, clientIp, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'

type Ctx = { params: Promise<{ id: string }> }

const tashkentDay = () => new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10)

// Vakansiya sahifasi ochilganda chaqiriladi. Bir kishi (hisob yoki IP+brauzer) kuniga bir marta hisoblanadi,
// muallifning o'z ko'rishlari hisobga olinmaydi. Javobda joriy ko'rishlar soni
export const POST = api<Ctx>(async (req, { params }) => {
  const { id } = await params
  const ip = clientIp(req)
  rateLimit(`view:${ip}`, 300, 3600_000)
  const job = await db.job.findUnique({ where: { id }, select: { status: true, authorId: true, views: true } })
  if (!job || job.status !== 'ACTIVE') return json({ views: job?.views ?? 0 })

  const user = await getApiUser(req)
  if (user && user.id === job.authorId) return json({ views: job.views })
  // IP xom holda saqlanmaydi
  const viewer = user ? `u:${user.id}` : 'a:' + createHash('sha256').update(`${ip}|${req.headers.get('user-agent') || ''}`).digest('hex').slice(0, 32)

  const { count } = await db.jobView.createMany({ data: [{ jobId: id, viewer, day: tashkentDay() }], skipDuplicates: true })
  if (!count) return json({ views: job.views })
  const j = await db.job.update({ where: { id }, data: { views: { increment: 1 } }, select: { views: true } })
  return json({ views: j.views })
})
