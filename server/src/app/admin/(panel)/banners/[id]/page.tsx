import { notFound } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { siteUrl } from '@/lib/login-bot'
import { Card, PageHead } from '@/components/ui'
import { Submit } from '@/components/client'
import { BannerForm } from '@/components/banner-form'
import { deleteBanner } from '../actions'

export const metadata = { title: 'Banner' }

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  const b = await db.banner.findUnique({ where: { id } })
  if (!b) notFound()
  return (
    <>
      <PageHead title={b.title} sub={`Bannerni tahrirlash · ${b.clicks} marta bosilgan`}>
        {admin.role === 'ADMIN' && (
          <form action={deleteBanner}>
            <input type="hidden" name="id" value={b.id} />
            <Submit className="btn danger" confirm="Banner butunlay o'chiriladi. Davom etasizmi?"><Trash2 size={15} /> O&apos;chirish</Submit>
          </form>
        )}
      </PageHead>
      <Card><BannerForm b={b} site={siteUrl()} /></Card>
    </>
  )
}
