import type { ReactNode } from 'react'
import { BarChart3, Eye, Globe2, Link2, MonitorSmartphone, MousePointerClick, Radio, UserPlus, Users } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { siteAnalytics } from '@/lib/site-analytics'
import { COUNTRY_NAMES, flag } from '@/lib/countries'
import { formatSum } from '@/lib/format'
import { Card, Empty, PageHead, Tabs, sp } from '@/components/ui'
import { Donut, LineChart, SegmentBar } from '@/components/charts'

export const metadata = { title: 'Statistika' }
export const dynamic = 'force-dynamic'

const PERIODS = [{ key: '1', label: 'Bugun' }, { key: '7', label: '7 kun' }, { key: '30', label: '30 kun' }, { key: '90', label: '90 kun' }]
const DEVICE: Record<string, string> = { mobile: 'Telefon', desktop: 'Kompyuter', tablet: 'Planshet' }
const COLORS = ['var(--blue)', 'var(--pink)', 'var(--green)', 'var(--ink)', '#f5b83d', '#8b5cf6', '#14b8a6', '#a3a7b2']

function Growth({ v }: { v: number | null }) {
  if (v === null) return <span className="delta-note">avvalgi davr bilan solishtirib bo‘lmaydi</span>
  return <><span className={`delta ${v >= 0 ? 'up' : 'down'}`}>{v >= 0 ? '+' : ''}{v}%</span><span className="delta-note">avvalgi davrga nisbatan</span></>
}

