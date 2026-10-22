import { z } from 'zod'
import { db } from '@/lib/db'
import { ApiError, api, body, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { requireBotKey } from '@/lib/bot-auth'
import { adTitle, adWarnings, cleanFields, templateById } from '@/lib/ad-templates'
import { siteUrl } from '@/lib/login-bot'
import { publicOrigin } from '@/lib/media'

const input = z.object({
  template: z.string().max(40),
  fields: z.record(z.string(), z.string().max(3000)),
  user: z.object({
    id: z.coerce.string().regex(/^\d{3,20}$/),
    username: z.string().max(64).nullish(),
    name: z.string().trim().max(120).default(''),
    phone: z.string().max(30).nullish(),
    lang: z.enum(['uz', 'ru']).default('uz'),
  }),
})

const STATUS = { PENDING: 'pending', PUBLISHED: 'published', REJECTED: 'rejected' } as const

// Botdan yangi e'lon → admin panelda moderatsiya navbati
export const POST = api(async (req) => {
  requireBotKey(req)
  const { template, fields: raw, user } = await body(req, input)
  rateLimit(`bot-ad:${user.id}`, 10, 24 * 3600_000) // bir foydalanuvchi — kuniga 10 ta e'lon
  const tpl = templateById(template)
  if (!tpl) throw new ApiError(400, 'bad_template', 'Bunday shablon yo\'q')
  const { fields, errors } = cleanFields(tpl, raw)
  if (Object.keys(errors).length) return json({ error: { code: 'validation', message: "Ma'lumotlar noto'g'ri", fields: errors } }, 400)

  // bir xil e'lonni ketma-ket ikki marta yuborishdan himoya (tugma ikki bosilsa)
  const dup = await db.ad.findFirst({ where: { tgUserId: user.id, template, status: 'PENDING', createdAt: { gt: new Date(Date.now() - 10 * 60_000) } }, orderBy: { createdAt: 'desc' } })
  // jsonb kalitlar tartibini o'zgartiradi — solishtirish tartiblangan kalitlar bo'yicha
  const canon = (o: unknown) => JSON.stringify(Object.entries((o || {}) as Record<string, string>).sort(([x], [y]) => x.localeCompare(y)))
  if (dup && canon(dup.fields) === canon(fields)) return json({ id: dup.id, number: dup.number, duplicate: true })

  const ad = await db.ad.create({
    data: {
      template, fields, warnings: adWarnings(fields), tgUserId: user.id, tgUsername: user.username || null,
      authorName: user.name || (user.username ? '@' + user.username : `ID ${user.id}`), authorPhone: user.phone || null, lang: user.lang,
    },
  })
  const admin = publicOrigin(req)
  return json({ id: ad.id, number: ad.number, title: adTitle(tpl, fields), warnings: ad.warnings, adminUrl: admin ? `${admin}/admin/ads/${ad.id}` : '', site: siteUrl() }, 201)
})

// Foydalanuvchining e'lonlari (botdagi «Mening e'lonlarim»): ?tgUserId=
export const GET = api(async (req) => {
  requireBotKey(req)
  const tgUserId = new URL(req.url).searchParams.get('tgUserId') || ''
  if (!/^\d{3,20}$/.test(tgUserId)) throw new ApiError(400, 'validation', 'tgUserId kerak')
  const ads = await db.ad.findMany({ where: { tgUserId }, orderBy: { createdAt: 'desc' }, take: 20, include: { posts: { where: { status: 'SENT' }, include: { channel: true } } } })
  return json({
    items: ads.map((a) => {
      const tpl = templateById(a.template)
      return {
        id: a.id, number: a.number, template: a.template, title: tpl ? adTitle(tpl, a.fields as Record<string, string>) : a.template,
        status: STATUS[a.status], rejectReason: a.rejectReason, createdAt: a.createdAt.toISOString(),
        links: a.posts.map((p) => (p.channel.username && p.messageId ? `https://t.me/${p.channel.username}/${p.messageId}` : null)).filter(Boolean),
      }
    }),
  })
})
