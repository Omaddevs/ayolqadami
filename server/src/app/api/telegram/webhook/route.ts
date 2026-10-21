import { timingSafeEqual } from 'node:crypto'
import { getTelegramConfig } from '@/lib/telegram/config'
import { handleUpdate } from '@/lib/telegram/bot'
import type { TgUpdate } from '@/lib/telegram/api'

export const dynamic = 'force-dynamic'

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

// Telegram webhook. setWebhook'da berilgan secret_token har so'rovda sarlavhada keladi — boshqalar so'rov yubora olmaydi
export async function POST(req: Request) {
  const cfg = await getTelegramConfig()
  const secret = req.headers.get('x-telegram-bot-api-secret-token') || ''
  if (cfg.mode !== 'webhook' || !cfg.token || !cfg.webhookSecret || !same(secret, cfg.webhookSecret)) {
    return new Response('Unauthorized', { status: 401 })
  }
  let update: TgUpdate
  try {
    update = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }
  // Xato bo'lsa ham 200 — aks holda Telegram shu yangilanishni qayta-qayta yuboradi
  await handleUpdate(update, cfg).catch((e) => console.error('[telegram] webhook', e))
  return Response.json({ ok: true })
}
