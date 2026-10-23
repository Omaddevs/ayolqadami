import Link from 'next/link'
import { Eye, EyeOff, Pencil, Plus } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { siteUrl } from '@/lib/login-bot'
import { Badge, Card, Empty, PageHead, type SearchParams } from '@/components/ui'
import { Submit } from '@/components/client'
import { togglePartner } from './actions'

export const metadata = { title: 'Hamkorlar' }

export default async function PartnersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin()
  const p = await searchParams
  const items = await db.partner.findMany({ orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }] })
  const live = items.filter((x) => x.active).length
  const site = siteUrl()
  const src = (u: string) => (u.startsWith('/') && !u.startsWith('/media/') ? site + u : u)
  const mode = live === 0 ? 'Saytda ko\'rinmaydi (faol hamkor yo\'q)' : live > 5 ? `Saytda ${live} ta — aylanuvchi lenta` : `Saytda ${live} ta — qotib turadi (6 tadan boshlab aylanadi)`
  return (
    <>
      <PageHead title="Hamkorlar" sub={`Bosh sahifadagi hamkorlar lentasi · ${mode}`}>
        <Link className="btn dark" href="/admin/partners/new"><Plus size={15} /> Yangi hamkor</Link>
      </PageHead>
      {p.saved && <div className="ok-box">Hamkor saqlandi</div>}
      <Card>
        {items.length === 0 ? <Empty title="Hamkorlar yo'q">Birinchi hamkorni qo&apos;shing — logotipi saytning bosh sahifasida chiqadi. Hamkor bo&apos;lmasa, lenta ko&apos;rinmaydi.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Hamkor</th><th>Havola</th><th>Holat</th><th /></tr></thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <Link href={`/admin/partners/${x.id}`} className="cell-main">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="partner-thumb" src={src(x.imageUrl)} alt="" />
                        <span><b>{x.name}</b><small>Tartib: {x.sort}</small></span>
                      </Link>
                    </td>
                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.linkUrl || '—'}</td>
                    <td><Badge tone={x.active ? 'green' : 'gray'}>{x.active ? 'Saytda' : "O'chirilgan"}</Badge></td>
                    <td>
                      <div className="acts">
                        <form action={togglePartner}>
                          <input type="hidden" name="id" value={x.id} />
                          <Submit className="btn sm" title={x.active ? "O'chirish" : 'Yoqish'}>
                            {x.active ? <><EyeOff size={14} /> O&apos;chirish</> : <><Eye size={14} /> Yoqish</>}
                          </Submit>
                        </form>
                        <Link className="btn sm icon" href={`/admin/partners/${x.id}`} aria-label="Tahrirlash"><Pencil size={14} /></Link>
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
