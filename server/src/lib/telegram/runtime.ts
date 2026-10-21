// Polling rejimi: server o'zi Telegram'dan yangilanishlarni so'rab turadi (HTTPS manzil kerak emas — lokal va oddiy serverlar uchun).
// Server ishga tushganda instrumentation.ts chaqiradi; rejim admin paneldan o'zgarsa, keyingi aylanishda hisobga olinadi.
import { TelegramError, tg, type TgUpdate } from './api'
import { getTelegramConfig } from './config'
import { handleUpdate } from './bot'

type PollerState = { started: boolean; token: string; offset: number; lastError: string; lastPollAt: number }
const g = globalThis as unknown as { __tgPoller?: PollerState }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const pollerStatus = () => g.__tgPoller ?? null

export function startPoller() {
  if (g.__tgPoller?.started) return
  const st: PollerState = (g.__tgPoller = { started: true, token: '', offset: 0, lastError: '', lastPollAt: 0 })
  void (async () => {
    for (;;) {
      let cfg
      try {
        cfg = await getTelegramConfig()
      } catch {
        await sleep(5000) // baza hali tayyor emas
        continue
      }
      if (cfg.mode !== 'polling' || !cfg.token) {
        st.token = ''
        await sleep(3000)
        continue
      }
      try {
        if (st.token !== cfg.token) {
          // yangi bot: webhook o'chiriladi (aks holda getUpdates 409 qaytaradi)
          await tg(cfg.token, 'deleteWebhook', { drop_pending_updates: false })
          st.token = cfg.token
          st.offset = 0
        }
        const updates = await tg<TgUpdate[]>(cfg.token, 'getUpdates', {
          offset: st.offset, timeout: 25, allowed_updates: ['message', 'callback_query', 'my_chat_member'],
        }, 35000)
        st.lastPollAt = Date.now()
        st.lastError = ''
        for (const u of updates) {
          st.offset = u.update_id + 1
          await handleUpdate(u, cfg).catch((e) => console.error('[telegram] update', u.update_id, e))
        }
      } catch (e) {
        st.lastError = e instanceof TelegramError ? `${e.code}: ${e.description}` : (e as Error).message
        // 409 — boshqa nusxa ham shu botni so'rayapti; 401 — token noto'g'ri
        await sleep(e instanceof TelegramError && e.code === 401 ? 30000 : 5000)
      }
    }
  })()
}
