import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import type { AdStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { timeAgo } from '@/lib/format'
import { adTitle, templateById } from '@/lib/ad-templates'
import { Badge, Card, Empty, PageHead, Tabs, sp, type SearchParams } from '@/components/ui'

export const metadata = { title: "E'lonlar" }

const STATUS: Record<AdStatus, { label: string; tone: 'yellow' | 'green' | 'red' }> = {
  PENDING: { label: 'Kutilmoqda', tone: 'yellow' },
  PUBLISHED: { label: 'Joylangan', tone: 'green' },
  REJECTED: { label: 'Rad etilgan', tone: 'red' },
}

export default async function AdsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin()
  const p = await searchParams
  const status = (['PENDING', 'PUBLISHED', 'REJECTED'] as const).find((s) => s === sp(p.status)) || 'PENDING'
  const [items, counts] = await Promise.all([
    db.ad.findMany({ where: { status }, orderBy: { createdAt: status === 'PENDING' ? 'asc' : 'desc' }, take: 100, include: { _count: { select: { posts: { where: { status: 'SENT' } } } } } }),
    db.ad.groupBy({ by: ['status'], _count: true }),
  ])
  const n = (s: AdStatus) => counts.find((c) => c.status === s)?._count ?? 0
  return (
    <>
      <PageHead title="E'lonlar" sub="Botdagi «E'lon berish» orqali kelgan e'lonlar: tekshiring, tahrirlang, kanallarga joylang" />
      <Tabs active={status} items={(['PENDING', 'PUBLISHED', 'REJECTED'] as const).map((s) => ({ key: s, label: STATUS[s].label, href: `/admin/ads?status=${s}`, n: n(s) }))} />
      <Card className="mt-12">
        {items.length === 0 ? <Empty title={status === 'PENDING' ? "Yangi e'lon yo'q" : "E'lonlar yo'q"} /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>№</th><th>E&apos;lon</th><th>Kim berdi</th><th>Kanallar</th><th>Holat</th><th>Vaqt</th></tr></thead>
              <tbody>
                {items.map((a) => {
                  const tpl = templateById(a.template)
                  return (
                    <tr key={a.id}>
                      <td style={{ color: 'var(--muted)' }}>#{a.number}</td>
                      <td>
                        <Link href={`/admin/ads/${a.id}`} className="cell-main">
                          <span className="logo" style={{ background: 'var(--bg)', fontSize: 18 }}>{tpl?.emoji || '📢'}</span>
                          <span>
                            <b>{tpl ? adTitle(tpl, a.fields as Record<string, string>) : a.template}</b>
                            <small>{tpl?.name.uz}</small>
                          </span>
                        </Link>
                        {a.warnings.length > 0 && <div className="ad-warn-chip"><AlertTriangle size={12} /> {a.warnings.length} ta ogohlantirish</div>}
                      </td>
                      <td>{a.authorName}{a.tgUsername && <small style={{ display: 'block', color: 'var(--muted)' }}>@{a.tgUsername}</small>}</td>
                      <td>{a._count.posts || '—'}</td>
                      <td><Badge tone={STATUS[a.status].tone}>{STATUS[a.status].label}</Badge></td>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }}>{timeAgo(a.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
