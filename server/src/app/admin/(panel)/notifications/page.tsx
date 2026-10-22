import { Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { dateTime } from '@/lib/format'
import { loginBotToken } from '@/lib/login-bot'
import { siteAudienceCount } from '@/lib/notifications'
import { getTelegramConfig } from '@/lib/telegram/config'
import { Badge, Card, Empty, PageHead } from '@/components/ui'
import { ActionForm } from '@/components/action-form'
import { Submit } from '@/components/client'
import { deleteNotification, sendNotificationAction } from './actions'

export const metadata = { title: 'Bildirishnomalar' }

const ROLE_LABEL: Record<string, string> = { SEEKER: 'ish izlovchilar', EMPLOYER: 'ish beruvchilar' }
const BC_TONE = { RUNNING: 'yellow', DONE: 'green', FAILED: 'red' } as const
const muted = { color: 'var(--muted)' }

export default async function NotificationsPage() {
  await requireAdmin(['ADMIN'])
  const [cfg, all, seekers, employers, mainSubs, loginSubs, items] = await Promise.all([
    getTelegramConfig(),
    siteAudienceCount('ALL'),
    siteAudienceCount('SEEKER'),
    siteAudienceCount('EMPLOYER'),
    db.telegramUser.count({ where: { blocked: false } }),
    db.telegramPhone.count(),
    db.notification.findMany({ where: { userId: null }, orderBy: { createdAt: 'desc' }, take: 30 }),
  ])
  const broadcasts = items.length ? await db.telegramBroadcast.findMany({ where: { notificationId: { in: items.map((n) => n.id) } } }) : []
  const hasMain = Boolean(cfg.token)
  const hasLogin = Boolean(loginBotToken())

  return (
    <>
      <PageHead title="Bildirishnomalar" sub="Ro'yxatdan o'tgan foydalanuvchilarga va botda /start bosganlarga xabar yuborish" />
      <div className="grid" style={{ gap: 14 }}>
        <Card>
          <ActionForm action={sendNotificationAction} submit="Yuborish">
            <div className="grid" style={{ gap: 14 }}>
              <div className="field">
                <label>Kimga</label>
                <div className="grid" style={{ gap: 10 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <label className="check"><input type="checkbox" name="toSite" defaultChecked /> Saytdagi foydalanuvchilar</label>
                    <select className="select" name="audience" defaultValue="ALL" style={{ width: 'auto' }} aria-label="Saytdagi auditoriya">
                      <option value="ALL">Hammasi ({all})</option>
                      <option value="SEEKER">Ish izlovchilar ({seekers})</option>
                      <option value="EMPLOYER">Ish beruvchilar ({employers})</option>
                    </select>
                  </div>
                  <label className="check">
                    <input type="checkbox" name="bot_main" disabled={!hasMain} /> Asosiy botga /start bosganlar ({mainSubs}){!hasMain && ' — bot ulanmagan'}
                  </label>
                  <label className="check">
                    <input type="checkbox" name="bot_login" disabled={!hasLogin} /> Kirish boti foydalanuvchilari ({loginSubs}){!hasLogin && ' — TELEGRAM_LOGIN_BOT_TOKEN berilmagan'}
                  </label>
                </div>
                <small>Saytda — «Bildirishnomalar» bo&apos;limida (qo&apos;ng&apos;iroqcha belgisida son chiqadi). Botlarda — alohida Telegram xabari.</small>
              </div>
              <div className="field"><label htmlFor="n-title">Sarlavha *</label><input id="n-title" className="input" name="title" maxLength={120} required placeholder="Masalan: Yangi kurslar ochildi" /></div>
              <div className="field">
                <label htmlFor="n-body">Matn</label>
                <textarea id="n-body" className="textarea" name="body" maxLength={3000} style={{ minHeight: 140 }} />
                <small>Oddiy matn. Rasm bilan yuborilsa, Telegram&apos;da 1024 belgigacha</small>
              </div>
              <div className="grid g-2">
                <div className="field"><label htmlFor="n-link">Havola (ixtiyoriy)</label><input id="n-link" className="input" name="link" placeholder="/courses yoki https://…" /></div>
                <div className="field"><label htmlFor="n-btn">Tugma matni (Telegram)</label><input id="n-btn" className="input" name="buttonText" maxLength={40} placeholder="🔗 Batafsil" /></div>
              </div>
              <div className="field"><label htmlFor="n-photo">Rasm manzili (faqat Telegram, ixtiyoriy)</label><input id="n-photo" className="input" name="photo" placeholder="https://…/rasm.jpg" /></div>
            </div>
          </ActionForm>
        </Card>

        <Card title="Yuborilganlar">
          {items.length === 0 ? <Empty title="Hali bildirishnoma yuborilmagan" /> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Xabar</th><th>Sayt</th><th>Asosiy bot</th><th>Kirish boti</th><th>Vaqt</th><th /></tr></thead>
                <tbody>
                  {items.map((n) => {
                    const bc = (bot: string) => {
                      const b = broadcasts.find((x) => x.notificationId === n.id && x.bot === bot)
                      if (!b) return <span style={muted}>—</span>
                      return <Badge tone={BC_TONE[b.status]}>{b.sent}/{b.total}{b.failed ? ` · ${b.failed} xato` : ''}</Badge>
                    }
                    return (
                      <tr key={n.id}>
                        <td style={{ maxWidth: 380 }}>
                          <b>{n.title}</b>
                          {n.body && <div style={{ ...muted, fontSize: 12.5 }}>{n.body.length > 120 ? n.body.slice(0, 120) + '…' : n.body}</div>}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{n.site ? <>{n.siteTotal} · {n.role ? ROLE_LABEL[n.role] : 'hammasi'}</> : <span style={muted}>—</span>}</td>
                        <td>{bc('main')}</td>
                        <td>{bc('login')}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{dateTime(n.createdAt)}</td>
                        <td>
                          {n.site && (
                            <form action={deleteNotification}>
                              <input type="hidden" name="id" value={n.id} />
                              <Submit className="btn sm icon" title="Saytdan olib tashlash" confirm="Bildirishnoma saytdan olib tashlansinmi? Telegram xabarlari o'chmaydi.">
                                <Trash2 size={14} />
                              </Submit>
                            </form>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
