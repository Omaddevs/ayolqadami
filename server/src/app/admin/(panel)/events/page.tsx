import Link from 'next/link'
import { Pencil, Plus } from 'lucide-react'
import { db } from '@/lib/db'
import { CONTENT_STATUS } from '@/lib/catalog'
import { Badge, Card, Empty, PageHead, type SearchParams } from '@/components/ui'

export const metadata = { title: 'Tadbirlar' }

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const p = await searchParams
  const items = await db.event.findMany({ orderBy: [{ startsAt: 'asc' }, { createdAt: 'asc' }] })
  return (
    <>
      <PageHead title="Tadbirlar" sub="Forumlar, meetuplar va yarmarkalar">
        <Link className="btn dark" href="/admin/events/new"><Plus size={15} /> Yangi tadbir</Link>
      </PageHead>
      {p.saved && <div className="ok-box">Tadbir saqlandi</div>}
      <Card>
        {items.length === 0 ? <Empty title="Tadbirlar yo'q" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Tadbir</th><th>Sana</th><th>Joy</th><th>Holat</th><th /></tr></thead>
              <tbody>
                {items.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link href={`/admin/events/${e.id}`} className="cell-main">
                        <span className="logo" style={{ background: `linear-gradient(135deg, ${e.cover[0] || '#6E6AF6'}, ${e.cover[1] || '#4338CA'})` }} />
                        <span><b>{e.title}</b><small>{e.tag}</small></span>
                      </Link>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{e.dateLabel}</td>
                    <td>{e.place}</td>
                    <td><Badge tone={CONTENT_STATUS[e.status].tone}>{CONTENT_STATUS[e.status].label}</Badge></td>
                    <td><div className="acts"><Link className="btn sm icon" href={`/admin/events/${e.id}`} aria-label="Tahrirlash"><Pencil size={14} /></Link></div></td>
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
