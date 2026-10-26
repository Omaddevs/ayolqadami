'use server'
// Kategoriyalar: soha va bo'limlarni yaratish/tahrirlash, yoqish/o'chirish, o'chirib tashlash.
// Slug yoki ota-soha o'zgarsa — shu kategoriyadagi vakansiyalar ham yangi qiymatga o'tkaziladi (e'lonlar yo'qolmasin)
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { slugify } from '@/lib/slug'
import { CATEGORY_ICONS } from '@/lib/categories'
import type { FormState } from '../actions'

const LABEL: Record<string, string> = { name: 'Nomi', short: 'Qisqa nom', slug: 'Slug', icon: 'Ikonka', sort: 'Tartib raqami' }

const form = z.object({
  name: z.string().trim().min(2, 'nomini kiriting').max(60),
  short: z.string().trim().max(30),
  slug: z.string().trim().max(40).refine((v) => v === '' || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), 'faqat lotin kichik harflari, raqam va «-»'),
  parentId: z.string().max(64),
  icon: z.string().refine((v) => CATEGORY_ICONS.includes(v), "ro'yxatdan tanlang"),
  sort: z.coerce.number().int().min(0).max(10000),
})

export async function saveCategory(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const parsed = form.safeParse({
    name: f.get('name'), short: f.get('short') ?? '', slug: f.get('slug') ?? '', parentId: f.get('parentId') ?? '', icon: f.get('icon'), sort: f.get('sort') || 0,
  })
  if (!parsed.success) {
    const i = parsed.error.issues[0]
    return { error: `${LABEL[String(i.path[0])] || 'Maydon'}: ${i.message}` }
  }
  const v = parsed.data
  const id = String(f.get('id') || '')
  const slug = v.slug || slugify(v.name, 40)
  if (!slug) return { error: 'Slug: nomdan yasab bo\'lmadi — lotin harflarida kiriting' }

  const prev = id ? await db.category.findUnique({ where: { id }, include: { parent: true, _count: { select: { children: true } } } }) : null
  if (id && !prev) return { error: 'Kategoriya topilmadi' }
  // faqat bir daraja: ota — soha bo'lishi kerak; bo'limlari bor soha boshqa sohaning bo'limiga aylanmaydi
  const parent = v.parentId ? await db.category.findUnique({ where: { id: v.parentId } }) : null
  if (v.parentId && (!parent || parent.parentId)) return { error: "Ota soha topilmadi (bo'lim ichiga bo'lim qo'shib bo'lmaydi)" }
  if (parent && parent.id === id) return { error: "Kategoriya o'ziga bo'lim bo'la olmaydi" }
  if (parent && prev?._count.children) return { error: "Bu sohaning bo'limlari bor — uni boshqa sohaga bo'lim qilib bo'lmaydi" }

  const data = { name: v.name, short: v.short, slug, icon: v.icon, sort: v.sort, parentId: parent?.id ?? null, active: f.get('active') === 'on' }
  try {
    if (prev) {
      await db.$transaction(async (tx) => {
        await tx.category.update({ where: { id: prev.id }, data })
        // vakansiyalardagi (soha, bo'lim) juftligi: eski → yangi
        const was = prev.parent ? { category: prev.parent.slug, subcategory: prev.slug } : { category: prev.slug }
        const now = parent ? { category: parent.slug, subcategory: slug } : { category: slug }
        const changed = was.category !== now.category || (was as { subcategory?: string }).subcategory !== (now as { subcategory?: string }).subcategory
        if (changed) {
          // soha nomi o'zgarsa — uning bo'limlaridagi vakansiyalar bo'limini saqlab qoladi; bo'lim sohaga aylansa — bo'lim tozalanadi
          await tx.job.updateMany({ where: was, data: prev.parent && !parent ? { ...now, subcategory: null } : now })
        }
      })
      await audit(admin.id, 'category.update', 'category', prev.id, { name: v.name, slug })
    } else {
      const c = await db.category.create({ data })
      await audit(admin.id, 'category.create', 'category', c.id, { name: v.name, slug })
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return { error: `Slug: «${slug}» band — boshqasini kiriting` }
    throw e
  }
  revalidatePath('/admin/categories')
  redirect('/admin/categories?saved=1')
}

export async function toggleCategory(f: FormData) {
  const admin = await requireAdmin()
  const id = z.string().min(1).max(64).parse(f.get('id'))
  const c = await db.category.findUniqueOrThrow({ where: { id } })
  await db.category.update({ where: { id }, data: { active: !c.active } })
  await audit(admin.id, c.active ? 'category.disable' : 'category.enable', 'category', id, { name: c.name })
  revalidatePath('/admin/categories')
}

// Vakansiyasi yoki bo'limi bor kategoriya o'chirilmaydi — uni o'chirib qo'yish (saytda yashirish) kifoya.
// Rad etilsa — tahrirlash sahifasiga sabab bilan qaytadi
export async function deleteCategory(f: FormData) {
  const admin = await requireAdmin(['ADMIN'])
  const id = z.string().min(1).max(64).parse(f.get('id'))
  const c = await db.category.findUnique({ where: { id }, include: { parent: true, _count: { select: { children: true } } } })
  if (!c) redirect('/admin/categories')
  const back = (msg: string) => redirect(`/admin/categories/${id}?error=${encodeURIComponent(msg)}`)
  if (c._count.children) back("Avval bu sohaning bo'limlarini o'chiring yoki boshqa sohaga o'tkazing")
  const jobs = await db.job.count({ where: c.parent ? { category: c.parent.slug, subcategory: c.slug } : { category: c.slug } })
  if (jobs) back(`Bu kategoriyada ${jobs} ta vakansiya bor — o'chirib tashlash o'rniga «O'chirish» (saytda yashirish) tugmasidan foydalaning`)
  await db.category.delete({ where: { id } })
  await audit(admin.id, 'category.delete', 'category', id, { name: c.name, slug: c.slug })
  revalidatePath('/admin/categories')
  redirect('/admin/categories')
}
