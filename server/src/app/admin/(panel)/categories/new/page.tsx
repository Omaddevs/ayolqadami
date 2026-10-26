import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { Card, PageHead, sp, type SearchParams } from '@/components/ui'
import { CategoryForm } from '@/components/category-form'

export const metadata = { title: 'Yangi kategoriya' }

// ?parent=<id> — shu sohaga bo'lim qo'shish (ro'yxatdagi «+ Bo'lim» tugmasi)
export default async function NewCategoryPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin()
  const parentId = sp((await searchParams).parent)
  const roots = await db.category.findMany({ where: { parentId: null }, orderBy: [{ sort: 'asc' }, { name: 'asc' }] })
  const parent = roots.find((r) => r.id === parentId)
  return (
    <>
      <PageHead title={parent ? `Yangi bo'lim — ${parent.name}` : 'Yangi soha'} sub="Soha — vakansiyalarning asosiy guruhi; bo'lim — soha ichidagi yo'nalish (Frontend, Backend...)" />
      <Card><CategoryForm roots={roots} parentId={parent?.id} /></Card>
    </>
  )
}
