import Link from 'next/link'
import { Bot, ExternalLink, Megaphone, Plus, RefreshCw, Send, Settings2, Trash2, Users } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getTelegramConfig } from '@/lib/telegram/config'
import { tg, TelegramError, type TgUser, type TgWebhookInfo } from '@/lib/telegram/api'
import { pollerStatus } from '@/lib/telegram/runtime'
import { catName } from '@/lib/catalog'
import { dateTime, formatSum, timeAgo } from '@/lib/format'
import { Badge, Card, Empty, PageHead, Pager, pageOf, type SearchParams } from '@/components/ui'
import { ActionForm } from '@/components/action-form'
import { Submit } from '@/components/client'
import { addChannel, deletePostAction, refreshChannel } from './actions'
import { POST_STATUS, TgTabs, plain, postLink } from './shared'

export const metadata = { title: 'Telegram' }
const LIMIT = 20

// Bot holatini jonli tekshirish (sahifa ochilganda). Telegram javob bermasa ham sahifa ochilaveradi
async function liveStatus(token: string, mode: string) {
  if (!token) return { ok: false, text: 'Ulanmagan' }
  try {
    const me = await tg<TgUser>(token, 'getMe', {}, 6000)
    let detail = ''
    if (mode === 'webhook') {
      const wh = await tg<TgWebhookInfo>(token, 'getWebhookInfo', {}, 6000)
      detail = wh.last_error_message ? `Webhook xatosi: ${wh.last_error_message}` : wh.url ? `Navbatda: ${wh.pending_update_count}` : "Webhook o'rnatilmagan"
    } else if (mode === 'polling') {
      const st = pollerStatus()
      detail = st?.lastError ? `Polling xatosi: ${st.lastError}` : st?.lastPollAt ? `Oxirgi so'rov: ${timeAgo(new Date(st.lastPollAt))}` : 'Polling ishga tushmoqda…'
    } else detail = "Bot o'chirilgan (faqat kanalga post yuboriladi)"
    return { ok: true, text: `@${me.username}`, detail }
  } catch (e) {
    return { ok: false, text: e instanceof TelegramError && e.code === 401 ? "Token noto'g'ri" : 'Telegram javob bermadi', detail: (e as Error).message }
  }
}

