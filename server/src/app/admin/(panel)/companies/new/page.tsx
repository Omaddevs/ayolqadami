import { Card, PageHead } from '@/components/ui'
import { CompanyForm } from '@/components/content-forms'

export const metadata = { title: 'Yangi kompaniya' }

export default function NewKompaniyaPage() {
  return (
    <>
      <PageHead title="Yangi kompaniya" />
      <Card><CompanyForm /></Card>
    </>
  )
}
