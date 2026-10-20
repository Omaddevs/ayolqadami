// O'zbekiston mobil raqamlari: +998 XX XXX XX XX (kod + 7 raqam, jami 9 raqam)
export const UZ_CODES = ['20', '33', '50', '55', '77', '87', '88', '90', '91', '93', '94', '95', '97', '98', '99']
export const PHONE_PREFIX = '+998 '

// Kiritilgan matnni niqobga soladi: ortiqcha raqamlar kesiladi, +998 o'chirilmaydi
export function formatUzPhone(input) {
  let d = String(input).replace(/\D/g, '')
  if (d.startsWith('998')) d = d.slice(3)
  d = d.slice(0, 9)
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean)
  return PHONE_PREFIX + parts.join(' ')
}

const local = (phone) => String(phone).replace(/\D/g, '').replace(/^998/, '')

// 'ok' | 'short' (to'liq emas) | 'code' (operator kodi noto'g'ri)
export function checkUzPhone(phone) {
  const d = local(phone)
  if (d.length >= 2 && !UZ_CODES.includes(d.slice(0, 2))) return 'code'
  if (d.length !== 9) return 'short'
  return 'ok'
}
