import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { ApiError } from './http'

// ayolqadam-bot → server so'rovlari: X-Api-Key sarlavhasi BOT_API_KEY (botdagi WEB_API_KEY) bilan bir xil bo'lishi kerak
export function requireBotKey(req: Request) {
  const want = process.env.BOT_API_KEY || ''
  const got = req.headers.get('x-api-key') || ''
  if (want.length < 16) throw new ApiError(503, 'bot_api_disabled', 'BOT_API_KEY sozlanmagan')
  if (got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) throw new ApiError(401, 'bad_key', "Kalit noto'g'ri")
}
