import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, Check, ExternalLink, Send, X } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { dateTime } from '@/lib/format'
import { CATEGORIES, CITIES } from '@/lib/catalog'
import { adTitle, templateById, type AdFields } from '@/lib/ad-templates'
import { adPostPreview } from '@/lib/ads'
import { Badge, Card, PageHead } from '@/components/ui'
import { ActionForm } from '@/components/action-form'
import { POST_STATUS, postLink } from '../../telegram/shared'
import { approveAd, rejectAdAction, saveAd } from '../actions'

export const metadata = { title: "E'lon" }

const STATUS = {
  PENDING: { label: 'Kutilmoqda', tone: 'yellow' as const },
  PUBLISHED: { label: 'Joylangan', tone: 'green' as const },
  REJECTED: { label: 'Rad etilgan', tone: 'red' as const },
}
const QUICK_REJECT = [
  "Ma'lumotlar to'liq emas (maosh, manzil yoki aloqa)",
  "Nomzoddan pul so'ralmoqda — platforma qoidalariga zid",
  'Boshqa kanal/guruh reklamasi',
  "E'lon takrorlangan",
]

// Kanal postidagi tugma ranglari (Telegram: primary — ko'k, success — yashil, danger — qizil)
const BTN = { primary: '#3E88F7', success: '#31A24C', danger: '#E5484D' } as const

