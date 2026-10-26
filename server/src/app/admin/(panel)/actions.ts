'use server'
// Admin panel amallari. Har bir amal: ruxsat → validatsiya → o'zgarish → jurnal → sahifani yangilash.
// Server action'lar Next.js tomonidan Origin tekshiruvi bilan CSRF'dan himoyalangan.
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { hashPassword, requireAdmin, setAdminCookie, verifyPassword } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { saveSettings as persistSettings } from '@/lib/settings'
import { endOfDayTashkent, startOfDayTashkent } from '@/lib/dates'
import { splitCategoryChoice } from '@/lib/categories'
import { autoPostJob, notifyUser } from '@/lib/telegram/service'
import { esc } from '@/lib/telegram/format'

export type FormState = { error?: string; ok?: string }

const id = z.string().min(1).max(64)
const getId = (f: FormData) => id.parse(f.get('id'))
const text = (f: FormData, k: string) => String(f.get(k) ?? '').trim()
const lines = (s: string) => s.split('\n').map((x) => x.replace(/^[-•*\s]+/, '').trim()).filter(Boolean)
const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)
const firstError = (e: z.ZodError) => {
  const i = e.issues[0]
  return i ? `${i.path.join('.') || 'Maydon'}: ${i.message}` : "Ma'lumotlar noto'g'ri"
}

// ================= Vakansiyalar =================

export async function approveJob(f: FormData) {
  const admin = await requireAdmin()
  const jobId = getId(f)
  const prev = await db.job.findUniqueOrThrow({ where: { id: jobId }, select: { expiresAt: true, authorId: true, title: true, status: true } })
  const now = new Date()
  // muddati o'tib ketgan vakansiya tasdiqlansa — saytda ko'rinmay qolmasin: 30 kunga uzaytiriladi
  const expiresAt = !prev.expiresAt || prev.expiresAt <= now ? new Date(now.getTime() + 30 * 86400_000) : prev.expiresAt
  await db.job.update({ where: { id: jobId }, data: { status: 'ACTIVE', rejectReason: null, publishedAt: now, expiresAt } })
  await audit(admin.id, 'job.approve', 'job', jobId)
  await autoPostJob(jobId) // Telegram kanallariga (yoqilgan bo'lsa)
  // muallif botdan foydalansa — tasdiqlangani haqida xabar
  if (prev.authorId && prev.status === 'PENDING') {
    await notifyUser(prev.authorId, `✅ «${esc(prev.title)}» vakansiyangiz tasdiqlandi va e'lon qilindi.`)
  }
  revalidatePath('/admin', 'layout')
}

export async function rejectJob(f: FormData) {
  const admin = await requireAdmin()
  const jobId = getId(f)
  const reason = text(f, 'reason').slice(0, 500) || "Platforma qoidalariga mos emas"
  const job = await db.job.update({ where: { id: jobId }, data: { status: 'REJECTED', rejectReason: reason } })
  await audit(admin.id, 'job.reject', 'job', jobId, { reason })
  if (job.authorId) await notifyUser(job.authorId, `❌ «${esc(job.title)}» vakansiyangiz rad etildi.\n\nSabab: ${esc(reason)}\n\nTuzatib qayta joylash: /post`)
  revalidatePath('/admin', 'layout')
}

export async function archiveJob(f: FormData) {
  const admin = await requireAdmin()
  const jobId = getId(f)
  await db.job.update({ where: { id: jobId }, data: { status: 'ARCHIVED' } })
  await audit(admin.id, 'job.archive', 'job', jobId)
  revalidatePath('/admin', 'layout')
}

export async function deleteJob(f: FormData) {
  const admin = await requireAdmin(['ADMIN'])
  const jobId = getId(f)
  const job = await db.job.delete({ where: { id: jobId } })
  await audit(admin.id, 'job.delete', 'job', jobId, { title: job.title })
  revalidatePath('/admin', 'layout')
  redirect('/admin/jobs')
}

