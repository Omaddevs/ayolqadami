import { db } from '@/lib/db'
import { api, clientIp } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'

// Banner bosilishi (admin paneldagi statistika). Bir IP'dan daqiqada bir marta hisoblanadi
export const POST = api<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const { id } = await params
  try {
    rateLimit(`banner-click:${clientIp(req)}:${id}`, 1, 60_000)
    await db.banner.updateMany({ where: { id, active: true }, data: { clicks: { increment: 1 } } })
  } catch {
    // limitdan oshgan yoki noto'g'ri id — jim
  }
  return new Response(null, { status: 204 })
})
