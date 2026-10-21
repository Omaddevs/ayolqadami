import Link from 'next/link'
import type { Prisma, Role } from '@prisma/client'
import { Download } from 'lucide-react'
import { db } from '@/lib/db'
import { ROLE } from '@/lib/catalog'
import { shortDate, timeAgo } from '@/lib/format'
import { formatUzPhone, phoneDigits } from '@/lib/phone'
import { Avatar, Badge, Card, Empty, PageHead, Pager, SearchBox, Tabs, pageOf, qs, sp, type SearchParams } from '@/components/ui'

export const metadata = { title: 'Foydalanuvchilar' }
const LIMIT = 25

export default async function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  const p = await searchParams
  const role = sp(p.role)
  const status = sp(p.status)
  const q = sp(p.q)
  const page = pageOf(p.page)
  const digits = phoneDigits(q)

  const base: Prisma.UserWhereInput = {
    ...(status && { status: status as 'ACTIVE' | 'BLOCKED' }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
        ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
      ],
    }),
  }
  const where: Prisma.UserWhereInput = { ...base, ...(role && { role: role as Role }) }

  const [users, total, counts] = await Promise.all([
    db.user.findMany({
      where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * LIMIT, take: LIMIT,
      include: { _count: { select: { applications: true, jobs: true } } },
    }),
    db.user.count({ where }),
    db.user.groupBy({ by: ['role'], where: base, _count: true }),
  ])
  const n = (r: string) => counts.find((c) => c.role === r)?._count ?? 0
  const link = (o: Record<string, string | number | undefined>) => `/admin/users${qs({ role, status, q, ...o })}`

  return (
    <>
      <PageHead title="Foydalanuvchilar" sub="Ish izlovchilar, ish beruvchilar va administratorlar">
        <a className="btn" href={`/admin/export/users${qs({ role, status, q })}`}><Download size={15} /> CSV</a>
      </PageHead>
      <Tabs
        active={role}
        items={[
          { key: '', label: 'Hammasi', href: link({ role: undefined, page: undefined }), n: counts.reduce((a, c) => a + c._count, 0) },
          ...Object.entries(ROLE).map(([k, v]) => ({ key: k, label: v.label, href: link({ role: k, page: undefined }), n: n(k) })),
        ]}
      />
      <div style={{ height: 12 }} />
      <SearchBox q={q} placeholder="Ism, telefon, email yoki kompaniya" keep={{ role }}>
        <select className="select" name="status" defaultValue={status} aria-label="Holat">
          <option value="">Barcha holatlar</option>
          <option value="ACTIVE">Faol</option>
          <option value="BLOCKED">Bloklangan</option>
        </select>
      </SearchBox>
      <Card>
        {users.length === 0 ? <Empty title="Foydalanuvchi topilmadi" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Foydalanuvchi</th><th>Telefon</th><th>Rol</th><th>Shahar</th><th className="num">Faollik</th><th>Ro&apos;yxatdan o&apos;tgan</th><th>Oxirgi kirish</th><th>Holat</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link href={`/admin/users/${u.id}`} className="cell-main">
                        <Avatar name={u.name} src={u.photo} />
                        <span><b>{u.name}</b><small>{u.company || u.email || '—'}</small></span>
                      </Link>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatUzPhone(u.phone) || '—'}</td>
                    <td><Badge tone={ROLE[u.role].tone}>{ROLE[u.role].label}</Badge></td>
                    <td>{u.city || '—'}</td>
                    <td className="num" style={{ whiteSpace: 'nowrap' }}>{u.role === 'EMPLOYER' ? `${u._count.jobs} vakansiya` : `${u._count.applications} ariza`}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{shortDate(u.createdAt)}</td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }}>{u.lastLoginAt ? timeAgo(u.lastLoginAt) : '—'}</td>
                    <td>{u.status === 'ACTIVE' ? <Badge tone="green">Faol</Badge> : <Badge tone="red">Bloklangan</Badge>}</td>
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
