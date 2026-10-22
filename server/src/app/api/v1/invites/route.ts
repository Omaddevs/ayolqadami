import { db } from '@/lib/db'
import { requireApiUser } from '@/lib/auth'
import { ApiError, api, body, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { inviteSchema } from '@/lib/validators'

// Ish beruvchi nomzodni suhbatga taklif qiladi
export const POST = api(async (req) => {
  const user = await requireApiUser(req, ['EMPLOYER'])
  rateLimit(`invite:${user.id}`, 100, 24 * 3600_000)
  const { candidateId, jobId } = await body(req, inviteSchema)
  // taklif faqat o'z vakansiyasiga bog'lanadi — boshqa kompaniya vakansiyasi nomidan taklif yuborib bo'lmaydi
  if (jobId && !(await db.job.findFirst({ where: { id: jobId, authorId: user.id }, select: { id: true } }))) {
    throw new ApiError(404, 'not_found', 'Vakansiya topilmadi')
  }
  await db.invite.upsert({
    where: { employerId_candidateRef: { employerId: user.id, candidateRef: candidateId } },
    create: { employerId: user.id, candidateRef: candidateId, jobId },
    update: {},
  })
  return json({ ok: true }, 201)
})
