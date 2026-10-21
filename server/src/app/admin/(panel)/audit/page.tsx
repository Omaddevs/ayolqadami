import Link from 'next/link'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { dateTime } from '@/lib/format'
import { Avatar, Card, Empty, PageHead, Pager, pageOf, qs, sp, type SearchParams } from '@/components/ui'

export const metadata = { title: 'Amallar jurnali' }
const LIMIT = 40

const ACTION_LABEL: Record<string, string> = {
  'admin.login': 'Panelga kirdi', 'admin.logout': 'Paneldan chiqdi', 'admin.password': "Parolini almashtirdi",
  'job.approve': 'Vakansiyani tasdiqladi', 'job.reject': 'Vakansiyani rad etdi', 'job.archive': 'Vakansiyani arxivladi',
  'job.delete': "Vakansiyani o'chirdi", 'job.create': "Vakansiya qo'shdi", 'job.update': 'Vakansiyani tahrirladi',
  'user.block': 'Foydalanuvchini blokladi', 'user.unblock': 'Blokdan chiqardi', 'user.role': "Rolni o'zgartirdi",
  'user.delete': "Foydalanuvchini o'chirdi", 'user.revoke_sessions': 'Sessiyalarni yopdi',
  'application.status': "Ariza holatini o'zgartirdi", 'ticket.reply': 'Murojaatga javob berdi', 'ticket.status': "Murojaat holatini o'zgartirdi",
  'course.create': "Kurs qo'shdi", 'course.update': 'Kursni tahrirladi', 'course.delete': "Kursni o'chirdi",
  'article.create': "Maqola qo'shdi", 'article.update': 'Maqolani tahrirladi', 'article.delete': "Maqolani o'chirdi",
  'event.create': "Tadbir qo'shdi", 'event.update': 'Tadbirni tahrirladi', 'event.delete': "Tadbirni o'chirdi",
  'company.create': "Kompaniya qo'shdi", 'company.update': 'Kompaniyani tahrirladi', 'company.verify': 'Kompaniyani tasdiqladi',
  'company.unverify': 'Tasdiq belgisini olib tashladi', 'company.delete': "Kompaniyani o'chirdi", 'settings.update': "Sozlamalarni o'zgartirdi",
  export: 'Hisobot yuklab oldi (CSV)', 'telegram.settings': "Bot sozlamalarini o'zgartirdi", 'telegram.disconnect': 'Botni uzdi',
  'telegram.channel_add': "Telegram kanal qo'shdi", 'telegram.channel_update': "Kanal sozlamalarini o'zgartirdi",
  'telegram.channel_delete': 'Kanalni olib tashladi', 'telegram.job_post': 'Vakansiyani kanalga yubordi', 'telegram.post': 'Telegram post yubordi',
  'telegram.post_delete': "Telegram postni o'chirdi",
}
const ENTITY_HREF: Record<string, string> = { telegram_channel: '/admin/telegram/channels/', job: '/admin/jobs/', user: '/admin/users/', course: '/admin/courses/', article: '/admin/articles/', event: '/admin/events/', company: '/admin/companies/' }

export default async function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin()
  if (admin.role !== 'ADMIN') {
    return <><PageHead title="Amallar jurnali" /><div className="card">Jurnalni faqat administrator ko&apos;radi.</div></>
  }
  const p = await searchParams
  const page = pageOf(p.page)
  const entity = sp(p.entity)
  const where = entity ? { entity } : {}
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * LIMIT, take: LIMIT, include: { actor: { select: { name: true, photo: true } } } }),
    db.auditLog.count({ where }),
  ])
  return (
    <>
      <PageHead title="Amallar jurnali" sub="Admin paneldagi barcha o'zgarishlar: kim, qachon, nima qildi" />
      <Card>
        {logs.length === 0 ? <Empty title="Jurnal bo'sh" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Vaqt</th><th>Kim</th><th>Amal</th><th>Obyekt</th><th>IP</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{dateTime(l.createdAt)}</td>
                    <td><span className="cell-main" style={{ minWidth: 160 }}><Avatar name={l.actor?.name || '?'} src={l.actor?.photo} size={26} />{l.actor?.name || '—'}</span></td>
                    <td>{ACTION_LABEL[l.action] || l.action}</td>
                    <td>
                      {l.entityId && ENTITY_HREF[l.entity] ? (
                        <Link href={ENTITY_HREF[l.entity] + l.entityId} style={{ color: 'var(--blue)' }}>{l.entity} · {String((l.meta as Record<string, unknown>)?.title || (l.meta as Record<string, unknown>)?.name || l.entityId.slice(0, 8))}</Link>
                      ) : <Link href={`/admin/audit${qs({ entity: l.entity })}`}>{l.entity}</Link>}
                    </td>
                    <td style={{ color: 'var(--muted)', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{l.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager page={page} limit={LIMIT} total={total} href={(pg) => `/admin/audit${qs({ entity, page: pg })}`} />
          </div>
        )}
      </Card>
    </>
  )
}
