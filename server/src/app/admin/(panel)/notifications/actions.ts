'use server'
// Bildirishnomalar: saytdagi foydalanuvchilarga va bot obunachilariga xabar yuborish
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications'
import type { BroadcastBot } from '@/lib/telegram/service'
import type { FormState } from '../actions'

const form = z.object({
  title: z.string().trim().min(1, 'sarlavhani kiriting').max(120),
  body: z.string().trim().max(3000).default(''),
  link: z.string().trim().max(500).refine((v) => !v || /^(\/[^\s]*|https:\/\/[^\s]+)$/.test(v), '/sahifa yoki https:// bilan boshlanishi kerak').default(''),
  buttonText: z.string().trim().max(40).default(''),
  photo: z.string().trim().max(500).refine((v) => !v || /^https:\/\/[^\s]+$/.test(v), 'https:// bilan boshlanishi kerak').default(''),
  audience: z.enum(['ALL', 'SEEKER', 'EMPLOYER']).default('ALL'),
})
const BOT_LABEL: Record<BroadcastBot, string> = { main: 'asosiy bot', login: 'kirish boti' }

export async function sendNotificationAction(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin(['ADMIN'])
  const parsed = form.safeParse(Object.fromEntries(f))
  if (!parsed.success) {
    const i = parsed.error.issues[0]
    return { error: `${i.path.join('.')}: ${i.message}` }
  }
  const v = parsed.data
  const toSite = f.get('toSite') === 'on'
  const bots = (['main', 'login'] as const).filter((b) => f.get(`bot_${b}`) === 'on')
  if (!toSite && !bots.length) return { error: 'Kamida bitta yo‘nalishni tanlang: sayt yoki bot' }

  const r = await sendNotification({ ...v, site: toSite ? v.audience : null, bots, authorId: admin.id })
  await audit(admin.id, 'notification.send', 'notification', r.notification.id, { site: toSite ? v.audience : null, bots })
  revalidatePath('/admin/notifications')

  const parts: string[] = []
  if (toSite) parts.push(`saytda ${r.siteTotal} ta foydalanuvchiga`)
  const errors: string[] = []
  for (const b of r.broadcasts) {
    if (b.error) errors.push(`${BOT_LABEL[b.bot]}: ${b.error}`)
    else parts.push(`${BOT_LABEL[b.bot]} orqali ${b.total} kishiga (fonda yuborilmoqda)`)
  }
  const ok = parts.length ? `Yuborildi: ${parts.join(', ')}` : ''
  return errors.length ? { error: [ok, `Xato — ${errors.join('; ')}`].filter(Boolean).join('. ') } : { ok }
}

// Saytdagi ro'yxatdan olib tashlash (Telegram'ga ketgan xabarlar o'chmaydi)
export async function deleteNotification(f: FormData) {
  const admin = await requireAdmin(['ADMIN'])
  const id = z.string().min(1).max(64).parse(f.get('id'))
  await db.notification.update({ where: { id }, data: { site: false } }).catch(() => {})
  await audit(admin.id, 'notification.delete', 'notification', id)
  revalidatePath('/admin/notifications')
}
