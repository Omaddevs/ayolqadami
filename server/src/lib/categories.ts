import 'server-only'
import type { Category } from '@prisma/client'
import { db } from './db'

// Web ilovadagi 3D ikonkalar nomlari (src/components/Icon3D.jsx: ICON_NAMES) — admin formasida tanlash uchun
export const CATEGORY_ICONS = [
  'briefcase', 'folder', 'laptop', 'gradcap', 'stethoscope', 'bottle', 'house', 'spray', 'pot', 'heart', 'bag', 'lipstick',
  'building', 'woman', 'spool', 'cloche', 'target', 'coins', 'books', 'sparkle', 'palette', 'apple', 'users', 'calendar', 'resume', 'bell',
]

export type CategoryNode = Category & { children: Category[] }

// Sohalar va ularning bo'limlari (faqat bir daraja). onlyActive — saytga chiqadiganlari
export async function categoryTree(onlyActive = false): Promise<CategoryNode[]> {
  const all = await db.category.findMany({ where: onlyActive ? { active: true } : {}, orderBy: [{ sort: 'asc' }, { name: 'asc' }] })
  return all.filter((c) => !c.parentId).map((r) => ({ ...r, children: all.filter((c) => c.parentId === r.id) }))
}

// Web ilova kutgan shakl: src/data/mock.js dagi CATEGORIES elementi + bo'limlar
export const categoryOut = (c: CategoryNode) => ({
  id: c.slug,
  name: c.name,
  short: c.short || c.name,
  icon: c.icon,
  subs: c.children.map((s) => ({ id: s.slug, name: s.name, short: s.short || s.name })),
})

// Admin vakansiya formasidagi tanlov: «it» (butun soha) yoki «it/frontend» (bo'lim)
export function splitCategoryChoice(v: string) {
  const [category, subcategory] = v.split('/')
  return { category, subcategory: subcategory || null }
}
