import { db } from '@/lib/db'
import { Card, PageHead } from '@/components/ui'
import { JobForm } from '@/components/job-form'
import { categoryTree } from '@/lib/categories'

export const metadata = { title: 'Yangi vakansiya' }

export default async function NewJobPage() {
  const [companies, categories] = await Promise.all([db.company.findMany({ select: { name: true }, orderBy: { name: 'asc' } }), categoryTree()])
  return (
    <>
      <PageHead title="Yangi vakansiya" sub="Admin tomonidan qo'shilgan vakansiya moderatsiyasiz chop etiladi" />
      <Card><JobForm companies={companies.map((c) => c.name)} categories={categories} /></Card>
    </>
  )
}
