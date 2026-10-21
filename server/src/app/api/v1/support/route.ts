import { db } from '@/lib/db'
import { requireApiUser } from '@/lib/auth'
import { api, body, json } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { getSettings } from '@/lib/settings'
import { supportSchema } from '@/lib/validators'

const msgOut = (m: { id: string; from: string; text: string; createdAt: Date }) => ({
  id: m.id, from: m.from === 'USER' ? 'me' : 'bot', operator: m.from === 'ADMIN', text: m.text, time: m.createdAt.toISOString(),
})

// Foydalanuvchining so'nggi murojaati va undagi xabarlar (operator javoblari ham)
export const GET = api(async (req) => {
  const user = await requireApiUser(req)
  const ticket = await db.supportTicket.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 200 } },
  })
  return json({ ticket: ticket && { id: ticket.id, status: ticket.status }, messages: ticket?.messages.map(msgOut) || [] })
})

// Xabar yuborish: ochiq murojaat bo'lsa unga qo'shiladi, aks holda yangisi ochiladi
export const POST = api(async (req) => {
  const user = await requireApiUser(req)
  rateLimit(`support:${user.id}`, 30, 60 * 60_000)
  const { text } = await body(req, supportSchema)
  const open = await db.supportTicket.findFirst({ where: { userId: user.id, status: { not: 'CLOSED' } }, orderBy: { updatedAt: 'desc' } })
  const ticketId = open
    ? (await db.supportTicket.update({ where: { id: open.id }, data: { status: 'OPEN' } })).id
    : (await db.supportTicket.create({ data: { userId: user.id } })).id
  const msg = await db.supportMessage.create({ data: { ticketId, from: 'USER', authorId: user.id, text } })
  // yangi murojaatga avtomatik javob (matni admin paneldagi Sozlamalardan)
  const reply = open ? null : await db.supportMessage.create({ data: { ticketId, from: 'BOT', text: (await getSettings()).supportGreeting } })
  return json({ message: msgOut(msg), reply: reply && msgOut(reply) }, 201)
})
