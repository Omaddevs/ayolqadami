import { notFound } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { Card, PageHead } from '@/components/ui'
import { Submit } from '@/components/client'
import { EventForm } from '@/components/content-forms'
import { deleteEvent } from '../../actions'

export const metadata = { title: 'Tadbir' }

export default async function EditTadbirPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  const item = await db.event.findUnique({ where: { id } })
  if (!item) notFound()
  return (
    <>
      <PageHead title={item.title} sub="Tadbirni tahrirlash">
        {admin.role === 'ADMIN' && (
          <form action={deleteEvent}>
            <input type="hidden" name="id" value={item.id} />
            <Submit className="btn danger" confirm="Tadbir butunlay o'chiriladi. Davom etasizmi?"><Trash2 size={15} /> O&apos;chirish</Submit>
          </form>
        )}
      </PageHead>
      <Card><EventForm e={item} /></Card>
    </>
  )
}
