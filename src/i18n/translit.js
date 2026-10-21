// O'zbek lotin → kirill transliteratsiyasi (rasmiy imlo qoidalari bo'yicha, soddalashtirilgan).
// Brend va qisqartmalar (AyolQadami, QadamAI, IT, SMS, React...) lotincha qoldiriladi.

const KEEP = new Set([
  'AyolQadami', 'QadamAI', 'Google', 'Telegram', 'React', 'Python', 'JavaScript', 'TypeScript', 'Excel', 'Word', 'Figma',
  'Instagram', 'Facebook', 'YouTube', 'LinkedIn', 'Click', 'Payme', 'Uzum', 'Makro', 'Flutter', 'Node', 'Git', 'CSS', 'HTML',
  'Photoshop', 'Illustrator', 'Canva', 'Soon', 'OpenStreetMap', 'Android', 'iOS', 'email', 'Email', 'E-mail', 'IELTS', 'CEFR',
])

const APOS = "['ʻʼ‘’`´]"
// tartib muhim: avval ko'p harfli birikmalar
const PAIRS = [
  [new RegExp(`o${APOS}`, 'g'), 'ў'], [new RegExp(`O${APOS}`, 'g'), 'Ў'],
  [new RegExp(`g${APOS}`, 'g'), 'ғ'], [new RegExp(`G${APOS}`, 'g'), 'Ғ'],
  [/sh/g, 'ш'], [/Sh/g, 'Ш'], [/SH/g, 'Ш'],
  [/ch/g, 'ч'], [/Ch/g, 'Ч'], [/CH/g, 'Ч'],
  [/yo/g, 'ё'], [/Yo/g, 'Ё'], [/YO/g, 'Ё'],
  [/yu/g, 'ю'], [/Yu/g, 'Ю'], [/YU/g, 'Ю'],
  [/ya/g, 'я'], [/Ya/g, 'Я'], [/YA/g, 'Я'],
  [/ye/g, 'е'], [/Ye/g, 'Е'], [/YE/g, 'Е'],
]
const ONE = {
  a: 'а', b: 'б', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п',
  q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з', c: 'с', w: 'в',
}

function word(w) {
  // so'z boshidagi "e" → "э"
  let s = w.replace(/^e/, 'э').replace(/^E/, 'Э')
  for (const [re, to] of PAIRS) s = s.replace(re, to)
  // unlilardan keyingi "e" → "э" (masalan: "poeziya" → "поэзия")
  s = s.replace(/([аоуиэўё])e/g, '$1э')
  // tutuq belgisi (ayirish) → ъ
  s = s.replace(new RegExp(APOS, 'g'), 'ъ')
  let out = ''
  for (const ch of s) {
    const lo = ch.toLowerCase()
    const c = ONE[lo]
    out += c ? (ch === lo ? c : c.toUpperCase()) : ch
  }
  return out
}

// Lotincha qoldiriladigan so'zlar: brend ro'yxati, qisqartmalar (2+ katta harf), CamelCase, raqam aralash, havolalar
const keepWord = (w) =>
  KEEP.has(w) || /^[A-Z0-9]{2,}s?$/.test(w) || /[a-z][A-Z]/.test(w) || /\d/.test(w)

// {o'zgaruvchi}, havola/email yoki so'z (ichida tutuq belgisi va chiziqcha bo'lishi mumkin)
const TOKEN = new RegExp(String.raw`\{\w+\}|https?://\S+|[\w.+-]+@[\w.-]+\w|[A-Za-z0-9]+(?:(?:${APOS}|-)[A-Za-z0-9]+)*${APOS}?`, 'g')

const cache = new Map()

export function toCyrillic(text) {
  if (!text || !/[A-Za-z]/.test(text)) return text
  const hit = cache.get(text)
  if (hit !== undefined) return hit
  // {o'zgaruvchi} va <teg> qismlariga tegmaymiz
  const res = text.replace(TOKEN, (m) => {
    if (m.startsWith('{') || m.includes('@') || m.includes('://')) return m
    // "Ish-izlovchi" kabi chiziqchali so'zlarni bo'lib ko'rib chiqamiz
    return m.split('-').map((p) => (keepWord(p) ? p : word(p))).join('-')
  })
  if (cache.size > 5000) cache.clear()
  cache.set(text, res)
  return res
}
