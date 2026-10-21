'use server'
// Telegram bot va kanallarni boshqarish amallari
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { TelegramError, tg } from '@/lib/telegram/api'
import { envToken, getTelegramConfig, isTokenFormat, saveTelegramConfig, type BotMode } from '@/lib/telegram/config'
import { syncBotProfile } from '@/lib/telegram/bot'
import { checkBot, deletePost, errText, inspectChannel, parseChatRef, postCustom, postJobToChannels, startBroadcast } from '@/lib/telegram/service'
import type { FormState } from '../actions'

const tgMsg = (e: unknown) => {
  if (e instanceof TelegramError) {
    if (e.code === 401) return "Bot tokeni noto'g'ri yoki bekor qilingan"
    if (/chat not found/i.test(e.description)) return "Kanal topilmadi. Username to'g'riligini va bot kanalga qo'shilganini tekshiring"
    if (e.code === 0) return e.description
    return `Telegram: ${e.description}`
  }
  return (e as Error)?.message || 'Xatolik'
}
const httpsUrl = z.string().trim().max(500).refine((v) => !v || /^https:\/\/[^\s]+$/.test(v), 'https:// bilan boshlanishi kerak')
const anyUrl = z.string().trim().max(500).refine((v) => !v || /^(https?:\/\/|tg:\/\/)[^\s]+$/.test(v), "havola noto'g'ri")

// ================= Bot sozlamalari =================

const settingsForm = z.object({
  token: z.string().trim().max(100),
  mode: z.enum(['off', 'polling', 'webhook']),
  publicUrl: httpsUrl,
  webAppUrl: z.string().trim().max(300).refine((v) => !v || /^https?:\/\/[^\s]+$/.test(v), "manzil noto'g'ri"),
  welcomeText: z.string().trim().min(1, 'salomlashuv matnini kiriting').max(3000),
  jobFooter: z.string().trim().max(500),
  channelButtons: z.string().trim().max(2000).default(''),
})

export async function saveBotSettings(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin(['ADMIN'])
  const parsed = settingsForm.safeParse(Object.fromEntries(f))
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)[0] }
  const v = parsed.data
  const prev = await getTelegramConfig()
  const patch: Parameters<typeof saveTelegramConfig>[0] = {
    mode: v.mode as BotMode, publicUrl: v.publicUrl.replace(/\/$/, ''), webAppUrl: v.webAppUrl.replace(/\/$/, ''),
    welcomeText: v.welcomeText, jobFooter: v.jobFooter, channelButtons: v.channelButtons,
    autoPostJobs: f.get('autoPostJobs') === 'on', supportViaBot: f.get('supportViaBot') === 'on',
  }

  // Yangi token — avval Telegram orqali tekshiriladi
  let token = prev.token
  if (v.token && !envToken()) {
    if (!isTokenFormat(v.token)) return { error: "Token formati noto'g'ri. @BotFather bergan to'liq tokenni kiriting" }
    try {
      const me = await checkBot(v.token)
      if (prev.token && prev.token !== v.token && prev.mode === 'webhook') await tg(prev.token, 'deleteWebhook').catch(() => {})
      Object.assign(patch, { token: v.token, botUsername: me.username || '', botName: me.first_name })
      token = v.token
    } catch (e) {
      return { error: tgMsg(e) }
    }
  }
  if (patch.mode !== 'off' && !token) return { error: 'Avval bot tokenini kiriting' }
  if (patch.mode === 'webhook' && !patch.publicUrl) return { error: 'Webhook rejimi uchun server manzili (https://…) kerak' }

  const cfg = await saveTelegramConfig(patch)
  const notes: string[] = []
  if (token) {
    try {
      if (cfg.mode === 'webhook') {
        await tg(token, 'setWebhook', {
          url: `${cfg.publicUrl}/api/telegram/webhook`, secret_token: cfg.webhookSecret,
          allowed_updates: ['message', 'callback_query', 'my_chat_member'], drop_pending_updates: false,
        })
      } else if (prev.mode === 'webhook') {
        await tg(token, 'deleteWebhook')
      }
    } catch (e) {
      notes.push(`Webhook: ${tgMsg(e)}`)
    }
    // "O'chiq" rejimda bot boshqa dastur (masalan, ayolqadam-bot) tomonidan boshqariladi — uning menyusiga tegilmaydi
    if (cfg.mode !== 'off') {
      try {
        await syncBotProfile(cfg)
      } catch (e) {
        notes.push(`Bot menyusi: ${tgMsg(e)}`)
      }
    }
  }
  await audit(admin.id, 'telegram.settings', 'telegram', null, { mode: cfg.mode, tokenChanged: token !== prev.token })
  revalidatePath('/admin/telegram', 'layout')
  return notes.length ? { error: `Saqlandi, lekin: ${notes.join('; ')}` } : { ok: 'Sozlamalar saqlandi' }
}

