import { Suspense, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import {
  Bell, Buildings, CaretDoubleLeft, CaretDown, CaretRight, CaretUp, CheckCircle, DotsThree, DotsThreeVertical, FolderSimple, GearSix,
  House, IdentificationCard, MagnifyingGlass, PencilSimple, Plus, SignOut, Sparkle, SquaresFour, Target, Trash, Tray, UsersThree,
} from '@phosphor-icons/react'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import { CompanyLogo } from '../components/UI'
import { profileCompletion, useApp } from '../context/AppContext'
import { catIcon, catShort, formatSum } from '../data/mock'
import { tx, useT } from '../i18n'
import { jobPath } from '../lib/seo'
import { fullDate, postedAt, postedText, timeAgo } from '../lib/time'
import '../styles/dashboard.css'

// Kirgan foydalanuvchining ish stoli: chap ikonka paneli, to'q rangli daraxt menyu (saqlanganlar sohalar bo'yicha),
// so'nggi faollik kartalari, soha «papkalari» va tanlanadigan jadval. Ish beruvchida — o'z vakansiyalari.
// DashShell — kirgan foydalanuvchining desktopdagi umumiy qobig'i: barcha bo'limlar (vakansiyalar, arizalar, profil...)
// shu panellar ichida ochiladi, landing sarlavhasi ko'rinmaydi. DashOverview — /dashboard sahifasining o'zi
const STATUS_TONE = { "Ko'rib chiqilmoqda": 'wait', 'Suhbatga taklif': 'ok', 'Rad etildi': 'no', 'Qabul qilindi': 'ok' }
const salaryShort = (j) => {
  const m = (n) => `${Math.round(n / 100000) / 10}`.replace('.', ',')
  if (j.salaryFrom && j.salaryTo) return `${m(j.salaryFrom)}–${m(j.salaryTo)} mln`
  return j.salaryFrom ? `${formatSum(j.salaryFrom)}+` : '—'
}
const companiesOf = (jobs) => [...new Map(jobs.map((j) => [j.company, j])).values()]

function Logos({ jobs, max = 3, size = 26 }) {
  const list = companiesOf(jobs)
  return (
    <span className="db-logos">
      {list.slice(0, max).map((j) => <span key={j.company} className="db-logo"><CompanyLogo name={j.company || '?'} color={j.color || '#5B57F0'} size={size} /></span>)}
      {list.length > max && <span className="db-more" style={{ '--s': `${size}px` }}>+{list.length - max}</span>}
    </span>
  )
}

// Soha «papkasi»: chapda baland yorliq, o'ngga silliq tushadi; orqada ikki lavanda varaq chiqib turadi.
// Shakl SVG'da (viewBox 212×166, yuqoridagi 14px — varaqlar uchun) — egri chiziq CSS bilan aniq chiqmaydi
const FOLDER_FRONT = 'M0 32Q0 14 18 14H78C90 14 94 18 100 24C106 30 110 32 122 32H194Q212 32 212 50V148Q212 166 194 166H18Q0 166 0 148Z'
function Folder({ to, dark, icon, title, meta, jobs }) {
  const id = 'dbf' + useId().replace(/:/g, '') // url(#...) ichida «:» ishlamaydi
  return (
    <Link to={to} className={`db-folder${dark ? ' dark' : ''}`}>
      <svg className="db-folder-shape" viewBox="0 0 212 166" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" className="db-folder-a" />
            <stop offset="1" className="db-folder-b" />
          </linearGradient>
        </defs>
        <rect className="db-folder-sheet s1" x="104" y="2" width="100" height="60" rx="12" />
        <rect className="db-folder-sheet s2" x="96" y="10" width="106" height="60" rx="12" />
        <path className="db-folder-front" d={FOLDER_FRONT} fill={`url(#${id})`} />
      </svg>
      <span className="db-folder-body">
        <Icon3D name={icon} size={30} />
        <b>{title}</b>
        <small>{meta}</small>
        <Logos jobs={jobs} size={30} />
      </span>
    </Link>
  )
}

// Daraxt: soha → kompaniya → vakansiya
function Tree({ jobs, onPick }) {
  const t = useT()
  const groups = useMemo(() => {
    const m = new Map()
    jobs.forEach((j) => {
      const c = m.get(j.category) || new Map()
      c.set(j.company, [...(c.get(j.company) || []), j])
      m.set(j.category, c)
    })
    return [...m.entries()]
  }, [jobs])
  const [open, setOpen] = useState(() => new Set(groups.slice(0, 1).flatMap(([cat, cos]) => [cat, `${cat}/${[...cos.keys()][0]}`])))
  const toggle = (k) => setOpen((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n })
  if (!groups.length) return <p className="db-tree-empty">{t("Hali hech narsa saqlanmagan — yoqqan vakansiyalarni yurakcha bilan saqlang")}</p>
  return (
    <ul className="db-tree">
      {groups.map(([cat, cos]) => (
        <li key={cat} className={open.has(cat) ? 'open' : ''}>
          <button type="button" className="db-node" onClick={() => toggle(cat)}>
            <FolderSimple size={19} /> <span>{catShort(cat)}</span>
            {open.has(cat) ? <CaretUp size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
          </button>
          {open.has(cat) && (
            <ul>
              {[...cos.entries()].map(([co, list]) => {
                const k = `${cat}/${co}`
                return (
                  <li key={k}>
                    <button type="button" className="db-node sub" onClick={() => toggle(k)}>
                      <FolderSimple size={17} /> <span>{co}</span>
                      {open.has(k) ? <CaretUp size={13} weight="bold" /> : <CaretRight size={13} weight="bold" />}
                    </button>
                    {open.has(k) && (
                      <ul>{list.map((j) => <li key={j.id}><button type="button" className="db-leaf" onClick={() => onPick(j)}>{tx(j.title)}</button></li>)}</ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

function RecentCard({ item, onOpen }) {
  const t = useT()
  const [menu, setMenu] = useState(false)
  const { toggleSave, saved } = useApp()
  const j = item.job
  return (
    <article className="db-recent">
      <button type="button" className="db-preview" onClick={() => onOpen(j)}>
        <span className="db-sheet">
          <CompanyLogo name={j.company || '?'} color={j.color || '#5B57F0'} size={34} />
          <i /><i /><i className="short" />
        </span>
        <span className="db-see">{t('Batafsil')}</span>
      </button>
      <div className="db-recent-foot">
        <div>
          <b>{tx(j.title)}</b>
          <small>{item.label} {item.when}</small>
        </div>
        <div className="db-menu-wrap">
          <button type="button" className="db-dots" aria-label={t('Amallar')} onClick={() => setMenu((m) => !m)}><DotsThree size={20} weight="bold" /></button>
          {menu && (
            <div className="db-menu" onMouseLeave={() => setMenu(false)}>
              <button type="button" onClick={() => onOpen(j)}>{t('Ochish')}</button>
              <button type="button" onClick={() => { toggleSave(j.id); setMenu(false) }}>{saved.includes(j.id) ? t('Saqlanganlardan olib tashlash') : t('Saqlash')}</button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

// Yo'l satri uchun bo'lim nomlari (manzil prefiksi bo'yicha)
const SECTIONS = [
  ['/jobs', 'Vakansiyalar'], ['/applications', 'Arizalarim'], ['/profile', 'Mening profilim'], ['/companies', 'Kompaniyalar'],
  ['/candidates', 'Nomzodlar'], ['/post-job', 'Vakansiya joylash'], ['/notifications', 'Bildirishnomalar'], ['/settings', 'Sozlamalar'],
  ['/courses', 'Kurslar'], ['/events', 'Tadbirlar'], ['/articles', 'Maqolalar'], ['/map', 'Xarita'], ['/categories', 'Kategoriyalar'],
  ['/support', 'Texnik yordam'], ['/more', 'Yana'], ['/privacy', 'Maxfiylik siyosati'], ['/terms', 'Foydalanish shartlari'],
]
const sectionOf = (pathname) => SECTIONS.find(([p]) => pathname === p || pathname.startsWith(p + '/'))

export function DashShell() {
  const { user, jobsAll, applications, saved, posted, unreadNotifs, logout, toast } = useApp()
  const t = useT()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const cat = useSearchParams()[0].get('cat')
  const overview = pathname === '/dashboard'
  const isEmp = user.role === 'employer'
  // telefonda yon menyu yopiq holda ochiladi (ustma-ust chiqadi)
  const [collapsed, setCollapsed] = useState(() => window.matchMedia('(max-width: 960px)').matches)
  const [overviewOpen, setOverviewOpen] = useState(true)
  const [q, setQ] = useState('')
  const [tab, setTab] = useState(isEmp ? 'mine' : 'apps')
  const searchRef = useRef(null)
  const byId = useMemo(() => new Map(jobsAll.map((j) => [j.id, j])), [jobsAll])

  // Layout kabi: bo'lim almashganda sahifa boshidan ochiladi
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  // ⌘K / Ctrl+K — qidiruv
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCollapsed(false); searchRef.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  // umumiy ko'rinishda qidiruv jadvalni filtrlaydi; boshqa bo'limlarda Enter — vakansiyalar qidiruvi
  const onSearchKey = (e) => {
    if (e.key === 'Enter' && !overview && q.trim()) nav(`/jobs?q=${encodeURIComponent(q.trim())}`)
  }

  const savedJobs = useMemo(() => saved.map((id) => byId.get(id)).filter(Boolean), [saved, byId])
  const treeJobs = isEmp ? posted : savedJobs
  const activityCount = isEmp ? posted.length : applications.length + saved.length
  const open = (j) => nav(jobPath(j))
  const pct = profileCompletion(user)
  const section = sectionOf(pathname)
  const rail = [
    { to: '/dashboard', icon: SquaresFour, label: 'Dashboard', end: true },
    isEmp ? { to: '/candidates', icon: UsersThree, label: t('Nomzodlar') } : { to: '/jobs', icon: Target, label: t('Vakansiyalar') },
    { to: '/companies', icon: Buildings, label: t('Kompaniyalar') },
    { to: '/applications', icon: Tray, label: t('Arizalarim') },
    ...(isEmp ? [{ to: '/qadam-ai', icon: Sparkle, label: 'QadamAI' }] : []),
    { to: '/settings/hidden', icon: Trash, label: t('Yashirilganlar') },
    { to: '/notifications', icon: Bell, label: t('Bildirishnomalar'), dot: unreadNotifs > 0 },
  ]

  return (
    <div className={`db ${collapsed ? 'is-collapsed' : ''}`}>
      <nav className="db-rail" aria-label={t('Asosiy menyu')}>
        <Link to="/dashboard" className="db-mark" aria-label="Dashboard"><img src="/ayolqadami-mark.webp" alt="" /></Link>
        <span className="db-rule" />
        {rail.map(({ to, icon: I, label, dot, end }) => (
          <NavLink key={to} to={to} end={end} className="db-rail-btn" title={label} aria-label={label}>
            {({ isActive }) => <><I size={22} weight={isActive ? 'fill' : 'regular'} />{dot && <span className="db-dot" />}</>}
          </NavLink>
        ))}
        <Link to={isEmp ? '/post-job' : '/profile/edit'} className="db-rail-btn add" title={isEmp ? t('Vakansiya joylash') : t('Rezyumeni tahrirlash')}><Plus size={20} /></Link>
        <div className="db-rail-end">
          <span className="db-rule" />
          <NavLink to="/settings" end className="db-rail-btn" title={t('Sozlamalar')}>
            {({ isActive }) => <GearSix size={22} weight={isActive ? 'fill' : 'regular'} />}
          </NavLink>
          <button type="button" className="db-rail-btn" title={t('Chiqish')} onClick={logout}><SignOut size={22} /></button>
        </div>
      </nav>

      <aside className="db-side">
        <div className="db-side-head">
          <button type="button" className="db-round" onClick={() => setCollapsed(true)} aria-label={t('Yopish')}><CaretDoubleLeft size={16} weight="bold" /></button>
          <h2>Dashboard</h2>
          <Link to="/settings" className="db-round ghost" aria-label={t('Sozlamalar')}><GearSix size={17} /></Link>
        </div>
        <label className="db-search">
          <MagnifyingGlass size={19} />
          <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onSearchKey} placeholder={t('Qidirish')} />
          <kbd>⌘ K</kbd>
        </label>

        <div className="db-scroll">
          <button type="button" className="db-overview" onClick={() => setOverviewOpen((o) => !o)} aria-expanded={overviewOpen}>
            <House size={18} weight="fill" /> <span>{t("Umumiy ko'rinish")}</span>
            {overviewOpen ? <CaretUp size={15} weight="bold" /> : <CaretDown size={15} weight="bold" />}
          </button>
          {overviewOpen && (
            <ul className="db-sub">
              <li><Link to="/profile" className={`db-sub-item ${pathname === '/profile' ? 'active' : ''}`}>{t('Mening profilim')} <CaretRight size={14} weight="bold" /></Link></li>
              <li><button type="button" className={`db-sub-item ${overview ? 'active' : ''}`} onClick={() => { setTab(isEmp ? 'mine' : 'apps'); nav('/dashboard') }}>{t("So'nggi faollik")} <em>{activityCount}</em></button></li>
            </ul>
          )}

          <div className="db-label">
            <span>{isEmp ? t('Mening vakansiyalarim') : t('Saqlanganlar')}</span>
            <Link to={isEmp ? '/applications' : '/applications?tab=saved'} aria-label={t('Tahrirlash')}><PencilSimple size={17} /></Link>
          </div>
          <Tree key={treeJobs.length} jobs={treeJobs} onPick={open} />

          <Link to={isEmp ? '/post-job' : '/jobs'} className="db-new"><span><Plus size={13} weight="bold" /></span> {isEmp ? t('Yangi vakansiya') : t('Vakansiya qidirish')}</Link>
        </div>

        <div className="db-promo">
          <button type="button" className="db-promo-dots" aria-label={t('Amallar')}><DotsThreeVertical size={18} weight="bold" /></button>
          <h3>{isEmp ? t('Nomzodlar kutmoqda!') : pct < 100 ? t("Profilingiz {n}% to'liq!", { n: pct }) : t('Profilingiz tayyor!')}</h3>
          <p>{isEmp ? t("Vakansiya joylang — QadamAI mos nomzodlarni darhol tavsiya qiladi.") : t("To'liq rezyume ish beruvchilarga 3 barobar ko'proq ko'rinadi.")}</p>
          <Link to={isEmp ? '/post-job' : '/profile/edit'} className="db-promo-btn"><Sparkle size={16} /> {isEmp ? t('Vakansiya joylash') : t('Rezyumeni to\'ldirish')}</Link>
        </div>
      </aside>

      {!collapsed && <button type="button" className="db-backdrop" aria-label={t('Yopish')} onClick={() => setCollapsed(true)} />}
      <main className="db-main">
        <header className="db-top">
          {collapsed && <button type="button" className="db-round light" onClick={() => setCollapsed(false)} aria-label={t('Menyuni ochish')}><CaretDoubleLeft size={16} weight="bold" style={{ transform: 'scaleX(-1)' }} /></button>}
          <span className="db-cloud"><IdentificationCard size={22} weight="fill" /></span>
          <div className="db-meter">
            <div><b>{isEmp ? t('Kompaniya profili') : t("Profil to'liqligi")}</b> <span><em>{pct}%</em> / 100%</span></div>
            <i><s style={{ width: `${pct}%` }} /></i>
          </div>
        </header>

        {overview ? (
          <div className="db-crumbs">
            <Link to="/dashboard">Dashboard</Link> <span>/</span>
            <button type="button" onClick={() => setOverviewOpen((o) => !o)}>{t("Umumiy ko'rinish")} <CaretDown size={13} weight="bold" /></button> <span>/</span>
            <b>{t("So'nggi faollik")}</b> <em>{activityCount}</em>
          </div>
        ) : (
          <div className="db-crumbs">
            <Link to="/dashboard">Dashboard</Link>
            {section && (pathname === section[0] && !cat
              ? <><span>/</span> <b>{t(section[1])}</b></>
              : <><span>/</span> <Link to={section[0]}>{t(section[1])}</Link></>)}
            {pathname === '/jobs' && cat && <><span>/</span> <b>{catShort(cat)}</b></>}
          </div>
        )}

        <div className="db-page">
          <Suspense fallback={<div className="page" aria-busy="true" />}>
            <Outlet context={{ q, tab, setTab }} />
          </Suspense>
        </div>
      </main>

      {toast && <div className="toast" key={toast.id}><Icon name="check" size={18} /> {toast.text}</div>}
    </div>
  )
}

export default function DashOverview() {
  const { user, jobsAll, allJobs, applications, saved, posted } = useApp()
  const { q, tab, setTab } = useOutletContext()
  const t = useT()
  const nav = useNavigate()
  const isEmp = user.role === 'employer'
  const [checked, setChecked] = useState([])
  const byId = useMemo(() => new Map(jobsAll.map((j) => [j.id, j])), [jobsAll])

  const appRows = useMemo(() => applications.map((a) => ({ job: byId.get(a.jobId), date: new Date(a.date), status: a.status })).filter((r) => r.job), [applications, byId])
  const savedJobs = useMemo(() => saved.map((id) => byId.get(id)).filter(Boolean), [saved, byId])

  // So'nggi faollik: arizalar (ish izlovchi) yoki joylangan vakansiyalar (ish beruvchi)
  const recent = isEmp
    ? posted.slice(0, 6).map((j) => ({ job: j, label: t('Joylandi'), when: postedText(j).toLowerCase() }))
    : appRows.slice(0, 6).map((r) => ({ job: r.job, label: t('Ariza yuborildi'), when: timeAgo(r.date).toLowerCase() }))

  // Soha «papkalari»: foydalanuvchi sohalari birinchi, keyin eng ko'p vakansiyali sohalar
  const folders = useMemo(() => {
    const m = new Map()
    allJobs.forEach((j) => m.set(j.category, [...(m.get(j.category) || []), j]))
    const mine = user.categories || (user.category ? [user.category] : [])
    return [...m.entries()]
      .sort(([a, x], [b, y]) => (mine.includes(b) - mine.includes(a)) || y.length - x.length)
      .slice(0, 6)
  }, [allJobs, user.categories, user.category])

  const tabs = isEmp
    ? [{ id: 'mine', label: t('Mening vakansiyalarim') }, { id: 'all', label: t('Barcha vakansiyalar') }]
    : [{ id: 'apps', label: t('Arizalarim') }, { id: 'saved', label: t('Saqlanganlar') }, { id: 'all', label: t('Barcha vakansiyalar') }]
  const rows = useMemo(() => {
    const list = tab === 'apps' ? appRows
      : tab === 'saved' ? savedJobs.map((j) => ({ job: j, date: postedAt(j), status: null }))
      : tab === 'mine' ? posted.map((j) => ({ job: j, date: postedAt(j), status: j.status === 'PENDING' ? 'Moderatsiyada' : null }))
      : allJobs.slice(0, 50).map((j) => ({ job: j, date: postedAt(j), status: null }))
    const s = q.trim().toLowerCase()
    return s ? list.filter(({ job }) => `${job.title} ${job.company} ${job.city}`.toLowerCase().includes(s)) : list
  }, [tab, appRows, savedJobs, posted, allJobs, q])
  useEffect(() => setChecked([]), [tab])

  const allChecked = rows.length > 0 && rows.every((r) => checked.includes(r.job.id))
  const toggleRow = (id) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  const toggleAll = () => setChecked(allChecked ? [] : rows.map((r) => r.job.id))
  const focus = rows.find((r) => r.job.id === checked[checked.length - 1])

  const open = (j) => nav(jobPath(j))

  return (
    <>
    <section className="db-sec">
      <h3>{isEmp ? t("So'nggi joylanganlar") : t("So'nggi arizalar")}</h3>
      {recent.length ? (
        <div className="db-recents">{recent.map((r) => <RecentCard key={r.job.id} item={r} onOpen={open} />)}</div>
      ) : (
        <p className="db-empty">{isEmp ? t('Hali vakansiya joylamadingiz') : t("Hali ariza yubormadingiz — mos vakansiyani tanlang va bir bosishda ariza yuboring")}</p>
      )}
    </section>

    <section className="db-sec">
      <h3>{t('Sohalar')}</h3>
      <div className="db-folders">
        {folders.map(([cat, list], i) => (
          <Folder key={cat} to={`/jobs?cat=${cat}`} dark={i === 0} icon={catIcon(cat)} title={catShort(cat)} jobs={list}
            meta={`${t('{n} vakansiya', { n: list.length })}, ${salaryShort({ salaryFrom: Math.min(...list.map((j) => j.salaryFrom || Infinity)), salaryTo: Math.max(...list.map((j) => j.salaryTo || 0)) })}`} />
        ))}
      </div>
    </section>

    <section className="db-sec db-table-sec">
      <div className="db-tabs" role="tablist">
        {tabs.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} className={tab === x.id ? 'on' : ''} onClick={() => setTab(x.id)}>
            {tab === x.id && <CheckCircle size={17} weight="fill" />} {x.label}
          </button>
        ))}
      </div>

      <div className="db-table" role="table">
        <div className="db-tr head" role="row">
          <span><input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label={t('Hammasini tanlash')} /></span>
          <span>{t('Vakansiya')}</span><span>{t('Kompaniya')}</span><span>{t('Sana')}</span><span>{t('Maosh')}</span><span>{t('Holat')}</span>
        </div>
        {rows.map(({ job, date, status }) => (
          <div key={job.id} role="row" className={`db-tr ${checked.includes(job.id) ? 'sel' : ''}`} onClick={() => toggleRow(job.id)}>
            <span><input type="checkbox" checked={checked.includes(job.id)} onChange={() => toggleRow(job.id)} onClick={(e) => e.stopPropagation()} aria-label={tx(job.title)} /></span>
            <span className="db-name">
              <Icon3D name={catIcon(job.category)} size={32} />
              <span>
                <Link to={jobPath(job)} onClick={(e) => e.stopPropagation()}>{tx(job.title)}</Link>
                <small>{tx(job.city)} · {tx(job.type)} {isEmp ? <UsersThree size={12} /> : null}</small>
              </span>
            </span>
            <span><Logos jobs={[job]} /> <small className="db-co">{job.company}</small></span>
            <span className="db-muted">{date ? fullDate(date) : postedText(job)}</span>
            <span className="db-muted">{salaryShort(job)}</span>
            <span>{status ? <em className={`db-chip ${STATUS_TONE[status] || 'wait'}`}>{t(status)}</em> : <em className="db-chip">{t('Ochiq')}</em>}</span>
          </div>
        ))}
        {!rows.length && <p className="db-empty pad">{q ? t('Hech narsa topilmadi') : t("Bu ro'yxat hozircha bo'sh")}</p>}
      </div>
    </section>

    {focus && (
      <div className="db-float">
        <Icon3D name={catIcon(focus.job.category)} size={24} />
        <b>{tx(focus.job.title)}</b>
        <span>· {salaryShort(focus.job)} ·</span>
        <span>{focus.date ? fullDate(focus.date) : postedText(focus.job)}</span>
        {checked.length > 1 && <span className="db-muted">+{checked.length - 1}</span>}
        <button type="button" onClick={() => open(focus.job)}>{focus.status ? t(focus.status) : t('Ochish')} <CaretRight size={14} weight="bold" /></button>
      </div>
    )}
    </>
  )
}
