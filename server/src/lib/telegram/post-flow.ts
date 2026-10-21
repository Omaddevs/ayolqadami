// Botda vakansiya e'lonini joylash: bosqichma-bosqich so'raladi, qoralama TelegramUser.draft'da saqlanadi.
// Kirish: /post, /start post (kanal postidagi «E'lon joylash» tugmasi) yoki /start menyusidagi tugma.
// Tayyor e'lon saytdagidek moderatsiyaga tushadi (o'chiq bo'lsa — darhol kanallarga).
import { Prisma, type Job } from '@prisma/client'
import { db } from '../db'
import { CATEGORIES, CITIES, catName } from '../catalog'
import { formatUzPhone, normalizeUzPhone } from '../phone'
import { tg, type TgMessage, type TgUser } from './api'
import type { TelegramConfig } from './config'
import { esc, jobPostHtml } from './format'
import { autoPostJob } from './service'

type Step = 'title' | 'company' | 'city' | 'district' | 'category' | 'salary' | 'phone' | 'description' | 'confirm'

export type JobDraft = {
  step: Step
  title?: string
  company?: string
  city?: string
  district?: string
  category?: string
  salaryFrom?: number
  salaryTo?: number
  phone?: string
  contactName?: string
  description?: string
}

const ORDER: Step[] = ['title', 'company', 'city', 'district', 'category', 'salary', 'phone', 'description', 'confirm']
const TOTAL = ORDER.length - 1
const DAILY_LIMIT = 5

const btn = (text: string, data: string) => ({ text, callback_data: data })
const rows = <T,>(items: T[], n: number) => Array.from({ length: Math.ceil(items.length / n) }, (_, i) => items.slice(i * n, i * n + n))
const SKIP = [[btn("⏭ O'tkazib yuborish", 'pj:skip')]]
const CANCEL_HINT = '\n\n<i>/cancel — bekor qilish</i>'

// "5000000", "5 000 000", "5 mln", "3-5 mln", "300$" emas — faqat so'm. Topilmasa null
export function parseSalary(input: string): { from: number; to: number } | null {
  const s = input.toLowerCase().replace(/\s+/g, ' ').trim()
  if (/kelish|договор|by agreement/.test(s)) return { from: 0, to: 0 }
  const mult = /mln|million|млн/.test(s) ? 1e6 : /ming|тыс|k\b/.test(s) ? 1e3 : 1
  const nums = (s.replace(/(\d)[ .,](?=\d{3}\b)/g, '$1').match(/\d+(?:[.,]\d+)?/g) || []).map((n) => Number(n.replace(',', '.')) * mult)
  const ok = nums.filter((n) => n >= 100_000 && n <= 1_000_000_000).map(Math.round)
  if (!ok.length || ok.length !== nums.length) return null
  const [a, b = 0] = ok
  return b && b < a ? { from: b, to: a } : { from: a, to: b }
}

