import Link from 'next/link'
import {
  Activity, Briefcase, ChevronRight, Download, FileText, GraduationCap, PieChart, Plus, Send, ShieldCheck, Sparkles, Target, UserPlus, Users,
} from 'lucide-react'
import { getSettings } from '@/lib/settings'
import { dashboardStats } from '@/lib/stats'
import { APP_STATUS } from '@/lib/catalog'
import { formatSum, timeAgo } from '@/lib/format'
import { db } from '@/lib/db'
import { Avatar, Badge, Card, Logo } from '@/components/ui'
import { BotCard } from '@/components/bot-card'
import { getBotStats } from '@/lib/bot-stats'
import { getTelegramConfig } from '@/lib/telegram/config'
import { DotMatrix, DotProgress, Donut, LineChart, SegmentBar, StackedBars, WaveBars } from '@/components/charts'

export const metadata = { title: 'Dashboard' }

// Foiz o'zgarish. Solishtirish uchun ma'lumot bo'lmasa (o'tgan davr 0) — ko'rsatilmaydi
function Delta({ v, note = "o'tgan haftaga nisbatan" }: { v: number | null; note?: string }) {
  if (v === null) return <span className="delta-note">{note.replace('nisbatan', "ma'lumot yo'q")}</span>
  return (
    <>
      <span className={`delta ${v >= 0 ? 'up' : 'down'}`}>{v >= 0 ? '+' : ''}{v}%</span>
      <span className="delta-note">{note}</span>
    </>
  )
}

// Davr ichida qo'shilganlar soni: +12 bu hafta
const Added = ({ n, note }: { n: number; note: string }) => (
  <><span className={`delta ${n > 0 ? 'up' : ''}`}>+{formatSum(n)}</span><span className="delta-note">{note}</span></>
)

