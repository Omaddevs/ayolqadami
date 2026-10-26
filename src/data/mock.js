import { tr } from '../i18n'

// Sohalar (kategoriyalar) admin paneldan keladi (/api/v1/content → categories, bo'limlari bilan: subs).
// Bu ro'yxat — server bo'lmasa yoki javob kelguncha zaxira. syncCategories uni joyida almashtiradi:
// CATEGORIES import qilgan barcha joylar (filtrlar, formalar, dashboard) keyingi chizilishda yangisini ko'radi
export const CATEGORIES = [
  { id: 'office', name: 'Ofis ishlari', short: 'Ofis', icon: 'folder' },
  { id: 'edu', name: "Ta'lim va pedagogika", short: "Ta'lim", icon: 'gradcap' },
  { id: 'med', name: "Tibbiyot va sog'liqni saqlash", short: 'Tibbiyot', icon: 'stethoscope' },
  { id: 'nanny', name: 'Enaga va bola parvarishi', short: 'Enaga', icon: 'bottle' },
  { id: 'housekeeper', name: 'Uy xizmatchisi', short: 'Uy xizmatchisi', icon: 'house' },
  { id: 'cleaning', name: 'Tozalik xodimi', short: 'Tozalik', icon: 'spray' },
  { id: 'cook', name: 'Oshpaz (uy va oshxona)', short: 'Oshpaz', icon: 'pot' },
  { id: 'caregiver', name: 'Keksalar va bemorlar parvarishi', short: 'Parvarishchi', icon: 'heart' },
  { id: 'sales', name: 'Savdo va mijozlar bilan ishlash', short: 'Savdo', icon: 'bag' },
  { id: 'beauty', name: "Go'zallik va parvarish", short: "Go'zallik", icon: 'lipstick' },
  { id: 'it', name: 'IT va dizayn', short: 'IT va dizayn', icon: 'laptop' },
  { id: 'home', name: 'Maishiy xizmatlar', short: 'Maishiy xizmat', icon: 'building' },
  { id: 'remote', name: 'Masofaviy ish', short: 'Masofaviy', icon: 'woman' },
  { id: 'production', name: 'Ishlab chiqarish', short: 'Ishlab chiqarish', icon: 'spool' },
  { id: 'food', name: 'Restoran va mehmonxona', short: 'Restoran', icon: 'cloche' },
  { id: 'marketing', name: 'Marketing va media', short: 'Marketing', icon: 'target' },
  { id: 'finance', name: 'Moliya va buxgalteriya', short: 'Moliya', icon: 'coins' },
  { id: 'law', name: 'Huquq va yuridik', short: 'Huquq', icon: 'books' },
  { id: 'logistics', name: 'Logistika va transport', short: 'Logistika', icon: 'briefcase' },
  { id: 'other', name: 'Boshqa toifalar', short: 'Boshqa', icon: 'sparkle' },
]

export const CITIES = [
  'Toshkent', 'Toshkent viloyati', 'Samarqand', 'Buxoro', 'Andijon', "Farg'ona", 'Namangan', 'Navoiy', 'Qarshi', 'Nukus', 'Urganch', 'Jizzax', 'Guliston', 'Termiz',
]

export const JOB_TYPES = ["To'liq stavka", 'Yarim stavka', 'Masofaviy', 'Gibrid']

// eski saqlangan ma'lumotlardagi soha id'lari yangi ro'yxatga moslanadi
const LEGACY_CAT = { sew: 'production', design: 'it' }
const findCat = (id) => CATEGORIES.find((c) => c.id === (LEGACY_CAT[id] || id))
export const catName = (id) => tr(findCat(id)?.name || id)
export const catShort = (id) => (findCat(id) ? tr(findCat(id).short) : catName(id))
export const catIcon = (id) => findCat(id)?.icon || 'briefcase'
// soha bo'limlari (IT va dizayn → Frontend, Backend...): [{ id, name, short }]
export const subsOf = (id) => findCat(id)?.subs || []
export const subName = (cat, sub) => tr(subsOf(cat).find((s) => s.id === sub)?.short || sub)
// tanlov ro'yxatlari uchun — chizish paytida (modul darajasida emas), admin qo'shgan sohalar ham chiqsin
export const catOptions = () => CATEGORIES.map((c) => ({ value: c.id, label: c.name }))

export function syncCategories(list) {
  if (!Array.isArray(list) || !list.length) return
  CATEGORIES.splice(0, CATEGORIES.length, ...list.map((c) => ({
    id: c.id, name: c.name, short: c.short || c.name, icon: c.icon || 'briefcase', subs: Array.isArray(c.subs) ? c.subs : [],
  })))
}

// botdan kelgan vakansiyalarda maosh satr bo'lishi mumkin — raqamga o'giramiz
export const formatSum = (n) => (Number(n) || 0).toLocaleString('ru-RU').replace(/[,\u00A0\u202F]/g, ' ')
export const salaryText = (j) =>
  j.salaryFrom && j.salaryTo
    ? `${formatSum(j.salaryFrom)} – ${formatSum(j.salaryTo)} ${tr("so'm")}`
    : j.salaryFrom ? tr("{sum} so'mdan", { sum: formatSum(j.salaryFrom) }) : tr('Kelishilgan holda')

// Nomzodlar bazasi. Demo ma'lumotlar olib tashlangan: haqiqiy nomzodlar ish izlovchining roziligi bilan
// (rezyumeni ish beruvchilarga ochiq qilish) backend orqali qo'shilganda shu ro'yxat o'rnini API egallaydi.
export const CANDIDATES = []