// Gorizontal ustunli ro'yxat
function BarList({ rows, unit }: { rows: { label: ReactNode; value: number; sub?: string }[]; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (!rows.length) return <Empty title="Hozircha ma’lumot yo‘q" />
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, marginBottom: 4 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
            <b style={{ whiteSpace: 'nowrap' }}>{formatSum(r.value)} <span className="delta-note">{unit}{r.sub ? ` · ${r.sub}` : ''}</span></b>
          </div>
          <div style={{ height: 6, borderRadius: 4, background: '#f1f2f6' }}>
            <div style={{ width: `${(r.value / max) * 100}%`, height: '100%', borderRadius: 4, background: 'var(--blue)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin()
  const q = await searchParams
  const period = PERIODS.some((p) => p.key === sp(q.d)) ? sp(q.d) : '30'
  const days = Number(period)
  const a = await siteAnalytics(days)
  const t = a.totals
  const r = a.reg
  const step = Math.ceil(a.series.length / 10)
  const pts = (k: 'visitors' | 'views' | 'regs') =>
    a.series.map((s, i) => ({ label: i % step === 0 || i === a.series.length - 1 ? s.label : '', value: s[k] }))
  const totalDev = a.devices.reduce((s, d) => s + d.v, 0)
  const methods: [string, { period: number; total: number }][] = [
    ['📱 Telegram bot orqali', r.telegram], ['🟢 Google hisobi orqali', r.google], ['🔑 Telefon va parol', r.phone],
  ]

  return (
    <div className="grid" style={{ gap: 14 }}>
      <PageHead title="Statistika" sub="Sayt tashriflari, mamlakatlar, sahifalar va ro‘yxatdan o‘tishlar">
        <Tabs active={period} items={PERIODS.map((p) => ({ key: p.key, label: p.label, href: `/admin/analytics?d=${p.key}` }))} />
      </PageHead>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <Card title="Hozir saytda" icon={<Radio size={12} />} tone="green">
          <div className="kpi"><b>{formatSum(t.online)}</b><span className="delta-note">so‘nggi 5 daqiqada</span></div>
        </Card>
        <Card title="Tashrifchilar" icon={<Users size={12} />} tone="blue">
          <div className="kpi"><b>{formatSum(t.visitors)}</b><Growth v={t.growth.visitors} /></div>
        </Card>
        <Card title="Sahifa ko‘rishlari" icon={<Eye size={12} />} tone="pink">
          <div className="kpi"><b>{formatSum(t.views)}</b><Growth v={t.growth.views} /></div>
        </Card>
        <Card title="Tashriflar (sessiya)" icon={<MousePointerClick size={12} />} tone="purple">
          <div className="kpi"><b>{formatSum(t.sessions)}</b><span className="delta-note">{t.perSession} sahifa / tashrif · {t.bounce}% bitta sahifa</span></div>
        </Card>
        <Card title="Ro‘yxatdan o‘tdi" icon={<UserPlus size={12} />} tone="yellow">
          <div className="kpi"><b>{formatSum(r.period)}</b><span className="delta-note">konversiya {t.conversion}% · jami {formatSum(r.total)}</span></div>
        </Card>
      </div>

      <Card title="Tashrifchilar dinamikasi" icon={<BarChart3 size={12} />} tone="blue">
        {days === 1
          ? <div className="kpi"><b>{formatSum(t.visitors)}</b><span className="delta-note">bugungi tashrifchilar</span></div>
          : <LineChart points={pts('visitors')} color="var(--blue)" />}
      </Card>

      <div className="grid g-2">
        <Card title="Ro‘yxatdan o‘tish usullari" icon={<UserPlus size={12} />} tone="green" href="/admin/users">
          <Donut
            center={formatSum(r.total)} sub="jami foydalanuvchi"
            segments={[
              { label: 'Telegram bot', value: r.telegram.total, color: 'var(--blue)' },
              { label: 'Google', value: r.google.total, color: 'var(--pink)' },
              { label: 'Telefon + parol', value: r.phone.total, color: 'var(--green)' },
            ]}
          />
          <table style={{ marginTop: 12, width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead><tr className="delta-note"><th style={{ textAlign: 'left', padding: 4 }}>Usul</th><th>Shu davrda</th><th>Jami</th></tr></thead>
            <tbody>
              {methods.map(([l, v]) => (
                <tr key={l} style={{ borderTop: '1px solid #f1f2f6' }}>
                  <td style={{ padding: 6 }}>{l}</td>
                  <td style={{ textAlign: 'center' }}><b>{formatSum(v.period)}</b></td>
                  <td style={{ textAlign: 'center' }}>{formatSum(v.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 12 }}>
            <SegmentBar segments={[{ label: 'Ish izlovchi', value: r.seekers, color: 'var(--blue)' }, { label: 'Ish beruvchi', value: r.employers, color: 'var(--ink)' }]} />
          </div>
        </Card>
        <Card title="Ro‘yxatdan o‘tishlar dinamikasi" icon={<UserPlus size={12} />} tone="pink">
          {days === 1
            ? <div className="kpi"><b>{formatSum(r.period)}</b><span className="delta-note">bugun</span></div>
            : <LineChart points={pts('regs')} />}
        </Card>
      </div>

      <div className="grid g-2">
        <Card title="Mamlakatlar" icon={<Globe2 size={12} />} tone="blue">
          <BarList unit="kishi" rows={a.countries.map((c) => ({
            label: <>{flag(c.code)} {COUNTRY_NAMES[c.code] || c.code || 'Noma’lum'}</>,
            value: c.visitors,
            sub: t.visitors ? `${Math.round((c.visitors / t.visitors) * 100)}%` : undefined,
          }))} />
        </Card>
        <Card title="Eng ko‘p ko‘rilgan sahifalar" icon={<Eye size={12} />} tone="pink">
          <BarList unit="ko‘rish" rows={a.pages.map((p) => ({
            label: <span title={p.path}>{p.label}{p.label !== p.path && <span className="delta-note"> {p.path}</span>}</span>,
            value: p.views, sub: `${formatSum(p.visitors)} kishi`,
          }))} />
        </Card>
      </div>

      <div className="grid g-3">
        <Card title="Qurilmalar" icon={<MonitorSmartphone size={12} />} tone="purple">
          <Donut center={formatSum(totalDev)} sub="tashrifchi" segments={a.devices.map((d, i) => ({ label: DEVICE[d.k] || d.k, value: d.v, color: COLORS[i % COLORS.length] }))} />
        </Card>
        <Card title="Brauzerlar" icon={<Globe2 size={12} />} tone="green">
          <BarList unit="kishi" rows={a.browsers.map((b) => ({ label: b.k, value: b.v }))} />
        </Card>
        <Card title="Qayerdan kelishdi" icon={<Link2 size={12} />} tone="yellow">
          <BarList unit="tashrif" rows={a.referrers.map((x) => ({ label: x.k || 'To‘g‘ridan-to‘g‘ri', value: x.v }))} />
        </Card>
      </div>

      <p className="delta-note">
        Statistika saytning o‘zida yig‘iladi: IP manzil saqlanmaydi, botlar hisobga olinmaydi. Mamlakat brauzer vaqt mintaqasi bo‘yicha aniqlanadi.
        Ma’lumotlar shu bo‘lim ishga tushgan kundan boshlab yig‘iladi.
      </p>
    </div>
  )
}
