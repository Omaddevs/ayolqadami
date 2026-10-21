// Telegram sozlamalari — bazada (Setting 'telegram'). TELEGRAM_BOT_TOKEN muhit o'zgaruvchisi berilsa, u ustun.
// Bu fayl 'server-only'siz: instrumentation (polling) ham ishlatadi.
import { randomBytes } from 'node:crypto'
import { db } from '../db'
import { DEFAULT_CHANNEL_BUTTONS } from './format'

export type BotMode = 'off' | 'polling' | 'webhook'

export type TelegramConfig = {
  token: string
  botUsername: string // getMe natijasi (ko'rsatish va havolalar uchun)
  botName: string
  mode: BotMode
  publicUrl: string // webhook uchun server manzili, https://api.ayolqadami.uz
  webhookSecret: string
  webAppUrl: string // web ilova manzili — vakansiya havolalari va "Ilovani ochish" tugmasi
  welcomeText: string
  autoPostJobs: boolean // tasdiqlangan vakansiya avtomatik kanallarga
  supportViaBot: boolean // botga yozilgan matn murojaat sifatida admin panelga tushadi
  jobFooter: string // kanal postlari oxiridagi matn (masalan, kanal havolasi)
  channelButtons: string // kanal postlari ostidagi rangli tugmalar: "Matn | havola | rang" har qatorda
}

const DEFAULTS: TelegramConfig = {
  token: '',
  botUsername: '',
  botName: '',
  mode: 'off',
  publicUrl: '',
  webhookSecret: '',
  webAppUrl: '',
  welcomeText:
    "Assalomu alaykum, {name}! 👋\n\nAyolQadami — ayollar uchun ish, rezyume va o'quv kurslari platformasi.\n\n/jobs — so'nggi vakansiyalar\n/help — yordam\n\nSavolingiz bo'lsa, shu yerga yozing — operatorlarimiz javob berishadi.",
  autoPostJobs: true,
  supportViaBot: true,
  jobFooter: '',
  channelButtons: DEFAULT_CHANNEL_BUTTONS,
}

export const envToken = () => process.env.TELEGRAM_BOT_TOKEN || ''

export async function getTelegramConfig(): Promise<TelegramConfig> {
  const row = await db.setting.findUnique({ where: { key: 'telegram' } })
  const saved = (row?.value as Partial<TelegramConfig>) || {}
  const cfg = { ...DEFAULTS, ...saved }
  if (envToken()) cfg.token = envToken()
  return cfg
}

export async function saveTelegramConfig(patch: Partial<TelegramConfig>) {
  const row = await db.setting.findUnique({ where: { key: 'telegram' } })
  const next = { ...DEFAULTS, ...((row?.value as Partial<TelegramConfig>) || {}), ...patch }
  if (!next.webhookSecret) next.webhookSecret = randomBytes(24).toString('hex')
  await db.setting.upsert({ where: { key: 'telegram' }, create: { key: 'telegram', value: next }, update: { value: next } })
  return next
}

// Tokenni ekranda ko'rsatish: 1234567890:AA…xY
export const maskToken = (t: string) => (t ? `${t.split(':')[0]}:${t.slice(t.indexOf(':') + 1, t.indexOf(':') + 3)}…${t.slice(-3)}` : '')
export const isTokenFormat = (t: string) => /^\d{5,15}:[A-Za-z0-9_-]{30,50}$/.test(t)
