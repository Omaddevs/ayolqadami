import { Card, PageHead } from '@/components/ui'
import { CourseForm } from '@/components/content-forms'

export const metadata = { title: 'Yangi kurs' }

export default function NewKursPage() {
  return (
    <>
      <PageHead title="Yangi kurs" />
      <Card><CourseForm /></Card>
    </>
  )
}
