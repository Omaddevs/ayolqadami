import 'server-only'

// ayolqadam-bot (Python) statistikasi — botning REST API'si orqali (GET /api/stats, X-Api-Key).
// Bot o'chiq yoki sozlanmagan bo'lsa null qaytadi — dashboard ishlashda davom etadi.
export type BotStats = {
  users: number; seekers: number; employers: number
  new_day: number; new_week: number; new_month: number
  active_day: number; active_week: number
  blocked: number; banned: number; verified: number
  lang_uz: number; lang_ru: number
  res_total: number; res_active: number; res_pending: number
  vac_total: number; vac_active: number; vac_pending: number
  apps: number; apps_week: number; invites: number
  daily_users: Record<string, number>; daily_apps: Record<string, number>
  broadcasts: number
  last_broadcast: { total: number; sent: number; failed: number; created_at: string } | null
}

export type BotStatsResult = { configured: false } | { configured: true; ok: false; error: string } | { configured: true; ok: true; data: BotStats }

export async function getBotStats(): Promise<BotStatsResult> {
  const base = (process.env.BOT_API_URL || '').replace(/\/$/, '')
  const key = process.env.BOT_API_KEY || ''
  if (!base || !key) return { configured: false }
  try {
    const res = await fetch(`${base}/api/stats`, { headers: { 'X-Api-Key': key }, cache: 'no-store', signal: AbortSignal.timeout(4000) })
    if (!res.ok) return { configured: true, ok: false, error: res.status === 503 ? "Kalit noto'g'ri" : `HTTP ${res.status}` }
    return { configured: true, ok: true, data: (await res.json()) as BotStats }
  } catch {
    return { configured: true, ok: false, error: 'Bot ishlamayapti yoki javob bermadi' }
  }
}

// So'nggi n kun (Toshkent vaqti) — bo'sh kunlar 0 bilan
export function lastDays(map: Record<string, number>, n = 14) {
  const out: { day: string; label: string; value: number }[] = []
  const now = Date.now() + 5 * 3600_000
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400_000).toISOString().slice(0, 10)
    out.push({ day: d, label: `${Number(d.slice(8))}.${d.slice(5, 7)}`, value: map[d] || 0 })
  }
  return out
}
