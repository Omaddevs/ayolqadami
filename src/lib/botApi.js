// Telegram bot (ayolqadam-bot) REST API bilan bog'lanish.
// VITE_BOT_API_URL berilmagan bo'lsa yoki admin botda "Web sinxron"ni o'chirgan bo'lsa (503) — jimgina hech narsa qilmaydi.
const BASE = (import.meta.env.VITE_BOT_API_URL || '').replace(/\/$/, '')

export const botApiEnabled = Boolean(BASE)

// Botdagi faol vakansiyalar — saytdagi vakansiya shakli bilan bir xil (id: 'tg123')
export async function fetchBotJobs(signal) {
  if (!BASE) return []
  try {
    const res = await fetch(`${BASE}/api/vacancies?limit=200`, { signal })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.items) ? data.items : []
  } catch {
    return []
  }
}

// Saytda joylangan vakansiya botga ham yuboriladi (u yerda admin moderatsiyasidan o'tib, kanalga chiqadi)
export function sendJobToBot(job) {
  if (!BASE) return
  fetch(`${BASE}/api/vacancies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  }).catch(() => { /* bot o'chiq — sayt ishlashda davom etadi */ })
}
