'use server'
// Bannerlar: yaratish/tahrirlash (rasm yuklash yoki havola), yoqish/o'chirish, o'chirib tashlash
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { isSafeImage, isSafeLink } from '@/lib/banners'
import { endOfDayTashkent, startOfDayTashkent } from '@/lib/dates'
import { saveImage, UploadError } from '@/lib/media'
import type { FormState } from '../actions'

const LABEL: Record<string, string> = { title: 'Nomi', linkUrl: 'Havola', imageUrl: 'Rasm havolasi', sort: 'Tartib raqami', startsAt: 'Boshlanish', endsAt: 'Tugash' }

const form = z.object({
  title: z.string().trim().min(2, 'nomini kiriting').max(120),
  linkUrl: z.string().trim().min(1, 'banner bosilganda ochiladigan havolani kiriting').max(500).refine(isSafeLink, "havola / (sayt ichida) yoki https:// bilan boshlanishi kerak"),
  imageUrl: z.string().trim().max(500).refine((v) => !v || isSafeImage(v), "rasm manzili / yoki https:// bilan boshlanishi kerak"),
  sort: z.coerce.number().int().min(0).max(1000),
  startsAt: z.string().max(20),
  endsAt: z.string().max(20),
})

export async function saveBanner(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const parsed = form.safeParse({
    title: f.get('title'), linkUrl: f.get('linkUrl') ?? '', imageUrl: f.get('imageUrl') ?? '', sort: f.get('sort') || 0,
    startsAt: f.get('startsAt') ?? '', endsAt: f.get('endsAt') ?? '',
  })
  if (!parsed.success) {
    const i = parsed.error.issues[0]
    return { error: `${LABEL[String(i.path[0])] || 'Maydon'}: ${i.message}` }
  }
  const v = parsed.data
  const id = String(f.get('id') || '')
  const file = f.get('image')

  // avval barcha tekshiruvlar — xato bo'lsa rasm bazaga yozilmasin (egasiz qolmasin)
  const startsAt = v.startsAt ? startOfDayTashkent(v.startsAt) : null
  const endsAt = v.endsAt ? endOfDayTashkent(v.endsAt) : null
  if (startsAt && endsAt && endsAt <= startsAt) return { error: "Tugash sanasi boshlanishdan keyin bo'lishi kerak" }
  const hasFile = file instanceof File && file.size > 0
  if (!hasFile && !v.imageUrl) return { error: 'Rasm yuklang yoki rasm havolasini kiriting' }

  // rasm: yangi fayl yuklansa — u, aks holda kiritilgan havola yoki avvalgisi
  let imageUrl = v.imageUrl
  if (hasFile) {
    try {
      imageUrl = await saveImage(file, admin.id)
    } catch (e) {
      return { error: e instanceof UploadError ? e.message : 'Rasmni saqlab bo\'lmadi' }
    }
  }

  const data = { title: v.title, linkUrl: v.linkUrl, imageUrl, sort: v.sort, startsAt, endsAt, active: f.get('active') === 'on' }
  if (id) {
    await db.banner.update({ where: { id }, data })
    await audit(admin.id, 'banner.update', 'banner', id, { title: v.title })
  } else {
    const b = await db.banner.create({ data })
    await audit(admin.id, 'banner.create', 'banner', b.id, { title: v.title })
  }
  revalidatePath('/admin/banners')
  redirect('/admin/banners?saved=1')
}

export async function toggleBanner(f: FormData) {
  const admin = await requireAdmin()
  const id = z.string().min(1).max(64).parse(f.get('id'))
  const b = await db.banner.findUniqueOrThrow({ where: { id } })
  await db.banner.update({ where: { id }, data: { active: !b.active } })
  await audit(admin.id, b.active ? 'banner.disable' : 'banner.enable', 'banner', id, { title: b.title })
  revalidatePath('/admin/banners')
}

export async function deleteBanner(f: FormData) {
  const admin = await requireAdmin(['ADMIN'])
  const id = z.string().min(1).max(64).parse(f.get('id'))
  const b = await db.banner.delete({ where: { id } })
  // banner uchun yuklangan rasm boshqa joyda ishlatilmasa — o'chiriladi
  const m = /^\/media\/([a-z0-9]+)$/.exec(b.imageUrl)
  if (m && !(await db.banner.count({ where: { imageUrl: b.imageUrl } }))) await db.media.deleteMany({ where: { id: m[1] } })
  await audit(admin.id, 'banner.delete', 'banner', id, { title: b.title })
  revalidatePath('/admin/banners')
  redirect('/admin/banners')
}