async function send(cfg: TelegramConfig, chatId: number, text: string, replyMarkup?: unknown) {
  await tg(cfg.token, 'sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true }, reply_markup: replyMarkup })
}

const saveDraft = (tgId: string, draft: JobDraft | null) =>
  db.telegramUser.update({ where: { id: tgId }, data: { draft: draft ? (draft as Prisma.InputJsonValue) : Prisma.DbNull } })

const nextStep = (s: Step): Step => ORDER[Math.min(ORDER.indexOf(s) + 1, ORDER.length - 1)]

// Qoralamadan vaqtinchalik Job — kanal postining aynan o'zini oldindan ko'rsatish uchun
function draftAsJob(d: JobDraft): Job {
  return {
    id: 'preview', title: d.title || '', companyName: d.company || '', city: d.city || '', district: d.district || null,
    category: d.category || 'other', salaryFrom: d.salaryFrom || 0, salaryTo: d.salaryTo || 0, type: "To'liq stavka",
    tags: [], details: { contact: { name: d.contactName, phone: d.phone ? formatUzPhone(d.phone) : '' } },
  } as unknown as Job
}

async function ask(cfg: TelegramConfig, chatId: number, d: JobDraft) {
  const n = ORDER.indexOf(d.step) + 1
  const head = (t: string) => `📝 <b>${n}/${TOTAL}.</b> ${t}`
  switch (d.step) {
    case 'title':
      return send(cfg, chatId, head('Lavozim nomini yozing.\n\nMasalan: <i>Buxgalter</i>, <i>Sotuv menejeri</i>') + CANCEL_HINT)
    case 'company':
      return send(cfg, chatId, head('Kompaniya (yoki ish beruvchi) nomi?') + CANCEL_HINT)
    case 'city':
      return send(cfg, chatId, head('Qaysi shaharda? Tanlang yoki yozing.'), { inline_keyboard: rows(CITIES.map((c, i) => btn(c, `pj:c:${i}`)), 3) })
    case 'district':
      return send(cfg, chatId, head("Tuman yoki mo'ljal?\n\nMasalan: <i>Chilonzor</i>, <i>Usta Shirin</i>"), { inline_keyboard: SKIP })
    case 'category':
      return send(cfg, chatId, head('Soha?'), { inline_keyboard: rows(CATEGORIES.map((c) => btn(c.name, `pj:k:${c.id}`)), 2) })
    case 'salary':
      return send(cfg, chatId, head("Maosh (so'mda)?\n\nMasalan: <i>5 000 000</i>, <i>4-6 mln</i>"), { inline_keyboard: [[btn('🤝 Kelishilgan', 'pj:s0')]] })
    case 'phone':
      return send(cfg, chatId, head("Aloqa uchun telefon raqami?\n\nPastdagi tugmani bosing yoki yozing: <i>+998 90 123 45 67</i>"), {
        keyboard: [[{ text: '📱 Raqamimni yuborish', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true,
      })
    case 'description':
      return send(cfg, chatId, head("Qisqacha tavsif: vazifalar, ish vaqti, talablar (ixtiyoriy)."), { inline_keyboard: SKIP })
    case 'confirm': {
      const preview = jobPostHtml(draftAsJob(d), { jobFooter: '' })
      const extra = d.description ? `\n\n<i>${esc(d.description.slice(0, 300))}${d.description.length > 300 ? '…' : ''}</i>` : ''
      await send(cfg, chatId, '👀 <b>Kanalda shunday ko\'rinadi:</b>', { remove_keyboard: true })
      return send(cfg, chatId, preview + extra, { inline_keyboard: [[btn('✅ Joylash', 'pj:ok')], [btn('✏️ Qaytadan', 'pj:new'), btn('❌ Bekor qilish', 'pj:no')]] })
    }
  }
}

export async function startJobDraft(cfg: TelegramConfig, chatId: number, tgId: string) {
  const draft: JobDraft = { step: 'title' }
  await saveDraft(tgId, draft)
  await send(cfg, chatId, `📢 <b>Vakansiya joylash</b>\n\n${TOTAL} ta qisqa savol — 1 daqiqa. E'lon moderatsiyadan so'ng kanal(lar)da va saytda chiqadi.`, { remove_keyboard: true })
  return ask(cfg, chatId, draft)
}

export async function cancelJobDraft(cfg: TelegramConfig, chatId: number, tgId: string) {
  await saveDraft(tgId, null)
  return send(cfg, chatId, "❌ E'lon bekor qilindi. Qaytadan: /post", { remove_keyboard: true })
}

const clip = (s: string, n: number) => s.replace(/\s+/g, ' ').trim().slice(0, n)

/** Qoralama bosqichidagi matn yoki kontakt. true — xabar shu oqimda qayta ishlandi */
export async function onDraftMessage(cfg: TelegramConfig, msg: TgMessage, tgId: string, draft: JobDraft): Promise<boolean> {
  const chatId = msg.chat.id
  const text = msg.text?.trim() || ''
  const d: JobDraft = { ...draft }
  const err = (t: string) => send(cfg, chatId, `⚠️ ${t}`).then(() => true)

  switch (d.step) {
    case 'title':
      if (text.length < 3) return err('Lavozim nomini kamida 3 harf bilan yozing.')
      d.title = clip(text, 120)
      break
    case 'company':
      if (text.length < 2) return err('Kompaniya nomini yozing.')
      d.company = clip(text, 120)
      break
    case 'city': {
      if (!text) return err("Shaharni tanlang yoki yozing.")
      d.city = CITIES.find((c) => c.toLowerCase() === text.toLowerCase()) || clip(text, 60)
      break
    }
    case 'district':
      d.district = text ? clip(text, 80) : undefined
      break
    case 'category': {
      const c = CATEGORIES.find((x) => x.name.toLowerCase() === text.toLowerCase())
      if (!c) return err('Sohani tugmalardan tanlang.')
      d.category = c.id
      break
    }
    case 'salary': {
      const s = parseSalary(text)
      if (!s) return err("Maoshni tushunmadim. Masalan: 5 000 000 yoki 4-6 mln. Yoki «Kelishilgan» tugmasini bosing.")
      d.salaryFrom = s.from
      d.salaryTo = s.to
      break
    }
    case 'phone': {
      const raw = msg.contact?.phone_number || text
      const phone = normalizeUzPhone(raw)
      if (!phone) return err("Raqam noto'g'ri. O'zbekiston raqamini yozing: +998 90 123 45 67")
      d.phone = phone
      d.contactName = clip([msg.contact?.first_name || msg.from?.first_name, msg.contact?.last_name || msg.from?.last_name].filter(Boolean).join(' '), 80)
      break
    }
    case 'description':
      d.description = text.slice(0, 2000)
      break
    case 'confirm':
      return err("Pastdagi «✅ Joylash» yoki «❌ Bekor qilish» tugmasini bosing.")
  }
  d.step = nextStep(d.step)
  await saveDraft(tgId, d)
  await ask(cfg, chatId, d)
  return true
}

/** pj:* tugmalari. Boshqa callback bo'lsa — false */
export async function onDraftCallback(cfg: TelegramConfig, from: TgUser, chatId: number, data: string, messageId?: number): Promise<boolean> {
  if (!data.startsWith('pj:')) return false
  const tgId = String(from.id)
  // bosilgan tugmalar olib tashlanadi — qayta bosib bo'lmasin
  if (messageId) await tg(cfg.token, 'editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }).catch(() => {})

  if (data === 'pj:new') return startJobDraft(cfg, chatId, tgId).then(() => true)
  if (data === 'pj:no') return cancelJobDraft(cfg, chatId, tgId).then(() => true)

  const tu = await db.telegramUser.findUnique({ where: { id: tgId } })
  const d = (tu?.draft as JobDraft | null) || null
  if (!d) return send(cfg, chatId, "Bu e'lon eskirgan. Yangisini boshlash: /post").then(() => true)

  if (data === 'pj:ok' && d.step === 'confirm') return submitDraft(cfg, chatId, from, d).then(() => true)
  if (data === 'pj:skip' && (d.step === 'district' || d.step === 'description')) {
    d.step = nextStep(d.step)
  } else if (data.startsWith('pj:c:') && d.step === 'city') {
    const city = CITIES[Number(data.slice(5))]
    if (!city) return true
    d.city = city
    d.step = nextStep(d.step)
  } else if (data.startsWith('pj:k:') && d.step === 'category') {
    const id = data.slice(5)
    if (!CATEGORIES.some((c) => c.id === id)) return true
    d.category = id
    d.step = nextStep(d.step)
  } else if (data === 'pj:s0' && d.step === 'salary') {
    d.salaryFrom = 0
    d.salaryTo = 0
    d.step = nextStep(d.step)
  } else {
    return true // eski xabardagi tugma — e'tiborsiz
  }
  await saveDraft(tgId, d)
  await ask(cfg, chatId, d)
  return true
}

// Telegram foydalanuvchisini platforma hisobiga bog'laydi (yo'q bo'lsa — ish beruvchi hisobi yaratiladi)
async function ensureAuthor(from: TgUser, d: JobDraft) {
  const tu = await db.telegramUser.findUniqueOrThrow({ where: { id: String(from.id) } })
  if (tu.userId) return db.user.findUniqueOrThrow({ where: { id: tu.userId } })
  const byPhone = d.phone ? await db.user.findUnique({ where: { phone: d.phone } }) : null
  // Raqam bo'yicha mavjud hisobga avtomatik bog'lanmaydi (raqam tasdiqlanmagan) — alohida hisob yaratiladi
  const user = await db.user.create({
    data: {
      name: clip([from.first_name, from.last_name].filter(Boolean).join(' '), 80) || 'Telegram foydalanuvchi',
      role: 'EMPLOYER',
      company: d.company,
      phone: byPhone ? null : d.phone,
      city: d.city,
      profile: { source: 'telegram', telegram: from.username ? '@' + from.username : '' },
    },
  })
  await db.telegramUser.update({ where: { id: tu.id }, data: { userId: user.id } })
  return user
}

async function submitDraft(cfg: TelegramConfig, chatId: number, from: TgUser, d: JobDraft) {
  if (!d.title || !d.company || !d.city || !d.category || !d.phone) return startJobDraft(cfg, chatId, String(from.id))
  const user = await ensureAuthor(from, d)
  if (user.status === 'BLOCKED') return send(cfg, chatId, 'Hisobingiz bloklangan.')
  const recent = await db.job.count({ where: { authorId: user.id, createdAt: { gt: new Date(Date.now() - 86400_000) } } })
  if (recent >= DAILY_LIMIT) return send(cfg, chatId, `Bir kunda ${DAILY_LIMIT} tadan ortiq e'lon joylab bo'lmaydi. Ertaga urinib ko'ring.`)

  const app = await db.setting.findUnique({ where: { key: 'app' } })
  const moderation = (app?.value as { jobModeration?: boolean } | null)?.jobModeration ?? process.env.JOB_MODERATION !== 'false'
  const now = new Date()
  const job = await db.job.create({
    data: {
      title: d.title,
      companyName: d.company,
      category: d.category,
      city: d.city,
      district: d.district,
      salaryFrom: d.salaryFrom || 0,
      salaryTo: d.salaryTo || 0,
      type: "To'liq stavka",
      description: d.description || '',
      tags: [], skills: [], requirements: [], conditions: [],
      details: { contact: { name: d.contactName || user.name, phone: formatUzPhone(d.phone), telegram: from.username ? '@' + from.username : '' } },
      status: moderation ? 'PENDING' : 'ACTIVE',
      publishedAt: moderation ? null : now,
      expiresAt: new Date(now.getTime() + 30 * 86400_000),
      source: 'BOT',
      authorId: user.id,
    },
  })
  await saveDraft(String(from.id), null)
  if (job.status === 'ACTIVE') {
    const r = await autoPostJob(job.id)
    return send(cfg, chatId, `✅ <b>E'lon joylandi!</b>${r.sent ? `\n\n${r.sent} ta kanalga yuborildi.` : ''}\n\nYana bittasi: /post`)
  }
  return send(cfg, chatId, `✅ <b>E'lon qabul qilindi!</b>\n\n«${esc(job.title)}» (${esc(catName(job.category))}) moderatsiyaga yuborildi. Tasdiqlangach kanal(lar)da va saytda chiqadi — sizga shu yerda xabar beramiz.\n\nYana bittasi: /post`)
}
