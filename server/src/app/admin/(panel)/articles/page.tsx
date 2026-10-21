import Link from 'next/link'
import { Pencil, Plus } from 'lucide-react'
import { db } from '@/lib/db'
import { CONTENT_STATUS } from '@/lib/catalog'
import { shortDate } from '@/lib/format'
import { Badge, Card, Empty, PageHead, type SearchParams } from '@/components/ui'

export const metadata = { title: 'Maqolalar' }

export default async function ArticlesPage({ searchParams }: { searchParams: SearchParams }) {
  const p = await searchParams
  const items = await db.article.findMany({ orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }] })
  return (
    <>
      <PageHead title="Maqolalar" sub="Foydali maqolalar — web ilovadagi «Maqolalar» bo'limi">
        <Link className="btn dark" href="/admin/articles/new"><Plus size={15} /> Yangi maqola</Link>
      </PageHead>
      {p.saved && <div className="ok-box">Maqola saqlandi</div>}
      <Card>
        {items.length === 0 ? <Empty title="Maqolalar yo'q" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Maqola</th><th>Teg</th><th className="num">O&apos;qish</th><th>Chop etilgan</th><th>Holat</th><th /></tr></thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/admin/articles/${a.id}`} className="cell-main">
                        <span className="logo" style={{ background: `linear-gradient(135deg, ${a.cover[0] || '#8286F6'}, ${a.cover[1] || '#4C42EA'})` }} />
                        <span style={{ minWidth: 0 }}><b>{a.title}</b><small style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.excerpt}</small></span>
                      </Link>
                    </td>
                    <td><span className="chip">{a.tag}</span></td>
                    <td className="num">{a.readMinutes} daq</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{a.publishedAt ? shortDate(a.publishedAt) : '—'}</td>
                    <td><Badge tone={CONTENT_STATUS[a.status].tone}>{CONTENT_STATUS[a.status].label}</Badge></td>
                    <td><div className="acts"><Link className="btn sm icon" href={`/admin/articles/${a.id}`} aria-label="Tahrirlash"><Pencil size={14} /></Link></div></td>
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