export default async function Dashboard() {
  const [s, settings, openTickets, botStats, tgCfg] = await Promise.all([
    dashboardStats(), getSettings(), db.supportTicket.count({ where: { status: 'OPEN' } }), getBotStats(), getTelegramConfig(),
  ])
  const goals = settings.goals

  return (
    <div className="grid" style={{ gap: 14 }}>
      {/* 1-qator: asosiy ko'rsatkichlar */}
      <div className="grid g-3">
        <Card title="Foydalanuvchilar" icon={<Users size={12} />} tone="blue" href="/admin/users">
          <div className="kpi"><b>{formatSum(s.users.total)}</b><Added n={s.users.thisWeek} note={`bu hafta${s.users.growth !== null ? ` (${s.users.growth >= 0 ? '+' : ''}${s.users.growth}%)` : ''}`} /></div>
          <SegmentBar
            highlight={1}
            segments={[
              { label: 'Ish izlovchilar', value: s.users.seekers, color: 'var(--blue)' },
              { label: 'Ish beruvchilar', value: s.users.employers, color: 'var(--ink)' },
              { label: 'Bloklangan', value: s.users.blocked, color: 'var(--green)' },
            ]}
          />
        </Card>
        <Card title="Faol vakansiyalar" icon={<Briefcase size={12} />} tone="green" href="/admin/jobs">
          <div className="kpi"><b>{formatSum(s.jobs.active)}</b><Added n={s.jobs.publishedThisWeek} note="bu hafta chop etildi" /></div>
          <DotMatrix
            groups={[
              { label: 'Faol', value: s.jobs.active, color: 'var(--blue)', weeks: s.jobs.weeks.active },
              { label: 'Moderatsiyada', value: s.jobs.pending, color: 'var(--pink)', weeks: s.jobs.weeks.pending },
              { label: 'Arxiv / rad', value: s.jobs.archived, color: 'var(--green)', weeks: s.jobs.weeks.archived },
            ]}
          />
        </Card>
        <Card title="Arizalar · 7 kun" icon={<FileText size={12} />} tone="pink" href="/admin/applications">
          <div className="kpi"><b>{formatSum(s.apps.total)}</b><Delta v={s.apps.growth} /></div>
          <LineChart points={s.apps.week} />
        </Card>
      </div>

      {/* 2-qator */}
      <div className="grid g-dash-2">
        <Card title="Ro'yxatdan o'tish" icon={<UserPlus size={12} />} tone="yellow" href="/admin/users">
          <div className="kpi"><b>{formatSum(s.signupsThisMonth)}</b><Delta v={s.signupsGrowth} note="o'tgan oyning shu davriga nisbatan" /></div>
          <WaveBars up={s.wave.up} down={s.wave.down} labels={s.wave.labels} highlightFrom={s.wave.up.length - 4} />
          <div className="actions-grid">
            <Link className="btn dark" href="/admin/jobs/new"><Plus size={15} /> Vakansiya</Link>
            <Link className="btn" href="/admin/courses/new"><GraduationCap size={15} /> Kurs qo&apos;shish</Link>
            <Link className="btn" href="/admin/jobs?status=PENDING"><ShieldCheck size={15} /> Moderatsiya</Link>
            <a className="btn" href="/admin/export/users"><Download size={15} /> Hisobot</a>
          </div>
        </Card>

        <Card
          title="Faollik oqimi"
          icon={<Activity size={12} />}
          tone="purple"
          action={
            <div className="legend">
              <span><i style={{ background: 'var(--pink)' }} />Ro&apos;yxatdan o&apos;tish</span>
              <span><i style={{ background: 'var(--blue)' }} />Arizalar</span>
              <span><i style={{ background: 'var(--green)' }} />Kurslar</span>
            </div>
          }
        >
          <div className="kpi" style={{ marginBottom: 6 }}>
            <b>{formatSum(s.flow.signups[5] + s.flow.apps[5] + s.flow.enrolls[5])}</b>
            <span className="delta-note">amal shu oyda</span>
          </div>
          <StackedBars
            months={s.flow.months}
            series={[
              { label: "Ro'yxat", value: 0, color: '#e8457a', values: s.flow.signups },
              { label: 'Arizalar', value: 0, color: '#2f6bff', values: s.flow.apps },
              { label: 'Kurslar', value: 0, color: '#1f9d48', values: s.flow.enrolls },
            ]}
          />
        </Card>

        <section className="ai-card" aria-label="QadamAI tahlili">
          <div className="ai-bot" aria-hidden="true" />
          {!s.trend && (
            <div className="ai-note">
              <b><Sparkles size={13} style={{ verticalAlign: -2, color: 'var(--blue)' }} /> Bu hafta</b>
              <p>{s.apps.total} ta ariza, {s.users.thisWeek} ta yangi foydalanuvchi, {s.jobs.publishedThisWeek} ta yangi vakansiya.</p>
              <Link href="/admin/applications">Arizalarni ko&apos;rish ›</Link>
            </div>
          )}
          {s.trend && (
            <div className="ai-note">
              <b><Sparkles size={13} style={{ verticalAlign: -2, color: 'var(--blue)' }} /> {s.trend.name} {s.trend.growth === null ? '· yangi faollik' : `${s.trend.growth >= 0 ? '+' : ''}${s.trend.growth}%`}</b>
              <p>Bu haftada shu sohaga {s.trend.now} ta ariza tushdi (o&apos;tgan hafta {s.trend.prev}).</p>
              <Link href={`/admin/jobs?category=${s.trend.category}`}>Vakansiyalarni ko&apos;rish ›</Link>
            </div>
          )}
          <div className="ai-note">
            <b>{s.jobs.pending} ta vakansiya moderatsiyada</b>
            <p>{openTickets} ta murojaat javob kutmoqda.</p>
            <Link href="/admin/jobs?status=PENDING">Ko&apos;rib chiqish ›</Link>
          </div>
          <Link className="ai-input" href="/admin/support">
            <span>Murojaatlarga javob berish</span>
            <span style={{ flex: 'none', width: 28, height: 28, borderRadius: 8, background: '#fff', display: 'grid', placeItems: 'center', color: 'var(--blue)' }}><Send size={14} /></span>
          </Link>
        </section>
      </div>

      {/* Telegram bot statistikasi */}
      <BotCard stats={botStats} username={tgCfg.botUsername} />

      {/* 3-qator */}
      <div className="grid g-3">
        <Card title="So'nggi arizalar" icon={<FileText size={12} />} tone="pink" href="/admin/applications">
          <div className="rows">
            {s.recentApps.length === 0 && <div className="empty">Hali arizalar yo&apos;q</div>}
            {s.recentApps.map((a) => (
              <Link key={a.id} href={`/admin/applications?q=${encodeURIComponent(a.job.title)}`} className="row">
                <Logo name={a.job.companyName} color={a.job.color} />
                <div style={{ minWidth: 0 }}>
                  <div className="t">{a.job.title}</div>
                  <div className="s">{a.user.name} · {a.job.companyName}</div>
                </div>
                <span className="when">{timeAgo(a.createdAt)}</span>
                <Badge tone={APP_STATUS[a.status].tone}>{APP_STATUS[a.status].label}</Badge>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Sohalar bo'yicha" icon={<PieChart size={12} />} tone="green" href="/admin/jobs">
          <div className="donut-wrap">
            <Donut segments={s.donut} center={formatSum(s.activeJobs)} sub="faol vakansiya" />
            <div className="donut-legend">
              {s.donut.map((d) => (
                <div key={d.label}><span><i style={{ background: d.color }} />{d.label}</span><b>{d.value}</b></div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Maqsadlar" icon={<Target size={12} />} tone="yellow" href="/admin/settings">
          {[
            { label: 'Foydalanuvchilar', now: s.users.total, target: goals.users, color: 'var(--green)', bg: 'var(--green-soft)', icon: <Users size={16} color="var(--green)" /> },
            { label: 'Faol vakansiyalar', now: s.jobs.active, target: goals.jobs, color: 'var(--blue)', bg: 'var(--blue-soft)', icon: <Briefcase size={16} color="var(--blue)" /> },
            { label: 'Ishga joylashganlar', now: s.apps.hired, target: goals.hires, color: 'var(--pink)', bg: 'var(--pink-soft)', icon: <Target size={16} color="var(--pink)" /> },
          ].map((g) => {
            const p = g.target ? g.now / g.target : 0
            return (
              <div className="goal" key={g.label}>
                <span className="gi" style={{ background: g.bg }}>{g.icon}</span>
                <div>
                  <div className="goal-top"><span>{g.label}</span><span>{Math.min(100, Math.round(p * 100))}%</span></div>
                  <DotProgress value={p} color={g.color} />
                  <div className="goal-meta"><span>Maqsad: {formatSum(g.target)}</span><span><b style={{ color: 'var(--ink)' }}>{formatSum(g.now)}</b> / {formatSum(g.target)}</span></div>
                </div>
              </div>
            )
          })}
          <Link href="/admin/settings" className="delta-note" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginTop: 6 }}>
            Maqsadlarni o&apos;zgartirish <ChevronRight size={13} />
          </Link>
        </Card>
      </div>
    </div>
  )
}
