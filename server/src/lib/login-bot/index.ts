// AyolQadami kirish boti (@ayolqadami_kirish_bot): telefon raqamini tasdiqlash, kod bilan kirish, xavfsizlik xabarlari.
// Asosiy platforma botidan (lib/telegram) mustaqil: token — TELEGRAM_LOGIN_BOT_TOKEN, ishlash usuli — polling
// (HTTPS webhook kerak emas). Server ishga tushganda instrumentation.ts startLoginPoller() ni chaqiradi.
//
// Menyu: 🔑 Kirish kodi · 📝 Ro'yxatdan o'tish · 👤 Profil · ⚙️ Sozlamalar · 🆘 Yordam
// Kod xabari: kod (bosilsa nusxalanadi) + [📋 Nusxalash] [🔄 Yangi kod] [🌐 Saytga o'tish]
import type { PhoneVerification, TelegramPhone, User } from '@prisma/client'
import { db } from '../db'
import { formatUzPhone, normalizeUzPhone } from '../phone'
import { rateLimit } from '../rate-limit'
import { createVerification, maskPhone, setCode } from '../phone-verify'
import { TelegramError, tg, type TgMessage, type TgUpdate, type TgUser } from '../telegram/api'

export const loginBotToken = () => process.env.TELEGRAM_LOGIN_BOT_TOKEN || ''

type BotState = { username: string; started: boolean; offset: number; lastError: string; lastPollAt: number }
const g = globalThis as unknown as { __loginBot?: BotState }
const st = (): BotState => (g.__loginBot ??= { username: '', started: false, offset: 0, lastError: '', lastPollAt: 0 })
// Botni faqat bitta server tinglashi kerak: ikki joy (masalan, lokal `next dev` va production) bitta token bilan
// getUpdates qilsa, Telegram xabarlarni ular orasida bo'lib beradi — kod boshqa bazaga yoziladi va saytda «kod yuborilmagan»
// chiqadi. Shuning uchun sukut bo'yicha faqat production tinglaydi; lokalda LOGIN_BOT_POLLING=true (alohida test boti bilan)
export const loginBotPolling = () =>
  Boolean(loginBotToken()) && (process.env.LOGIN_BOT_POLLING ? process.env.LOGIN_BOT_POLLING === 'true' : process.env.NODE_ENV === 'production')
// Lokal server botni tinglamasa, tasdiqlash ishlamaydi (kod faqat botdan; saytda hech qachon ko'rsatilmaydi).
// Productionda LOGIN_BOT_POLLING=false bo'lishi mumkin (bir nechta nusxa, bittasi tinglaydi, baza umumiy) — u yerda to'xtatmaymiz
export const botUnreachable = () => process.env.NODE_ENV !== 'production' && !loginBotPolling()
export const loginBotStatus = () => ({ configured: Boolean(loginBotToken()), polling: loginBotPolling(), ...st() })

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

