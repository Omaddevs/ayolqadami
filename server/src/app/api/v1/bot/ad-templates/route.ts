import { api, json } from '@/lib/http'
import { requireBotKey } from '@/lib/bot-auth'
import { templatesForBot } from '@/lib/ad-templates'

// Bot «E'lon berish» savollarini shu yerdan oladi — shablon serverda o'zgarsa, bot ham yangilanadi
export const GET = api(async (req) => {
  requireBotKey(req)
  return json(templatesForBot(), { headers: { 'Cache-Control': 'no-store' } })
})
