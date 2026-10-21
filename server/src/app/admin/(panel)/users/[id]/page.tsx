import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Ban, LogOut, ShieldCheck, Trash2, UserCheck } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { APP_STATUS, JOB_STATUS, ROLE, catName } from '@/lib/catalog'
import { dateTime, formatSum, timeAgo } from '@/lib/format'
import { formatUzPhone } from '@/lib/phone'
import { Avatar, Badge, Card, Logo, PageHead } from '@/components/ui'
import { Submit } from '@/components/client'
import { blockUser, deleteUser, revokeSessions, setUserRole, unblockUser } from '../../actions'

export const metadata = { title: 'Foydalanuvchi' }

type Profile = {
  headline?: string; about?: string; salary?: number; skills?: string[]; skillsDetail?: { name: string }[]
  experience?: { role?: string; company?: string; from?: string; to?: string; current?: boolean }[]
  telegram?: string; demo?: boolean
}

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  const u = await db.user.findUnique({
    where: { id },
    include: {
      applications: { orderBy: { createdAt: 'desc' }, take: 15, include: { job: { select: { id: true, title: true, companyName: true, color: true } } } },
      jobs: { orderBy: { createdAt: 'desc' }, take: 15, include: { _count: { select: { applications: true } } } },
      enrollments: { include: { course: { select: { title: true } } } },
      _count: { select: { applications: true, jobs: true, tickets: true } },
    },
  })
  if (!u) notFound()
  const pr = (u.profile || {}) as Profile
  const skills = pr.skillsDetail?.map((s) => s.name) || pr.skills || []
  const self = u.id === admin.id
  const canManage = !self && (admin.role === 'ADMIN' || (u.role !== 'ADMIN' && u.role !== 'MODERATOR'))

  return (
    <>
      <PageHead title={u.name} sub={pr.headline || ROLE[u.role].label}>
        <Badge tone={ROLE[u.role].tone}>{ROLE[u.role].label}</Badge>
        {u.status === 'ACTIVE' ? <Badge tone="green">Faol</Badge> : <Badge tone="red">Bloklangan</Badge>}
      </PageHead>
      <div className="grid g-side">
        <div className="grid" style={{ alignContent: 'start' }}>
          <Card title="Profil">
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
              <Avatar name={u.name} src={u.photo} size={56} />
              <div><b style={{ fontSize: 16 }}>{u.name}</b><div style={{ color: 'var(--muted)' }}>{u.company || u.city || ''}</div></div>
            </div>
            <dl className="kv">
              <dt>Telefon</dt><dd>{formatUzPhone(u.phone) || '—'}</dd>
              <dt>Email</dt><dd>{u.email || '—'}</dd>
              {pr.telegram && <><dt>Telegram</dt><dd>{pr.telegram}</dd></>}
              <dt>Shahar</dt><dd>{u.city || '—'}</dd>
              <dt>Sohalar</dt><dd>{u.categories.map(catName).join(', ') || '—'}</dd>
              {pr.salary ? <><dt>Kutilgan maosh</dt><dd>{formatSum(pr.salary)} so&apos;m</dd></> : null}
              <dt>Kirish usuli</dt><dd>{[u.passwordHash && 'Telefon + parol', u.googleSub && 'Google'].filter(Boolean).join(', ') || '—'}</dd>
              <dt>Ro&apos;yxatdan o&apos;tgan</dt><dd>{dateTime(u.createdAt)}</dd>
              <dt>Telefon tasdiqlangan</dt><dd>{u.phoneVerifiedAt ? dateTime(u.phoneVerifiedAt) : "Yo'q"}</dd>
              <dt>Shartlarga rozilik</dt><dd>{u.termsAcceptedAt ? dateTime(u.termsAcceptedAt) : '—'}</dd>
              <dt>Oxirgi kirish</dt><dd>{u.lastLoginAt ? dateTime(u.lastLoginAt) : '—'}</dd>
            </dl>
            {pr.about && <><div className="section-t">O&apos;zi haqida</div><p className="prose" style={{ margin: 0 }}>{pr.about}</p></>}
            {skills.length > 0 && <><div className="section-t">Ko&apos;nikmalar</div><div className="chips">{skills.map((s) => <span className="chip" key={s}>{s}</span>)}</div></>}
            {pr.experience?.length ? (
              <>
                <div className="section-t">Tajriba</div>
                {pr.experience.map((e, i) => (
                  <div key={i} style={{ marginBottom: 8 }}><b>{e.role}</b> — {e.company} <small style={{ color: 'var(--muted)' }}>{e.from}{e.current ? ' – hozir' : e.to ? ` – ${e.to}` : ''}</small></div>
                ))}
              </>
            ) : null}
          </Card>

          {u.role === 'EMPLOYER' ? (
            <Card title={`Vakansiyalari (${u._count.jobs})`} href={`/admin/jobs?q=${encodeURIComponent(u.company || u.name)}`}>
              <div className="rows">
                {u.jobs.length === 0 && <div className="empty">Vakansiya joylamagan</div>}
                {u.jobs.map((j) => (
                  <Link key={j.id} href={`/admin/jobs/${j.id}`} className="row">
                    <Logo name={j.companyName} color={j.color} />
                    <div style={{ minWidth: 0 }}><div className="t">{j.title}</div><div className="s">{j._count.applications} ariza</div></div>
                    <span className="when">{timeAgo(j.createdAt)}</span>
                    <Badge tone={JOB_STATUS[j.status].tone}>{JOB_STATUS[j.status].label}</Badge>
                  </Link>
                ))}
              </div>
            </Card>
          ) : (
            <Card title={`Arizalari (${u._count.applications})`}>
              <div className="rows">
                {u.applications.length === 0 && <div className="empty">Ariza topshirmagan</div>}
                {u.applications.map((a) => (
                  <Link key={a.id} href={`/admin/jobs/${a.job.id}`} className="row">
                    <Logo name={a.job.companyName} color={a.job.color} />
                    <div style={{ minWidth: 0 }}><div className="t">{a.job.title}</div><div className="s">{a.job.companyName}</div></div>
                    <span className="when">{timeAgo(a.createdAt)}</span>
                    <Badge tone={APP_STATUS[a.status].tone}>{APP_STATUS[a.status].label}</Badge>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="grid" style={{ alignContent: 'start' }}>
          <Card title="Boshqaruv" tone="pink">
            {!canManage ? (
              <p style={{ color: 'var(--muted)', margin: 0 }}>{self ? "Bu sizning hisobingiz. Parolni Sozlamalar bo'limida almashtiring." : "Bu hisobni faqat administrator boshqaradi."}</p>
            ) : (
              <div className="grid" style={{ gap: 10 }}>
                {u.status === 'ACTIVE' ? (
                  <form action={blockUser}><input type="hidden" name="id" value={u.id} /><Submit className="btn danger block" confirm="Foydalanuvchi bloklanadi va barcha qurilmalardan chiqariladi. Davom etasizmi?"><Ban size={15} /> Bloklash</Submit></form>
                ) : (
                  <form action={unblockUser}><input type="hidden" name="id" value={u.id} /><Submit className="btn green block"><UserCheck size={15} /> Blokdan chiqarish</Submit></form>
                )}
                <form action={revokeSessions}><input type="hidden" name="id" value={u.id} /><Submit className="btn block" confirm="Foydalanuvchi barcha qurilmalardan chiqariladi"><LogOut size={15} /> Barcha sessiyalarni yopish</Submit></form>
                {admin.role === 'ADMIN' && (
                  <>
                    <form action={setUserRole} className="field" style={{ marginTop: 6 }}>
                      <input type="hidden" name="id" value={u.id} />
                      <label htmlFor="role">Rol</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select id="role" className="select" name="role" defaultValue={u.role}>
                          {Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <Submit className="btn" confirm="Rolni o'zgartirasizmi?"><ShieldCheck size={15} /></Submit>
                      </div>
                    </form>
                    <form action={deleteUser} style={{ marginTop: 6 }}><input type="hidden" name="id" value={u.id} /><Submit className="btn danger block" confirm="Hisob va unga tegishli arizalar, murojaatlar butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi!"><Trash2 size={15} /> Hisobni o&apos;chirish</Submit></form>
                  </>
                )}
              </div>
            )}
          </Card>
          <Card title="Statistika">
            <dl className="kv">
              <dt>Arizalar</dt><dd>{u._count.applications}</dd>
              <dt>Vakansiyalar</dt><dd>{u._count.jobs}</dd>
              <dt>Murojaatlar</dt><dd>{u._count.tickets ? <Link href={`/admin/support?user=${u.id}`} style={{ color: 'var(--blue)' }}>{u._count.tickets}</Link> : 0}</dd>
              <dt>Kurslar</dt><dd>{u.enrollments.map((e) => e.course.title).join(', ') || '—'}</dd>
            </dl>
          </Card>
        </div>
      </div>
    </>
  )
}
