// Telegram bilan ishlashning yuqori darajadagi amallari (admin panel, API va bot ishlatadi)
import type { Job, TelegramChannel } from '@prisma/client'
import { db } from '../db'
import { TelegramError, tg, tgRetry, type TgChat, type TgChatMember, type TgUser } from './api'
import { getTelegramConfig, type TelegramConfig } from './config'
import { loginBotToken } from '../login-bot'
import { customKeyboard, jobKeyboard, jobPostHtml, jobShareUrl, sanitizeTelegramHtml } from './format'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const errText = (e: unknown) => (e instanceof TelegramError ? `${e.code}: ${e.description}` : (e as Error)?.message || String(e))

// --- Bot ---

export async function checkBot(token: string) {
  return tg<TgUser>(token, 'getMe')
}

// --- Kanallar ---

// "@kanal", "https://t.me/kanal" yoki "-100123..." → Telegram chat_id
export function parseChatRef(input: string): string | null {
  const s = input.trim()
  const link = /^(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([A-Za-z0-9_]{4,64})\/?$/i.exec(s)
  if (link) return '@' + link[1]
  if (/^@[A-Za-z0-9_]{4,64}$/.test(s)) return s
  if (/^[A-Za-z][A-Za-z0-9_]{3,63}$/.test(s)) return '@' + s
  if (/^-?\d{5,20}$/.test(s)) return s
  return null
}

// Kanal mavjudligi va bot admin ekanini tekshiradi; natija — saqlashga tayyor ma'lumot
export async function inspectChannel(token: string, chatRef: string) {
  const chat = await tg<TgChat>(token, 'getChat', { chat_id: chatRef })
  const me = await tg<TgUser>(token, 'getMe')
  const member = await tg<TgChatMember>(token, 'getChatMember', { chat_id: chat.id, user_id: me.id })
  const isAdmin = member.status === 'administrator' || member.status === 'creator'
  const canPost = chat.type === 'channel' ? isAdmin && member.can_post_messages !== false : ['administrator', 'creator', 'member'].includes(member.status)
  const memberCount = await tg<number>(token, 'getChatMemberCount', { chat_id: chat.id }).catch(() => null)
  return {
    chatId: String(chat.id),
    title: chat.title || chat.first_name || chatRef,
    username: chat.username || null,
    type: chat.type,
    memberCount,
    canPost,
    status: member.status,
  }
}

// --- Postlar ---

// previewUrl — matn ostida shu havolaning katta rasmli kartochkasi chiqadi
type SendInput = { text: string; photo?: string | null; replyMarkup?: unknown; previewUrl?: string }

export async function sendToChat(token: string, chatId: string, { text, photo, replyMarkup, previewUrl }: SendInput) {
  if (photo) {
    // rasm izohi 1024 belgigacha — uzun matn rasmdan keyin alohida xabar emas, qisqartiriladi
    const caption = text.length > 1024 ? text.slice(0, 1020) + '…' : text
    return tgRetry<{ message_id: number }>(token, 'sendPhoto', { chat_id: chatId, photo, caption, parse_mode: 'HTML', reply_markup: replyMarkup })
  }
  return tgRetry<{ message_id: number }>(token, 'sendMessage', {
    chat_id: chatId, text, parse_mode: 'HTML', reply_markup: replyMarkup,
    link_preview_options: previewUrl ? { url: previewUrl, prefer_large_media: true } : { is_disabled: true },
  })
}

export async function postToChannel(cfg: TelegramConfig, channel: TelegramChannel, input: SendInput & { jobId?: string; adId?: string; authorId?: string | null }) {
  try {
    const msg = await sendToChat(cfg.token, channel.chatId, input)
    await db.telegramChannel.update({ where: { id: channel.id }, data: { lastPostAt: new Date() } })
    return db.telegramPost.create({
      data: { channelId: channel.id, jobId: input.jobId, adId: input.adId, text: input.text, photo: input.photo || null, messageId: msg.message_id, status: 'SENT', authorId: input.authorId ?? null },
    })
  } catch (e) {
    return db.telegramPost.create({
      data: { channelId: channel.id, jobId: input.jobId, adId: input.adId, text: input.text, photo: input.photo || null, status: 'FAILED', error: errText(e).slice(0, 500), authorId: input.authorId ?? null },
    })
  }
}

// Kanal filtri: soha va shahar ro'yxati bo'sh bo'lsa — hammasi mos
export const channelMatchesJob = (c: Pick<TelegramChannel, 'categories' | 'cities'>, job: Pick<Job, 'category' | 'city'>) =>
  (!c.categories.length || c.categories.includes(job.category)) && (!c.cities.length || c.cities.includes(job.city))

/**
 * Vakansiyani kanallarga yuborish.
 * channelIds berilmasa — avtomatik rejim: autoPost yoqilgan, filtri mos va bu vakansiya hali yuborilmagan kanallar.
 */
export async function postJobToChannels(jobId: string, opts: { channelIds?: string[]; authorId?: string | null } = {}) {
  const cfg = await getTelegramConfig()
  if (!cfg.token) return { sent: 0, failed: 0, skipped: 'Bot ulanmagan' }
  const job = await db.job.findUnique({ where: { id: jobId } })
  if (!job || job.status !== 'ACTIVE') return { sent: 0, failed: 0, skipped: 'Vakansiya faol emas' }

  let channels: TelegramChannel[]
  if (opts.channelIds) {
    channels = await db.telegramChannel.findMany({ where: { id: { in: opts.channelIds }, active: true } })
  } else {
    if (!cfg.autoPostJobs) return { sent: 0, failed: 0, skipped: "Avtomatik yuborish o'chirilgan" }
    const already = new Set((await db.telegramPost.findMany({ where: { jobId, status: 'SENT' }, select: { channelId: true } })).map((p) => p.channelId))
    channels = (await db.telegramChannel.findMany({ where: { active: true, autoPost: true } })).filter((c) => !already.has(c.id) && channelMatchesJob(c, job))
  }

  const text = jobPostHtml(job, cfg)
  const replyMarkup = jobKeyboard(job, cfg)
  const previewUrl = jobShareUrl(job, cfg) || undefined
  let sent = 0, failed = 0
  for (const ch of channels) {
    const post = await postToChannel(cfg, ch, { text, replyMarkup, previewUrl, jobId, authorId: opts.authorId })
    if (post.status === 'SENT') sent++
    else failed++
    await sleep(150) // Telegram cheklovi: bir guruhga ~20 xabar/daqiqa, kanallar orasida kichik pauza
  }
  return { sent, failed }
}

// Avtomatik yuborish xatosi asosiy amalni (tasdiqlash) to'xtatmasligi kerak
export function autoPostJob(jobId: string) {
  return postJobToChannels(jobId).catch((e) => {
    console.error('[telegram] autopost', jobId, e)
    return { sent: 0, failed: 0 }
  })
}

// buttons — "Matn | havola | rang" qatorlari (admin paneldagi tugmalar muharriri)
export async function postCustom(input: { channelIds: string[]; text: string; photo?: string | null; buttons?: string | null; authorId: string }) {
  const cfg = await getTelegramConfig()
  if (!cfg.token) throw new TelegramError(401, 'Bot ulanmagan')
  const channels = await db.telegramChannel.findMany({ where: { id: { in: input.channelIds } } })
  const text = sanitizeTelegramHtml(input.text)
  const replyMarkup = customKeyboard(cfg, input.buttons)
  const results = []
  for (const ch of channels) {
    results.push(await postToChannel(cfg, ch, { text, photo: input.photo, replyMarkup, authorId: input.authorId }))
    await sleep(150)
  }
  return results
}

export async function deletePost(postId: string) {
  const cfg = await getTelegramConfig()
  const post = await db.telegramPost.findUnique({ where: { id: postId }, include: { channel: true } })
  if (!post || post.status !== 'SENT' || !post.messageId) throw new Error("Bu postni o'chirib bo'lmaydi")
  try {
    await tg(cfg.token, 'deleteMessage', { chat_id: post.channel.chatId, message_id: post.messageId })
  } catch (e) {
    // 48 soatdan eski xabarni bot o'chira olmaydi — kanalda qo'lda o'chirish kerak
    if (!(e instanceof TelegramError && /message to delete not found/i.test(e.description))) throw e
  }
  return db.telegramPost.update({ where: { id: postId }, data: { status: 'DELETED' } })
}

// --- Bot obunachilariga tarqatish ---
// bot: main — asosiy botga /start bosganlar (TelegramUser), login — kirish botidan foydalanganlar (TelegramPhone)

export type BroadcastBot = 'main' | 'login'
const running = new Set<string>()

const audienceCount = (bot: BroadcastBot) =>
  bot === 'login' ? db.telegramPhone.count() : db.telegramUser.count({ where: { blocked: false } })

// Keyingi 200 ta chat id (kursor — oxirgi id)
async function audiencePage(bot: BroadcastBot, cursor?: string): Promise<string[]> {
  const page = { take: 200, ...(cursor && { skip: 1 }) }
  if (bot === 'login') {
    const rows = await db.telegramPhone.findMany({ orderBy: { telegramId: 'asc' }, select: { telegramId: true }, ...page, ...(cursor && { cursor: { telegramId: cursor } }) })
    return rows.map((r) => r.telegramId)
  }
  const rows = await db.telegramUser.findMany({ where: { blocked: false }, orderBy: { id: 'asc' }, select: { id: true }, ...page, ...(cursor && { cursor: { id: cursor } }) })
  return rows.map((r) => r.id)
}

export async function startBroadcast(input: { text: string; photo?: string | null; buttons?: string | null; authorId: string; bot?: BroadcastBot; notificationId?: string }) {
  const bot = input.bot || 'main'
  const cfg = await getTelegramConfig()
  const token = bot === 'login' ? loginBotToken() : cfg.token
  if (!token) throw new TelegramError(401, bot === 'login' ? 'Kirish boti ulanmagan (TELEGRAM_LOGIN_BOT_TOKEN)' : 'Bot ulanmagan')
  const total = await audienceCount(bot)
  const b = await db.telegramBroadcast.create({
    data: {
      text: sanitizeTelegramHtml(input.text), photo: input.photo || null, buttons: input.buttons || null, total, authorId: input.authorId,
      bot, notificationId: input.notificationId ?? null,
    },
  })
  // Fonda ishlaydi: server action javobi kutib qolmaydi. Holat sahifada yangilanib turadi
  void runBroadcast(b.id, cfg, token)
  return b
}

async function runBroadcast(id: string, cfg: TelegramConfig, token: string) {
  if (running.has(id)) return
  running.add(id)
  try {
    const b = await db.telegramBroadcast.findUniqueOrThrow({ where: { id } })
    const bot: BroadcastBot = b.bot === 'login' ? 'login' : 'main'
    const replyMarkup = customKeyboard(cfg, b.buttons, b.buttonText, b.buttonUrl)
    let cursor: string | undefined
    let sent = 0, failed = 0
    for (;;) {
      const batch = await audiencePage(bot, cursor)
      if (!batch.length) break
      for (const chatId of batch) {
        try {
          await sendToChat(token, chatId, { text: b.text, photo: b.photo, replyMarkup })
          sent++
        } catch (e) {
          failed++
          if (bot === 'main' && e instanceof TelegramError && e.isForbidden) await db.telegramUser.update({ where: { id: chatId }, data: { blocked: true } })
        }
        await sleep(40) // ~25 xabar/soniya — Telegram umumiy cheklovidan past
      }
      cursor = batch[batch.length - 1]
      await db.telegramBroadcast.update({ where: { id }, data: { sent, failed } })
    }
    await db.telegramBroadcast.update({ where: { id }, data: { sent, failed, status: 'DONE', finishedAt: new Date() } })
  } catch (e) {
    console.error('[telegram] broadcast', id, e)
    await db.telegramBroadcast.update({ where: { id }, data: { status: 'FAILED', finishedAt: new Date() } }).catch(() => {})
  } finally {
    running.delete(id)
  }
}

// --- Platforma foydalanuvchisiga bot orqali xabar (masalan, operator javobi) ---

export async function notifyUser(userId: string, html: string) {
  const cfg = await getTelegramConfig()
  if (!cfg.token) return false
  const tu = await db.telegramUser.findUnique({ where: { userId } })
  if (!tu || tu.blocked) return false
  try {
    await sendToChat(cfg.token, tu.id, { text: html })
    return true
  } catch (e) {
    if (e instanceof TelegramError && e.isForbidden) await db.telegramUser.update({ where: { id: tu.id }, data: { blocked: true } })
    console.error('[telegram] notify', userId, errText(e))
    return false
  }
}

export { errText }