const jobForm = z.object({
  title: z.string().trim().min(3, 'kamida 3 belgi').max(120),
  companyName: z.string().trim().min(2, 'kompaniya nomini kiriting').max(120),
  category: z.string().min(1, 'sohani tanlang').max(81), // «it» yoki «it/frontend» (soha/bo'lim)
  city: z.string().min(1, 'shaharni tanlang').max(60),
  type: z.string().min(1).max(40),
  salaryFrom: z.coerce.number().int().min(0).max(2_000_000_000),
  salaryTo: z.coerce.number().int().min(0).max(2_000_000_000),
  experience: z.coerce.number().int().min(0).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'rang #RRGGBB formatida'),
  description: z.string().trim().max(5000),
  status: z.enum(['PENDING', 'ACTIVE', 'REJECTED', 'ARCHIVED']),
  expiresAt: z.string().max(20),
})

export async function saveJob(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const parsed = jobForm.safeParse(Object.fromEntries(f))
  if (!parsed.success) return { error: firstError(parsed.error) }
  const v = parsed.data
  if (v.salaryTo && v.salaryFrom > v.salaryTo) return { error: "Maosh: «dan» qiymati «gacha»dan katta bo'lmasligi kerak" }

  const jobId = text(f, 'id')
  const company = await db.company.findUnique({ where: { name: v.companyName }, select: { id: true } })
  const data = {
    title: v.title, companyName: v.companyName, companyId: company?.id ?? null, ...splitCategoryChoice(v.category), city: v.city, type: v.type,
    salaryFrom: v.salaryFrom, salaryTo: v.salaryTo, experience: v.experience, color: v.color, description: v.description, status: v.status,
    skills: list(text(f, 'skills')).slice(0, 30), tags: list(text(f, 'tags')).slice(0, 20),
    requirements: lines(text(f, 'requirements')).slice(0, 30), conditions: lines(text(f, 'conditions')).slice(0, 30),
    expiresAt: v.expiresAt ? endOfDayTashkent(v.expiresAt) : null,
  }
  if (v.status === 'ACTIVE' && data.expiresAt && data.expiresAt <= new Date()) {
    return { error: "Faol vakansiyaning amal qilish muddati o'tgan sana bo'lishi mumkin emas" }
  }
  if (jobId) {
    const prev = await db.job.findUnique({ where: { id: jobId }, select: { status: true, publishedAt: true } })
    if (!prev) return { error: 'Vakansiya topilmadi' }
    await db.job.update({
      where: { id: jobId },
      data: { ...data, ...(v.status === 'ACTIVE' && !prev.publishedAt && { publishedAt: new Date() }) },
    })
    await audit(admin.id, 'job.update', 'job', jobId)
    if (v.status === 'ACTIVE' && prev.status !== 'ACTIVE') await autoPostJob(jobId)
  } else {
    const job = await db.job.create({ data: { ...data, source: 'ADMIN', authorId: null, publishedAt: v.status === 'ACTIVE' ? new Date() : null } })
    await audit(admin.id, 'job.create', 'job', job.id, { title: job.title })
    if (job.status === 'ACTIVE') await autoPostJob(job.id)
  }
  revalidatePath('/admin', 'layout')
  redirect('/admin/jobs?saved=1')
}

// ================= Foydalanuvchilar =================

async function guardTarget(targetId: string, adminId: string, adminRole: string) {
  const target = await db.user.findUnique({ where: { id: targetId } })
  if (!target) throw new Error('Foydalanuvchi topilmadi')
  if (target.id === adminId) throw new Error("O'z hisobingizga bu amalni qo'llab bo'lmaydi")
  // moderator administrator/moderatorlarni boshqara olmaydi
  if (adminRole !== 'ADMIN' && (target.role === 'ADMIN' || target.role === 'MODERATOR')) throw new Error("Ruxsat yo'q")
  return target
}

