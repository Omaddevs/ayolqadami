import Link from 'next/link'
import {
  Bell, BellRing, Briefcase, Building2, CalendarDays, CircleHelp, FileText, GraduationCap, History, LayoutDashboard, LogOut, MessageCircle,
  Newspaper, Send, Settings, Users, GalleryHorizontal, Handshake, Megaphone, FolderTree, PhoneCall } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { NavLink } from '@/components/client'
import { Avatar } from '@/components/ui'
import { logout } from '../login/actions'

export const dynamic = 'force-dynamic'

const RAIL = [
  { href: '/admin', icon: LayoutDashboard, label: 'Bosh sahifa', exact: true },
  { href: '/admin/categories', icon: FolderTree, label: 'Kategoriyalar' },
  { href: '/admin/companies', icon: Building2, label: 'Kompaniyalar' },
  { href: '/admin/courses', icon: GraduationCap, label: 'Kurslar' },
  { href: '/admin/articles', icon: Newspaper, label: 'Maqolalar' },
  { href: '/admin/events', icon: CalendarDays, label: 'Tadbirlar' },
  { href: '/admin/banners', icon: GalleryHorizontal, label: 'Bannerlar' },
  { href: '/admin/partners', icon: Handshake, label: 'Hamkorlar' },
  { href: '/admin/notifications', icon: BellRing, label: 'Bildirishnomalar', adminOnly: true },
  null,
  { href: '/admin/audit', icon: History, label: 'Amallar jurnali', adminOnly: true },
  { href: '/admin/settings', icon: Settings, label: 'Sozlamalar' },
  { href: '/admin/help', icon: CircleHelp, label: "Yo'riqnoma" },
]

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()
  const [pendingJobs, openTickets, newApps, pendingAds] = await Promise.all([
    db.job.count({ where: { status: 'PENDING' } }),
    db.supportTicket.count({ where: { status: 'OPEN' } }),
    db.application.count({ where: { status: 'NEW' } }),
    db.ad.count({ where: { status: 'PENDING' } }),
  ])
  const NAV = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/jobs', label: 'Vakansiyalar', icon: Briefcase, count: pendingJobs },
    { href: '/admin/ads', label: "E'lonlar", icon: Megaphone, count: pendingAds },
    { href: '/admin/users', label: 'Foydalanuvchilar', icon: Users },
    { href: '/admin/applications', label: 'Arizalar', icon: FileText, count: newApps },
    { href: '/admin/contacts', label: "Bog'lanishlar", icon: PhoneCall },
    { href: '/admin/support', label: 'Murojaatlar', icon: MessageCircle, count: openTickets },
    { href: '/admin/telegram', label: 'Telegram', icon: Send },
  ]
  const alerts = pendingJobs + openTickets + pendingAds

  return (
    <div className="shell">
      <div className="frame">
        <header className="topbar">
          <Link href="/admin" className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="brand-mark"><img src="/logo.png" alt="" /></span>
            <div>AyolQadami<small>Admin panel</small></div>
          </Link>
          <nav className="pills" aria-label="Asosiy bo'limlar">
            {NAV.map(({ href, label, icon: Icon, exact, count }) => (
              <NavLink key={href} href={href} exact={exact} className="pill">
                <Icon size={15} />{label}{count ? <span className="count">{count > 99 ? '99+' : count}</span> : null}
              </NavLink>
            ))}
          </nav>
          <div className="top-right">
            <Link className="icon-btn" href={pendingAds ? '/admin/ads' : pendingJobs ? '/admin/jobs?status=PENDING' : '/admin/support'} aria-label={`Bildirishnomalar: ${alerts}`}>
              <Bell size={17} />{alerts > 0 && <span className="dot" />}
            </Link>
            <div className="me">
              <Avatar name={admin.name} src={admin.photo} size={30} />
              <div><b>{admin.name}</b><small>{admin.role === 'ADMIN' ? 'Administrator' : 'Moderator'}</small></div>
              <form action={logout}><button type="submit" aria-label="Chiqish" title="Chiqish"><LogOut size={16} /></button></form>
            </div>
          </div>
        </header>
        <div className="body">
          <nav className="rail" aria-label="Qo'shimcha bo'limlar">
            {RAIL.filter((r) => !r?.adminOnly || admin.role === 'ADMIN').map((r, i) =>
              r ? (
                <NavLink key={r.href} href={r.href} exact={r.exact} className="" title={r.label}>
                  <r.icon size={18} /><span className="tip">{r.label}</span>
                </NavLink>
              ) : <div key={i} className="sep" />,
            )}
          </nav>
          <main className="main">{children}</main>
        </div>
      </div>
    </div>
  )
}
