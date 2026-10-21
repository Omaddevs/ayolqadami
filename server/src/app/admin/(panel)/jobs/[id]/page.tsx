import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Archive, Check, Trash2, X } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { APP_STATUS, JOB_STATUS } from '@/lib/catalog'
import { dateTime, timeAgo } from '@/lib/format'
import { formatUzPhone } from '@/lib/phone'
import { Avatar, Badge, Card, PageHead } from '@/components/ui'
import { Submit } from '@/components/client'
import { JobForm } from '@/components/job-form'
import { approveJob, archiveJob, deleteJob, rejectJob } from '../../actions'
import { sendJobNow } from '../../telegram/actions'
import { ActionForm } from '@/components/action-form'
import { channelMatchesJob } from '@/lib/telegram/service'
import { getTelegramConfig } from '@/lib/telegram/config'
import { POST_STATUS, postLink } from '../../telegram/shared'

export const metadata = { title: 'Vakansiya' }

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  const [job, companies] = await Promise.all([
    db.job.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, phone: true, company: true } },
        applications: { orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { id: true, name: true, photo: true } } } },
        _count: { select: { applications: true } },
      },
    }),
    db.company.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
  ])
  const [tgCfg, channels, tgPosts] = await Promise.all([
    getTelegramConfig(),
    db.telegramChannel.findMany({ where: { active: true }, orderBy: { title: 'asc' } }),
    db.telegramPost.findMany({ where: { jobId: id }, orderBy: { createdAt: 'desc' }, include: { channel: { select: { title: true, chatId: true, username: true } } } }),
  ])
  if (!job) notFound()
  const details = (job.details || {}) as Record<string, unknown>
  const contact = details.contact as { name?: string; phone?: string; telegram?: string } | undefined

  return (
    <>
      <PageHead title={job.title} sub={`${job.companyName} · ${job.city}`}>
        <Badge tone={JOB_STATUS[job.status].tone}>{JOB_STATUS[job.status].label}</Badge>
      </PageHead>
      <div className="grid g-side">
        <Card title="Tahrirlash"><JobForm job={job} companies={companies.map((c) => c.name)} /></Card>
        <div className="grid" style={{ alignContent: 'start' }}>
          {job.status === 'PENDING' && (
            <Card title="Moderatsiya" tone="yellow">
              <form action={approveJob} style={{ marginBottom: 10 }}>
                <input type="hidden" name="id" value={job.id} />
                <Submit className="btn green block"><Check size={15} /> Tasdiqlash va chop etish</Submit>
              </form>
              <form action={rejectJob} className="field">
                <input type="hidden" name="id" value={job.id} />
                <label htmlFor="reason">Rad etish sababi (ish beruvchiga ko&apos;rinadi)</label>
                <textarea id="reason" className="textarea" name="reason" style={{ minHeight: 70 }} placeholder="Masalan: aloqa ma'lumotlari to'liq emas" maxLength={500} />
                <Submit className="btn danger block" confirm="Vakansiyani rad etasizmi?"><X size={15} /> Rad etish</Submit>
              </form>
            </Card>
          )}
          <Card title="Ma'lumot">
            <dl className="kv">
              <dt>Manba</dt><dd>{{ WEB: 'Web ilova', BOT: 'Telegram bot', ADMIN: 'Admin panel', SEED: "Boshlang'ich" }[job.source]}</dd>
              <dt>Muallif</dt><dd>{job.author ? <Link href={`/admin/users/${job.author.id}`} style={{ color: 'var(--blue)' }}>{job.author.name}</Link> : '—'}</dd>
              {contact?.phone && <><dt>Aloqa</dt><dd>{contact.name} · {contact.phone}{contact.telegram ? ` · ${contact.telegram}` : ''}</dd></>}
              <dt>Yaratilgan</dt><dd>{dateTime(job.createdAt)}</dd>
              <dt>Chop etilgan</dt><dd>{job.publishedAt ? dateTime(job.publishedAt) : '—'}</dd>
              <dt>Muddati</dt><dd>{job.expiresAt ? dateTime(job.expiresAt) : '—'}</dd>
              <dt>Ko&apos;rishlar</dt><dd>{job.views}</dd>
              <dt>Arizalar</dt><dd>{job._count.applications}</dd>
              {job.rejectReason && <><dt>Rad sababi</dt><dd>{job.rejectReason}</dd></>}
              {job.author?.phone && <><dt>Muallif tel.</dt><dd>{formatUzPhone(job.author.phone)}</dd></>}
            </dl>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {job.status === 'ACTIVE' && (
                <form action={archiveJob}><input type="hidden" name="id" value={job.id} /><Submit className="btn sm" confirm="Arxivlaysizmi?"><Archive size={14} /> Arxivlash</Submit></form>
              )}
              {admin.role === 'ADMIN' && (
                <form action={deleteJob}><input type="hidden" name="id" value={job.id} /><Submit className="btn sm danger" confirm="Vakansiya va unga tegishli barcha arizalar butunlay o'chiriladi. Davom etasizmi?"><Trash2 size={14} /> O&apos;chirish</Submit></form>
              )}
            </div>
          </Card>
          <Card title="Telegram">
            {!tgCfg.token ? (
              <p className="delta-note" style={{ margin: 0 }}>Bot ulanmagan. <Link href="/admin/telegram/settings" style={{ color: 'var(--blue)' }}>Ulash ›</Link></p>
            ) : job.status !== 'ACTIVE' ? (
              <p className="delta-note" style={{ margin: 0 }}>Faqat faol vakansiyani kanalga yuborish mumkin.</p>
            ) : channels.length === 0 ? (
              <p className="delta-note" style={{ margin: 0 }}>Faol kanal yo&apos;q. <Link href="/admin/telegram" style={{ color: 'var(--blue)' }}>Kanal qo&apos;shish ›</Link></p>
            ) : (
              <ActionForm action={sendJobNow} submit="Kanallarga yuborish">
                <input type="hidden" name="jobId" value={job.id} />
                <div className="grid" style={{ gap: 8 }}>
                  {channels.map((c) => {
                    const done = tgPosts.some((p) => p.channelId === c.id && p.status === 'SENT')
                    return (
                      <label key={c.id} className="check">
                        <input type="checkbox" name="channels" value={c.id} defaultChecked={!done && channelMatchesJob(c, job)} />
                        {c.title}{done && <Badge tone="green">yuborilgan</Badge>}
                      </label>
                    )
                  })}
                </div>
              </ActionForm>
            )}
            {tgPosts.length > 0 && (
              <div className="rows" style={{ marginTop: 10 }}>
                {tgPosts.map((p) => {
                  const href = postLink(p.channel.chatId, p.channel.username, p.messageId)
                  return (
                    <div key={p.id} className="row" style={{ gridTemplateColumns: '1fr auto' }}>
                      <div style={{ minWidth: 0 }}><div className="t">{p.channel.title}</div><div className="s">{timeAgo(p.createdAt)}{p.error ? ` · ${p.error}` : ''}</div></div>
                      {href && p.status === 'SENT'
                        ? <a href={href} target="_blank" rel="noopener noreferrer"><Badge tone="green">Ochish ↗</Badge></a>
                        : <Badge tone={POST_STATUS[p.status].tone}>{POST_STATUS[p.status].label}</Badge>}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
          <Card title={`Arizalar (${job._count.applications})`} href={`/admin/applications?q=${encodeURIComponent(job.title)}`}>
            <div className="rows">
              {job.applications.length === 0 && <div className="empty">Hali ariza yo&apos;q</div>}
              {job.applications.map((a) => (
                <Link key={a.id} href={`/admin/users/${a.user.id}`} className="row" style={{ gridTemplateColumns: '34px 1fr auto' }}>
                  <Avatar name={a.user.name} src={a.user.photo} />
                  <div style={{ minWidth: 0 }}><div className="t">{a.user.name}</div><div className="s">{timeAgo(a.createdAt)}</div></div>
                  <Badge tone={APP_STATUS[a.status].tone}>{APP_STATUS[a.status].label}</Badge>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