export default async function AdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAdmin()
  const ad = await db.ad.findUnique({ where: { id }, include: { job: true, posts: { orderBy: { createdAt: 'desc' }, include: { channel: true } } } })
  if (!ad) notFound()
  const tpl = templateById(ad.template)
  const fields = ad.fields as AdFields
  const [channels, preview] = await Promise.all([
    db.telegramChannel.findMany({ where: { active: true }, orderBy: { title: 'asc' } }),
    tpl ? adPostPreview(ad, ad.job) : null,
  ])
  const sentTo = new Set(ad.posts.filter((p) => p.status === 'SENT').map((p) => p.channelId))
  const buttons = (preview?.replyMarkup?.inline_keyboard || []).flat() as { text: string; style?: keyof typeof BTN }[]
  // post HTML: qiymatlar renderAdPost'da ekranlangan, faqat <b> teglari bor
  const html = (preview?.text || '').replace(/\n/g, '<br>')

  return (
    <>
      <PageHead title={`#${ad.number} · ${tpl ? adTitle(tpl, fields) : ad.template}`} sub={`${tpl?.emoji ?? ''} ${tpl?.name.uz ?? ad.template} · ${dateTime(ad.createdAt)}`}>
        <Badge tone={STATUS[ad.status].tone}>{STATUS[ad.status].label}</Badge>
      </PageHead>

      {ad.warnings.length > 0 && (
        <div className="ad-warn">
          <AlertTriangle size={16} />
          <div><b>Diqqat:</b>{ad.warnings.map((w) => <div key={w}>• {w}</div>)}</div>
        </div>
      )}
      {ad.status === 'REJECTED' && ad.rejectReason && <div className="error-box" style={{ marginBottom: 12 }}>Rad etish sababi: {ad.rejectReason}</div>}

      <div className="grid g-side">
        <div className="grid" style={{ alignContent: 'start' }}>
          <Card title="Kanalda shunday ko'rinadi" icon={<Send size={12} />}>
            <div className="tg-preview">
              <div className="tg-bubble" dangerouslySetInnerHTML={{ __html: html }} />
              {buttons.length > 0 && (
                <div className="tg-buttons">
                  {buttons.map((b) => <span key={b.text} style={{ background: b.style ? BTN[b.style] : '#5B6B7F' }}>{b.text}</span>)}
                </div>
              )}
            </div>
          </Card>

          {tpl && (
            <Card title="Tahrirlash">
              <ActionForm action={saveAd} submit="Saqlash">
                <input type="hidden" name="id" value={ad.id} />
                <div className="form-grid">
                  {tpl.fields.map((f) => {
                    const v = fields[f.key] ?? ''
                    const label = <label htmlFor={`f_${f.key}`}>{f.emoji} {f.label}{f.required && ' *'}</label>
                    if (f.type === 'long') return <div key={f.key} className="field full">{label}<textarea id={`f_${f.key}`} className="textarea" name={`f_${f.key}`} defaultValue={v} maxLength={f.max} rows={4} /></div>
                    if (f.type === 'choice' || f.type === 'category') {
                      const opts = f.type === 'category' ? CATEGORIES.map((c) => ({ v: c.id, uz: c.name })) : f.options!
                      return (
                        <div key={f.key} className="field">{label}
                          <select id={`f_${f.key}`} className="select" name={`f_${f.key}`} defaultValue={v}>
                            {!f.required && <option value="">—</option>}
                            {opts.map((o) => <option key={o.v} value={o.v}>{o.uz}</option>)}
                          </select>
                        </div>
                      )
                    }
                    return (
                      <div key={f.key} className="field">{label}
                        <input id={`f_${f.key}`} className="input" name={`f_${f.key}`} defaultValue={v} maxLength={f.max ?? 120} list={f.type === 'city' ? 'ad-cities' : undefined} />
                      </div>
                    )
                  })}
                </div>
                <datalist id="ad-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
              </ActionForm>
            </Card>
          )}
        </div>

        <div className="grid" style={{ alignContent: 'start' }}>
          <Card title="E'lon beruvchi">
            <dl className="kv">
              <dt>Ism</dt><dd>{ad.authorName}</dd>
              <dt>Telegram</dt><dd>{ad.tgUsername ? <a href={`https://t.me/${ad.tgUsername}`} target="_blank" rel="noreferrer">@{ad.tgUsername}</a> : `ID ${ad.tgUserId}`}</dd>
              {ad.authorPhone && <><dt>Telefon</dt><dd>{ad.authorPhone}</dd></>}
              {ad.job && <><dt>Saytda</dt><dd><Link href={`/admin/jobs/${ad.job.id}`}>Vakansiya #{ad.job.number}</Link></dd></>}
            </dl>
          </Card>

          <Card title={ad.status === 'PUBLISHED' ? 'Yana kanalga yuborish' : 'Tasdiqlash va joylash'} tone="green" icon={<Check size={12} />}>
            {channels.length === 0 ? (
              <p style={{ color: 'var(--muted)', margin: '0 0 12px', fontSize: 13 }}>Kanal yoki guruh yo&apos;q. Botni kanalga administrator qilib qo&apos;shing — <Link href="/admin/telegram">Telegram</Link> bo&apos;limida paydo bo&apos;ladi.</p>
            ) : null}
            <ActionForm action={approveAd} submit={ad.status === 'PUBLISHED' ? 'Yuborish' : '✅ Tasdiqlash va joylash'}>
              <input type="hidden" name="id" value={ad.id} />
              <div className="grid" style={{ gap: 8 }}>
                {channels.map((c) => (
                  <label key={c.id} className="check">
                    <input type="checkbox" name="channel" value={c.id} defaultChecked={ad.status !== 'PUBLISHED' && c.autoPost} disabled={sentTo.has(c.id)} />
                    {c.title} <small style={{ color: 'var(--muted)' }}>{c.type === 'channel' ? 'kanal' : 'guruh'}{c.memberCount ? ` · ${c.memberCount}` : ''}{sentTo.has(c.id) ? ' · yuborilgan' : ''}</small>
                  </label>
                ))}
              </div>
              {tpl?.job && ad.status !== 'PUBLISHED' && <p style={{ color: 'var(--muted)', fontSize: 12, margin: '10px 0 0' }}>Vakansiya saytda ham e&apos;lon qilinadi va postga «Batafsil» havolasi qo&apos;shiladi.</p>}
            </ActionForm>
          </Card>

          {ad.status !== 'REJECTED' && (
            <Card title="Rad etish" tone="pink" icon={<X size={12} />}>
              <ActionForm action={rejectAdAction} submit="Rad etish">
                <input type="hidden" name="id" value={ad.id} />
                <div className="field">
                  <label htmlFor="reason">Sabab (e&apos;lon beruvchiga yuboriladi)</label>
                  <textarea id="reason" className="textarea" name="reason" rows={3} maxLength={500} defaultValue={ad.warnings[0]?.startsWith('Nomzoddan') ? QUICK_REJECT[1] : ''} />
                  <small>Tayyor sabablar: {QUICK_REJECT.join(' · ')}</small>
                </div>
              </ActionForm>
            </Card>
          )}

          {ad.posts.length > 0 && (
            <Card title="Kanal postlari">
              <div className="grid" style={{ gap: 8 }}>
                {ad.posts.map((p) => {
                  const href = postLink(p.channel.chatId, p.channel.username, p.messageId)
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <Badge tone={POST_STATUS[p.status].tone}>{POST_STATUS[p.status].label}</Badge>
                      <span style={{ flex: 1 }}>{p.channel.title}{p.error && <small style={{ display: 'block', color: 'var(--muted)' }}>{p.error}</small>}</span>
                      {href && <a href={href} target="_blank" rel="noreferrer" aria-label="Postni ochish"><ExternalLink size={14} /></a>}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
