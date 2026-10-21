import Link from 'next/link'
import { Pencil, Plus } from 'lucide-react'
import { db } from '@/lib/db'
import { CONTENT_STATUS, catName } from '@/lib/catalog'
import { formatSum } from '@/lib/format'
import { Badge, Card, Empty, PageHead, type SearchParams } from '@/components/ui'

export const metadata = { title: 'Kurslar' }

export default async function CoursesPage({ searchParams }: { searchParams: SearchParams }) {
  const p = await searchParams
  const courses = await db.course.findMany({ orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }], include: { _count: { select: { enrollments: true } } } })
  return (
    <>
      <PageHead title="Kurslar" sub="Web ilovadagi «Kurslar» bo'limi shu yerdan boshqariladi">
        <Link className="btn dark" href="/admin/courses/new"><Plus size={15} /> Yangi kurs</Link>
      </PageHead>
      {p.saved && <div className="ok-box">Kurs saqlandi</div>}
      <Card>
        {courses.length === 0 ? <Empty title="Kurslar yo'q" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Kurs</th><th>Soha</th><th>Narx</th><th>Davomiylik</th><th className="num">Yozilganlar</th><th className="num">Reyting</th><th>Holat</th><th /></tr></thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id}>
                    <td><Link href={`/admin/courses/${c.id}`} className="cell-main"><span><b>{c.title}</b><small>{c.provider} · {c.format}</small></span></Link></td>
                    <td>{catName(c.category)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{c.price ? `${formatSum(c.price)} so'm` : <Badge tone="green">Bepul</Badge>}</td>
                    <td>{c.duration} · {c.lessons} dars</td>
                    <td className="num">{c._count.enrollments} <small style={{ color: 'var(--muted)' }}>/ {formatSum(c.students)}</small></td>
                    <td className="num">★ {c.rating.toFixed(1)}</td>
                    <td><Badge tone={CONTENT_STATUS[c.status].tone}>{CONTENT_STATUS[c.status].label}</Badge></td>
                    <td><div className="acts"><Link className="btn sm icon" href={`/admin/courses/${c.id}`} aria-label="Tahrirlash"><Pencil size={14} /></Link></div></td>
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
