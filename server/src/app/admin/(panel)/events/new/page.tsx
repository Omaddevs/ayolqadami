import { Card, PageHead } from '@/components/ui'
import { EventForm } from '@/components/content-forms'

export const metadata = { title: 'Yangi tadbir' }

export default function NewTadbirPage() {
  return (
    <>
      <PageHead title="Yangi tadbir" />
      <Card><EventForm /></Card>
    </>
  )
}
