import Link from 'next/link'
import { Bot, ExternalLink } from 'lucide-react'
import { formatSum, dateTime } from '@/lib/format'
import { lastDays, type BotStatsResult } from '@/lib/bot-stats'
import { Badge, Card } from './ui'
import { WaveBars } from './charts'

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

function Tile({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: 'up' | 'warn' }) {
  return (
    <div className="mini-tile">
      <span>{label}</span>
      <b>{typeof value === 'number' ? formatSum(value) : value}</b>
      {sub && <small className={tone === 'up' ? 'delta up' : tone === 'warn' ? 'warn-text' : ''}>{sub}</small>}
    </div>
  )
}

// Dashboard: @ayolqadam_bot statistikasi (Python bot REST API'sidan)
export function BotCard({ stats, username }: { stats: BotStatsResult; username: string }) {
  const title = username ? `Telegram bot · @${username}` : 'Telegram bot'
  const link = username ? `https://t.me/${username}` : null

  if (!stats.configured) {
    return (
      <Card title={title} icon={<Bot size={12} />} tone="blue">
        <p className="delta-note" style={{ margin: 0 }}>
          Bot statistikasi ulanmagan. Server <code>.env</code> fayliga <code>BOT_API_URL</code> va <code>BOT_API_KEY</code> (botning <code>WEB_API_KEY</code>) qiymatlarini yozing.
        </p>
      </Card>
    )
  }
  if (!stats.ok) {
    return (
      <Card title={title} icon={<Bot size={12} />} tone="blue" action={<Badge tone="red">Javob yo&apos;q</Badge>}>
        <p className="delta-note" style={{ margin: 0 }}>{stats.error}. Botni ishga tushiring (<code>ayolqadam-bot\start.bat</code>) — statistika avtomatik paydo bo&apos;ladi.</p>
      </Card>
    )
  }

  const s = stats.data
  const users = lastDays(s.daily_users)
  const apps = lastDays(s.daily_apps)
  return (
    <Card
      title={title}
      icon={<Bot size={12} />}
      tone="blue"
      action={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge tone="green">Ishlayapti</Badge>
          {link && <a className="card-more" href={link} target="_blank" rel="noopener noreferrer" aria-label="Botni Telegramda ochish"><ExternalLink size={15} /></a>}
        </div>
      }
    >
      <div className="bot-grid">
        <div className="mini-tiles">
          <Tile label="Foydalanuvchilar" value={s.users} sub={`+${formatSum(s.new_week)} bu hafta · +${s.new_day} bugun`} tone="up" />
          <Tile label="Faol" value={s.active_day} sub={`24 soatda · 7 kunda ${formatSum(s.active_week)}`} />
          <Tile label="Raqam tasdiqlagan" value={s.verified} sub={`${pct(s.verified, s.users)}% foydalanuvchilar`} />
          <Tile label="Botni bloklagan" value={s.blocked} sub={s.banned ? `${s.banned} tasi ban qilingan` : `${pct(s.blocked, s.users)}%`} tone={s.blocked ? 'warn' : undefined} />
          <Tile label="Ish izlovchi / beruvchi" value={`${formatSum(s.seekers)} / ${formatSum(s.employers)}`} sub={`O'zbek ${s.lang_uz} · Rus ${s.lang_ru}`} />
          <Tile label="Rezyumelar" value={s.res_active} sub={s.res_pending ? `${s.res_pending} tasi moderatsiyada` : `jami ${s.res_total}`} tone={s.res_pending ? 'warn' : undefined} />
          <Tile label="Vakansiyalar" value={s.vac_active} sub={s.vac_pending ? `${s.vac_pending} tasi moderatsiyada` : `jami ${s.vac_total}`} tone={s.vac_pending ? 'warn' : undefined} />
          <Tile label="Arizalar" value={s.apps} sub={`+${s.apps_week} bu hafta · ${s.invites} taklif`} />
        </div>
        <div>
          <div className="legend" style={{ justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>So&apos;nggi 14 kun</span>
            <span><span><i style={{ background: 'var(--blue)' }} />Yangi foydalanuvchilar</span> &nbsp; <span><i style={{ background: '#9db8ff' }} />Arizalar</span></span>
          </div>
          <WaveBars up={users.map((d) => d.value)} down={apps.map((d) => d.value)} labels={users.map((d) => d.label)} highlightFrom={users.length - 7} />
          <div className="delta-note" style={{ marginTop: 10 }}>
            {s.last_broadcast
              ? `Oxirgi tarqatish: ${dateTime(s.last_broadcast.created_at)} — ${s.last_broadcast.sent}/${s.last_broadcast.total} yetkazildi`
              : 'Botdan hali xabar tarqatilmagan'}
            {' · '}<Link href="/admin/telegram" style={{ color: 'var(--blue)' }}>Telegram bo&apos;limi ›</Link>
          </div>
        </div>
      </div>
    </Card>
  )
}