// Sayt manzili (tugmalar uchun): WEB_URL yoki WEB_ORIGINS'dagi birinchi https manzil. Telegram faqat https havolani qabul qiladi
export function siteUrl(): string {
  const list = [process.env.WEB_URL || '', ...(process.env.WEB_ORIGINS || '').split(',')].map((s) => s.trim().replace(/\/$/, ''))
  return list.find((u) => /^https:\/\/[^/\s]+$/.test(u) || /^https:\/\/\S+$/.test(u)) || ''
}
const siteHost = () => siteUrl().replace(/^https:\/\//, '') || 'AyolQadami'

// ================= Matnlar (uz / ru) =================

type Lang = 'uz' | 'ru'
const PURPOSE = {
  uz: { login: 'Kirish kodi', register: "Ro'yxatdan o'tish kodi", reset: 'Parolni tiklash kodi' },
  ru: { login: 'Код для входа', register: 'Код регистрации', reset: 'Код восстановления пароля' },
}
const WHERE = {
  uz: { login: 'kirish', register: "ro'yxatdan o'tish", reset: 'parolni tiklash' },
  ru: { login: 'входа', register: 'регистрации', reset: 'восстановления пароля' },
}
const ROLE = {
  uz: { SEEKER: 'Ish izlovchi', EMPLOYER: 'Ish beruvchi', MODERATOR: 'Moderator', ADMIN: 'Administrator' },
  ru: { SEEKER: 'Соискатель', EMPLOYER: 'Работодатель', MODERATOR: 'Модератор', ADMIN: 'Администратор' },
}

const T = {
  uz: {
    btnCode: '🔑 Kirish kodi', btnRegister: "📝 Ro'yxatdan o'tish", btnProfile: '👤 Profil', btnSettings: '⚙️ Sozlamalar', btnHelp: '🆘 Yordam',
    share: '📱 Raqamni ulashish', copy: '📋 Nusxalash', newCode: '🔄 Yangi kod', toSite: "🌐 Saytga o'tish", openProfile: '🌐 Profilni ochish',
    registerBtn: "📝 Saytda ro'yxatdan o'tish", supportBtn: "💬 Texnik yordam", notMe: '🔒 Bu men emasman',
    hello: (name: string) =>
      `👋 Assalomu alaykum, <b>${name}</b>!\n\nBu — <b>AyolQadami kirish boti</b>. U orqali:\n` +
      "• saytga <b>parolsiz</b> — kod bilan kirasiz;\n• ro'yxatdan o'tishda raqamingizni tasdiqlaysiz;\n• parolni tiklaysiz;\n" +
      "• hisobingizga kirilganda xabar olasiz.\n\nBoshlash uchun pastdagi menyudan foydalaning.",
    needPhone: "📱 Avval raqamingizni ulang — pastdagi <b>«📱 Raqamni ulashish»</b> tugmasini bosing.\n\nBu raqamingiz sizniki ekanini tasdiqlaydi.",
    expired: "⌛️ Havola eskirgan yoki ishlatilgan. Saytda qaytadan «Telegram'da kodni olish» tugmasini bosing.",
    otherAccount: '⛔️ Bu havola boshqa Telegram hisobida ochilgan. Saytda qaytadan kod oling.',
    already: '✅ Raqam allaqachon tasdiqlangan. Saytga qayting.',
    askContact: (p: string) => `Saytda kiritilgan raqam: <b>${p}</b>\n\nTasdiqlash uchun pastdagi <b>«📱 Raqamni ulashish»</b> tugmasini bosing.`,
    notOwn: "Iltimos, pastdagi tugma orqali <b>o'zingizning</b> raqamingizni yuboring.",
    mismatch: (tgPhone: string, sitePhone: string) =>
      `❌ Telegram hisobingiz raqami (<b>${tgPhone}</b>) saytda kiritilgan raqamga (<b>${sitePhone}</b>) mos kelmaydi.\n\n` +
      "Saytda shu Telegram raqamingizni kiriting yoki o'sha raqam ochilgan Telegram hisobidan foydalaning.",
    notUz: "❌ Faqat O'zbekiston raqamlari (+998) qabul qilinadi.",
    linked: (p: string) => `✅ Raqamingiz ulandi: <b>${p}</b>\n\nEndi saytda kod so'raganingizda u darhol shu chatga keladi.`,
    code: (title: string, code: string, min: number, phone: string, where: string) =>
      `🔐 <b>${title}</b>\n\n<code>${code}</code>\n\n⏳ ${min} daqiqa amal qiladi\n📱 ${phone}\n\n` +
      `Kodni <b>${siteHost()}</b> saytidagi ${where} sahifasiga kiriting. Kod ustiga bossangiz, nusxalanadi.\n` +
      "🔒 Kodni hech kimga bermang — AyolQadami xodimlari uni hech qachon so'ramaydi.",
    codeReplaced: '♻️ Bu kod bekor qilindi — yangisi pastda.',
    codeUsed: "✅ Bu kod allaqachon ishlatilgan. Yangi kod kerak bo'lsa, «🔑 Kirish kodi» tugmasini bosing.",
    noAccount: (p: string) => `ℹ️ <b>${p}</b> raqami bilan hisob topilmadi.\n\nSaytda ro'yxatdan o'ting — raqam tasdiqlash kodi shu chatga keladi.`,
    blocked: "⛔️ Hisobingiz bloklangan. Texnik yordamga murojaat qiling.",
    register: (linked: boolean) =>
      "📝 <b>Ro'yxatdan o'tish</b>\n\nSaytni oching va «Ro'yxatdan o'tish»ni tanlang." +
      (linked ? ' Raqamingiz ulangan — tasdiqlash kodi darhol shu chatga keladi.' : " Raqamni tasdiqlash bosqichida shu botga qaytasiz."),
    hasAccount: "✅ Bu raqam bilan hisobingiz bor. Kirish uchun «🔑 Kirish kodi» tugmasini bosing.",
    noSite: "Sayt manzili hali sozlanmagan.",
    profile: (u: User, lang: Lang, apps: number, jobs: number) =>
      `👤 <b>${esc(u.company || u.name)}</b>\n\n` +
      `📱 ${formatUzPhone(u.phone)}\n🧭 ${ROLE[lang][u.role]}` + (u.city ? `\n📍 ${esc(u.city)}` : '') +
      (u.role === 'EMPLOYER' ? `\n💼 Vakansiyalar: ${jobs}` : `\n📄 Arizalar: ${apps}`) +
      `\n📅 Ro'yxatdan o'tgan: ${date(u.createdAt)}` + (u.lastLoginAt ? `\n🕐 Oxirgi kirish: ${dateTime(u.lastLoginAt)}` : '') +
      `\n${u.phoneVerifiedAt ? '✅ Raqam tasdiqlangan' : '⚠️ Raqam tasdiqlanmagan'}`,
    settings: (p: TelegramPhone) =>
      `⚙️ <b>Sozlamalar</b>\n\n📱 Ulangan raqam: <b>${formatUzPhone(p.phone)}</b>\n🌐 Til: O'zbekcha\n🔔 Kirish xabarlari: ${p.notifyLogin ? 'yoqilgan' : "o'chirilgan"}`,
    setLang: "🌐 Русский язык", setNotifyOn: '🔔 Kirish xabarlarini yoqish', setNotifyOff: "🔕 Kirish xabarlarini o'chirish",
    setPhone: '📱 Raqamni yangilash', setUnlink: '🔌 Raqamni uzish',
    unlinked: "🔌 Raqam uzildi. Qayta ulash uchun «📱 Raqamni ulashish» tugmasini bosing.",
    help: (bot: string) =>
      `🆘 <b>Yordam</b>\n\n<b>🔑 Kirish kodi</b> — saytga parolsiz kirish uchun bir martalik kod.\n` +
      "<b>📝 Ro'yxatdan o'tish</b> — saytda yangi hisob ochish.\n<b>👤 Profil</b> — hisobingiz haqida qisqacha.\n" +
      "<b>⚙️ Sozlamalar</b> — til, kirish xabarlari, raqamni yangilash.\n\n" +
      "❓ <b>Kod kelmayaptimi?</b> Saytdagi raqam Telegram'dagi raqamingiz bilan bir xil bo'lishi kerak. «🔄 Yangi kod»ni bosing.\n" +
      "❓ <b>Parolni unutdingizmi?</b> Saytda «Parolni unutdingizmi?» → kod shu chatga keladi.\n\n" +
      `Savol bo'lsa — texnik yordamga yozing${bot ? ` (${bot})` : ''}.`,
    loginAlert: (when: string, device: string, ip: string, method: string) =>
      `🔔 <b>Hisobingizga kirildi</b>\n\n🕐 ${when}\n💻 ${device}\n🌍 IP: ${ip}\n🔑 Usul: ${method}\n\n` +
      "Agar bu siz bo'lmasangiz, pastdagi tugmani bosing — barcha qurilmalardagi sessiyalar yopiladi.",
    revoked: "🔒 Barcha qurilmalardagi sessiyalar yopildi. Saytda «Parolni unutdingizmi?» orqali yangi parol o'rnating.",
    methods: { password: 'parol', code: 'Telegram kodi', google: 'Google', reset: 'parolni tiklash' },
    tooMany: "Juda ko'p so'rov. Birozdan keyin qayta urinib ko'ring.",
    unknown: 'Pastdagi menyudan foydalaning 👇',
  },
  ru: {
    btnCode: '🔑 Код для входа', btnRegister: '📝 Регистрация', btnProfile: '👤 Профиль', btnSettings: '⚙️ Настройки', btnHelp: '🆘 Помощь',
    share: '📱 Поделиться номером', copy: '📋 Копировать', newCode: '🔄 Новый код', toSite: '🌐 Перейти на сайт', openProfile: '🌐 Открыть профиль',
    registerBtn: '📝 Регистрация на сайте', supportBtn: '💬 Техподдержка', notMe: '🔒 Это не я',
    hello: (name: string) =>
      `👋 Здравствуйте, <b>${name}</b>!\n\nЭто — <b>бот входа AyolQadami</b>. С ним вы:\n` +
      '• входите на сайт <b>без пароля</b> — по коду;\n• подтверждаете номер при регистрации;\n• восстанавливаете пароль;\n' +
      '• получаете уведомления о входе в аккаунт.\n\nВоспользуйтесь меню ниже.',
    needPhone: '📱 Сначала привяжите номер — нажмите кнопку <b>«📱 Поделиться номером»</b> ниже.\n\nТак мы убедимся, что номер ваш.',
    expired: '⌛️ Ссылка устарела или уже использована. Нажмите на сайте «Получить код в Telegram» ещё раз.',
    otherAccount: '⛔️ Эта ссылка уже открыта в другом аккаунте Telegram. Получите новый код на сайте.',
    already: '✅ Номер уже подтверждён. Вернитесь на сайт.',
    askContact: (p: string) => `Номер, указанный на сайте: <b>${p}</b>\n\nДля подтверждения нажмите кнопку <b>«📱 Поделиться номером»</b> ниже.`,
    notOwn: 'Пожалуйста, отправьте <b>свой</b> номер кнопкой ниже.',
    mismatch: (tgPhone: string, sitePhone: string) =>
      `❌ Номер вашего Telegram (<b>${tgPhone}</b>) не совпадает с номером на сайте (<b>${sitePhone}</b>).\n\n` +
      'Укажите на сайте номер этого Telegram или используйте аккаунт Telegram с тем номером.',
    notUz: '❌ Принимаются только номера Узбекистана (+998).',
    linked: (p: string) => `✅ Номер привязан: <b>${p}</b>\n\nТеперь коды с сайта будут сразу приходить в этот чат.`,
    code: (title: string, code: string, min: number, phone: string, where: string) =>
      `🔐 <b>${title}</b>\n\n<code>${code}</code>\n\n⏳ Действует ${min} мин.\n📱 ${phone}\n\n` +
      `Введите код на странице ${where} сайта <b>${siteHost()}</b>. Нажмите на код, чтобы скопировать.\n` +
      '🔒 Никому не сообщайте код — сотрудники AyolQadami никогда его не спрашивают.',
    codeReplaced: '♻️ Этот код отменён — новый ниже.',
    codeUsed: '✅ Этот код уже использован. Нужен новый — нажмите «🔑 Код для входа».',
    noAccount: (p: string) => `ℹ️ Аккаунт с номером <b>${p}</b> не найден.\n\nЗарегистрируйтесь на сайте — код подтверждения придёт в этот чат.`,
    blocked: '⛔️ Ваш аккаунт заблокирован. Обратитесь в поддержку.',
    register: (linked: boolean) =>
      '📝 <b>Регистрация</b>\n\nОткройте сайт и выберите «Регистрация».' +
      (linked ? ' Номер привязан — код подтверждения сразу придёт в этот чат.' : ' На шаге подтверждения номера вы вернётесь в этот бот.'),
    hasAccount: '✅ У вас уже есть аккаунт с этим номером. Для входа нажмите «🔑 Код для входа».',
    noSite: 'Адрес сайта ещё не настроен.',
    profile: (u: User, lang: Lang, apps: number, jobs: number) =>
      `👤 <b>${esc(u.company || u.name)}</b>\n\n` +
      `📱 ${formatUzPhone(u.phone)}\n🧭 ${ROLE[lang][u.role]}` + (u.city ? `\n📍 ${esc(u.city)}` : '') +
      (u.role === 'EMPLOYER' ? `\n💼 Вакансии: ${jobs}` : `\n📄 Отклики: ${apps}`) +
      `\n📅 Регистрация: ${date(u.createdAt)}` + (u.lastLoginAt ? `\n🕐 Последний вход: ${dateTime(u.lastLoginAt)}` : '') +
      `\n${u.phoneVerifiedAt ? '✅ Номер подтверждён' : '⚠️ Номер не подтверждён'}`,
    settings: (p: TelegramPhone) =>
      `⚙️ <b>Настройки</b>\n\n📱 Привязанный номер: <b>${formatUzPhone(p.phone)}</b>\n🌐 Язык: Русский\n🔔 Уведомления о входе: ${p.notifyLogin ? 'включены' : 'выключены'}`,
    setLang: "🌐 O'zbek tili", setNotifyOn: '🔔 Включить уведомления о входе', setNotifyOff: '🔕 Выключить уведомления о входе',
    setPhone: '📱 Обновить номер', setUnlink: '🔌 Отвязать номер',
    unlinked: '🔌 Номер отвязан. Чтобы привязать снова, нажмите «📱 Поделиться номером».',
    help: (bot: string) =>
      `🆘 <b>Помощь</b>\n\n<b>🔑 Код для входа</b> — одноразовый код для входа на сайт без пароля.\n` +
      '<b>📝 Регистрация</b> — новый аккаунт на сайте.\n<b>👤 Профиль</b> — коротко о вашем аккаунте.\n' +
      '<b>⚙️ Настройки</b> — язык, уведомления о входе, смена номера.\n\n' +
      '❓ <b>Код не приходит?</b> Номер на сайте должен совпадать с номером Telegram. Нажмите «🔄 Новый код».\n' +
      '❓ <b>Забыли пароль?</b> На сайте «Забыли пароль?» → код придёт в этот чат.\n\n' +
      `Остались вопросы — напишите в поддержку${bot ? ` (${bot})` : ''}.`,
    loginAlert: (when: string, device: string, ip: string, method: string) =>
      `🔔 <b>Выполнен вход в аккаунт</b>\n\n🕐 ${when}\n💻 ${device}\n🌍 IP: ${ip}\n🔑 Способ: ${method}\n\n` +
      'Если это были не вы, нажмите кнопку ниже — все сессии на всех устройствах будут закрыты.',
    revoked: '🔒 Все сессии закрыты. Установите новый пароль на сайте через «Забыли пароль?».',
    methods: { password: 'пароль', code: 'код Telegram', google: 'Google', reset: 'восстановление пароля' },
    tooMany: 'Слишком много запросов. Попробуйте позже.',
    unknown: 'Воспользуйтесь меню ниже 👇',
  },
}
type Texts = typeof T.uz

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const TZ = 'Asia/Tashkent'
const date = (d: Date) => d.toLocaleDateString('ru-RU', { timeZone: TZ })
const dateTime = (d: Date) => d.toLocaleString('ru-RU', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const langOf = (u?: TgUser, link?: TelegramPhone | null): Lang => (link?.lang === 'ru' || link?.lang === 'uz' ? link.lang : u?.language_code === 'ru' ? 'ru' : 'uz')

// ================= Klaviaturalar =================

const menuKeyboard = (t: Texts) => ({
  keyboard: [[{ text: t.btnCode }, { text: t.btnRegister }], [{ text: t.btnProfile }, { text: t.btnSettings }], [{ text: t.btnHelp }]],
  resize_keyboard: true,
  is_persistent: true,
})
const contactKeyboard = (t: Texts) => ({
  keyboard: [[{ text: t.share, request_contact: true }], [{ text: t.btnHelp }]],
  resize_keyboard: true,
  is_persistent: true,
})
const urlButton = (text: string, path = '') => (siteUrl() ? [{ text, url: siteUrl() + path }] : [])

// «Saytga o'tish» — kod kiritiladigan bo'limni ochadi (sayt shu brauzerda boshlangan tasdiqlashni qoralamadan davom ettiradi)
const SITE_SECTION: Record<string, string> = { login: 'code', register: 'signup', reset: 'reset' }

const codeKeyboard = (t: Texts, vid: string, code: string, purpose: string) => ({
  inline_keyboard: [
    [{ text: t.copy, copy_text: { text: code } }, { text: t.newCode, callback_data: `lc:new:${vid}` }],
    ...(siteUrl() ? [urlButton(t.toSite, `/?auth=${SITE_SECTION[purpose] || 'login'}`)] : []),
  ],
})

// ================= Yuborish =================

async function send(chatId: number | string, text: string, reply_markup?: unknown) {
  try {
    return await tg<{ message_id: number }>(loginBotToken(), 'sendMessage', {
      chat_id: chatId, text, parse_mode: 'HTML', reply_markup, link_preview_options: { is_disabled: true },
    })
  } catch (e) {
    if (!(e instanceof TelegramError && e.isForbidden)) console.error('[login-bot] send', e)
    return null
  }
}
const edit = (chatId: number | string, messageId: number, text: string, reply_markup?: unknown) =>
  tg(loginBotToken(), 'editMessageText', { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', reply_markup }).catch(() => null)

const linkOf = (tgId: string) => db.telegramPhone.findUnique({ where: { telegramId: tgId } })

// Kodni yaratib Telegram'ga yuboradi. Saytdan (raqam oldin ulangan bo'lsa), botdagi tugmalardan chaqiriladi
export async function sendVerificationCode(v: Pick<PhoneVerification, 'id' | 'purpose' | 'phone'>, chatId: string, u?: TgUser) {
  const t = T[langOf(u, await linkOf(chatId))]
  try {
    rateLimit(`login-bot:send:${v.id}`, 4, 10 * 60_000)
    rateLimit(`login-bot:send-chat:${chatId}`, 10, 10 * 60_000)
  } catch {
    await send(chatId, t.tooMany)
    return false
  }
  const { code, expiresAt } = await setCode(v.id, chatId, v.purpose)
  const lang = t === T.ru ? 'ru' : 'uz'
  const purpose = v.purpose as keyof typeof PURPOSE.uz
  const min = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / 60_000))
  const text = t.code(PURPOSE[lang][purpose], code, min, formatUzPhone(v.phone), WHERE[lang][purpose])
  return Boolean(await send(chatId, text, codeKeyboard(t, v.id, code, v.purpose)))
}

// Kontakt kutilayotgan tasdiqlash: ro'yxatdan o'tish/tiklash, yoki saytdan boshlangan, hali kod yuborilmagan kirish.
// (botdagi «Kirish kodi» yaratgan kirish yozuvlarida kod allaqachon bor — ular bu yerga kirmaydi)
// phone berilsa (raqam isbotlangan) — havolasi ochilmagan saytdagi sessiyalar ham topiladi: foydalanuvchi botga
// havola orqali emas, to'g'ridan-to'g'ri kirib raqamini ulashsa ham kod saytda ochiq turgan eng yangi sessiyaga boradi
async function pendingFor(telegramId: string, phone?: string) {
  const v = await db.phoneVerification.findFirst({
    where: {
      usedAt: null, verifiedAt: null, expiresAt: { gt: new Date() },
      AND: [
        { OR: [{ purpose: { not: 'login' } }, { codeHash: null }] },
        { OR: [{ telegramId }, ...(phone ? [{ telegramId: null, phone }] : [])] },
      ],
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!v || v.telegramId) return v
  // havolasiz topilgan sessiya shu Telegram hisobiga bog'lanadi (boshqasi ochib ulgurgan bo'lsa — olinmaydi)
  const { count } = await db.phoneVerification.updateMany({ where: { id: v.id, telegramId: null }, data: { telegramId } })
  return count ? { ...v, telegramId } : null
}

// ================= Amallar =================

async function cmdCode(msg: TgMessage, t: Texts, link: TelegramPhone | null) {
  const tgId = String(msg.from!.id)
  if (!link) return send(msg.chat.id, t.needPhone, contactKeyboard(t))
  // saytda shu raqam bilan ro'yxatdan o'tish / parolni tiklash ochiq turgan bo'lsa — o'sha uchun kod
  const pending = await pendingFor(tgId, link.phone)
  if (pending?.phone === link.phone) return sendVerificationCode(pending, tgId, msg.from)
  const user = await db.user.findUnique({ where: { phone: link.phone } })
  if (!user) return send(msg.chat.id, t.noAccount(formatUzPhone(link.phone)), { inline_keyboard: [urlButton(t.registerBtn, '/?auth=signup')].filter((r) => r.length) })
  if (user.status !== 'ACTIVE') return send(msg.chat.id, t.blocked)
  const v = await createVerification(link.phone, 'login', tgId)
  return sendVerificationCode(v, tgId, msg.from)
}

async function cmdRegister(msg: TgMessage, t: Texts, link: TelegramPhone | null) {
  if (link && (await db.user.findUnique({ where: { phone: link.phone }, select: { id: true } }))) {
    return send(msg.chat.id, t.hasAccount, menuKeyboard(t))
  }
  if (!siteUrl()) return send(msg.chat.id, t.noSite)
  return send(msg.chat.id, t.register(Boolean(link)), { inline_keyboard: [urlButton(t.registerBtn, '/?auth=signup')] })
}

async function cmdProfile(msg: TgMessage, t: Texts, link: TelegramPhone | null) {
  if (!link) return send(msg.chat.id, t.needPhone, contactKeyboard(t))
  const user = await db.user.findUnique({ where: { phone: link.phone } })
  if (!user) return send(msg.chat.id, t.noAccount(formatUzPhone(link.phone)), { inline_keyboard: [urlButton(t.registerBtn, '/?auth=signup')].filter((r) => r.length) })
  const [apps, jobs] = await Promise.all([
    db.application.count({ where: { userId: user.id } }),
    db.job.count({ where: { authorId: user.id, status: { not: 'ARCHIVED' } } }),
  ])
  const lang = t === T.ru ? 'ru' : 'uz'
  return send(msg.chat.id, t.profile(user, lang, apps, jobs), { inline_keyboard: [urlButton(t.openProfile, '/profile')].filter((r) => r.length) })
}

const settingsKeyboard = (t: Texts, p: TelegramPhone) => ({
  inline_keyboard: [
    [{ text: t.setLang, callback_data: 'st:lang' }],
    [{ text: p.notifyLogin ? t.setNotifyOff : t.setNotifyOn, callback_data: 'st:notify' }],
    [{ text: t.setPhone, callback_data: 'st:phone' }, { text: t.setUnlink, callback_data: 'st:unlink' }],
  ],
})

async function cmdSettings(msg: TgMessage, t: Texts, link: TelegramPhone | null) {
  if (!link) return send(msg.chat.id, t.needPhone, contactKeyboard(t))
  return send(msg.chat.id, t.settings(link), settingsKeyboard(t, link))
}

async function cmdHelp(msg: TgMessage, t: Texts, link: TelegramPhone | null) {
  const { getTelegramConfig } = await import('../telegram/config')
  const main = (await getTelegramConfig().catch(() => null))?.botUsername
  const rows = [
    ...(main ? [[{ text: t.supportBtn, url: `https://t.me/${main}` }]] : siteUrl() ? [urlButton(t.supportBtn, '/support')] : []),
    ...(siteUrl() ? [urlButton(t.toSite)] : []),
  ]
  await send(msg.chat.id, t.help(main ? `@${main}` : ''), rows.length ? { inline_keyboard: rows } : undefined)
  if (!link) await send(msg.chat.id, t.needPhone, contactKeyboard(t))
}

async function onStart(msg: TgMessage, payload: string) {
  const from = msg.from!
  const tgId = String(from.id)
  const link = await linkOf(tgId)
  const t = T[langOf(from, link)]
  if (!payload.startsWith('v_')) {
    await send(msg.chat.id, t.hello(esc(from.first_name)), link ? menuKeyboard(t) : contactKeyboard(t))
    if (!link) await send(msg.chat.id, t.needPhone)
    return
  }

  const v = await db.phoneVerification.findUnique({ where: { token: payload.slice(2) } })
  if (!v || v.usedAt || v.expiresAt < new Date()) return send(msg.chat.id, t.expired, link ? menuKeyboard(t) : contactKeyboard(t))
  if (v.verifiedAt) return send(msg.chat.id, t.already, menuKeyboard(t))
  // havola birinchi ochgan Telegram hisobiga bog'lanadi
  if (v.telegramId && v.telegramId !== tgId) return send(msg.chat.id, t.otherAccount)
  if (!v.telegramId) {
    const { count } = await db.phoneVerification.updateMany({ where: { id: v.id, telegramId: null }, data: { telegramId: tgId } })
    if (!count) return send(msg.chat.id, t.otherAccount)
  }
  // shu Telegram hisobi bu raqamni avval isbotlagan — kontakt so'ramaymiz
  if (link?.phone === v.phone) return sendVerificationCode(v, tgId, from)
  return send(msg.chat.id, t.askContact(maskPhone(v.phone)), contactKeyboard(t))
}

async function onContact(msg: TgMessage) {
  const from = msg.from!
  const tgId = String(from.id)
  const prev = await linkOf(tgId)
  const t = T[langOf(from, prev)]
  const c = msg.contact!
  // request_contact tugmasi faqat o'z raqamini yuboradi; boshqaning kontaktida user_id boshqa yoki yo'q
  if (c.user_id !== from.id) return send(msg.chat.id, t.notOwn, contactKeyboard(t))
  const phone = normalizeUzPhone(c.phone_number)
  if (!phone) return send(msg.chat.id, t.notUz, prev ? menuKeyboard(t) : contactKeyboard(t))

  await db.telegramPhone.upsert({
    where: { telegramId: tgId },
    create: { telegramId: tgId, phone, firstName: from.first_name.slice(0, 120), username: from.username },
    update: { phone, firstName: from.first_name.slice(0, 120), username: from.username ?? null },
  })

  const v = await pendingFor(tgId, phone)
  if (v && v.phone !== phone) return send(msg.chat.id, t.mismatch(formatUzPhone(phone), maskPhone(v.phone)), menuKeyboard(t))
  await send(msg.chat.id, t.linked(formatUzPhone(phone)), menuKeyboard(t))
  if (v) return sendVerificationCode(v, tgId, from)
}

// ================= Tugmalar (callback) =================

async function onCallback(q: NonNullable<TgUpdate['callback_query']>) {
  const token = loginBotToken()
  const answer = (text?: string) => tg(token, 'answerCallbackQuery', { callback_query_id: q.id, ...(text && { text }) }).catch(() => {})
  const msg = q.message
  if (!q.data || !msg || msg.chat.type !== 'private') return answer()
  const tgId = String(q.from.id)
  let link = await linkOf(tgId)
  const t = T[langOf(q.from, link)]

  // 🔄 Yangi kod — shu tasdiqlash uchun yangi kod (eski kod bekor bo'ladi)
  if (q.data.startsWith('lc:new:')) {
    const v = await db.phoneVerification.findUnique({ where: { id: q.data.slice(7) } })
    if (!v || v.telegramId !== tgId) return answer()
    await answer()
    if (v.usedAt || v.verifiedAt) {
      // kirish kodi ishlatilgan — yangi kirish sessiyasi; boshqalarida saytda qaytadan boshlash kerak
      if (v.purpose === 'login') return cmdCode({ ...msg, from: q.from }, t, link)
      return send(msg.chat.id, t.codeUsed)
    }
    await edit(msg.chat.id, msg.message_id, t.codeReplaced)
    return sendVerificationCode(v, tgId, q.from)
  }

  // 🔒 Bu men emasman — barcha sessiyalar bekor qilinadi
  if (q.data === 'lg:revoke') {
    if (!link) return answer()
    const user = await db.user.findUnique({ where: { phone: link.phone } })
    if (user) await db.user.update({ where: { id: user.id }, data: { tokenVersion: { increment: 1 } } })
    await answer()
    await edit(msg.chat.id, msg.message_id, (msg.text ? esc(msg.text) + '\n\n' : '') + t.revoked)
    return
  }

  if (q.data.startsWith('st:')) {
    if (!link) return answer()
    const action = q.data.slice(3)
    if (action === 'phone') {
      await answer()
      return send(msg.chat.id, t.needPhone, contactKeyboard(t))
    }
    if (action === 'unlink') {
      await db.telegramPhone.delete({ where: { telegramId: tgId } })
      await answer()
      await edit(msg.chat.id, msg.message_id, t.unlinked)
      return send(msg.chat.id, t.needPhone, contactKeyboard(t))
    }
    if (action === 'lang') link = await db.telegramPhone.update({ where: { telegramId: tgId }, data: { lang: langOf(q.from, link) === 'uz' ? 'ru' : 'uz' } })
    if (action === 'notify') link = await db.telegramPhone.update({ where: { telegramId: tgId }, data: { notifyLogin: !link.notifyLogin } })
    await answer()
    const nt = T[langOf(q.from, link)]
    await edit(msg.chat.id, msg.message_id, nt.settings(link), settingsKeyboard(nt, link))
    // menyu yangi tilda
    if (action === 'lang') await send(msg.chat.id, '✅', menuKeyboard(nt))
    return
  }
  return answer()
}

// ================= Kirish haqida xabar =================

function deviceOf(ua: string) {
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '—'
  const br = /Telegram/i.test(ua) ? 'Telegram' : /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /YaBrowser/.test(ua) ? 'Yandex' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : ''
  return [os, br].filter(Boolean).join(' · ')
}

// Hisobga kirilganda raqam ulangan Telegram'ga xabar (o'chirib qo'yish mumkin). Javobni kutdirmaydi
export function notifyLogin(user: Pick<User, 'phone'>, req: Request, method: keyof Texts['methods'], ip: string) {
  if (!loginBotToken() || !user.phone) return
  void (async () => {
    const link = await db.telegramPhone.findFirst({ where: { phone: user.phone!, notifyLogin: true }, orderBy: { updatedAt: 'desc' } })
    if (!link) return
    const t = T[langOf(undefined, link)]
    const ua = req.headers.get('user-agent') || ''
    await send(link.telegramId, t.loginAlert(dateTime(new Date()), esc(deviceOf(ua)), esc(ip), t.methods[method]), {
      inline_keyboard: [[{ text: t.notMe, callback_data: 'lg:revoke' }]],
    })
  })().catch((e) => console.error('[login-bot] notify', e))
}

// ================= Kirish nuqtasi =================

export async function handleLoginUpdate(update: TgUpdate) {
  if (update.callback_query) return onCallback(update.callback_query)
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

  const link = await linkOf(String(msg.from.id))
  const t = T[langOf(msg.from, link)]
  const is = (k: 'btnCode' | 'btnRegister' | 'btnProfile' | 'btnSettings' | 'btnHelp', cmd: string) =>
    text === T.uz[k] || text === T.ru[k] || text.split(/[\s@]/)[0].toLowerCase() === cmd
  if (is('btnCode', '/code')) return cmdCode(msg, t, link)
  if (is('btnRegister', '/register')) return cmdRegister(msg, t, link)
  if (is('btnProfile', '/profile')) return cmdProfile(msg, t, link)
  if (is('btnSettings', '/settings')) return cmdSettings(msg, t, link)
  if (is('btnHelp', '/help')) return cmdHelp(msg, t, link)

  // tasdiqlash kutilayotgan bo'lsa: raqam shu Telegram'da allaqachon isbotlangan — kod, aks holda kontakt so'raymiz
  const v = await pendingFor(String(msg.from.id), link?.phone)
  if (v && link?.phone === v.phone) return sendVerificationCode(v, String(msg.from.id), msg.from)
  if (v) return send(msg.chat.id, t.askContact(maskPhone(v.phone)), contactKeyboard(t))
  return send(msg.chat.id, link ? t.unknown : t.needPhone, link ? menuKeyboard(t) : contactKeyboard(t))
}

async function syncProfile(token: string) {
  const call = (method: string, params: Record<string, unknown>) => tg(token, method, params).catch(() => {})
  await call('setMyCommands', {
    commands: [
      { command: 'start', description: 'Bosh menyu' },
      { command: 'code', description: 'Kirish kodi' },
      { command: 'profile', description: 'Profil' },
      { command: 'settings', description: 'Sozlamalar' },
      { command: 'help', description: 'Yordam' },
    ],
  })
  await call('setMyCommands', {
    language_code: 'ru',
    commands: [
      { command: 'start', description: 'Главное меню' },
      { command: 'code', description: 'Код для входа' },
      { command: 'profile', description: 'Профиль' },
      { command: 'settings', description: 'Настройки' },
      { command: 'help', description: 'Помощь' },
    ],
  })
  await call('setMyDescription', {
    description: "AyolQadami — rasmiy kirish boti. Saytga parolsiz kirish, raqamni tasdiqlash va parolni tiklash uchun kod yuboradi. Kodni hech kimga bermang.",
  })
  await call('setMyDescription', {
    language_code: 'ru',
    description: 'AyolQadami — официальный бот входа. Присылает коды для входа без пароля, подтверждения номера и восстановления пароля. Никому не сообщайте код.',
  })
  await call('setMyShortDescription', { short_description: 'AyolQadami — kirish kodi, raqamni tasdiqlash va xavfsizlik xabarlari' })
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function startLoginPoller() {
  const s = st()
  if (s.started || !loginBotPolling()) return
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
        const updates = await tg<TgUpdate[]>(token, 'getUpdates', { offset: s.offset, timeout: 25, allowed_updates: ['message', 'callback_query'] }, 35000)
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