export async function blockUser(f: FormData) {
  const admin = await requireAdmin()
  const t = await guardTarget(getId(f), admin.id, admin.role)
  // tokenVersion oshiriladi — foydalanuvchining barcha sessiyalari darhol bekor bo'ladi
  await db.user.update({ where: { id: t.id }, data: { status: 'BLOCKED', tokenVersion: { increment: 1 } } })
  await audit(admin.id, 'user.block', 'user', t.id, { name: t.name })
  revalidatePath('/admin', 'layout')
}

export async function unblockUser(f: FormData) {
  const admin = await requireAdmin()
  const t = await guardTarget(getId(f), admin.id, admin.role)
  await db.user.update({ where: { id: t.id }, data: { status: 'ACTIVE' } })
  await audit(admin.id, 'user.unblock', 'user', t.id, { name: t.name })
  revalidatePath('/admin', 'layout')
}

export async function revokeSessions(f: FormData) {
  const admin = await requireAdmin()
  const t = await guardTarget(getId(f), admin.id, admin.role)
  await db.user.update({ where: { id: t.id }, data: { tokenVersion: { increment: 1 } } })
  await audit(admin.id, 'user.revoke_sessions', 'user', t.id)
  revalidatePath(`/admin/users/${t.id}`)
}

export async function setUserRole(f: FormData) {
  const admin = await requireAdmin(['ADMIN'])
  const t = await guardTarget(getId(f), admin.id, admin.role)
  const role = z.enum(['SEEKER', 'EMPLOYER', 'MODERATOR', 'ADMIN']).parse(f.get('role'))
  await db.user.update({ where: { id: t.id }, data: { role, tokenVersion: { increment: 1 } } })
  await audit(admin.id, 'user.role', 'user', t.id, { from: t.role, to: role })
  revalidatePath('/admin', 'layout')
}

export async function deleteUser(f: FormData) {
  const admin = await requireAdmin(['ADMIN'])
  const t = await guardTarget(getId(f), admin.id, admin.role)
  await db.user.delete({ where: { id: t.id } })
  await audit(admin.id, 'user.delete', 'user', t.id, { name: t.name, phone: t.phone })
  revalidatePath('/admin', 'layout')
  redirect('/admin/users')
}

// ================= Arizalar =================

export async function setApplicationStatus(f: FormData) {
  const admin = await requireAdmin()
  const appId = getId(f)
  const status = z.enum(['NEW', 'REVIEWING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']).parse(f.get('status'))
  await db.application.update({ where: { id: appId }, data: { status } })
  await audit(admin.id, 'application.status', 'application', appId, { status })
  revalidatePath('/admin', 'layout')
}

// ================= Murojaatlar =================

export async function replyTicket(f: FormData) {
  const admin = await requireAdmin()
  const ticketId = getId(f)
  const body = z.string().trim().min(1).max(2000).parse(f.get('text'))
  await db.$transaction([
    db.supportMessage.create({ data: { ticketId, from: 'ADMIN', authorId: admin.id, text: body } }),
    db.supportTicket.update({ where: { id: ticketId }, data: { status: 'ANSWERED' } }),
  ])
  await audit(admin.id, 'ticket.reply', 'ticket', ticketId)
  // murojaat bot orqali kelgan bo'lsa (yoki foydalanuvchi botga ulangan bo'lsa) — javob Telegramga ham yuboriladi
  const t = await db.supportTicket.findUnique({ where: { id: ticketId }, select: { userId: true } })
  if (t) await notifyUser(t.userId, `💬 <b>Operator javobi:</b>

${esc(body)}`)
  revalidatePath('/admin', 'layout')
}

export async function setTicketStatus(f: FormData) {
  const admin = await requireAdmin()
  const ticketId = getId(f)
  const status = z.enum(['OPEN', 'ANSWERED', 'CLOSED']).parse(f.get('status'))
  await db.supportTicket.update({ where: { id: ticketId }, data: { status } })
  await audit(admin.id, 'ticket.status', 'ticket', ticketId, { status })
  revalidatePath('/admin', 'layout')
}

