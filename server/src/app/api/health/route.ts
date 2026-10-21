import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Yuk balanslagich / monitoring uchun: server va baza holati
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return Response.json({ ok: true, db: 'up', time: new Date().toISOString() })
  } catch {
    return Response.json({ ok: false, db: 'down' }, { status: 503 })
  }
}
