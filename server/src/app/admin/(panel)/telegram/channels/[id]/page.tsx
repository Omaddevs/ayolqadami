import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink, Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { CATEGORIES, CITIES } from '@/lib/catalog'
import { dateTime, formatSum, timeAgo } from '@/lib/format'
import { Badge, Card, Empty, PageHead } from '@/components/ui'
import { ActionForm } from '@/components/action-form'
import { Submit } from '@/components/client'
import { deleteChannel, saveChannel } from '../../actions'
import { POST_STATUS, plain, postLink } from '../../shared'

export const metadata = { title: 'Telegram kanal' }

export default async function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  const ch = await db.telegramChannel.findUnique({
    where: { id },
    include: { posts: { orderBy: { createdAt: 'desc' }, take: 30, include: { job: { select: { id: true, title: true } } } } },
  })
  if (!ch) notFound()
  const link = ch.username ? `https://t.me/${ch.username}` : null

  return (
    <>
      <PageHead title={ch.title} sub={`${ch.username ? '@' + ch.username : ch.chatId} · ${ch.type === 'channel' ? 'kanal' : 'guruh'}`}>
        {link && <a className="btn" href={link} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> Telegramda ochish</a>}
        {admin.role === 'ADMIN' && (
          <form action={deleteChannel}>
            <input type="hidden" name="id" value={ch.id} />
            <Submit className="btn danger" confirm="Kanal ro'yxatdan olib tashlanadi (kanalning o'zi va undagi postlar o'chmaydi). Davom etasizmi?"><Trash2 size={15} /> Olib tashlash</Submit>
          </form>
        )}
      </PageHead>
      <div className="grid g-side">
        <Card title="Sozlamalar">
          <ActionForm action={saveChannel}>
            <input type="hidden" name="id" value={ch.id} />
            <div className="grid" style={{ gap: 14 }}>
              <label className="check"><input type="checkbox" name="active" defaultChecked={ch.active} /> Faol — bu kanalga post yuboriladi</label>
              <label className="check"><input type="checkbox" name="autoPost" defaultChecked={ch.autoPost} /> Tasdiqlangan vakansiyalar avtomatik yuboriladi</label>
              <div>
                <div className="section-t" style={{ marginTop: 4 }}>Sohalar filtri</div>
                <p className="delta-note" style={{ margin: '0 0 8px' }}>Hech biri tanlanmasa — barcha sohalardagi vakansiyalar yuboriladi</p>
                <div className="check-grid">
                  {CATEGORIES.map((c) => (
                    <label key={c.id} className="check"><input type="checkbox" name="categories" value={c.id} defaultChecked={ch.categories.includes(c.id)} /> {c.name}</label>
                  ))}
                </div>
              </div>
              <div>
                <div className="section-t" style={{ marginTop: 4 }}>Shaharlar filtri</div>
                <p className="delta-note" style={{ margin: '0 0 8px' }}>Masalan, viloyat kanali uchun faqat o&apos;sha shahar</p>
                <div className="check-grid">
                  {CITIES.map((c) => (
                    <label key={c} className="check"><input type="checkbox" name="cities" value={c} defaultChecked={ch.cities.includes(c)} /> {c}</label>
                  ))}
                </div>
              </div>
            </div>
          </ActionForm>
        </Card>
        <div className="grid" style={{ alignContent: 'start' }}>
          <Card title="Ma'lumot">
            <dl className="kv">
              <dt>Chat ID</dt><dd style={{ fontFamily: 'ui-monospace, monospace' }}>{ch.chatId}</dd>
              <dt>A&apos;zolar</dt><dd>{ch.memberCount != null ? formatSum(ch.memberCount) : '—'}</dd>
              <dt>Holat</dt><dd>{ch.active ? <Badge tone="green">Faol</Badge> : <Badge tone="gray">O&apos;chiq</Badge>}</dd>
              <dt>Qo&apos;shilgan</dt><dd>{dateTime(ch.createdAt)}</dd>
              <dt>Oxirgi post</dt><dd>{ch.lastPostAt ? dateTime(ch.lastPostAt) : '—'}</dd>
            </dl>
          </Card>
          <Card title="So'nggi postlar">
            {ch.posts.length === 0 ? <Empty title="Post yo'q" /> : (
              <div className="rows">
                {ch.posts.map((po) => {
                  const href = postLink(ch.chatId, ch.username, po.messageId)
                  return (
                    <div key={po.id} className="row" style={{ gridTemplateColumns: '1fr auto' }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="t">{po.job ? <Link href={`/admin/jobs/${po.job.id}`}>{po.job.title}</Link> : plain(po.text, 50)}</div>
                        <div className="s">{timeAgo(po.createdAt)}{po.error ? ` · ${po.error}` : ''}</div>
                      </div>
                      {href && po.status === 'SENT'
                        ? <a href={href} target="_blank" rel="noopener noreferrer"><Badge tone="green">Ochish ↗</Badge></a>
                        : <Badge tone={POST_STATUS[po.status].tone}>{POST_STATUS[po.status].label}</Badge>}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
