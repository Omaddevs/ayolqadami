import { requireApiUser } from '@/lib/auth'
import { api, json } from '@/lib/http'
import { userFeed } from '@/lib/notifications'

// Foydalanuvchining bildirishnomalari va o'qilmaganlar soni
export const GET = api(async (req) => {
  const user = await requireApiUser(req)
  return json(await userFeed(user))
})
