import { createHash } from 'node:crypto'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getApiUser } from '@/lib/auth'
import { ApiError, api, body, clientIp, json } from '@/lib/http'
import { notifySite } from '@/lib/notifications'
import { rateLimit } from '@/lib/rate-limit'
import { jobPath } from '@/lib/slug'

type Ctx = { params: Promise<{ id: string }> }

const schema = z.object({
  kind: z.enum(['CALL', 'TELEGRAM', 'MESSAGE']),
  text: z.string().trim().max(1000).optional(),
})
const REPEAT_MS = 10 * 60_000 // bir kishining takroriy bosishi shu oraliqda qayta hisoblanmaydi

// «Bog'lanish»: qo'ng'iroq, Telegram'ga o'tish yoki saytdan savol yozish. Admin panelda har bir vakansiya
// bo'yicha hisoblanadi. Muallifning o'z bosishlari hisobga olinmaydi. Javobda joriy hisoblagichlar
export const POST = api<Ctx>(async (req, { params }) => {
  const { id } = await params
  const ip = clientIp(req)
  rateLimit(`contact:${ip}`, 120, 3600_000)
  const { kind, text } = await body(req, schema)
  const job = await db.job.findUnique({ where: { id }, select: { status: true, authorId: true, number: true, title: true, city: true, calls: true, writes: true } })
  if (!job || job.status !== 'ACTIVE') throw new ApiError(404, 'not_found', 'Vakansiya topilmadi')

  const user = await getApiUser(req)
  if (kind === 'MESSAGE') {
    if (!user) throw new ApiError(401, 'unauthorized', 'Avval tizimga kiring')
    if (!text) throw new ApiError(400, 'validation', 'Savol matnini yozing')
    rateLimit(`contact-msg:${user.id}`, 20, 3600_000)
  }
  const counts = { calls: job.calls, writes: job.writes }
  if (user && user.id === job.authorId) return json(counts)

  // IP xom holda saqlanmaydi
  const viewer = user ? `u:${user.id}` : 'a:' + createHash('sha256').update(`${ip}|${req.headers.get('user-agent') || ''}`).digest('hex').slice(0, 32)
  if (kind !== 'MESSAGE') {
    const recent = await db.jobContact.findFirst({
      where: { jobId: id, viewer, kind, createdAt: { gt: new Date(Date.now() - REPEAT_MS) } }, select: { id: true },
    })
    if (recent) return json(counts)
  }

  const [, j] = await db.$transaction([
    db.jobContact.create({ data: { jobId: id, kind, viewer, userId: user?.id, text: kind === 'MESSAGE' ? text : null } }),
    db.job.update({
      where: { id },
      data: kind === 'CALL' ? { calls: { increment: 1 } } : { writes: { increment: 1 } },
      select: { calls: true, writes: true },
    }),
  ])
  // savol ish beruvchiga saytdagi bildirishnoma sifatida ham boradi
  if (kind === 'MESSAGE' && job.authorId) {
    await notifySite(job.authorId, { title: `«${job.title}» bo'yicha savol`, body: `${user!.name}: ${text}`.slice(0, 500), link: jobPath(job) })
      .catch((e) => console.error('[contact] notify', e))
  }
  return json({ calls: j.calls, writes: j.writes })
})