// ================= Kurslar =================

const courseForm = z.object({
  title: z.string().trim().min(3).max(160),
  provider: z.string().trim().min(2).max(120),
  category: z.string().min(1).max(40),
  icon: z.string().trim().max(40),
  price: z.coerce.number().int().min(0).max(1_000_000_000),
  duration: z.string().trim().max(40),
  lessons: z.coerce.number().int().min(0).max(1000),
  level: z.string().trim().max(40),
  rating: z.coerce.number().min(0).max(5),
  students: z.coerce.number().int().min(0).max(10_000_000),
  format: z.string().trim().max(40),
  description: z.string().trim().max(4000),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  sort: z.coerce.number().int().min(0).max(10000),
})

export async function saveCourse(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const parsed = courseForm.safeParse(Object.fromEntries(f))
  if (!parsed.success) return { error: firstError(parsed.error) }
  const data = { ...parsed.data, icon: parsed.data.icon || 'cap', certificate: f.get('certificate') === 'on', modules: lines(text(f, 'modules')).slice(0, 40) }
  const courseId = text(f, 'id')
  if (courseId) {
    await db.course.update({ where: { id: courseId }, data })
    await audit(admin.id, 'course.update', 'course', courseId)
  } else {
    const c = await db.course.create({ data })
    await audit(admin.id, 'course.create', 'course', c.id, { title: c.title })
  }
  revalidatePath('/admin/courses')
  redirect('/admin/courses?saved=1')
}

export async function deleteCourse(f: FormData) {
  const admin = await requireAdmin(['ADMIN'])
  const courseId = getId(f)
  await db.course.delete({ where: { id: courseId } })
  await audit(admin.id, 'course.delete', 'course', courseId)
  revalidatePath('/admin/courses')
  redirect('/admin/courses')
}

// ================= Maqolalar =================
// Matn formati: "## Sarlavha", "- ro'yxat elementi", bo'sh qator bilan ajratilgan paragraflar

function parseArticleBody(src: string) {
  const blocks: ({ h: string } | { p: string } | { list: string[] })[] = []
  for (const chunk of src.replace(/\r/g, '').split(/\n{2,}/)) {
    const rows = chunk.split('\n').map((r) => r.trim()).filter(Boolean)
    if (!rows.length) continue
    if (rows.every((r) => /^[-•*]\s+/.test(r))) blocks.push({ list: rows.map((r) => r.replace(/^[-•*]\s+/, '')) })
    else if (rows.length === 1 && rows[0].startsWith('## ')) blocks.push({ h: rows[0].slice(3).trim() })
    else {
      for (const r of rows) {
        if (r.startsWith('## ')) blocks.push({ h: r.slice(3).trim() })
        else blocks.push({ p: r })
      }
    }
  }
  return blocks
}

const articleForm = z.object({
  title: z.string().trim().min(5).max(200),
  tag: z.string().trim().min(2).max(40),
  icon: z.string().trim().max(40),
  excerpt: z.string().trim().max(600),
  body: z.string().max(40_000),
  readMinutes: z.coerce.number().int().min(1).max(120),
  dateLabel: z.string().trim().max(40),
  coverFrom: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  coverTo: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  img: z.string().trim().max(500).refine((v) => !v || /^(\/|https:\/\/)/.test(v), "rasm manzili / yoki https:// bilan boshlanishi kerak"),
  status: z.enum(['DRAFT', 'PUBLISHED']),
})

