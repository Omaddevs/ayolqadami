import { notFound } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { Card, PageHead } from '@/components/ui'
import { Submit } from '@/components/client'
import { CompanyForm } from '@/components/content-forms'
import { deleteCompany } from '../../actions'

export const metadata = { title: 'Kompaniya' }

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  const item = await db.company.findUnique({ where: { id } })
  if (!item) notFound()
  return (
    <>
      <PageHead title={item.name} sub="Kompaniyani tahrirlash">
        {admin.role === 'ADMIN' && (
          <form action={deleteCompany}>
            <input type="hidden" name="id" value={item.id} />
            <Submit className="btn danger" confirm="Kompaniya profili o'chiriladi. Uning vakansiyalari saqlanib qoladi. Davom etasizmi?"><Trash2 size={15} /> O&apos;chirish</Submit>
          </form>
        )}
      </PageHead>
      <Card><CompanyForm c={item} /></Card>
    </>
  )
}
