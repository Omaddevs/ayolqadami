import Link from 'next/link'
import { CornerDownRight, Eye, EyeOff, Pencil, Plus } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { categoryTree } from '@/lib/categories'
import { Badge, Card, Empty, PageHead, type SearchParams } from '@/components/ui'
import { Submit } from '@/components/client'
import { toggleCategory } from './actions'

export const metadata = { title: 'Kategoriyalar' }

// Sohalar va ularning bo'limlari: vakansiya formalarida, saytdagi filtrlar va dashboard menyusida ishlatiladi
export default async function CategoriesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin()
  const p = await searchParams
  const [tree, counts] = await Promise.all([
    categoryTree(),
    db.job.groupBy({ by: ['category', 'subcategory'], where: { status: 'ACTIVE' }, _count: { _all: true } }),
  ])
  const jobs = (cat: string, sub?: string) =>
    counts.filter((x) => x.category === cat && (sub === undefined || x.subcategory === sub)).reduce((n, x) => n + x._count._all, 0)
  const subs = tree.reduce((n, c) => n + c.children.length, 0)

  return (
    <>
      <PageHead title="Kategoriyalar" sub={`${tree.length} ta soha, ${subs} ta bo'lim · vakansiyalar shu ro'yxat bo'yicha guruhlanadi`}>
        <Link className="btn dark" href="/admin/categories/new"><Plus size={15} /> Yangi soha</Link>
      </PageHead>
      {p.saved && <div className="ok-box">Kategoriya saqlandi</div>}
      <Card>
        {tree.length === 0 ? <Empty title="Kategoriyalar yo'q">Birinchi sohani qo&apos;shing — vakansiyalar shu sohalarga bo&apos;linadi.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Soha / bo&apos;lim</th><th>Slug</th><th>Faol vakansiyalar</th><th>Holat</th><th /></tr></thead>
              <tbody>
                {tree.flatMap((c) => [
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/categories/${c.id}`} className="cell-main">
                        <span><b>{c.name}</b><small>{c.children.length ? `${c.children.length} ta bo'lim` : "Bo'limsiz"} · ikonka: {c.icon} · tartib: {c.sort}</small></span>
                      </Link>
                    </td>
                    <td><code>{c.slug}</code></td>
                    <td>{jobs(c.slug)}</td>
                    <td><Badge tone={c.active ? 'green' : 'gray'}>{c.active ? 'Saytda' : "O'chirilgan"}</Badge></td>
                    <td>
                      <div className="acts">
                        <Link className="btn sm" href={`/admin/categories/new?parent=${c.id}`}><Plus size={14} /> Bo&apos;lim</Link>
                        <Toggle id={c.id} active={c.active} />
                        <Link className="btn sm icon" href={`/admin/categories/${c.id}`} aria-label="Tahrirlash"><Pencil size={14} /></Link>
                      </div>
                    </td>
                  </tr>,
                  ...c.children.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <Link href={`/admin/categories/${s.id}`} className="cell-main" style={{ paddingLeft: 18 }}>
                          <CornerDownRight size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                          <span><b style={{ fontWeight: 500 }}>{s.name}</b><small>tartib: {s.sort}</small></span>
                        </Link>
                      </td>
                      <td><code>{c.slug}/{s.slug}</code></td>
                      <td>{jobs(c.slug, s.slug)}</td>
                      <td><Badge tone={s.active && c.active ? 'green' : 'gray'}>{!s.active ? "O'chirilgan" : c.active ? 'Saytda' : 'Soha o\'chirilgan'}</Badge></td>
                      <td>
                        <div className="acts">
                          <Toggle id={s.id} active={s.active} />
                          <Link className="btn sm icon" href={`/admin/categories/${s.id}`} aria-label="Tahrirlash"><Pencil size={14} /></Link>
                        </div>
                      </td>
                    </tr>
                  )),
                ])}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

function Toggle({ id, active }: { id: string; active: boolean }) {
  return (
    <form action={toggleCategory}>
      <input type="hidden" name="id" value={id} />
      <Submit className="btn sm" title={active ? "Saytda yashirish" : 'Saytda ko\'rsatish'}>
        {active ? <><EyeOff size={14} /> O&apos;chirish</> : <><Eye size={14} /> Yoqish</>}
      </Submit>
    </form>
  )
}
