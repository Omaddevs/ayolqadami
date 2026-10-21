import { db } from '@/lib/db'
import { Card, PageHead } from '@/components/ui'
import { JobForm } from '@/components/job-form'

export const metadata = { title: 'Yangi vakansiya' }

export default async function NewJobPage() {
  const companies = await db.company.findMany({ select: { name: true }, orderBy: { name: 'asc' } })
  return (
    <>
      <PageHead title="Yangi vakansiya" sub="Admin tomonidan qo'shilgan vakansiya moderatsiyasiz chop etiladi" />
      <Card><JobForm companies={companies.map((c) => c.name)} /></Card>
    </>
  )
}