export default async function TelegramPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin()
  const p = await searchParams
  const page = pageOf(p.page)
  const cfg = await getTelegramConfig()
  const dayAgo = new Date(Date.now() - 86400_000)
  const [status, channels, posts, totalPosts, subscribers, blockedSubs, postsToday] = await Promise.all([
    liveStatus(cfg.token, cfg.mode),
    db.telegramChannel.findMany({ orderBy: { createdAt: 'asc' }, include: { _count: { select: { posts: { where: { status: 'SENT' } } } } } }),
    db.telegramPost.findMany({
      orderBy: { createdAt: 'desc' }, skip: (page - 1) * LIMIT, take: LIMIT,
      include: { channel: { select: { title: true, chatId: true, username: true } }, job: { select: { id: true, title: true } } },
    }),
    db.telegramPost.count(),
    db.telegramUser.count({ where: { blocked: false } }),
    db.telegramUser.count({ where: { blocked: true } }),
    db.telegramPost.count({ where: { status: 'SENT', createdAt: { gte: dayAgo } } }),
  ])
  const MODE = { off: "O'chiq", polling: 'Polling', webhook: 'Webhook' }[cfg.mode]

  return (
    <>
      <PageHead title="Telegram" sub="Bot, kanallar va postlarni boshqarish">
        <Link className="btn" href="/admin/telegram/settings"><Settings2 size={15} /> Bot sozlamalari</Link>
        <Link className="btn dark" href="/admin/telegram/post"><Megaphone size={15} /> Post yuborish</Link>
      </PageHead>
      <TgTabs active="overview" />
      <div style={{ height: 12 }} />

      <div className="grid g-4" style={{ marginBottom: 14 }}>
        <Card title="Bot" icon={<Bot size={12} />} tone="blue" href="/admin/telegram/settings">
          <div className="kpi"><b style={{ fontSize: 18 }}>{status.text}</b>{status.ok ? <Badge tone="green">Ulangan</Badge> : <Badge tone={cfg.token ? 'red' : 'gray'}>{cfg.token ? 'Xato' : 'Ulanmagan'}</Badge>}</div>
          <div className="delta-note" style={{ marginTop: 6 }}>Rejim: {MODE}{status.detail ? ` · ${status.detail}` : ''}</div>
        </Card>
        <Card title="Obunachilar" icon={<Users size={12} />} tone="green">
          <div className="kpi"><b>{formatSum(subscribers)}</b><span className="delta-note">botni ishlatayotganlar</span></div>
          <div className="delta-note" style={{ marginTop: 6 }}>{blockedSubs} tasi botni bloklagan</div>
        </Card>
        <Card title="Kanallar" icon={<Send size={12} />} tone="purple">
          <div className="kpi"><b>{channels.filter((c) => c.active).length}</b><span className="delta-note">faol / {channels.length} jami</span></div>
          <div className="delta-note" style={{ marginTop: 6 }}>{formatSum(channels.reduce((n, c) => n + (c.memberCount || 0), 0))} ta a&apos;zo</div>
        </Card>
        <Card title="Postlar · 24 soat" icon={<Megaphone size={12} />} tone="pink">
          <div className="kpi"><b>{postsToday}</b><span className="delta-note">yuborildi</span></div>
          <div className="delta-note" style={{ marginTop: 6 }}>Avtomatik yuborish: {cfg.autoPostJobs ? 'yoqilgan' : "o'chiq"}</div>
        </Card>
      </div>

      <div className="grid g-side" style={{ marginBottom: 14 }}>
        <Card title="Kanallar va guruhlar">
          {channels.length === 0 ? (
            <Empty title="Kanal qo'shilmagan">Botni kanalingizga administrator qilib qo&apos;shing va o&apos;ng tomondagi formadan kanalni kiriting</Empty>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Kanal</th><th>Filtr</th><th className="num">A&apos;zolar</th><th className="num">Postlar</th><th>Oxirgi post</th><th>Holat</th><th /></tr></thead>
                <tbody>
                  {channels.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/admin/telegram/channels/${c.id}`} className="cell-main">
                          <span className="logo" style={{ background: '#229ED9' }}><Send size={15} /></span>
                          <span><b>{c.title}</b><small>{c.username ? `@${c.username}` : c.chatId} · {c.type === 'channel' ? 'kanal' : 'guruh'}</small></span>
                        </Link>
                      </td>
                      <td style={{ maxWidth: 220, color: 'var(--muted)', fontSize: 12 }}>
                        {c.categories.length ? c.categories.map(catName).join(', ') : 'Barcha sohalar'}
                        {c.cities.length ? ` · ${c.cities.join(', ')}` : ''}
                      </td>
                      <td className="num">{c.memberCount != null ? formatSum(c.memberCount) : '—'}</td>
                      <td className="num">{c._count.posts}</td>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }}>{c.lastPostAt ? timeAgo(c.lastPostAt) : '—'}</td>
                      <td>
                        {!c.active ? <Badge tone="gray">O&apos;chiq</Badge> : c.autoPost ? <Badge tone="green">Avtomatik</Badge> : <Badge tone="blue">Qo&apos;lda</Badge>}
                      </td>
                      <td>
                        <div className="acts">
                          <form action={refreshChannel}><input type="hidden" name="id" value={c.id} /><Submit className="btn sm icon" title="Ma'lumotni yangilash"><RefreshCw size={14} /></Submit></form>
                          <Link className="btn sm" href={`/admin/telegram/channels/${c.id}`}>Sozlash</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card title="Kanal qo'shish" icon={<Plus size={12} />} tone="green">
          <ActionForm action={addChannel} submit="Qo'shish">
            <div className="field">
              <label htmlFor="chat">Kanal yoki guruh</label>
              <input id="chat" className="input" name="chat" placeholder="@ayolqadami_ish yoki t.me/…" required disabled={!cfg.token} />
              <small>{cfg.token ? 'Yopiq kanal uchun -100… ID kiriting' : 'Avval botni ulang'}</small>
            </div>
            <ol className="steps">
              <li>Kanal sozlamalari → Administratorlar → {cfg.botUsername ? <b>@{cfg.botUsername}</b> : 'botingizni'} qo&apos;shing</li>
              <li>«Xabar joylash» va «Xabarlarni o&apos;chirish» huquqlarini bering</li>
              <li>Kanal manzilini shu yerga kiriting</li>
            </ol>
          </ActionForm>
        </Card>
      </div>

      <Card title="Postlar tarixi" icon={<Megaphone size={12} />} tone="pink">
        {posts.length === 0 ? <Empty title="Hali post yuborilmagan" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Post</th><th>Kanal</th><th>Kim</th><th>Vaqt</th><th>Holat</th><th /></tr></thead>
              <tbody>
                {posts.map((po) => {
                  const href = postLink(po.channel.chatId, po.channel.username, po.messageId)
                  return (
                    <tr key={po.id}>
                      <td style={{ maxWidth: 380, minWidth: 240 }}>
                        {po.job ? <Link href={`/admin/jobs/${po.job.id}`} style={{ fontWeight: 600 }}>{po.job.title}</Link> : <b>Ixtiyoriy post</b>}
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>{plain(po.text)}</div>
                        {po.error && <div style={{ color: 'var(--red)', fontSize: 12 }}>{po.error}</div>}
                      </td>
                      <td>{po.channel.title}</td>
                      <td style={{ color: 'var(--muted)' }}>{po.authorId ? 'Admin' : 'Avtomatik'}</td>
                      <td style={{ whiteSpace: 'nowrap' }} title={dateTime(po.createdAt)}>{timeAgo(po.createdAt)}</td>
                      <td><Badge tone={POST_STATUS[po.status].tone}>{POST_STATUS[po.status].label}</Badge></td>
                      <td>
                        <div className="acts">
                          {href && po.status === 'SENT' && <a className="btn sm icon" href={href} target="_blank" rel="noopener noreferrer" aria-label="Telegramda ochish"><ExternalLink size={14} /></a>}
                          {po.status === 'SENT' && (
                            <form action={deletePostAction}>
                              <input type="hidden" name="id" value={po.id} />
                              <Submit className="btn sm icon danger" title="Kanaldan o'chirish" confirm="Post kanaldan o'chiriladi (48 soatdan eski postlarni Telegram o'chirishga ruxsat bermaydi)"><Trash2 size={14} /></Submit>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Pager page={page} limit={LIMIT} total={totalPosts} href={(pg) => `/admin/telegram?page=${pg}`} />
          </div>
        )}
      </Card>
      {admin.role !== 'ADMIN' && <p className="delta-note" style={{ marginTop: 10 }}>Bot sozlamalari va obunachilarga tarqatish faqat administrator uchun.</p>}
    </>
  )
}
