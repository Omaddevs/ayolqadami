import Link from 'next/link'
import type { ContactKind, Prisma } from '@prisma/client'
import { Download, MessageCircle, Phone, Send, TrendingUp, Users, X } from 'lucide-react'
import { db } from '@/lib/db'
import { CONTACT_KIND, contactStats, conversion } from '@/lib/contacts'
import { endOfDayTashkent, startOfDayTashkent } from '@/lib/dates'
import { dateTime, formatSum, timeAgo } from '@/lib/format'
import { formatUzPhone } from '@/lib/phone'
import { Avatar, Badge, Card, Empty, Logo, PageHead, Pager, SearchBox, Tabs, pageOf, qs, sp, type SearchParams } from '@/components/ui'
import { LineChart } from '@/components/charts'

export const metadata = { title: "Bog'lanishlar" }
const LIMIT = 30

// Eng ko'p bog'lanilgan vakansiyalar: qo'ng'iroq va yozishlarga ajratib
async function topJobs(where: Prisma.JobContactWhereInput) {
  const raw = await db.jobContact.groupBy({ by: ['jobId'], where, _count: { _all: true }, orderBy: { _count: { jobId: 'desc' } }, take: 8 })
  const ids = raw.map((t) => t.jobId)
  if (!ids.length) return []
  const [jobs, kinds] = await Promise.all([
    db.job.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, companyName: true, color: true, views: true } }),
    db.jobContact.groupBy({ by: ['jobId', 'kind'], where: { ...where, jobId: { in: ids } }, _count: { _all: true } }),
  ])
  return raw.flatMap((t) => {
    const job = jobs.find((x) => x.id === t.jobId)
    if (!job) return []
    const k = (kd: ContactKind) => kinds.find((x) => x.jobId === t.jobId && x.kind === kd)?._count._all ?? 0
    return [{ job, total: t._count._all, calls: k('CALL'), writes: k('TELEGRAM') + k('MESSAGE') }]
  })
}

