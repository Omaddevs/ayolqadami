// Kanal postlari navbati: har daqiqada tekshiradi, sozlamadagi oraliq (postIntervalMin) o'tgan bo'lsa —
// navbatdagi vakansiyalarni barcha mos kanallarga yuboradi. Oxirgi ishga tushish vaqti bazada (server qayta ishga tushsa ham saqlanadi)
import { db } from '../db'
import { getTelegramConfig } from './config'
import { postQueuedJobs } from './service'

const KEY = 'telegramQueue'
const g = globalThis as unknown as { __tgQueue?: boolean }

async function tick() {
  const cfg = await getTelegramConfig()
  if (!cfg.token || !cfg.autoPostJobs || !(cfg.postIntervalMin > 0)) return
  const row = await db.setting.findUnique({ where: { key: KEY } })
  const last = Number((row?.value as { lastRunAt?: number } | null)?.lastRunAt) || 0
  if (Date.now() - last < cfg.postIntervalMin * 60_000) return
  await db.setting.upsert({ where: { key: KEY }, create: { key: KEY, value: { lastRunAt: Date.now() } }, update: { value: { lastRunAt: Date.now() } } })
  const r = await postQueuedJobs()
  if (r.jobs) console.log(`[telegram] navbat: ${r.jobs} vakansiya, ${r.sent} post yuborildi, ${r.failed} xato`)
}

export function startPostScheduler() {
  if (g.__tgQueue) return
  g.__tgQueue = true
  let busy = false
  setInterval(() => {
    if (busy) return
    busy = true
    tick().catch((e) => console.error('[telegram] navbat', e)).finally(() => { busy = false })
  }, 60_000)
}
