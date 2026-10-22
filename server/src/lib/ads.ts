import 'server-only'
// Botdan kelgan e'lonlar: tasdiqlash (+ saytda vakansiya), kanallarga joylash, rad etish, e'lon beruvchiga xabar
import type { Ad } from '@prisma/client'
import { db } from './db'
import { adTitle, adToJob, cleanFields, renderAdPost, templateById, type AdFields } from './ad-templates'
import { getTelegramConfig } from './telegram/config'
import { buttonsKeyboard, DEFAULT_CHANNEL_BUTTONS, esc, jobShareUrl } from './telegram/format'
import { postToChannel, sendToChat } from './telegram/service'
import { TelegramError } from './telegram/api'

export class AdError extends Error {}

const T = {
  ok: { uz: "✅ <b>E'loningiz #{n} tasdiqlandi</b> va kanalga joylandi:", ru: '✅ <b>Ваше объявление #{n} одобрено</b> и опубликовано:' },
  okNoLink: { uz: "✅ <b>E'loningiz #{n} tasdiqlandi</b> va e'lon qilindi.", ru: '✅ <b>Ваше объявление #{n} одобрено</b> и опубликовано.' },
  no: { uz: "❌ <b>E'loningiz #{n} rad etildi.</b>", ru: '❌ <b>Ваше объявление #{n} отклонено.</b>' },
  reason: { uz: 'Sabab', ru: 'Причина' },
  again: { uz: "Kamchilikni tuzatib, qaytadan e'lon berishingiz mumkin.", ru: 'Исправьте замечания и подайте объявление снова.' },
}
const tr = (k: keyof typeof T, lang: string, n: number) => (T[k][lang === 'ru' ? 'ru' : 'uz']).replace('{n}', String(n))

// E'lon beruvchiga xabar (asosiy bot orqali — u shu botda e'lon bergan)
async function notifyAuthor(ad: Ad, html: string) {
  const cfg = await getTelegramConfig()
  if (!cfg.token) return false
  try {
    await sendToChat(cfg.token, ad.tgUserId, { text: html })
    return true
  } catch (e) {
    if (!(e instanceof TelegramError && e.isForbidden)) console.error('[ads] notify', ad.number, e)
    return false
  }
}

const postLink = (p: { messageId: number | null; channel: { username: string | null; chatId: string } }) =>
  !p.messageId ? null : p.channel.username ? `https://t.me/${p.channel.username}/${p.messageId}` : p.channel.chatId.startsWith('-100') ? `https://t.me/c/${p.channel.chatId.slice(4)}/${p.messageId}` : null

// Admin tahrirlagan maydonlarni saqlash (tasdiqlashdan oldin)
export async function saveAdFields(adId: string, raw: Record<string, string>) {
  const ad = await db.ad.findUniqueOrThrow({ where: { id: adId } })
  const tpl = templateById(ad.template)
  if (!tpl) throw new AdError('Shablon topilmadi')
  const { fields, errors } = cleanFields(tpl, raw)
  const first = Object.entries(errors)[0]
  if (first) throw new AdError(`${tpl.fields.find((f) => f.key === first[0])?.label || first[0]}: ${first[1]}`)
  return db.ad.update({ where: { id: adId }, data: { fields } })
}

// Kanal postining matni va tugmalari (oldindan ko'rish ham shu bilan)
export async function adPostPreview(ad: Ad, jobForLink?: { id: string; number: number; title: string; city: string } | null) {
  const cfg = await getTelegramConfig()
  const tpl = templateById(ad.template)!
  const link = jobForLink ? jobShareUrl(jobForLink, cfg) : ''
  const text = renderAdPost(tpl, ad.fields as AdFields, { number: ad.number, link, footer: cfg.jobFooter })
  const replyMarkup = buttonsKeyboard(cfg.channelButtons ?? DEFAULT_CHANNEL_BUTTONS, cfg, jobForLink || undefined)
  return { text, replyMarkup, previewUrl: link || undefined, cfg }
}

// Tasdiqlash: vakansiya bo'lsa saytda e'lon qilinadi, tanlangan kanallarga yuboriladi, e'lon beruvchiga xabar
export async function publishAd(adId: string, channelIds: string[], adminId: string) {
  const ad = await db.ad.findUniqueOrThrow({ where: { id: adId } })
  const tpl = templateById(ad.template)
  if (!tpl) throw new AdError('Shablon topilmadi')
  const cfg = await getTelegramConfig()
  if (channelIds.length && !cfg.token) throw new AdError("Telegram bot ulanmagan (Telegram → Sozlamalar)")

  // saytdagi vakansiya (vakansiya turidagi shablonlar)
  let job = ad.jobId ? await db.job.findUnique({ where: { id: ad.jobId } }) : null
  if (tpl.job) {
    const data = adToJob(tpl, ad.fields as AdFields)
    const now = new Date()
    job = job
      ? await db.job.update({ where: { id: job.id }, data: { ...data, status: 'ACTIVE', publishedAt: job.publishedAt ?? now } })
      : await db.job.create({ data: { ...data, status: 'ACTIVE', source: 'BOT', publishedAt: now, expiresAt: new Date(now.getTime() + 30 * 24 * 3600_000) } })
  }

  const { text, replyMarkup, previewUrl } = await adPostPreview(ad, job)
  const channels = channelIds.length ? await db.telegramChannel.findMany({ where: { id: { in: channelIds }, active: true } }) : []
  const already = new Set((await db.telegramPost.findMany({ where: { adId, status: 'SENT' }, select: { channelId: true } })).map((p) => p.channelId))
  let sent = 0, failed = 0
  for (const ch of channels) {
    if (already.has(ch.id)) continue // bir kanalga ikki marta yuborilmaydi
    const p = await postToChannel(cfg, ch, { text, replyMarkup, previewUrl, adId, jobId: job?.id, authorId: adminId })
    if (p.status === 'SENT') sent++
    else failed++
    await new Promise((r) => setTimeout(r, 150))
  }

  const updated = await db.ad.update({ where: { id: adId }, data: { status: 'PUBLISHED', rejectReason: null, reviewerId: adminId, reviewedAt: new Date(), jobId: job?.id ?? ad.jobId } })
  if (ad.status !== 'PUBLISHED') {
    const posts = await db.telegramPost.findMany({ where: { adId, status: 'SENT' }, include: { channel: true } })
    const links = posts.map(postLink).filter(Boolean) as string[]
    const site = job && cfg.webAppUrl ? `\n🌐 ${esc(cfg.webAppUrl.replace(/\/$/, ''))}/jobs/${job.number}` : ''
    await notifyAuthor(updated, links.length ? `${tr('ok', ad.lang, ad.number)}\n${links.map((l) => `• ${l}`).join('\n')}${site}` : tr('okNoLink', ad.lang, ad.number) + site)
  }
  return { sent, failed, jobId: job?.id, title: adTitle(tpl, ad.fields as AdFields) }
}

export async function rejectAd(adId: string, reason: string, adminId: string) {
  const ad = await db.ad.update({ where: { id: adId }, data: { status: 'REJECTED', rejectReason: reason, reviewerId: adminId, reviewedAt: new Date() } })
  if (ad.jobId) await db.job.update({ where: { id: ad.jobId }, data: { status: 'ARCHIVED' } }).catch(() => {})
  await notifyAuthor(ad, `${tr('no', ad.lang, ad.number)}\n${T.reason[ad.lang === 'ru' ? 'ru' : 'uz']}: ${esc(reason)}\n\n${T.again[ad.lang === 'ru' ? 'ru' : 'uz']}`)
  return ad
}