// Vakansiyalar bo'yicha bog'lanishlar: «Bog'lanish» → qo'ng'iroq, Telegram'ga o'tish va saytdan yozilgan savollar
export default async function ContactsPage({ searchParams }: { searchParams: SearchParams }) {
  const p = await searchParams
  const kind = sp(p.kind) as ContactKind | ''
  const jobId = sp(p.job)
  const q = sp(p.q)
  const from = sp(p.from)
  const to = sp(p.to)
  const page = pageOf(p.page)

  const created = { ...(startOfDayTashkent(from) && { gte: startOfDayTashkent(from)! }), ...(endOfDayTashkent(to) && { lte: endOfDayTashkent(to)! }) }
  const base: Prisma.JobContactWhereInput = {
    ...(jobId && { jobId }),
    ...((from || to) && { createdAt: created }),
    ...(q && { OR: [
      { job: { title: { contains: q, mode: 'insensitive' } } },
      { job: { companyName: { contains: q, mode: 'insensitive' } } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { text: { contains: q, mode: 'insensitive' } },
    ] }),
  }
  const where: Prisma.JobContactWhereInput = { ...base, ...(kind && CONTACT_KIND[kind] && { kind }) }

  const [stats, items, total, job] = await Promise.all([
    contactStats(base, 14),
    db.jobContact.findMany({
      where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * LIMIT, take: LIMIT,
      include: {
        user: { select: { id: true, name: true, photo: true, phone: true } },
        job: { select: { id: true, title: true, companyName: true, color: true } },
      },
    }),
    db.jobContact.count({ where }),
    jobId ? db.job.findUnique({ where: { id: jobId }, select: { id: true, title: true, companyName: true, color: true, views: true } }) : null,
  ])
  const top: Awaited<ReturnType<typeof topJobs>> = jobId ? [] : await topJobs(base)

  const link = (o: Record<string, string | number | undefined>) => `/admin/contacts${qs({ kind, job: jobId, q, from, to, ...o })}`

  return (
    <>
      <PageHead title="Bog'lanishlar" sub="Vakansiyalar bo'yicha qo'ng'iroqlar, Telegram'ga o'tishlar va ish beruvchiga yozilgan savollar">
        <a className="btn" href={`/admin/export/contacts${qs({ kind, job: jobId, q, from, to })}`}><Download size={15} /> CSV</a>
      </PageHead>

      {job && (
        <div className="ok-box" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo name={job.companyName} color={job.color} />
          <span style={{ flex: 1, minWidth: 0 }}>Vakansiya: <Link href={`/admin/jobs/${job.id}`}><b>{job.title}</b></Link> · {job.companyName}</span>
          <Link className="btn sm" href={link({ job: undefined, page: undefined })}><X size={14} /> Filtrni olib tashlash</Link>
        </div>
      )}

      <div className="grid g-4" style={{ marginBottom: 14 }}>
        <Card title="Jami bog'lanish" icon={<TrendingUp size={12} />} tone="purple">
          <div className="kpi"><b>{formatSum(stats.total)}</b><span className="delta-note">{stats.week} ta oxirgi 7 kunda</span></div>
        </Card>
        <Card title="Qo'ng'iroqlar" icon={<Phone size={12} />} tone="green">
          <div className="kpi"><b>{formatSum(stats.calls)}</b><span className="delta-note">{stats.total ? Math.round((stats.calls / stats.total) * 100) : 0}% ulushi</span></div>
        </Card>
        <Card title="Yozishlar" icon={<Send size={12} />} tone="blue">
          <div className="kpi"><b>{formatSum(stats.telegram + stats.messages)}</b><span className="delta-note">Telegram {stats.telegram} · savol {stats.messages}</span></div>
        </Card>
        <Card title="Noyob nomzodlar" icon={<Users size={12} />} tone="pink">
          <div className="kpi">
            <b>{formatSum(stats.unique)}</b>
            <span className="delta-note">{job ? `ko'rishdan ${conversion(stats.unique, job.views)}%` : 'kishi bog\'langan'}</span>
          </div>
        </Card>
      </div>

      <div className={`grid ${top.length ? 'g-side' : ''}`} style={{ marginBottom: 14 }}>
        <Card title="Oxirgi 14 kun" icon={<TrendingUp size={12} />} tone="green">
          <LineChart points={stats.chart} color="var(--green)" />
        </Card>
        {top.length > 0 && (
          <Card title="Eng ko'p bog'lanilgan" icon={<Phone size={12} />} tone="yellow" href="/admin/jobs?sort=calls">
            <div className="rows">
              {top.map((t) => (
                <Link key={t.job.id} href={link({ job: t.job.id, page: undefined })} className="row">
                  <Logo name={t.job.companyName} color={t.job.color} />
                  <div style={{ minWidth: 0 }}><div className="t">{t.job.title}</div><div className="s">{t.job.companyName} · {conversion(t.total, t.job.views)}% ko&apos;rishdan</div></div>
                  <span className="when" title="Qo'ng'iroq / yozish"><Phone size={11} /> {t.calls} · <MessageCircle size={11} /> {t.writes}</span>
                  <Badge tone="gray">{t.total}</Badge>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Tabs
        active={kind}
        items={[
          { key: '', label: 'Hammasi', href: link({ kind: undefined, page: undefined }), n: stats.total },
          { key: 'CALL', label: "Qo'ng'iroqlar", href: link({ kind: 'CALL', page: undefined }), n: stats.calls },
          { key: 'TELEGRAM', label: 'Telegram', href: link({ kind: 'TELEGRAM', page: undefined }), n: stats.telegram },
          { key: 'MESSAGE', label: 'Savollar', href: link({ kind: 'MESSAGE', page: undefined }), n: stats.messages },
        ]}
      />
      <div style={{ height: 12 }} />
      <SearchBox q={q} placeholder="Vakansiya, kompaniya, nomzod yoki savol matni" keep={{ kind, job: jobId }}>
        <input className="input" type="date" name="from" defaultValue={from} aria-label="Sanadan" style={{ width: 'auto' }} />
        <input className="input" type="date" name="to" defaultValue={to} aria-label="Sanagacha" style={{ width: 'auto' }} />
      </SearchBox>

      <Card>
        {items.length === 0 ? (
          <Empty title="Bog'lanishlar topilmadi">Nomzod vakansiyada «Bog&apos;lanish»ni bosganda shu yerda ko&apos;rinadi</Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Nomzod</th><th>Vakansiya</th><th>Turi</th><th>Savol</th><th>Sana</th></tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.user ? (
                        <Link href={`/admin/users/${c.user.id}`} className="cell-main">
                          <Avatar name={c.user.name} src={c.user.photo} />
                          <span><b>{c.user.name}</b><small>{c.user.phone ? formatUzPhone(c.user.phone) : '—'}</small></span>
                        </Link>
                      ) : (
                        <span className="cell-main"><Avatar name="Mehmon" /><span><b>Mehmon</b><small>tizimga kirmagan</small></span></span>
                      )}
                    </td>
                    <td>
                      <Link href={link({ job: c.job.id, page: undefined })} className="cell-main">
                        <Logo name={c.job.companyName} color={c.job.color} />
                        <span><b>{c.job.title}</b><small>{c.job.companyName}</small></span>
                      </Link>
                    </td>
                    <td><Badge tone={CONTACT_KIND[c.kind].tone}>{CONTACT_KIND[c.kind].label}</Badge></td>
                    <td style={{ maxWidth: 360, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.text || <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }} title={dateTime(c.createdAt)}>{timeAgo(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager page={page} limit={LIMIT} total={total} href={(pg) => link({ page: pg })} />
          </div>
        )}
      </Card>
    </>
  )
}
