import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getTelegramConfig } from '@/lib/telegram/config'
import { dateTime } from '@/lib/format'
import { Badge, Card, Empty, PageHead } from '@/components/ui'
import { ActionForm } from '@/components/action-form'
import { sendCustomPost } from '../actions'
import { NotConnected, TgTabs, plain } from '../shared'
import { Composer } from './composer'

export const metadata = { title: 'Telegram post' }

const BC_STATUS = { RUNNING: { label: 'Yuborilmoqda', tone: 'yellow' }, DONE: { label: 'Tugadi', tone: 'green' }, FAILED: { label: 'Xato', tone: 'red' } } as const

export default async function PostPage() {
  const admin = await requireAdmin()
  const [cfg, channels, subscribers, broadcasts] = await Promise.all([
    getTelegramConfig(),
    db.telegramChannel.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true, active: true } }),
    db.telegramUser.count({ where: { blocked: false } }),
    db.telegramBroadcast.findMany({ orderBy: { createdAt: 'desc' }, take: 15 }),
  ])
  return (
    <>
      <PageHead title="Post yuborish" sub="Kanallarga e'lon, yangilik yoki bot obunachilariga xabar" />
      <TgTabs active="post" />
      <div style={{ height: 12 }} />
      {!cfg.token ? <NotConnected /> : (
        <div className="grid" style={{ gap: 14 }}>
          <Card>
            <ActionForm action={sendCustomPost} submit="Yuborish">
              <Composer channels={channels} canBroadcast={admin.role === 'ADMIN'} subscribers={subscribers} />
            </ActionForm>
          </Card>
          <Card title="Obunachilarga tarqatishlar">
            {broadcasts.length === 0 ? <Empty title="Hali tarqatish bo'lmagan" /> : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Xabar</th><th className="num">Yuborildi</th><th className="num">Xato</th><th className="num">Jami</th><th>Boshlangan</th><th>Holat</th></tr></thead>
                  <tbody>
                    {broadcasts.map((b) => (
                      <tr key={b.id}>
                        <td style={{ maxWidth: 420 }}>{plain(b.text, 120)}</td>
                        <td className="num">{b.sent}</td>
                        <td className="num">{b.failed}</td>
                        <td className="num">{b.total}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{dateTime(b.createdAt)}</td>
                        <td><Badge tone={BC_STATUS[b.status].tone}>{BC_STATUS[b.status].label}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  )
}
