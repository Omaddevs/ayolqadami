// Kirish oynasidagi tugallanmagan jarayon (raqamni tasdiqlash bosqichi) — sessionStorage'da.
// Telefonda «Telegram'da kodni olish» bosilganda brauzer fonga o'tadi va qaytganda sahifa ko'pincha qayta yuklanadi:
// shu qoralama bo'lmasa oyna yopilib, tasdiqlash sessiyasi (id) yo'qoladi va botdagi kod endi ishlamaydi.
// Parol saqlanmaydi. Qoralama shu tab bilan cheklangan va DRAFT_TTL dan keyin eskiradi.
const KEY = 'aq-auth-draft'
const DRAFT_TTL = 15 * 60_000

export function loadAuthDraft() {
  try {
    const d = JSON.parse(sessionStorage.getItem(KEY) || 'null')
    if (d && d.savedAt > Date.now() - DRAFT_TTL) return d
    sessionStorage.removeItem(KEY)
  } catch { /* storage yo'q */ }
  return null
}

export function saveAuthDraft(draft) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() })) } catch { /* storage yo'q */ }
}

export function clearAuthDraft() {
  try { sessionStorage.removeItem(KEY) } catch { /* storage yo'q */ }
}
