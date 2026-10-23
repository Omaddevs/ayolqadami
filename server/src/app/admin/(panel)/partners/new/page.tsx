import { requireAdmin } from '@/lib/auth'
import { siteUrl } from '@/lib/login-bot'
import { Card, PageHead } from '@/components/ui'
import { PartnerForm } from '@/components/partner-form'

export const metadata = { title: 'Yangi hamkor' }

export default async function NewPartnerPage() {
  await requireAdmin()
  return (
    <>
      <PageHead title="Yangi hamkor" sub="Logotipni yuklang yoki havolasini kiriting va kerakli o'lchamda qirqing" />
      <Card><PartnerForm site={siteUrl()} /></Card>
    </>
  )
}
