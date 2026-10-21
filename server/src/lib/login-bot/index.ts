// AyolQadami kirish boti (@ayolqadami_kirish_bot) — faqat telefon raqamini tasdiqlash kodlari uchun.
// Asosiy platforma botidan (lib/telegram) mustaqil: token — TELEGRAM_LOGIN_BOT_TOKEN, ishlash usuli — polling
// (HTTPS webhook kerak emas). Server ishga tushganda instrumentation.ts startLoginPoller() ni chaqiradi.
import { db } from '../db'
import { formatUzPhone, normalizeUzPhone } from '../phone'
import { rateLimit } from '../rate-limit'
import { maskPhone, setCode, VERIFY_TTL_MS } from '../phone-verify'
import { TelegramError, tg, type TgMessage, type TgUpdate, type TgUser } from '../telegram/api'

export const loginBotToken = () => process.env.TELEGRAM_LOGIN_BOT_TOKEN || ''

type BotState = { username: string; started: boolean; offset: number; lastError: string; lastPollAt: number }
const g = globalThis as unknown as { __loginBot?: BotState }
const st = (): BotState => (g.__loginBot ??= { username: '', started: false, offset: 0, lastError: '', lastPollAt: 0 })
export const loginBotStatus = () => ({ configured: Boolean(loginBotToken()), ...st() })

// Bot username (deep link uchun) — getMe bir marta so'raladi
export async function loginBotUsername(): Promise<string | null> {
  const token = loginBotToken()
  if (!token) return null
  const s = st()
  if (!s.username) {
    const me = await tg<TgUser>(token, 'getMe').catch(() => null)
    if (!me?.username) return null
    s.username = me.username
  }
  return s.username
}

// --- Matnlar (uz / ru — Telegram tiliga qarab) ---
const T = {
  uz: {
    share: '📱 Raqamni ulashish',
    hello:
      "👋 Assalomu alaykum! Bu — <b>AyolQadami kirish boti</b>.\n\nBot saytda telefon raqamingizni tasdiqlash va parolni tiklash uchun kod yuboradi.\n\n" +
      "Raqamingizni hozir ulab qo'ysangiz, keyingi safar kod darhol shu chatga keladi.",
    expired: "⌛️ Havola eskirgan yoki ishlatilgan. Saytda qaytadan «Telegram orqali kod olish» tugmasini bosing.",
    otherAccount: '⛔️ Bu havola boshqa Telegram hisobida ochilgan. Saytda qaytadan kod oling.',
    already: '✅ Raqam allaqachon tasdiqlangan. Saytga qayting.',
    askContact: (p: string) => `Saytda kiritilgan raqam: <b>${p}</b>\n\nTasdiqlash uchun pastdagi <b>«📱 Raqamni ulashish»</b> tugmasini bosing.`,
    notOwn: "Iltimos, pastdagi tugma orqali <b>o'zingizning</b> raqamingizni yuboring.",
    mismatch: (tgPhone: string, sitePhone: string) =>
      `❌ Telegram hisobingiz raqami (<b>${tgPhone}</b>) saytda kiritilgan raqamga (<b>${sitePhone}</b>) mos kelmaydi.\n\n` +
      "Saytda shu Telegram raqamingizni kiriting yoki o'sha raqam ochilgan Telegram hisobidan foydalaning.",
    notUz: "❌ Faqat O'zbekiston raqamlari (+998) qabul qilinadi.",
    saved: "✅ Raqamingiz ulandi. Endi saytda «Telegram orqali kod olish» tugmasini bossangiz, kod darhol shu yerga keladi.",
    code: (code: string, reset: boolean) =>
      `🔐 <b>${reset ? 'Parolni tiklash' : 'Tasdiqlash'} kodi:</b>\n\n<code>${code}</code>\n\n` +
      `Kod ${VERIFY_TTL_MS / 60_000} daqiqa amal qiladi. Uni saytdagi maydonga kiriting.\n\n` +
      "⚠️ Kodni hech kimga bermang. AyolQadami xodimlari kodni hech qachon so'ramaydi.",
    tooMany: "Juda ko'p so'rov. Birozdan keyin qayta urinib ko'ring.",
  },
  ru: {
    share: '📱 Поделиться номером',
    hello:
      '👋 Здравствуйте! Это — <b>бот входа AyolQadami</b>.\n\nБот присылает коды для подтверждения номера телефона и восстановления пароля на сайте.\n\n' +
      'Если привяжете номер сейчас, в следующий раз код сразу придёт в этот чат.',
    expired: '⌛️ Ссылка устарела или уже использована. Нажмите на сайте «Получить код в Telegram» ещё раз.',
    otherAccount: '⛔️ Эта ссылка уже открыта в другом аккаунте Telegram. Получите новый код на сайте.',
    already: '✅ Номер уже подтверждён. Вернитесь на сайт.',
    askContact: (p: string) => `Номер, указанный на сайте: <b>${p}</b>\n\nДля подтверждения нажмите кнопку <b>«📱 Поделиться номером»</b> ниже.`,
    notOwn: 'Пожалуйста, отправьте <b>свой</b> номер кнопкой ниже.',
    mismatch: (tgPhone: string, sitePhone: string) =>
      `❌ Номер вашего Telegram (<b>${tgPhone}</b>) не совпадает с номером на сайте (<b>${sitePhone}</b>).\n\n` +
      'Укажите на сайте номер этого Telegram или используйте аккаунт Telegram с тем номером.',
    notUz: '❌ Принимаются только номера Узбекистана (+998).',
    saved: '✅ Номер привязан. Теперь при нажатии «Получить код в Telegram» на сайте код сразу придёт сюда.',
    code: (code: string, reset: boolean) =>
      `🔐 <b>Код ${reset ? 'восстановления пароля' : 'подтверждения'}:</b>\n\n<code>${code}</code>\n\n` +
      `Код действует ${VERIFY_TTL_MS / 60_000} минут. Введите его на сайте.\n\n` +
      '⚠️ Никому не сообщайте код. Сотрудники AyolQadami никогда его не спрашивают.',
    tooMany: 'Слишком много запросов. Попробуйте позже.',
  },
}
const lang = (u?: TgUser) => (u?.language_code === 'ru' ? T.ru : T.uz)

