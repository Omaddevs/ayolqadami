// Bildirishnomalar: saytdagi «Bildirishnomalar» bo'limi va (admin tanlasa) botlar orqali tarqatish
import type { Prisma, Role, User } from '@prisma/client'
import { db } from './db'
import { siteUrl } from './login-bot'
import { getTelegramConfig } from './telegram/config'
import { esc } from './telegram/format'
import { startBroadcast, type BroadcastBot } from './telegram/service'

export type SiteAudience = 'ALL' | 'SEEKER' | 'EMPLOYER'

const appUsers = (aud: SiteAudience): Prisma.UserWhereInput => ({
  status: 'ACTIVE',
  role: aud === 'ALL' ? { in: ['SEEKER', 'EMPLOYER'] } : aud,
})

export const siteAudienceCount = (aud: SiteAudience) => db.user.count({ where: appUsers(aud) })

// Foydalanuvchiga ko'rinadigan bildirishnomalar: shaxsiylari va ro'yxatdan o'tgandan keyin yuborilgan umumiylari
const feedWhere = (user: Pick<User, 'id' | 'role' | 'createdAt'>): Prisma.NotificationWhereInput => ({
  site: true,
  OR: [
    { userId: user.id },
    { userId: null, createdAt: { gte: user.createdAt }, OR: [{ role: null }, { role: user.role }] },
  ],
})

export async function userFeed(user: Pick<User, 'id' | 'role' | 'createdAt' | 'notifReadAt'>, take = 50) {
  const where = feedWhere(user)
  const [items, unread] = await Promise.all([
    db.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take }),
    db.notification.count({ where: user.notifReadAt ? { AND: [where, { createdAt: { gt: user.notifReadAt } }] } : where }),
  ])
  return {
    unread,
    items: items.map((n) => ({
      id: n.id, title: n.title, body: n.body, link: n.link, time: n.createdAt.toISOString(),
      read: Boolean(user.notifReadAt && n.createdAt <= user.notifReadAt),
    })),
  }
}

// Bitta foydalanuvchiga shaxsiy bildirishnoma (masalan, ariza holati o'zgarganda)
export const notifySite = (userId: string, input: { title: string; body?: string; link?: string }) =>
  db.notification.create({ data: { userId, title: input.title, body: input.body || '', link: input.link || '', siteTotal: 1 } })

// Telegram tugmasi uchun to'liq https manzil: /jobs → https://sayt.uz/jobs
async function absoluteLink(link: string) {
  if (/^https:\/\//.test(link)) return link
  if (!link.startsWith('/')) return ''
  const base = ((await getTelegramConfig()).webAppUrl || siteUrl()).replace(/\/$/, '')
  return /^https:\/\//.test(base) ? base + link : ''
}

export const telegramText = (title: string, body: string) => [`🔔 <b>${esc(title)}</b>`, body && esc(body)].filter(Boolean).join('\n\n')

export async function sendNotification(input: {
  title: string; body: string; link: string; photo?: string
  site: SiteAudience | null // null — saytga yuborilmaydi
  bots: BroadcastBot[]
  buttonText?: string
  authorId: string
}) {
  const role: Role | null = input.site && input.site !== 'ALL' ? input.site : null
  const siteTotal = input.site ? await siteAudienceCount(input.site) : 0
  const n = await db.notification.create({
    data: { title: input.title, body: input.body, link: input.link, role, site: Boolean(input.site), siteTotal, authorId: input.authorId },
  })
  const url = input.link ? await absoluteLink(input.link) : ''
  const buttons = url ? `${input.buttonText || '🔗 Batafsil'} | ${url}` : null
  const broadcasts: { bot: BroadcastBot; total?: number; error?: string }[] = []
  for (const bot of input.bots) {
    try {
      const b = await startBroadcast({ text: telegramText(input.title, input.body), photo: input.photo || null, buttons, authorId: input.authorId, bot, notificationId: n.id })
      broadcasts.push({ bot, total: b.total })
    } catch (e) {
      broadcasts.push({ bot, error: (e as Error).message })
    }
  }
  return { notification: n, siteTotal, broadcasts }
}
