import Link from 'next/link'
import type { ApplicationStatus, Prisma } from '@prisma/client'
import { Download } from 'lucide-react'
import { db } from '@/lib/db'
import { APP_STATUS } from '@/lib/catalog'
import { timeAgo } from '@/lib/format'
import { Avatar, Card, Empty, Logo, PageHead, Pager, SearchBox, Tabs, pageOf, qs, sp, type SearchParams } from '@/components/ui'
import { AutoSelect } from '@/components/client'
import { setApplicationStatus } from '../actions'

export const metadata = { title: 'Arizalar' }
const LIMIT = 25
const OPTIONS = Object.entries(APP_STATUS).map(([value, v]) => ({ value, label: v.label }))

export default async function ApplicationsPage({ searchParams }: { searchParams: SearchParams }) {
  const p = await searchParams
  const status = sp(p.status)
  const q = sp(p.q)
  const page = pageOf(p.page)

  const base: Prisma.ApplicationWhereInput = q
    ? { OR: [{ job: { title: { contains: q, mode: 'insensitive' } } }, { job: { companyName: { contains: q, mode: 'insensitive' } } }, { user: { name: { contains: q, mode: 'insensitive' } } }] }
    : {}
  const where: Prisma.ApplicationWhereInput = { ...base, ...(status && { status: status as ApplicationStatus }) }

  const [apps, total, counts] = await Promise.all([
    db.application.findMany({
      where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * LIMIT, take: LIMIT,
      include: { user: { select: { id: true, name: true, photo: true, city: true } }, job: { select: { id: true, title: true, companyName: true, color: true } } },
    }),
    db.application.count({ where }),
    db.application.groupBy({ by: ['status'], where: base, _count: true }),
  ])
  const n = (s: string) => counts.find((c) => c.status === s)?._count ?? 0
  const link = (o: Record<string, string | number | undefined>) => `/admin/applications${qs({ status, q, ...o })}`

  return (
    <>
      <PageHead title="Arizalar" sub="Nomzodlar topshirgan arizalar va ularning holati">
        <a className="btn" href={`/admin/export/applications${qs({ status, q })}`}><Download size={15} /> CSV</a>
      </PageHead>
      <Tabs
        active={status}
        items={[
          { key: '', label: 'Hammasi', href: link({ status: undefined, page: undefined }), n: counts.reduce((a, c) => a + c._count, 0) },
          ...Object.entries(APP_STATUS).map(([k, v]) => ({ key: k, label: v.label, href: link({ status: k, page: undefined }), n: n(k) })),
        ]}
      />
      <div style={{ height: 12 }} />
      <SearchBox q={q} placeholder="Nomzod, vakansiya yoki kompaniya" keep={{ status }} />
      <Card>
        {apps.length === 0 ? <Empty title="Ariza topilmadi" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Nomzod</th><th>Vakansiya</th><th>Xat</th><th>Sana</th><th>Holat</th></tr></thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/admin/users/${a.user.id}`} className="cell-main" style={{ minWidth: 180 }}>
                        <Avatar name={a.user.name} src={a.user.photo} />
                        <span><b>{a.user.name}</b><small>{a.user.city || ''}</small></span>
                      </Link>
                    </td>
                    <td>
                      <Link href={`/admin/jobs/${a.job.id}`} className="cell-main">
                        <Logo name={a.job.companyName} color={a.job.color} />
                        <span><b>{a.job.title}</b><small>{a.job.companyName}</small></span>
                      </Link>
                    </td>
                    <td style={{ maxWidth: 260, color: 'var(--muted)' }}>
                      <span title={a.letter} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.letter || '—'}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }}>{timeAgo(a.createdAt)}</td>
                    <td>
                      <form action={setApplicationStatus}>
                        <input type="hidden" name="id" value={a.id} />
                        <AutoSelect name="status" defaultValue={a.status} options={OPTIONS} label="Ariza holati" />
                      </form>
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
