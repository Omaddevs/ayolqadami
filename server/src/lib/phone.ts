// Telefon raqamlari bazada faqat raqamlar ko'rinishida saqlanadi: 998901234567
export const phoneDigits = (s: string | null | undefined) => String(s || '').replace(/\D/g, '')

export function normalizeUzPhone(s: string): string | null {
  let d = phoneDigits(s)
  if (d.length === 9) d = '998' + d
  return /^998\d{9}$/.test(d) ? d : null
}

export function formatUzPhone(d: string | null | undefined): string {
  const s = phoneDigits(d)
  if (!/^998\d{9}$/.test(s)) return s
  return `+998 ${s.slice(3, 5)} ${s.slice(5, 8)} ${s.slice(8, 10)} ${s.slice(10, 12)}`
}
