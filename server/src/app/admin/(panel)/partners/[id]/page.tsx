import { notFound } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { siteUrl } from '@/lib/login-bot'
import { Card, PageHead } from '@/components/ui'
import { Submit } from '@/components/client'
import { PartnerForm } from '@/components/partner-form'
import { deletePartner } from '../actions'

export const metadata = { title: 'Hamkor' }

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  const p = await db.partner.findUnique({ where: { id } })
  if (!p) notFound()
  return (
    <>
      <PageHead title={p.name} sub="Hamkorni tahrirlash">
        {admin.role === 'ADMIN' && (
          <form action={deletePartner}>
            <input type="hidden" name="id" value={p.id} />
            <Submit className="btn danger" confirm="Hamkor butunlay o'chiriladi. Davom etasizmi?"><Trash2 size={15} /> O&apos;chirish</Submit>
          </form>
        )}
      </PageHead>
      <Card><PartnerForm p={p} site={siteUrl()} /></Card>
    </>
  )
}
