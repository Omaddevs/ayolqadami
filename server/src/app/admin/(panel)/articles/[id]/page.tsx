import { notFound } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { Card, PageHead } from '@/components/ui'
import { Submit } from '@/components/client'
import { ArticleForm } from '@/components/content-forms'
import { deleteArticle } from '../../actions'

export const metadata = { title: 'Maqola' }

export default async function EditMaqolaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  const item = await db.article.findUnique({ where: { id } })
  if (!item) notFound()
  return (
    <>
      <PageHead title={item.title} sub="Maqolani tahrirlash">
        {admin.role === 'ADMIN' && (
          <form action={deleteArticle}>
            <input type="hidden" name="id" value={item.id} />
            <Submit className="btn danger" confirm="Maqola butunlay o'chiriladi. Davom etasizmi?"><Trash2 size={15} /> O&apos;chirish</Submit>
          </form>
        )}
      </PageHead>
      <Card><ArticleForm a={item} /></Card>
    </>
  )
}