export async function saveArticle(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const parsed = articleForm.safeParse(Object.fromEntries(f))
  if (!parsed.success) return { error: firstError(parsed.error) }
  const v = parsed.data
  const body = parseArticleBody(v.body)
  if (!body.length) return { error: "Maqola matni bo'sh" }
  const data = {
    title: v.title, tag: v.tag, icon: v.icon || 'resume', excerpt: v.excerpt, body: body as Prisma.InputJsonValue, readMinutes: v.readMinutes,
    dateLabel: v.dateLabel, cover: [v.coverFrom, v.coverTo], img: v.img || null, status: v.status,
  }
  const articleId = text(f, 'id')
  if (articleId) {
    const prev = await db.article.findUnique({ where: { id: articleId }, select: { publishedAt: true } })
    await db.article.update({ where: { id: articleId }, data: { ...data, ...(v.status === 'PUBLISHED' && !prev?.publishedAt && { publishedAt: new Date() }) } })
    await audit(admin.id, 'article.update', 'article', articleId)
  } else {
    const a = await db.article.create({ data: { ...data, publishedAt: v.status === 'PUBLISHED' ? new Date() : null } })
    await audit(admin.id, 'article.create', 'article', a.id, { title: a.title })
  }
  revalidatePath('/admin/articles')
  redirect('/admin/articles?saved=1')
}

export async function deleteArticle(f: FormData) {
  const admin = await requireAdmin(['ADMIN'])
  const articleId = getId(f)
  await db.article.delete({ where: { id: articleId } })
  await audit(admin.id, 'article.delete', 'article', articleId)
  revalidatePath('/admin/articles')
  redirect('/admin/articles')
}

// ================= Tadbirlar =================

const eventForm = z.object({
  title: z.string().trim().min(3).max(200),
  dateLabel: z.string().trim().min(1, 'sanani kiriting').max(60),
  startsAt: z.string().max(20),
  place: z.string().trim().max(160),
  tag: z.string().trim().max(40),
  description: z.string().trim().max(2000),
  coverFrom: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  coverTo: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  img: z.string().trim().max(500).refine((v) => !v || /^(\/|https:\/\/)/.test(v), "rasm manzili / yoki https:// bilan boshlanishi kerak"),
  status: z.enum(['DRAFT', 'PUBLISHED']),
})

export async function saveEvent(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const parsed = eventForm.safeParse(Object.fromEntries(f))
  if (!parsed.success) return { error: firstError(parsed.error) }
  const v = parsed.data
  const data = {
    title: v.title, dateLabel: v.dateLabel, startsAt: v.startsAt ? startOfDayTashkent(v.startsAt) : null, place: v.place, tag: v.tag,
    description: v.description, cover: [v.coverFrom, v.coverTo], img: v.img || null, status: v.status,
  }
  const eventId = text(f, 'id')
  if (eventId) {
    await db.event.update({ where: { id: eventId }, data })
    await audit(admin.id, 'event.update', 'event', eventId)
  } else {
    const e = await db.event.create({ data })
    await audit(admin.id, 'event.create', 'event', e.id, { title: e.title })
  }
  revalidatePath('/admin/events')
  redirect('/admin/events?saved=1')
}

export async function deleteEvent(f: FormData) {
  const admin = await requireAdmin(['ADMIN'])
  const eventId = getId(f)
  await db.event.delete({ where: { id: eventId } })
  await audit(admin.id, 'event.delete', 'event', eventId)
  revalidatePath('/admin/events')
  redirect('/admin/events')
}

// ================= Kompaniyalar =================

