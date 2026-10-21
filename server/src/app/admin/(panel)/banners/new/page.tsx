import { requireAdmin } from '@/lib/auth'
import { siteUrl } from '@/lib/login-bot'
import { Card, PageHead } from '@/components/ui'
import { BannerForm } from '@/components/banner-form'

export const metadata = { title: 'Yangi banner' }

export default async function NewBannerPage() {
  await requireAdmin()
  return (
    <>
      <PageHead title="Yangi banner" sub="Rasm yuklang va bosilganda qayerga olib borishini kiriting" />
      <Card><BannerForm site={siteUrl()} /></Card>
    </>
  )
}
