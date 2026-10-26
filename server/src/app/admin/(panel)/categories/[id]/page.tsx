import { notFound } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { Card, PageHead, sp, type SearchParams } from '@/components/ui'
import { Submit } from '@/components/client'
import { CategoryForm } from '@/components/category-form'
import { deleteCategory } from '../actions'

export const metadata = { title: 'Kategoriya' }

export default async function EditCategoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  const { id } = await params
  const error = sp((await searchParams).error)
  const admin = await requireAdmin()
  const [c, roots] = await Promise.all([
    db.category.findUnique({ where: { id }, include: { parent: true, _count: { select: { children: true } } } }),
    db.category.findMany({ where: { parentId: null }, orderBy: [{ sort: 'asc' }, { name: 'asc' }] }),
  ])
  if (!c) notFound()
  return (
    <>
      <PageHead title={c.name} sub={c.parent ? `«${c.parent.name}» sohasining bo'limi` : `Soha · ${c._count.children} ta bo'lim`}>
        {admin.role === 'ADMIN' && (
          <form action={deleteCategory}>
            <input type="hidden" name="id" value={c.id} />
            <Submit className="btn danger" confirm="Kategoriya butunlay o'chiriladi. Davom etasizmi?"><Trash2 size={15} /> O&apos;chirib tashlash</Submit>
          </form>
        )}
      </PageHead>
      {error && <div className="error-box" role="alert" style={{ marginBottom: 12 }}>{error}</div>}
      <Card><CategoryForm c={c} roots={roots} hasChildren={c._count.children > 0} /></Card>
    </>
  )
}