const contactKeyboard = (t: typeof T.uz) => ({
  keyboard: [[{ text: t.share, request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
})
const removeKeyboard = { remove_keyboard: true }

async function send(chatId: number | string, text: string, reply_markup?: unknown) {
  try {
    await tg(loginBotToken(), 'sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', reply_markup })
    return true
  } catch (e) {
    if (!(e instanceof TelegramError && e.isForbidden)) console.error('[login-bot] send', e)
    return false
  }
}

// Kodni yaratib Telegram'ga yuboradi. Saytdan (raqam oldin ulangan bo'lsa) va botdan chaqiriladi
export async function sendVerificationCode(v: { id: string; purpose: string }, chatId: string, u?: TgUser) {
  try {
    rateLimit(`login-bot:send:${v.id}`, 4, VERIFY_TTL_MS)
  } catch {
    await send(chatId, lang(u).tooMany)
    return false
  }
  const code = await setCode(v.id, chatId)
  return send(chatId, lang(u).code(code, v.purpose === 'reset'), removeKeyboard)
}

const pendingFor = (telegramId: string) =>
  db.phoneVerification.findFirst({
    where: { telegramId, usedAt: null, verifiedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

async function onStart(msg: TgMessage, payload: string) {
  const from = msg.from!
  const t = lang(from)
  const tgId = String(from.id)
  if (!payload.startsWith('v_')) {
    const known = await db.telegramPhone.findUnique({ where: { telegramId: tgId } })
    return send(msg.chat.id, t.hello, known ? removeKeyboard : contactKeyboard(t))
  }

  const v = await db.phoneVerification.findUnique({ where: { token: payload.slice(2) } })
  if (!v || v.usedAt || v.expiresAt < new Date()) return send(msg.chat.id, t.expired, removeKeyboard)
  if (v.verifiedAt) return send(msg.chat.id, t.already, removeKeyboard)
  // havola birinchi ochgan Telegram hisobiga bog'lanadi
  if (v.telegramId && v.telegramId !== tgId) return send(msg.chat.id, t.otherAccount, removeKeyboard)
  if (!v.telegramId) {
    const { count } = await db.phoneVerification.updateMany({ where: { id: v.id, telegramId: null }, data: { telegramId: tgId } })
    if (!count) return send(msg.chat.id, t.otherAccount, removeKeyboard)
  }

  // shu Telegram hisobi bu raqamni avval isbotlagan — kontakt so'ramaymiz
  const link = await db.telegramPhone.findUnique({ where: { telegramId: tgId } })
  if (link?.phone === v.phone) return sendVerificationCode(v, tgId, from)
  return send(msg.chat.id, t.askContact(maskPhone(v.phone)), contactKeyboard(t))
}

async function onContact(msg: TgMessage) {
  const from = msg.from!
  const t = lang(from)
  const c = msg.contact!
  // request_contact tugmasi faqat o'z raqamini yuboradi; boshqaning kontaktida user_id boshqa yoki yo'q
  if (c.user_id !== from.id) return send(msg.chat.id, t.notOwn, contactKeyboard(t))
  const phone = normalizeUzPhone(c.phone_number)
  if (!phone) return send(msg.chat.id, t.notUz, removeKeyboard)

  const tgId = String(from.id)
  await db.telegramPhone.upsert({
    where: { telegramId: tgId },
    create: { telegramId: tgId, phone, firstName: from.first_name.slice(0, 120), username: from.username },
    update: { phone, firstName: from.first_name.slice(0, 120), username: from.username ?? null },
  })

  const v = await pendingFor(tgId)
  if (!v) return send(msg.chat.id, t.saved, removeKeyboard)
  if (v.phone !== phone) return send(msg.chat.id, t.mismatch(formatUzPhone(phone), maskPhone(v.phone)), removeKeyboard)
  return sendVerificationCode(v, tgId, from)
}

export async function handleLoginUpdate(update: TgUpdate) {
  const msg = update.message
  if (!msg?.from || msg.from.is_bot || msg.chat.type !== 'private') return
  try {
    rateLimit(`login-bot:msg:${msg.from.id}`, 30, 60_000)
  } catch {
    return
  }
  if (msg.contact) return onContact(msg)
  const text = msg.text?.trim() || ''
  const m = /^\/start(?:@\w+)?(?:\s+(\S+))?/i.exec(text)
  if (m) return onStart(msg, m[1] || '')
  // boshqa har qanday xabar: agar tasdiqlash kutilayotgan bo'lsa — kontakt so'raymiz, aks holda salom
  const t = lang(msg.from)
  const v = await pendingFor(String(msg.from.id))
  if (v) return send(msg.chat.id, t.askContact(maskPhone(v.phone)), contactKeyboard(t))
  return onStart(msg, '')
}

async function syncProfile(token: string) {
  await tg(token, 'setMyCommands', { commands: [{ command: 'start', description: 'Raqamni ulash / kod olish' }] }).catch(() => {})
  await tg(token, 'setMyDescription', {
    description: "AyolQadami saytida telefon raqamingizni tasdiqlash va parolni tiklash uchun kod yuboradi. Kodni hech kimga bermang.",
  }).catch(() => {})
  await tg(token, 'setMyShortDescription', { short_description: 'AyolQadami — telefon raqamini tasdiqlash kodi' }).catch(() => {})
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function startLoginPoller() {
  const s = st()
  if (s.started || !loginBotToken()) return
  s.started = true
  void (async () => {
    let synced = ''
    for (;;) {
      const token = loginBotToken()
      try {
        if (synced !== token) {
          await tg(token, 'deleteWebhook', { drop_pending_updates: false })
          await syncProfile(token)
          await loginBotUsername()
          synced = token
        }
        const updates = await tg<TgUpdate[]>(token, 'getUpdates', { offset: s.offset, timeout: 25, allowed_updates: ['message'] }, 35000)
        s.lastPollAt = Date.now()
        s.lastError = ''
        for (const u of updates) {
          s.offset = u.update_id + 1
          await handleLoginUpdate(u).catch((e) => console.error('[login-bot] update', u.update_id, e))
        }
      } catch (e) {
        s.lastError = e instanceof TelegramError ? `${e.code}: ${e.description}` : (e as Error).message
        await sleep(e instanceof TelegramError && e.code === 401 ? 60_000 : 5000)
      }
    }
  })()
}
