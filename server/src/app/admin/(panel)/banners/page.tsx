import Link from 'next/link'
import { Eye, EyeOff, Pencil, Plus } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { siteUrl } from '@/lib/login-bot'
import { dateTime } from '@/lib/format'
import { Badge, Card, Empty, PageHead, type SearchParams } from '@/components/ui'
import { Submit } from '@/components/client'
import { toggleBanner } from './actions'

export const metadata = { title: 'Bannerlar' }

export default async function BannersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin()
  const p = await searchParams
  const items = await db.banner.findMany({ orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }] })
  const site = siteUrl()
  const now = new Date()
  // saytdagi fayl (/banners/x.jpg) admin panelda sayt manzili bilan ko'rsatiladi
  const src = (u: string) => (u.startsWith('/') && !u.startsWith('/media/') ? site + u : u)
  const state = (b: (typeof items)[number]) =>
    !b.active ? { tone: 'gray' as const, label: "O'chirilgan" }
      : b.startsAt && b.startsAt > now ? { tone: 'yellow' as const, label: 'Rejalashtirilgan' }
      : b.endsAt && b.endsAt <= now ? { tone: 'gray' as const, label: 'Muddati tugagan' }
      : { tone: 'green' as const, label: 'Saytda' }
  return (
    <>
      <PageHead title="Bannerlar" sub="Bosh sahifadagi aylanma bannerlar: rasm, havola va ko'rsatish davri">
        <Link className="btn dark" href="/admin/banners/new"><Plus size={15} /> Yangi banner</Link>
      </PageHead>
      {p.saved && <div className="ok-box">Banner saqlandi</div>}
      <Card>
        {items.length === 0 ? <Empty title="Bannerlar yo'q">Birinchi bannerni qo&apos;shing — u saytning bosh sahifasida chiqadi.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Banner</th><th>Havola</th><th>Davr</th><th>Bosishlar</th><th>Holat</th><th /></tr></thead>
              <tbody>
                {items.map((b) => {
                  const s = state(b)
                  return (
                    <tr key={b.id}>
                      <td>
                        <Link href={`/admin/banners/${b.id}`} className="cell-main">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="banner-thumb" src={src(b.imageUrl)} alt="" />
                          <span><b>{b.title}</b><small>Tartib: {b.sort}</small></span>
                        </Link>
                      </td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.linkUrl || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                        {b.startsAt || b.endsAt ? <>{b.startsAt ? dateTime(b.startsAt).slice(0, 10) : '…'} — {b.endsAt ? dateTime(b.endsAt).slice(0, 10) : '…'}</> : 'Doimiy'}
                      </td>
                      <td>{b.clicks}</td>
                      <td><Badge tone={s.tone}>{s.label}</Badge></td>
                      <td>
                        <div className="acts">
                          <form action={toggleBanner}>
                            <input type="hidden" name="id" value={b.id} />
                            <Submit className="btn sm" title={b.active ? "O'chirish" : 'Yoqish'}>
                              {b.active ? <><EyeOff size={14} /> O&apos;chirish</> : <><Eye size={14} /> Yoqish</>}
                            </Submit>
                          </form>
                          <Link className="btn sm icon" href={`/admin/banners/${b.id}`} aria-label="Tahrirlash"><Pencil size={14} /></Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