export async function disconnectBot() {
  const admin = await requireAdmin(['ADMIN'])
  const cfg = await getTelegramConfig()
  if (cfg.token && cfg.mode === 'webhook') await tg(cfg.token, 'deleteWebhook').catch(() => {})
  await saveTelegramConfig({ token: '', botUsername: '', botName: '', mode: 'off' })
  await audit(admin.id, 'telegram.disconnect', 'telegram')
  revalidatePath('/admin/telegram', 'layout')
}

// ================= Kanallar =================

export async function addChannel(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const cfg = await getTelegramConfig()
  if (!cfg.token) return { error: 'Avval botni ulang (Telegram → Sozlamalar)' }
  const ref = parseChatRef(String(f.get('chat') || ''))
  if (!ref) return { error: "Kanalni @username, t.me/havola yoki -100… ID ko'rinishida kiriting" }
  try {
    const info = await inspectChannel(cfg.token, ref)
    if (!info.canPost) {
      return { error: `Bot «${info.title}» kanalida administrator emas (holati: ${info.status}). Botni kanalga administrator qilib, «Xabar joylash» huquqi bilan qo'shing` }
    }
    const ch = await db.telegramChannel.upsert({
      where: { chatId: info.chatId },
      create: { chatId: info.chatId, title: info.title, username: info.username, type: info.type, memberCount: info.memberCount },
      update: { title: info.title, username: info.username, type: info.type, memberCount: info.memberCount, active: true },
    })
    await audit(admin.id, 'telegram.channel_add', 'telegram_channel', ch.id, { title: ch.title })
    revalidatePath('/admin/telegram', 'layout')
    return { ok: `«${ch.title}» qo'shildi` }
  } catch (e) {
    return { error: tgMsg(e) }
  }
}

export async function saveChannel(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const id = z.string().min(1).parse(f.get('id'))
  const categories = f.getAll('categories').map(String).filter(Boolean).slice(0, 30)
  const cities = f.getAll('cities').map(String).filter(Boolean).slice(0, 30)
  await db.telegramChannel.update({
    where: { id },
    data: { active: f.get('active') === 'on', autoPost: f.get('autoPost') === 'on', categories, cities },
  })
  await audit(admin.id, 'telegram.channel_update', 'telegram_channel', id)
  revalidatePath('/admin/telegram', 'layout')
  return { ok: 'Kanal sozlamalari saqlandi' }
}

export async function refreshChannel(f: FormData) {
  await requireAdmin()
  const id = z.string().min(1).parse(f.get('id'))
  const cfg = await getTelegramConfig()
  const ch = await db.telegramChannel.findUniqueOrThrow({ where: { id } })
  try {
    const info = await inspectChannel(cfg.token, ch.chatId)
    await db.telegramChannel.update({ where: { id }, data: { title: info.title, username: info.username, memberCount: info.memberCount, active: info.canPost ? ch.active : false } })
  } catch (e) {
    // kanal o'chirilgan yoki bot chiqarib yuborilgan
    if (e instanceof TelegramError && (e.code === 400 || e.code === 403)) await db.telegramChannel.update({ where: { id }, data: { active: false } })
  }
  revalidatePath('/admin/telegram', 'layout')
}

