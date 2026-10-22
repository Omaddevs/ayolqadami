// Botga kelgan yangilanishlarni qayta ishlash (webhook ham, polling ham shu funksiyani chaqiradi)
import { db } from '../db'
import { salaryText } from '../format'
import { TelegramError, tg, type TgMessage, type TgUpdate, type TgUser } from './api'
import { getTelegramConfig, type TelegramConfig } from './config'
import { colorizeKeyboard, esc, jobUrl } from './format'
import { cancelJobDraft, onDraftCallback, onDraftMessage, startJobDraft, type JobDraft } from './post-flow'

const SUPPORT_GREETING_FALLBACK = 'Murojaatingiz qabul qilindi. Operatorlarimiz tez orada javob berishadi.'

async function reply(cfg: TelegramConfig, chatId: number | string, text: string, extra: Record<string, unknown> = {}) {
  try {
    await tg(cfg.token, 'sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true }, ...extra, reply_markup: colorizeKeyboard(extra.reply_markup) })
  } catch (e) {
    if (e instanceof TelegramError && e.isForbidden) await db.telegramUser.updateMany({ where: { id: String(chatId) }, data: { blocked: true } })
    else console.error('[telegram] reply', e)
  }
}

async function touchUser(u: TgUser) {
  return db.telegramUser.upsert({
    where: { id: String(u.id) },
    create: { id: String(u.id), firstName: u.first_name.slice(0, 120), lastName: u.last_name?.slice(0, 120), username: u.username, languageCode: u.language_code },
    update: { firstName: u.first_name.slice(0, 120), lastName: u.last_name?.slice(0, 120) ?? null, username: u.username ?? null, blocked: false, lastSeenAt: new Date() },
  })
}

const webAppKeyboard = (cfg: TelegramConfig) =>
  // web_app tugmasi faqat https manzil bilan ishlaydi
  /^https:\/\//.test(cfg.webAppUrl) ? { inline_keyboard: [[{ text: '📱 Ilovani ochish', web_app: { url: cfg.webAppUrl } }]] } : undefined

const startKeyboard = (cfg: TelegramConfig) => ({
  inline_keyboard: [
    [{ text: "📢 E'lon joylash", callback_data: 'pj:new', style: 'primary' }],
    ...(webAppKeyboard(cfg)?.inline_keyboard ?? []),
  ],
})

async function cmdJobs(cfg: TelegramConfig, chatId: number) {
  const jobs = await db.job.findMany({
    where: { status: 'ACTIVE', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 7,
  })
  if (!jobs.length) return reply(cfg, chatId, "Hozircha faol vakansiyalar yo'q.")
  const lines = jobs.map((j) => {
    const url = jobUrl(j, cfg)
    const title = url ? `<a href="${esc(url)}">${esc(j.title)}</a>` : `<b>${esc(j.title)}</b>`
    return `💼 ${title}\n🏢 ${esc(j.companyName)} · 📍 ${esc(j.city)}\n💰 ${esc(salaryText(j.salaryFrom, j.salaryTo))}`
  })
  return reply(cfg, chatId, `<b>So'nggi vakansiyalar</b>\n\n${lines.join('\n\n')}`, { reply_markup: webAppKeyboard(cfg) })
}

// Botga yozilgan oddiy matn → admin paneldagi "Murojaatlar"
async function toSupport(cfg: TelegramConfig, msg: TgMessage, text: string) {
  const from = msg.from!
  let tu = await db.telegramUser.findUniqueOrThrow({ where: { id: String(from.id) } })
  if (!tu.userId) {
    const name = [from.first_name, from.last_name].filter(Boolean).join(' ').slice(0, 80) || 'Telegram foydalanuvchi'
    const user = await db.user.create({
      data: { name, role: 'SEEKER', profile: { source: 'telegram', telegram: from.username ? '@' + from.username : '' } },
    })
    tu = await db.telegramUser.update({ where: { id: tu.id }, data: { userId: user.id } })
  }
  const userId = tu.userId!
  const user = await db.user.findUnique({ where: { id: userId }, select: { status: true } })
  if (user?.status === 'BLOCKED') return reply(cfg, msg.chat.id, 'Hisobingiz bloklangan.')

  const open = await db.supportTicket.findFirst({ where: { userId, status: { not: 'CLOSED' } }, orderBy: { updatedAt: 'desc' } })
  const ticketId = open
    ? (await db.supportTicket.update({ where: { id: open.id }, data: { status: 'OPEN' } })).id
    : (await db.supportTicket.create({ data: { userId } })).id
  await db.supportMessage.create({ data: { ticketId, from: 'USER', authorId: userId, text: text.slice(0, 2000) } })
  if (!open) {
    const app = await db.setting.findUnique({ where: { key: 'app' } })
    const greeting = (app?.value as { supportGreeting?: string } | null)?.supportGreeting || SUPPORT_GREETING_FALLBACK
    await db.supportMessage.create({ data: { ticketId, from: 'BOT', text: greeting } })
    return reply(cfg, msg.chat.id, `✅ ${esc(greeting)}`)
  }
  return reply(cfg, msg.chat.id, '✅ Xabaringiz operatorga yetkazildi.')
}

async function onMessage(cfg: TelegramConfig, msg: TgMessage) {
  if (msg.chat.type !== 'private' || !msg.from || msg.from.is_bot) return
  const tu = await touchUser(msg.from)
  const text = msg.text?.trim()
  const draft = tu.draft as JobDraft | null
  const cmd = text?.startsWith('/') ? text.split(/[\s@]/)[0].toLowerCase() : ''

  // Vakansiya e'loni to'ldirilayotgan bo'lsa — buyruq bo'lmagan xabar (va kontakt) shu oqimga
  if (draft && !cmd && (text || msg.contact)) return onDraftMessage(cfg, msg, tu.id, draft)
  if (!text) return reply(cfg, msg.chat.id, 'Hozircha faqat matnli xabarlar qabul qilinadi.')

  if (cmd === '/start') {
    if (/^\/start(@\w+)?\s+post\b/i.test(text)) return startJobDraft(cfg, msg.chat.id, tu.id) // kanal postidagi «E'lon joylash»
    const welcome = esc(cfg.welcomeText).replace(/\{name\}/g, esc(tu.firstName))
    return reply(cfg, msg.chat.id, welcome, { reply_markup: startKeyboard(cfg) })
  }
  if (cmd === '/post') return startJobDraft(cfg, msg.chat.id, tu.id)
  if (cmd === '/cancel') return draft ? cancelJobDraft(cfg, msg.chat.id, tu.id) : reply(cfg, msg.chat.id, "Bekor qilinadigan amal yo'q.")
  if (cmd === '/jobs') return cmdJobs(cfg, msg.chat.id)
  if (cmd === '/help') {
    return reply(cfg, msg.chat.id, "ℹ️ <b>Yordam</b>\n\n/post — vakansiya e'lonini joylash\n/jobs — so'nggi vakansiyalar\n/start — bosh menyu\n\nSavolingizni shu yerga oddiy xabar qilib yozing — operator javobi shu chatga keladi.")
  }
  if (cmd) return reply(cfg, msg.chat.id, "Bunday buyruq yo'q. /help — yordam")
  if (!cfg.supportViaBot) return reply(cfg, msg.chat.id, '/jobs — so\'nggi vakansiyalar')
  return toSupport(cfg, msg, text)
}

// Bot kanal/guruhga admin qilib qo'shilsa — kanal ro'yxatga tushadi (avtomatik yuborish o'chiq holda, admin tekshiradi)
async function onMyChatMember(update: NonNullable<TgUpdate['my_chat_member']>) {
  const { chat, new_chat_member } = update
  const status = new_chat_member.status
  if (chat.type === 'private') {
    await db.telegramUser.updateMany({ where: { id: String(chat.id) }, data: { blocked: status === 'kicked' } })
    return
  }
  const chatId = String(chat.id)
  if (status === 'administrator') {
    await db.telegramChannel.upsert({
      where: { chatId },
      create: { chatId, title: chat.title || chatId, username: chat.username, type: chat.type, active: true, autoPost: false },
      update: { title: chat.title || chatId, username: chat.username ?? null, active: true },
    })
  } else if (status === 'left' || status === 'kicked') {
    await db.telegramChannel.updateMany({ where: { chatId }, data: { active: false } })
  }
}

export async function handleUpdate(update: TgUpdate, cfg?: TelegramConfig) {
  const c = cfg || (await getTelegramConfig())
  if (!c.token) return
  if (update.message) return onMessage(c, update.message)
  if (update.my_chat_member) return onMyChatMember(update.my_chat_member)
  if (update.callback_query) {
    const q = update.callback_query
    await tg(c.token, 'answerCallbackQuery', { callback_query_id: q.id }).catch(() => {})
    if (!q.data || !q.message || q.message.chat.type !== 'private') return
    await touchUser(q.from)
    return onDraftCallback(c, q.from, q.message.chat.id, q.data, q.message.message_id)
  }
}

// Bot menyusidagi buyruqlar va "Ilovani ochish" tugmasi
export async function syncBotProfile(cfg: TelegramConfig) {
  await tg(cfg.token, 'setMyCommands', {
    commands: [
      { command: 'start', description: 'Bosh menyu' },
      { command: 'post', description: "Vakansiya e'lonini joylash" },
      { command: 'jobs', description: "So'nggi vakansiyalar" },
      { command: 'help', description: 'Yordam' },
    ],
  })
  if (/^https:\/\//.test(cfg.webAppUrl)) {
    await tg(cfg.token, 'setChatMenuButton', { menu_button: { type: 'web_app', text: 'Ilova', web_app: { url: cfg.webAppUrl } } })
  } else {
    await tg(cfg.token, 'setChatMenuButton', { menu_button: { type: 'commands' } })
  }
}
