import { Card, PageHead } from '@/components/ui'
import { ArticleForm } from '@/components/content-forms'

export const metadata = { title: 'Yangi maqola' }

export default function NewMaqolaPage() {
  return (
    <>
      <PageHead title="Yangi maqola" />
      <Card><ArticleForm /></Card>
    </>
  )
}