const companyForm = z.object({
  name: z.string().trim().min(2).max(120),
  about: z.string().trim().max(2000),
  size: z.string().trim().max(20),
  since: z.string().trim().max(4).refine((v) => !v || /^\d{4}$/.test(v), 'yil 4 xonali'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export async function saveCompany(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const parsed = companyForm.safeParse(Object.fromEntries(f))
  if (!parsed.success) return { error: firstError(parsed.error) }
  const v = parsed.data
  const data = { name: v.name, about: v.about, size: v.size || null, since: v.since ? Number(v.since) : null, color: v.color, verified: f.get('verified') === 'on' }
  const companyId = text(f, 'id')
  if (companyId) {
    const prev = await db.company.findUnique({ where: { id: companyId } })
    if (!prev) return { error: 'Kompaniya topilmadi' }
    await db.$transaction([
      db.company.update({ where: { id: companyId }, data }),
      // nom o'zgarsa — vakansiyalardagi nom ham yangilanadi
      ...(prev.name !== v.name ? [db.job.updateMany({ where: { companyName: prev.name }, data: { companyName: v.name } })] : []),
    ])
    await audit(admin.id, 'company.update', 'company', companyId)
  } else {
    const c = await db.company.create({ data })
    await db.job.updateMany({ where: { companyName: c.name, companyId: null }, data: { companyId: c.id } })
    await audit(admin.id, 'company.create', 'company', c.id, { name: c.name })
  }
  revalidatePath('/admin/companies')
  redirect('/admin/companies?saved=1')
}

export async function deleteCompany(f: FormData) {
  const admin = await requireAdmin(['ADMIN'])
  const companyId = getId(f)
  // vakansiyalar o'chmaydi — faqat kompaniya profiliga bog'lanish uziladi (onDelete: SetNull)
  const c = await db.company.delete({ where: { id: companyId } })
  await audit(admin.id, 'company.delete', 'company', companyId, { name: c.name })
  revalidatePath('/admin/companies')
  redirect('/admin/companies')
}

export async function toggleCompanyVerified(f: FormData) {
  const admin = await requireAdmin()
  const companyId = getId(f)
  const c = await db.company.findUniqueOrThrow({ where: { id: companyId } })
  await db.company.update({ where: { id: companyId }, data: { verified: !c.verified } })
  await audit(admin.id, c.verified ? 'company.unverify' : 'company.verify', 'company', companyId)
  revalidatePath('/admin/companies')
}

// ================= Sozlamalar =================

const settingsForm = z.object({
  supportGreeting: z.string().trim().max(500),
  goalUsers: z.coerce.number().int().min(1).max(100_000_000),
  goalJobs: z.coerce.number().int().min(1).max(10_000_000),
  goalHires: z.coerce.number().int().min(1).max(10_000_000),
})

export async function saveSettings(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin(['ADMIN'])
  const parsed = settingsForm.safeParse(Object.fromEntries(f))
  if (!parsed.success) return { error: firstError(parsed.error) }
  const v = parsed.data
  const next = await persistSettings({
    jobModeration: f.get('jobModeration') === 'on',
    registrationOpen: f.get('registrationOpen') === 'on',
    phoneVerification: f.get('phoneVerification') === 'on',
    supportGreeting: v.supportGreeting,
    goals: { users: v.goalUsers, jobs: v.goalJobs, hires: v.goalHires },
  })
  await audit(admin.id, 'settings.update', 'setting', 'app', next)
  revalidatePath('/admin', 'layout')
  return { ok: 'Sozlamalar saqlandi' }
}

const pwForm = z.object({
  current: z.string().min(1, 'joriy parolni kiriting').max(128),
  next: z.string().min(10, 'yangi parol kamida 10 belgi').max(128),
  confirm: z.string().max(128),
})

export async function changeOwnPassword(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const parsed = pwForm.safeParse(Object.fromEntries(f))
  if (!parsed.success) return { error: firstError(parsed.error) }
  const v = parsed.data
  if (v.next !== v.confirm) return { error: 'Yangi parollar mos emas' }
  if (!admin.passwordHash || !(await verifyPassword(v.current, admin.passwordHash))) return { error: "Joriy parol noto'g'ri" }
  const updated = await db.user.update({ where: { id: admin.id }, data: { passwordHash: await hashPassword(v.next), tokenVersion: { increment: 1 } } })
  await setAdminCookie(updated) // joriy sessiya davom etadi, boshqa qurilmalardagilari bekor bo'ladi
  await audit(admin.id, 'admin.password', 'user', admin.id)
  return { ok: 'Parol almashtirildi. Boshqa qurilmalardagi sessiyalar yopildi' }
}