export async function deleteChannel(f: FormData) {
  const admin = await requireAdmin(['ADMIN'])
  const id = z.string().min(1).parse(f.get('id'))
  const ch = await db.telegramChannel.delete({ where: { id } })
  await audit(admin.id, 'telegram.channel_delete', 'telegram_channel', id, { title: ch.title })
  revalidatePath('/admin/telegram', 'layout')
  redirect('/admin/telegram')
}

// ================= Postlar =================

export async function sendJobNow(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const jobId = z.string().min(1).parse(f.get('jobId'))
  const channelIds = f.getAll('channels').map(String).filter(Boolean)
  if (!channelIds.length) return { error: 'Kamida bitta kanalni tanlang' }
  const r = await postJobToChannels(jobId, { channelIds, authorId: admin.id })
  if ('skipped' in r && r.skipped) return { error: r.skipped }
  await audit(admin.id, 'telegram.job_post', 'job', jobId, { sent: r.sent, failed: r.failed })
  revalidatePath(`/admin/jobs/${jobId}`)
  revalidatePath('/admin/telegram', 'layout')
  return r.failed ? { error: `${r.sent} ta kanalga yuborildi, ${r.failed} tasida xato (tafsilot — Telegram → Postlar)` } : { ok: `${r.sent} ta kanalga yuborildi` }
}

const postForm = z.object({
  text: z.string().trim().min(1, 'matnni kiriting').max(4000),
  photo: httpsUrl,
  buttons: z.string().trim().max(2000).default(''),
})

export async function sendCustomPost(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const parsed = postForm.safeParse(Object.fromEntries(f))
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)[0] }
  const v = parsed.data
  const badBtn = v.buttons.split('\n').map((l) => l.split('|').map((s) => s.trim())).find(([t, u]) => t && u && !anyUrl.safeParse(u).success && !/^\{\w+\}/.test(u))
  if (badBtn) return { error: `«${badBtn[0]}» tugmasining havolasi noto'g'ri` }
  const channelIds = f.getAll('channels').map(String).filter(Boolean)
  const broadcast = f.get('broadcast') === 'on'
  if (!channelIds.length && !broadcast) return { error: 'Kamida bitta kanal yoki «Bot obunachilari»ni tanlang' }
  if (broadcast && admin.role !== 'ADMIN') return { error: 'Obunachilarga tarqatishni faqat administrator bajaradi' }

  const parts: string[] = []
  try {
    if (channelIds.length) {
      const res = await postCustom({ channelIds, ...v, authorId: admin.id })
      const ok = res.filter((p) => p.status === 'SENT').length
      parts.push(`${ok}/${res.length} kanalga yuborildi`)
      const bad = res.find((p) => p.status === 'FAILED')
      if (bad) parts.push(`xato: ${bad.error}`)
    }
    if (broadcast) {
      const b = await startBroadcast({ ...v, authorId: admin.id })
      parts.push(`${b.total} ta obunachiga tarqatish boshlandi`)
    }
  } catch (e) {
    return { error: tgMsg(e) }
  }
  await audit(admin.id, 'telegram.post', 'telegram', null, { channels: channelIds.length, broadcast })
  revalidatePath('/admin/telegram', 'layout')
  return parts.some((p) => p.startsWith('xato')) ? { error: parts.join('. ') } : { ok: parts.join('. ') }
}

export async function deletePostAction(f: FormData) {
  const admin = await requireAdmin()
  const id = z.string().min(1).parse(f.get('id'))
  try {
    await deletePost(id)
    await audit(admin.id, 'telegram.post_delete', 'telegram_post', id)
  } catch (e) {
    // xato sahifani yiqitmaydi — post qatorida ko'rsatiladi
    console.error('[telegram] delete post', errText(e))
    await db.telegramPost.update({ where: { id }, data: { error: `O'chirib bo'lmadi: ${tgMsg(e)}`.slice(0, 500) } }).catch(() => {})
  }
  revalidatePath('/admin/telegram', 'layout')
}
