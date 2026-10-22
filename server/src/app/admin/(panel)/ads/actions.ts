'use server'
// Botdan kelgan e'lonlar: tahrirlash, tasdiqlab kanallarga joylash, rad etish
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { AdError, publishAd, rejectAd, saveAdFields } from '@/lib/ads'
import type { FormState } from '../actions'

const id = z.string().min(1).max(64)

export async function saveAd(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const adId = id.parse(f.get('id'))
  const raw: Record<string, string> = {}
  for (const [k, v] of f.entries()) if (k.startsWith('f_')) raw[k.slice(2)] = String(v)
  try {
    await saveAdFields(adId, raw)
  } catch (e) {
    return { error: e instanceof AdError ? e.message : "Saqlab bo'lmadi" }
  }
  await audit(admin.id, 'ad.update', 'ad', adId)
  revalidatePath(`/admin/ads/${adId}`)
  return { ok: "O'zgarishlar saqlandi — post ko'rinishi yangilandi" }
}

export async function approveAd(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const adId = id.parse(f.get('id'))
  const channelIds = f.getAll('channel').map(String).filter(Boolean).slice(0, 50)
  try {
    const r = await publishAd(adId, channelIds, admin.id)
    await audit(admin.id, 'ad.publish', 'ad', adId, { channels: channelIds.length, sent: r.sent, failed: r.failed, title: r.title })
    revalidatePath('/admin', 'layout')
    if (!channelIds.length) return { ok: r.jobId ? "Tasdiqlandi va saytda e'lon qilindi (kanal tanlanmadi)" : 'Tasdiqlandi (kanal tanlanmadi)' }
    return r.failed
      ? { error: `${r.sent} ta kanalga yuborildi, ${r.failed} tasida xato — bot o'sha kanalda admin ekanini tekshiring` }
      : { ok: `Tasdiqlandi va ${r.sent} ta kanal/guruhga joylandi${r.jobId ? ", saytda ham chiqdi" : ''}` }
  } catch (e) {
    return { error: e instanceof AdError ? e.message : 'Joylab bo\'lmadi' }
  }
}

export async function rejectAdAction(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const adId = id.parse(f.get('id'))
  const reason = z.string().trim().min(3, 'sababni yozing').max(500).safeParse(f.get('reason'))
  if (!reason.success) return { error: 'Rad etish sababini yozing (e\'lon beruvchiga yuboriladi)' }
  await rejectAd(adId, reason.data, admin.id)
  await audit(admin.id, 'ad.reject', 'ad', adId, { reason: reason.data })
  revalidatePath('/admin', 'layout')
  return { ok: "Rad etildi — e'lon beruvchiga sababi yuborildi" }
}
