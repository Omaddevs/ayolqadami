import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { Archive, Check, Download, Pencil, Plus, X } from 'lucide-react'
import { db } from '@/lib/db'
import { CATEGORIES, JOB_STATUS, catName } from '@/lib/catalog'
import { salaryText, timeAgo } from '@/lib/format'
import { Badge, Card, Empty, Logo, PageHead, Pager, SearchBox, Tabs, pageOf, qs, sp, type SearchParams } from '@/components/ui'
import { Submit } from '@/components/client'
import { approveJob, archiveJob, rejectJob } from '../actions'

export const metadata = { title: 'Vakansiyalar' }
const LIMIT = 20

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const p = await searchParams
  const status = sp(p.status)
  const q = sp(p.q)
  const category = sp(p.category)
  const page = pageOf(p.page)

  const base: Prisma.JobWhereInput = {
    ...(category && { category }),
    ...(q && { OR: [{ title: { contains: q, mode: 'insensitive' } }, { companyName: { contains: q, mode: 'insensitive' } }, { city: { contains: q, mode: 'insensitive' } }] }),
  }
  const where: Prisma.JobWhereInput = { ...base, ...(status && { status: status as Prisma.EnumJobStatusFilter['equals'] }) }

  const [jobs, total, counts] = await Promise.all([
    db.job.findMany({
      where, skip: (page - 1) * LIMIT, take: LIMIT,
      // moderatsiyadagilar avval — eng eskisidan (navbat tartibida)
      orderBy: status === 'PENDING' ? { createdAt: 'asc' } : { createdAt: 'desc' },
      include: { _count: { select: { applications: true } }, author: { select: { name: true } } },
    }),
    db.job.count({ where }),
    db.job.groupBy({ by: ['status'], where: base, _count: true }),
  ])
  const now = new Date()
  const n = (s: string) => counts.find((c) => c.status === s)?._count ?? 0
  const all = counts.reduce((a, c) => a + c._count, 0)
  const link = (o: Record<string, string | number | undefined>) => `/admin/jobs${qs({ status, q, category, ...o })}`

  return (
    <>
      <PageHead title="Vakansiyalar" sub="Moderatsiya, tahrirlash va arxivlash">
        <a className="btn" href={`/admin/export/jobs${qs({ status, q, category })}`}><Download size={15} /> CSV</a>
        <Link className="btn dark" href="/admin/jobs/new"><Plus size={15} /> Yangi vakansiya</Link>
      </PageHead>
      {p.saved && <div className="ok-box">Vakansiya saqlandi</div>}
      <Tabs
        active={status}
        items={[
          { key: '', label: 'Hammasi', href: link({ status: undefined, page: undefined }), n: all },
          ...Object.entries(JOB_STATUS).map(([k, v]) => ({ key: k, label: v.label, href: link({ status: k, page: undefined }), n: n(k) })),
        ]}
      />
      <div style={{ height: 12 }} />
      <SearchBox q={q} placeholder="Lavozim, kompaniya yoki shahar" keep={{ status }}>
        <select className="select" name="category" defaultValue={category} aria-label="Soha">
          <option value="">Barcha sohalar</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </SearchBox>

      <Card>
        {jobs.length === 0 ? (
          <Empty title="Vakansiya topilmadi">Filtrlarni o&apos;zgartirib ko&apos;ring</Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Vakansiya</th><th>Soha / shahar</th><th>Maosh</th><th className="num">Arizalar</th><th>Holat</th><th>Sana</th><th /></tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <Link href={`/admin/jobs/${j.id}`} className="cell-main">
                        <Logo name={j.companyName} color={j.color} />
                        <span><b>{j.title}</b><small>{j.companyName}{j.author ? ` · ${j.author.name}` : ''}</small></span>
                      </Link>
                    </td>
                    <td><div>{catName(j.category)}</div><small style={{ color: 'var(--muted)' }}>{j.city} · {j.type}</small></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{salaryText(j.salaryFrom, j.salaryTo)}</td>
                    <td className="num">{j._count.applications}</td>
                    <td>
                      {j.status === 'ACTIVE' && j.expiresAt && j.expiresAt <= now
                        ? <Badge tone="gray">Muddati o&apos;tgan</Badge>
                        : <Badge tone={JOB_STATUS[j.status].tone}>{JOB_STATUS[j.status].label}</Badge>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }}>{timeAgo(j.createdAt)}</td>
                    <td>
                      <div className="acts">
                        {j.status === 'PENDING' && (
                          <>
                            <form action={approveJob}><input type="hidden" name="id" value={j.id} /><Submit className="btn sm green" title="Tasdiqlash"><Check size={14} /> Tasdiqlash</Submit></form>
                            <form action={rejectJob}><input type="hidden" name="id" value={j.id} /><Submit className="btn sm danger" title="Rad etish" confirm="Vakansiyani rad etasizmi?"><X size={14} /></Submit></form>
                          </>
                        )}
                        {j.status === 'ACTIVE' && (
                          <form action={archiveJob}><input type="hidden" name="id" value={j.id} /><Submit className="btn sm icon" title="Arxivlash" confirm="Vakansiya saytdan olib tashlanadi. Davom etasizmi?"><Archive size={14} /></Submit></form>
                        )}
                        <Link className="btn sm icon" href={`/admin/jobs/${j.id}`} aria-label="Tahrirlash" title="Tahrirlash"><Pencil size={14} /></Link>
                      </div>
                    </td>
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
