import { db } from '@/lib/db'
import { requireApiUser } from '@/lib/auth'
import { api, json } from '@/lib/http'

// Barchasini o'qilgan deb belgilash (bildirishnomalar sahifasi ochilganda)
export const POST = api(async (req) => {
  const user = await requireApiUser(req)
  await db.user.update({ where: { id: user.id }, data: { notifReadAt: new Date() } })
  return json({ ok: true })
})
