import Link from 'next/link'
import type { Prisma, TicketStatus } from '@prisma/client'
import { Bot, CheckCircle2, Headset, RotateCcw, Send } from 'lucide-react'
import { db } from '@/lib/db'
import { ROLE, TICKET_STATUS } from '@/lib/catalog'
import { dateTime, timeAgo } from '@/lib/format'
import { formatUzPhone } from '@/lib/phone'
import { Avatar, Badge, Card, Empty, PageHead, Tabs, qs, sp, type SearchParams } from '@/components/ui'
import { Submit } from '@/components/client'
import { replyTicket, setTicketStatus } from '../actions'

export const metadata = { title: 'Murojaatlar' }

export default async function SupportPage({ searchParams }: { searchParams: SearchParams }) {
  const p = await searchParams
  // sukut: javob kutayotganlar; ALL — hammasi (foydalanuvchi bo'yicha ochilganda ham hammasi)
  const raw = sp(p.status) || (sp(p.user) ? 'ALL' : 'OPEN')
  const status = raw === 'ALL' ? '' : raw
  const userId = sp(p.user)
  const selected = sp(p.t)

  const where: Prisma.SupportTicketWhereInput = { ...(status && { status: status as TicketStatus }), ...(userId && { userId }) }
  const [tickets, counts] = await Promise.all([
    db.supportTicket.findMany({
      where, orderBy: { updatedAt: 'desc' }, take: 50,
      include: { user: { select: { name: true, photo: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    }),
    db.supportTicket.groupBy({ by: ['status'], _count: true }),
  ])
  const activeId = selected || tickets[0]?.id
  const ticket = activeId
    ? await db.supportTicket.findUnique({
        where: { id: activeId },
        include: { user: true, messages: { orderBy: { createdAt: 'asc' } } },
      })
    : null
  const n = (s: string) => counts.find((c) => c.status === s)?._count ?? 0
  const link = (o: Record<string, string | undefined>) => `/admin/support${qs({ status: raw, user: userId, ...o })}`

  return (
    <>
      <PageHead title="Murojaatlar" sub="Foydalanuvchilarning texnik yordam xabarlari" />
      <Tabs
        active={raw}
        items={[
          ...Object.entries(TICKET_STATUS).map(([k, v]) => ({ key: k, label: v.label, href: link({ status: k, t: undefined }), n: n(k) })),
          { key: 'ALL', label: 'Hammasi', href: link({ status: 'ALL', t: undefined }), n: counts.reduce((a, c) => a + c._count, 0) },
        ]}
      />
      <div style={{ height: 12 }} />
      <div className="grid g-support">
        <Card>
          {tickets.length === 0 ? <Empty title="Murojaat yo'q">Bu bo&apos;limda hozircha murojaat yo&apos;q</Empty> : (
            <div className="ticket-list">
              {tickets.map((t) => (
                <Link key={t.id} href={link({ t: t.id })} className={t.id === activeId ? 'active' : ''}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Avatar name={t.user.name} src={t.user.photo} size={30} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <b style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.user.name}</b>
                        <small style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{timeAgo(t.updatedAt)}</small>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.messages[0]?.text || '—'}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="thread">
          {!ticket ? <Empty title="Murojaatni tanlang" /> : (
            <>
              <div className="card-h">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Avatar name={ticket.user.name} src={ticket.user.photo} />
                  <div>
                    <Link href={`/admin/users/${ticket.user.id}`} style={{ fontWeight: 600 }}>{ticket.user.name}</Link>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{ROLE[ticket.user.role].label} · {formatUzPhone(ticket.user.phone)} · {dateTime(ticket.createdAt)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge tone={TICKET_STATUS[ticket.status].tone}>{TICKET_STATUS[ticket.status].label}</Badge>
                  <form action={setTicketStatus}>
                    <input type="hidden" name="id" value={ticket.id} />
                    {ticket.status === 'CLOSED'
                      ? <Submit className="btn sm" name="status" value="OPEN"><RotateCcw size={14} /> Qayta ochish</Submit>
                      : <Submit className="btn sm" name="status" value="CLOSED"><CheckCircle2 size={14} /> Yopish</Submit>}
                  </form>
                </div>
              </div>
              <div className="chat" aria-live="polite">
                {ticket.messages.map((m) => {
                  const mine = m.from !== 'USER'
                  return (
                    <div key={m.id} className={`msg-row${mine ? ' out' : ''}`}>
                      {m.from === 'USER'
                        ? <Avatar name={ticket.user.name} src={ticket.user.photo} size={28} />
                        : <span className={`msg-ava ${m.from === 'BOT' ? 'is-bot' : 'is-admin'}`} aria-hidden="true">{m.from === 'BOT' ? <Bot size={15} /> : <Headset size={15} />}</span>}
                      <div className="msg-col">
                        <div className={`msg msg-${m.from.toLowerCase()}`}>{m.text}</div>
                        <small className="msg-meta">{m.from === 'ADMIN' ? 'Operator' : m.from === 'BOT' ? 'Avtomatik javob' : ticket.user.name} · {dateTime(m.createdAt)}</small>
                      </div>
                    </div>
                  )
                })}
              </div>
              <form action={replyTicket} className="composer">
                <input type="hidden" name="id" value={ticket.id} />
                <textarea className="textarea" name="text" required maxLength={2000} placeholder="Javob yozing…" rows={2} aria-label="Javob matni" />
                <Submit className="btn dark" title="Yuborish"><Send size={15} /> Yuborish</Submit>
              </form>
            </>
          )}
        </Card>
      </div>
    </>
  )
}
