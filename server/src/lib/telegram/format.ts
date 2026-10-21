// Telegram postlari matni (parse_mode: HTML)
import type { Job } from '@prisma/client'
import { catName } from '../catalog'
import { salaryText } from '../format'
import type { TelegramConfig } from './config'

export const esc = (s: string | null | undefined) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Teglar: #IT_va_dizayn #Toshkent — kanalda qidirish oson bo'lsin
const hashtag = (s: string) => '#' + s.replace(/['ʻʼ‘’`]/g, '').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '')

export function jobUrl(job: Pick<Job, 'id'>, cfg: Pick<TelegramConfig, 'webAppUrl'>) {
  return cfg.webAppUrl ? `${cfg.webAppUrl.replace(/\/$/, '')}/jobs/${encodeURIComponent(job.id)}` : ''
}

// Kanal postidagi "Batafsil" havolasi: server manzili bo'lsa — qisqa havola (/l/:id) — Telegram undan
// rasmli kartochka (Open Graph) chizadi va bosilganda web ilovadagi vakansiyaga yo'naltiradi
export function jobShareUrl(job: Pick<Job, 'id'>, cfg: Pick<TelegramConfig, 'webAppUrl' | 'publicUrl'>) {
  return /^https?:\/\//.test(cfg.publicUrl) ? `${cfg.publicUrl.replace(/\/$/, '')}/l/${encodeURIComponent(job.id)}` : jobUrl(job, cfg)
}

export type JobContact = { name?: string; phone?: string; telegram?: string }
export const jobContact = (job: Pick<Job, 'details'>): JobContact => {
  const c = (job.details as { contact?: JobContact } | null)?.contact
  return c && typeof c === 'object' ? c : {}
}

const salaryShort = (from: number, to: number) => (from || to ? salaryText(from, to) : 'Kelishilgan')

// Kanal posti: sarlavha, kompaniya, hudud, maosh, aloqa va havola — har biri alohida qatorda
export function jobPostHtml(job: Job, cfg: Pick<TelegramConfig, 'jobFooter'> & Partial<Pick<TelegramConfig, 'webAppUrl' | 'publicUrl'>>) {
  const place = [job.city, job.district].filter(Boolean).join(', ')
  const contact = jobContact(job)
  const phone = contact.phone && /\d{7}/.test(contact.phone.replace(/\D/g, '')) ? contact.phone : ''
  const tgUser = contact.telegram?.replace(/^@/, '').trim()
  const link = jobShareUrl(job, { webAppUrl: cfg.webAppUrl || '', publicUrl: cfg.publicUrl || '' })

  const lines = [
    `<b>${esc(job.title)}</b>`,
    '',
    `🏢 Kompaniya: ${esc(job.companyName)}`,
    '',
    `📍 Hudud: ${esc(place)}`,
    '',
    `💰 Maosh: ${esc(salaryShort(job.salaryFrom, job.salaryTo))}`,
  ]
  if (phone) lines.push('', `☎️ Aloqa: ${esc(phone)}${contact.name ? ` (${esc(contact.name)})` : ''}`)
  if (tgUser && /^[A-Za-z0-9_]{4,32}$/.test(tgUser)) lines.push('', `✈️ Telegram: @${tgUser}`)
  if (link) lines.push('', `📞 Batafsil: ${esc(link)}`)
  lines.push('', [hashtag(catName(job.category)), hashtag(job.city)].join(' '))
  if (cfg.jobFooter) lines.push('', cfg.jobFooter) // admin yozgan HTML (ishonchli manba)
  return lines.join('\n')
}

// --- Kanal postlari ostidagi rangli tugmalar ---
// Sozlamada har qator: "Matn | havola | rang". Rang: blue/ko'k, red/qizil, green/yashil (bo'sh — oddiy).
// Havolada: {post} — botda e'lon joylash, {site} — web ilova, {job} — shu vakansiya, {bot} — t.me/bot

export const DEFAULT_CHANNEL_BUTTONS = [
  "📢 E'lon joylash / Разместить вакансию | {post} | blue",
  "🗂 Kanallar to'plami / Подборка каналов |  | red",
  '💼 Website AyolQadami | {site} | green',
].join('\n')

const STYLES: Record<string, 'primary' | 'danger' | 'success'> = {
  blue: 'primary', "ko'k": 'primary', kok: 'primary', primary: 'primary',
  red: 'danger', qizil: 'danger', danger: 'danger',
  green: 'success', yashil: 'success', success: 'success',
}

export type TgButton = { text: string; url: string; style?: 'primary' | 'danger' | 'success' }

export function parseChannelButtons(src: string, vars: Record<string, string>): TgButton[] {
  const out: TgButton[] = []
  for (const raw of src.split(/\r?\n/)) {
    const [text = '', url = '', color = ''] = raw.split('|').map((s) => s.trim())
    if (!text || text.startsWith('#')) continue
    const href = url.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m)
    if (!/^(https?:\/\/|tg:\/\/)[^\s{}]+$/.test(href)) continue // to'ldirilmagan yoki noto'g'ri havola — tugma chiqmaydi
    const style = STYLES[color.toLowerCase().replace(/[ʻʼ‘’`]/g, "'")]
    out.push({ text: text.slice(0, 64), url: href, ...(style && { style }) })
  }
  return out.slice(0, 8)
}

export const botLink = (cfg: Pick<TelegramConfig, 'botUsername'>, start?: string) =>
  cfg.botUsername ? `https://t.me/${cfg.botUsername}${start ? `?start=${start}` : ''}` : ''

// Vakansiya posti tugmalari: har biri alohida qatorda (skrinshotdagidek to'liq kenglikda)
export function buttonsKeyboard(src: string, cfg: Pick<TelegramConfig, 'webAppUrl' | 'botUsername'>, job?: Pick<Job, 'id'>) {
  const site = cfg.webAppUrl.replace(/\/$/, '')
  const buttons = parseChannelButtons(src, {
    site,
    job: job ? jobUrl(job, cfg) : '',
    bot: botLink(cfg),
    post: botLink(cfg, 'post') || (site ? `${site}/post-job` : ''),
  })
  return buttons.length ? { inline_keyboard: buttons.map((b) => [b]) } : undefined
}

export const jobKeyboard = (job: Pick<Job, 'id'>, cfg: Pick<TelegramConfig, 'webAppUrl' | 'botUsername' | 'channelButtons'>) =>
  buttonsKeyboard(cfg.channelButtons ?? DEFAULT_CHANNEL_BUTTONS, cfg, job)

// Qo'lda yozilgan post/tarqatma tugmalari. Eski tarqatmalarda bitta tugma (buttonText/buttonUrl) saqlangan
export function customKeyboard(cfg: Pick<TelegramConfig, 'webAppUrl' | 'botUsername'>, buttons?: string | null, text?: string | null, url?: string | null) {
  return buttonsKeyboard(buttons || (text && url ? `${text} | ${url}` : ''), cfg)
}

// Telegram HTML rejimi faqat ma'lum teglarni qabul qiladi — ruxsat etilmaganlari matn sifatida ko'rsatiladi
const ALLOWED = /^\/?(b|strong|i|em|u|ins|s|strike|del|a|code|pre|blockquote|tg-spoiler|span)$/i
export function sanitizeTelegramHtml(src: string) {
  return src.replace(/<\/?([a-z-]+)([^>]*)>/gi, (m, tag: string, attrs: string) => {
    if (!ALLOWED.test(tag)) return esc(m)
    if (tag.toLowerCase() === 'a' && !m.startsWith('</')) {
      const href = /href\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] || ''
      return /^(https?:\/\/|tg:\/\/)/i.test(href) ? `<a href="${href.replace(/"/g, '&quot;')}">` : esc(m)
    }
    if (tag.toLowerCase() === 'span' && !m.startsWith('</') && !/class\s*=\s*"tg-spoiler"/.test(attrs)) return esc(m)
    return m.startsWith('</') ? `</${tag}>` : `<${tag}>`
  })
}
