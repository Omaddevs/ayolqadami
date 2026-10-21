// Ilova tarjimasi. Kalit — o'zbekcha (lotin) asl matn: tarjima topilmasa asl matn ko'rsatiladi.
// uz-cyrl — lotindan avtomatik transliteratsiya (lug'atda maxsus tarjima bo'lsa — o'sha), ru/en — lug'atdan.
// Ishlatish: const t = useT();  t("{n} ta vakansiya", { n: 5 })
import { useApp } from '../context/AppContext'
import RU from './ru'
import EN from './en'
import { toCyrillic } from './translit'

export const LANGS = [
  { id: 'uz', short: 'UZ', label: "O'zbek", hint: 'Lotin yozuvi', html: 'uz' },
  { id: 'uz-cyrl', short: 'ЎЗ', label: 'Ўзбек', hint: 'Кирилл ёзуви', html: 'uz-Cyrl' },
  { id: 'ru', short: 'RU', label: 'Русский', hint: 'Русский язык', html: 'ru' },
  { id: 'en', short: 'EN', label: 'English', hint: 'English language', html: 'en' },
]

const DICTS = { ru: RU, en: EN }
let current = 'uz'

export const normalizeLang = (id) => (LANGS.some((l) => l.id === id) ? id : 'uz')
export const getLang = () => current

// AppProvider har bir render boshida chaqiradi — modul darajasidagi tr() ham joriy tilni biladi
export function setLang(id) {
  const next = normalizeLang(id)
  if (next === current && typeof document !== 'undefined' && document.documentElement.lang) return
  current = next
  if (typeof document !== 'undefined') document.documentElement.lang = LANGS.find((l) => l.id === next).html
}

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : s)

// Interfeys matni
export function tr(src, vars) {
  if (src == null || src === '') return src
  const s = String(src)
  if (current === 'uz') return fill(s, vars)
  if (current === 'uz-cyrl') return fill(toCyrillic(s), vars && Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, typeof v === 'string' ? toCyrillic(v) : v])))
  const d = DICTS[current]
  return fill(d?.[s] ?? s, vars)
}

// Kontent (vakansiya nomi, shahar, tavsif): kirillga o'giriladi; ru/en da lug'atda bo'lsa (masalan, shahar nomi)
// tarjima qilinadi, bo'lmasa muallif yozgan asl matn qoladi
export function tx(src) {
  if (!src || current === 'uz') return src
  if (current === 'uz-cyrl') return toCyrillic(String(src))
  return DICTS[current]?.[src] ?? src
}

// Ro'yxatlar uchun: ['a', 'b'] → tarjima qilingan ['A', 'B']
export const trList = (list) => list.map((s) => tr(s))

// Komponentlar uchun: tilni kontekstdan o'qiydi (til almashganda qayta chiziladi)
export function useT() {
  useApp()
  return tr
}
