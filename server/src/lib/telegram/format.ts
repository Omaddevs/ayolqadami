// Telegram postlari matni (parse_mode: HTML)
import type { Job } from '@prisma/client'
import { catName } from '../catalog'
import { salaryText } from '../format'
import { jobPath } from '../slug'
import type { TelegramConfig } from './config'

export const esc = (s: string | null | undefined) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Teglar: #IT_va_dizayn #Toshkent — kanalda qidirish oson bo'lsin
const hashtag = (s: string) => '#' + s.replace(/['ʻʼ‘’`]/g, '').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '')

export function jobUrl(job: Pick<Job, 'id' | 'number' | 'title' | 'city'>, cfg: Pick<TelegramConfig, 'webAppUrl'>) {
  return cfg.webAppUrl ? `${cfg.webAppUrl.replace(/\/$/, '')}${jobPath(job)}` : ''
}

// Kanal postidagi "Batafsil" havolasi: server manzili bo'lsa — qisqa havola (/l/:id) — Telegram undan
// rasmli kartochka (Open Graph) chizadi va bosilganda web ilovadagi vakansiyaga yo'naltiradi
export function jobShareUrl(job: Pick<Job, 'id' | 'number' | 'title' | 'city'>, cfg: Pick<TelegramConfig, 'webAppUrl' | 'publicUrl'>) {
  return /^https?:\/\//.test(cfg.publicUrl) ? `${cfg.publicUrl.replace(/\/$/, '')}/l/${job.number}` : jobUrl(job, cfg)
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
    ...(job.type ? ['', `🕒 Ish turi: ${esc(job.type)}`] : []),
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

// --- «📂 Ish kanallari» — Telegram chat papkasi (t.me/addlist/...): bosilsa barcha kanallarga bir bosishda qo'shiladi ---
export const FOLDER_LINK_RE = /^https:\/\/t\.me\/addlist\/[\w-]{6,}$/
export const FOLDER_BUTTON_TEXT = '📂 Ish kanallari / Каналы с вакансиями'
// AyolQadam ish kanallari papkasi — tugma havolasi bo'sh qolsa shu ishlatiladi (FOLDER_LINK muhit o'zgaruvchisi bilan almashtiriladi)
export const DEFAULT_FOLDER_LINK = process.env.FOLDER_LINK || 'https://t.me/addlist/URvgf3qbEus5ZDcy'

export const DEFAULT_CHANNEL_BUTTONS = [
  "📢 E'lon joylash / Разместить вакансию | {post} | blue",
  `${FOLDER_BUTTON_TEXT} | ${DEFAULT_FOLDER_LINK} | red`,
  '💼 Website AyolQadami | {site} | green',
].join('\n')
// eski «🗂 Kanallar to'plami» qatori ham shu tugma hisoblanadi
const isFolderRow = (text: string, url: string) => /t\.me\/addlist\//.test(url) || /📂|🗂|kanallar|каналы/i.test(text)

export function folderLinkOf(lines: string) {
  for (const raw of lines.split(/\r?\n/)) {
    const [text = '', url = ''] = raw.split('|').map((s) => s.trim())
    if (text && isFolderRow(text, url)) return url
  }
  return ''
}

// Papka havolasini "Matn | havola | rang" qatorlariga yozadi: mavjud papka tugmasi yangilanadi, bo'lmasa — qo'shiladi.
// Bo'sh havola — tugma havolasiz qoladi (kanalda ko'rinmaydi)
export function withFolderLink(lines: string, url: string) {
  const rows = lines.split(/\r?\n/).filter((l) => l.trim())
  const i = rows.findIndex((raw) => {
    const [text = '', u = ''] = raw.split('|').map((s) => s.trim())
    return text && isFolderRow(text, u)
  })
  if (i >= 0) {
    const color = rows[i].split('|')[2]?.trim() || 'red'
    rows[i] = `${FOLDER_BUTTON_TEXT} | ${url} | ${color}`
  } else if (url) {
    rows.push(`${FOLDER_BUTTON_TEXT} | ${url} | red`)
  }
  return rows.join('\n')
}

const STYLES: Record<string, 'primary' | 'danger' | 'success'> = {
  blue: 'primary', "ko'k": 'primary', kok: 'primary', primary: 'primary',
  red: 'danger', qizil: 'danger', danger: 'danger',
  green: 'success', yashil: 'success', success: 'success',
}

export type TgButton = { text: string; url: string; style?: 'primary' | 'danger' | 'success' }

// Barcha inline tugmalar rangli: rangi berilmagan tugmaga matniga qarab rang beriladi
// (bekor qilish, o'chirish — qizil; tasdiqlash, joylash, saqlash — yashil; qolgani — ko'k). ayolqadam-bot/app/button_colors.py bilan bir xil
const DANGER_RE = /❌|🗑|🚫|⛔|bekor|o['ʻʼ‘’`]?chir|rad\b|rad et|yopish|yashir|chiqish|отмен|удал|отклон|закры|скры|выйти/i
const SUCCESS_RE = /✅|✔|💾|📤|tasdiq|joyla|saqla|yubor|ariza|qabul|^ha\b|подтверд|опублик|размест|сохран|отправ|отклик|принят|^да\b/i
export const styleFor = (text: string): NonNullable<TgButton['style']> =>
  DANGER_RE.test(text) ? 'danger' : SUCCESS_RE.test(text) ? 'success' : 'primary'

export function colorizeKeyboard<T>(markup: T): T {
  const rows = (markup as { inline_keyboard?: { text: string; style?: string }[][] } | undefined)?.inline_keyboard
  if (!Array.isArray(rows)) return markup
  return { ...markup, inline_keyboard: rows.map((row) => row.map((b) => (b.style ? b : { ...b, style: styleFor(b.text) }))) }
}

export function parseChannelButtons(src: string, vars: Record<string, string>): TgButton[] {
  const out: TgButton[] = []
  for (const raw of src.split(/\r?\n/)) {
    const [text = '', url = '', color = ''] = raw.split('|').map((s) => s.trim())
    if (!text || text.startsWith('#')) continue
    // «📂 Ish kanallari» havolasiz saqlangan bo'lsa (eski sozlama) — standart papka havolasi
    const href = (url || (isFolderRow(text, '') ? DEFAULT_FOLDER_LINK : '')).replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m)
    if (!/^(https?:\/\/|tg:\/\/)[^\s{}]+$/.test(href)) continue // to'ldirilmagan yoki noto'g'ri havola — tugma chiqmaydi
    const style = STYLES[color.toLowerCase().replace(/[ʻʼ‘’`]/g, "'")]
    out.push({ text: text.slice(0, 64), url: href, ...(style && { style }) })
  }
  return out.slice(0, 8)
}

export const botLink = (cfg: Pick<TelegramConfig, 'botUsername'>, start?: string) =>
  cfg.botUsername ? `https://t.me/${cfg.botUsername}${start ? `?start=${start}` : ''}` : ''

// Vakansiya posti tugmalari: har biri alohida qatorda (skrinshotdagidek to'liq kenglikda)
export function buttonsKeyboard(src: string, cfg: Pick<TelegramConfig, 'webAppUrl' | 'botUsername'>, job?: Pick<Job, 'id' | 'number' | 'title' | 'city'>) {
  const site = cfg.webAppUrl.replace(/\/$/, '')
  const buttons = parseChannelButtons(src, {
    site,
    job: job ? jobUrl(job, cfg) : '',
    bot: botLink(cfg),
    post: botLink(cfg, 'post') || (site ? `${site}/post-job` : ''),
  })
  return buttons.length ? colorizeKeyboard({ inline_keyboard: buttons.map((b) => [b]) }) : undefined
}

export const jobKeyboard = (job: Pick<Job, 'id' | 'number' | 'title' | 'city'>, cfg: Pick<TelegramConfig, 'webAppUrl' | 'botUsername' | 'channelButtons'>) =>
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
