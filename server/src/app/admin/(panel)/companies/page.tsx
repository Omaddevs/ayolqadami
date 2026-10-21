import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { BadgeCheck, Pencil, Plus } from 'lucide-react'
import { db } from '@/lib/db'
import { Badge, Card, Empty, Logo, PageHead, SearchBox, sp, type SearchParams } from '@/components/ui'
import { Submit } from '@/components/client'
import { toggleCompanyVerified } from '../actions'

export const metadata = { title: 'Kompaniyalar' }

export default async function CompaniesPage({ searchParams }: { searchParams: SearchParams }) {
  const p = await searchParams
  const q = sp(p.q)
  const where: Prisma.CompanyWhereInput = q ? { name: { contains: q, mode: 'insensitive' } } : {}
  const [companies, jobStats] = await Promise.all([
    db.company.findMany({ where, orderBy: { name: 'asc' } }),
    db.job.groupBy({ by: ['companyName', 'status'], _count: true }),
  ])
  const stat = (name: string, status?: string) =>
    jobStats.filter((s) => s.companyName === name && (!status || s.status === status)).reduce((n, s) => n + s._count, 0)

  return (
    <>
      <PageHead title="Kompaniyalar" sub="Ish beruvchi kompaniyalar profili va tasdiqlash belgisi">
        <Link className="btn dark" href="/admin/companies/new"><Plus size={15} /> Kompaniya qo&apos;shish</Link>
      </PageHead>
      {p.saved && <div className="ok-box">Kompaniya saqlandi</div>}
      <SearchBox q={q} placeholder="Kompaniya nomi" />
      <Card>
        {companies.length === 0 ? <Empty title="Kompaniya topilmadi" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Kompaniya</th><th>Xodimlar</th><th>Yil</th><th className="num">Faol / jami vakansiya</th><th>Belgi</th><th /></tr></thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/companies/${c.id}`} className="cell-main">
                        <Logo name={c.name} color={c.color} />
                        <span style={{ minWidth: 0 }}><b>{c.name}</b><small style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 420 }}>{c.about || '—'}</small></span>
                      </Link>
                    </td>
                    <td>{c.size || '—'}</td>
                    <td>{c.since || '—'}</td>
                    <td className="num"><Link href={`/admin/jobs?q=${encodeURIComponent(c.name)}`} style={{ color: 'var(--blue)' }}>{stat(c.name, 'ACTIVE')} / {stat(c.name)}</Link></td>
                    <td>{c.verified ? <Badge tone="green">Tasdiqlangan</Badge> : <Badge tone="gray">Tasdiqlanmagan</Badge>}</td>
                    <td>
                      <div className="acts">
                        <form action={toggleCompanyVerified}>
                          <input type="hidden" name="id" value={c.id} />
                          <Submit className="btn sm" title={c.verified ? 'Belgini olib tashlash' : 'Tasdiqlash'}><BadgeCheck size={14} />{c.verified ? 'Olib tashlash' : 'Tasdiqlash'}</Submit>
                        </form>
                        <Link className="btn sm icon" href={`/admin/companies/${c.id}`} aria-label="Tahrirlash"><Pencil size={14} /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
