'use server'
// Hamkorlar: yaratish/tahrirlash (rasm yuklash yoki havola), yoqish/o'chirish, o'chirib tashlash
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { isSafeImage, isSafeLink } from '@/lib/banners'
import { detectImage, saveImage, UploadError } from '@/lib/media'
import type { FormState } from '../actions'

const LABEL: Record<string, string> = { name: 'Nomi', linkUrl: 'Havola', imageUrl: 'Rasm havolasi', sort: 'Tartib raqami' }

const form = z.object({
  name: z.string().trim().min(2, 'nomini kiriting').max(80),
  linkUrl: z.string().trim().max(500).refine(isSafeLink, "havola / (sayt ichida) yoki https:// bilan boshlanishi kerak"),
  imageUrl: z.string().trim().max(500).refine((v) => !v || isSafeImage(v), "rasm manzili / yoki https:// bilan boshlanishi kerak"),
  sort: z.coerce.number().int().min(0).max(1000),
})

export async function savePartner(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const parsed = form.safeParse({ name: f.get('name'), linkUrl: f.get('linkUrl') ?? '', imageUrl: f.get('imageUrl') ?? '', sort: f.get('sort') || 0 })
  if (!parsed.success) {
    const i = parsed.error.issues[0]
    return { error: `${LABEL[String(i.path[0])] || 'Maydon'}: ${i.message}` }
  }
  const v = parsed.data
  const id = String(f.get('id') || '')
  const file = f.get('image')
  const hasFile = file instanceof File && file.size > 0
  if (!hasFile && !v.imageUrl) return { error: 'Rasm yuklang yoki rasm havolasini kiriting' }

  // rasm: yangi fayl yuklansa (qirqilgan) — u, aks holda kiritilgan havola
  let imageUrl = v.imageUrl
  if (hasFile) {
    try {
      imageUrl = await saveImage(file, admin.id)
    } catch (e) {
      return { error: e instanceof UploadError ? e.message : 'Rasmni saqlab bo\'lmadi' }
    }
  }

  const data = { name: v.name, linkUrl: v.linkUrl, imageUrl, sort: v.sort, active: f.get('active') === 'on' }
  if (id) {
    const prev = await db.partner.findUnique({ where: { id }, select: { imageUrl: true } })
    await db.partner.update({ where: { id }, data })
    if (prev && prev.imageUrl !== imageUrl) await dropMedia(prev.imageUrl)
    await audit(admin.id, 'partner.update', 'partner', id, { name: v.name })
  } else {
    const p = await db.partner.create({ data })
    await audit(admin.id, 'partner.create', 'partner', p.id, { name: v.name })
  }
  revalidatePath('/admin/partners')
  redirect('/admin/partners?saved=1')
}

export async function togglePartner(f: FormData) {
  const admin = await requireAdmin()
  const id = z.string().min(1).max(64).parse(f.get('id'))
  const p = await db.partner.findUniqueOrThrow({ where: { id } })
  await db.partner.update({ where: { id }, data: { active: !p.active } })
  await audit(admin.id, p.active ? 'partner.disable' : 'partner.enable', 'partner', id, { name: p.name })
  revalidatePath('/admin/partners')
}

export async function deletePartner(f: FormData) {
  const admin = await requireAdmin(['ADMIN'])
  const id = z.string().min(1).max(64).parse(f.get('id'))
  const p = await db.partner.delete({ where: { id } })
  await dropMedia(p.imageUrl)
  await audit(admin.id, 'partner.delete', 'partner', id, { name: p.name })
  revalidatePath('/admin/partners')
  redirect('/admin/partners')
}

// hamkor uchun yuklangan rasm boshqa joyda ishlatilmasa — o'chiriladi
async function dropMedia(url: string) {
  const m = /^\/media\/([a-z0-9]+)$/.exec(url)
  if (!m) return
  const used = (await db.partner.count({ where: { imageUrl: url } })) + (await db.banner.count({ where: { imageUrl: url } }))
  if (!used) await db.media.deleteMany({ where: { id: m[1] } })
}

// Havoladagi rasmni qirqish uchun server orqali olib berish (brauzerda boshqa domen rasmini canvas'da qirqib bo'lmaydi — CORS).
// Faqat https, 5 MB gacha, tarkibi PNG/JPEG/WebP bo'lishi shart; ichki tarmoq manzillari — yo'q
export async function fetchPartnerImage(url: string): Promise<{ data?: string; error?: string }> {
  await requireAdmin()
  let u: URL
  try {
    u = new URL(url.trim())
  } catch {
    return { error: "Havola noto'g'ri" }
  }
  if (u.protocol !== 'https:') return { error: 'Havola https:// bilan boshlanishi kerak' }
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[)/i.test(u.hostname) || !u.hostname.includes('.')) {
    return { error: 'Bu manzildan rasm olib bo\'lmaydi' }
  }
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(10_000), redirect: 'follow' })
    if (!r.ok) return { error: `Rasm ochilmadi (${r.status})` }
    if (Number(r.headers.get('content-length') || 0) > 5 * 1024 * 1024) return { error: 'Rasm 5 MB dan katta' }
    const buf = new Uint8Array(await r.arrayBuffer())
    if (buf.length > 5 * 1024 * 1024) return { error: 'Rasm 5 MB dan katta' }
    const mime = detectImage(buf)
    if (!mime) return { error: 'Havolada PNG, JPEG yoki WebP rasm yo\'q' }
    return { data: `data:${mime};base64,${Buffer.from(buf).toString('base64')}` }
  } catch {
    return { error: 'Rasmni yuklab bo\'lmadi — havolani tekshiring' }
  }
}
