import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BookOpen, Briefcase, CaretDown, CaretLeft, CaretRight, Check, Heart, House, Plus, SealCheck, SortAscending, Sparkle, User, UsersThree } from '@phosphor-icons/react'
import Icon from './Icons'
import Icon3D from './Icon3D'
import { useApp } from '../context/AppContext'
import { catName, salaryText, formatSum } from '../data/mock'

export function Avatar({ name = '', color = '#6366F6', size = 40, radius }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, borderRadius: radius ?? size * 0.32,
      background: `linear-gradient(135deg, ${color}AA, ${color})` }}>
      {initials || '?'}
    </div>
  )
}

export function CompanyLogo({ name, color, size = 46 }) {
  return (
    <div className="company-logo" style={{ width: size, height: size, background: `${color}1A`, color }}>
      {name[0]}
    </div>
  )
}

export function navItems(role) {
  return role === 'employer'
    ? [
        { to: '/', icon: 'home', ph: House, label: 'Bosh sahifa', tab: 'Asosiy', end: true },
        { to: '/candidates', icon: 'users', ph: UsersThree, label: 'Nomzodlar' },
        { to: '/post-job', icon: 'plus', ph: Plus, label: 'Joylash', fab: true },
        { to: '/qadam-ai', icon: 'sparkle', ph: Sparkle, label: 'QadamAI' },
        { to: '/profile', icon: 'user', ph: User, label: 'Profil' },
      ]
    : [
        { to: '/', icon: 'home', ph: House, label: 'Bosh sahifa', tab: 'Asosiy', end: true },
        { to: '/jobs', icon: 'briefcase', ph: Briefcase, label: 'Vakansiyalar', tab: 'Ishlar' },
        { to: '/profile/edit', icon: 'plus', ph: Plus, label: 'Rezyume', fab: true },
        { to: '/courses', icon: 'book', ph: BookOpen, label: 'Kurslar' },
        { to: '/profile', icon: 'user', ph: User, label: 'Profil', end: true },
      ]
}

const isOn = (it, pathname) => (it.end ? pathname === it.to : pathname === it.to || pathname.startsWith(it.to + '/'))

// Tab bar geometriyasi (px): doira radiusi, markazining paneldan balandligi, chuqurcha atrofidagi bo'shliq
const ORB_R = 27, ORB_Y = 2, NOTCH_GAP = 6, NOTCH_D = ORB_Y + ORB_R + NOTCH_GAP, NOTCH_HW = 60, BAR_H = 72, BAR_PAD = 8

const notchPath = (w, x, d) =>
  `M0 0 H${x - NOTCH_HW} C${x - NOTCH_HW + 20} 0 ${x - 32} ${d} ${x} ${d} ` +
  `C${x + 32} ${d} ${x + NOTCH_HW - 20} 0 ${x + NOTCH_HW} 0 H${w} V${BAR_H} H0 Z`

export function TabBar({ items, pathname }) {
  const active = items.findIndex((it) => isOn(it, pathname))
  const navRef = useRef(null)
  const pathRef = useRef(null)
  const orbRef = useRef(null)
  const sim = useRef({ x: null, vx: 0, d: 0, vd: 0, w: 0, raf: 0, last: 0 })
  const target = useRef(active)
  target.current = active

  const kick = useCallback(() => {
    const s = sim.current
    const nav = navRef.current
    if (!nav) return
    const slotX = (i) => BAR_PAD + ((s.w - BAR_PAD * 2) / items.length) * (i + 0.5)
    const draw = (lift = 0, squash = 0) => {
      pathRef.current?.setAttribute('d', notchPath(s.w, s.x, s.d))
      if (orbRef.current) {
        const y = ORB_Y + (s.d - NOTCH_D) - lift
        orbRef.current.style.transform =
          `translate(${s.x - ORB_R}px, ${y - ORB_R}px) scale(${1 + squash}, ${1 - squash})`
      }
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tx = target.current >= 0 ? slotX(target.current) : (s.x ?? s.w / 2)
    const td = target.current >= 0 ? NOTCH_D : 0

    if (s.x === null || reduce) {
      Object.assign(s, { x: tx, vx: 0, d: td, vd: 0 })
      draw()
      return
    }
    cancelAnimationFrame(s.raf)
    s.last = performance.now()
    const step = (now) => {
      const dt = Math.min((now - s.last) / 1000, 1 / 30)
      s.last = now
      const tx = target.current >= 0 ? slotX(target.current) : s.x
      const tdBase = target.current >= 0 ? NOTCH_D : 0
      const speed = Math.abs(s.vx)
      // tez harakatda chuqurcha tekislanadi, doira ko'tariladi; qo'nganda prujina to'lqin beradi
      const td = tdBase * Math.max(0, 1 - speed / 420)
      s.vx += (210 * (tx - s.x) - 23 * s.vx) * dt
      s.x += s.vx * dt
      s.vd += (380 * (td - s.d) - 13 * s.vd) * dt
      s.d += s.vd * dt
      const lift = Math.min(16, speed * 0.022)
      const squash = Math.max(-0.12, Math.min(0.12, s.vd / 1400))
      draw(lift, squash)
      const settled = Math.abs(tx - s.x) < 0.3 && Math.abs(s.vx) < 0.5 && Math.abs(tdBase - s.d) < 0.15 && Math.abs(s.vd) < 0.5
      if (settled) {
        Object.assign(s, { x: tx, vx: 0, d: tdBase, vd: 0 })
        draw()
      } else {
        s.raf = requestAnimationFrame(step)
      }
    }
    s.raf = requestAnimationFrame(step)
  }, [items.length])

  useEffect(() => {
    const nav = navRef.current
    const ro = new ResizeObserver(() => {
      const s = sim.current
      const w = nav.offsetWidth
      if (w === s.w) return
      s.w = w
      s.x = null // o'lcham o'zgarsa animatsiyasiz joyiga qo'yamiz
      kick()
    })
    ro.observe(nav)
    return () => { ro.disconnect(); cancelAnimationFrame(sim.current.raf) }
  }, [kick])

  useEffect(() => { if (sim.current.w) kick() }, [active, kick])

  const ActivePh = active >= 0 ? items[active].ph : null
  return (
    <nav className="tabbar" ref={navRef} aria-label="Asosiy menyu">
      <div className="tabbar-shadow" aria-hidden="true">
        <div className="tabbar-bg">
          <svg><path ref={pathRef} /></svg>
        </div>
      </div>
      <span ref={orbRef} className={`tab-orb ${active < 0 ? 'off' : ''}`} aria-hidden="true">
        <span className="tab-orb-in">
          {ActivePh && <span className="tab-orb-ico" key={active}><ActivePh size={24} weight="fill" /></span>}
        </span>
      </span>
      {items.map((it, i) => {
        const on = i === active
        const Ph = it.ph
        return (
          <Link key={it.to} to={it.to} className={`tab ${on ? 'active' : ''}`}
            aria-current={on ? 'page' : undefined} aria-label={it.label}>
            <Ph size={23} weight="regular" />
            <span className="tab-label">{it.tab || it.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function Layout() {
  const { user, toast } = useApp()
  const { pathname } = useLocation()
  const items = navItems(user?.role)
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <img src="/logo.png" alt="" />
          <span>Ayol<b>Qadami</b></span>
        </Link>
        <nav>
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className="side-link">
              <Icon name={it.icon} size={20} /> {it.fab ? (user?.role === 'employer' ? 'Vakansiya joylash' : 'Rezyumeni tahrirlash') : it.label}
            </NavLink>
          ))}
          {user?.role === 'seeker' && (
            <NavLink to="/qadam-ai" className="side-link"><Icon name="sparkle" size={20} /> QadamAI</NavLink>
          )}
          {user?.role === 'employer' && (
            <NavLink to="/courses" className="side-link"><Icon name="book" size={20} /> Kurslar</NavLink>
          )}
          <NavLink to="/applications" className="side-link"><Icon name="grid" size={20} /> {user?.role === 'employer' ? 'Vakansiyalarim' : 'Arizalarim'}</NavLink>
          <NavLink to="/events" className="side-link"><Icon name="calendar" size={20} /> Tadbirlar</NavLink>
        </nav>
        <div className="side-promo">
          <Icon3D name="sparkle" size={56} />
          <b>QadamAI</b>
          <p>{user?.role === 'employer' ? "Bir jumlada kerakli kadrni toping" : 'Sizga mos ishni AI topib beradi'}</p>
          <Link to="/qadam-ai" className="btn btn-primary btn-sm">Sinab ko'rish</Link>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>

      <TabBar items={items} pathname={pathname} />

      {toast && <div className="toast" key={toast.id}><Icon name="check" size={18} /> {toast.text}</div>}
    </div>
  )
}

// Ochiladigan tanlov menyusi (native select o'rniga). options: [{ value, label, icon? }]
export function Dropdown({ value, options, onChange, label }) {
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState(-1)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const current = options.find((o) => o.value === value) || options[0]
  const CurIcon = current.icon

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  useEffect(() => {
    if (open && focus >= 0) listRef.current?.children[focus]?.focus()
  }, [open, focus])

  const toggle = () => {
    setFocus(options.indexOf(current))
    setOpen((o) => !o)
  }
  const pick = (v) => {
    onChange(v)
    setOpen(false)
    rootRef.current?.querySelector('.dd-btn')?.focus()
  }
  const onKey = (e) => {
    if (e.key === 'Escape') { setOpen(false); rootRef.current?.querySelector('.dd-btn')?.focus() }
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocus((f) => (f + 1) % options.length) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocus((f) => (f - 1 + options.length) % options.length) }
  }

  return (
    <div className={`dd ${open ? 'open' : ''}`} ref={rootRef} onKeyDown={onKey}>
      <button type="button" className="dd-btn" onClick={toggle} aria-haspopup="listbox" aria-expanded={open}
        aria-label={label ? `${label}: ${current.label}` : current.label}>
        {CurIcon ? <CurIcon size={17} weight="bold" /> : <SortAscending size={17} weight="bold" />}
        <span>{current.label}</span>
        <CaretDown size={14} weight="bold" className="dd-caret" />
      </button>
      <div className="dd-menu" role="listbox" ref={listRef} aria-label={label}>
        {options.map((o) => {
          const Ic = o.icon
          const on = o.value === current.value
          return (
            <button key={o.value} type="button" role="option" aria-selected={on} tabIndex={open ? 0 : -1}
              className={`dd-item ${on ? 'on' : ''}`} onClick={() => pick(o.value)}>
              {Ic && <span className="dd-ico"><Ic size={18} weight={on ? 'fill' : 'regular'} /></span>}
              <span className="dd-label">{o.label}</span>
              {on && <Check size={16} weight="bold" className="dd-check" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function TopBar({ title, right, back = true }) {
  const nav = useNavigate()
  return (
    <div className="topbar">
      {back ? (
        <button className="icon-btn" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))} aria-label="Orqaga">
          <Icon name="left" />
        </button>
      ) : <span style={{ width: 42 }} />}
      <h1>{title}</h1>
      <div className="topbar-right">{right || <span style={{ width: 42 }} />}</div>
    </div>
  )
}

export function JobCard({ job, compact }) {
  const { user, saved, toggleSave, applications, apply, notify } = useApp()
  const nav = useNavigate()
  const isSaved = saved.includes(job.id)
  const applied = applications.some((a) => a.jobId === job.id)
  const showActions = !compact && user?.role !== 'employer' && !job.own
  const quickApply = () => {
    apply(job.id, '')
    notify('Arizangiz yuborildi!')
  }

  return (
    <article className={`job-card ${compact ? 'compact' : ''}`}>
      <div className="job-title-row">
        {/* sarlavha havolasi butun kartani bosiladigan qiladi (::after orqali) */}
        <h3><Link to={`/jobs/${job.id}`} className="job-link">{job.title}</Link></h3>
        <button type="button" className={`save-btn ${isSaved ? 'on' : ''}`} aria-label="Saqlash" aria-pressed={isSaved}
          onClick={() => toggleSave(job.id)}>
          <Heart size={26} weight={isSaved ? 'fill' : 'regular'} />
        </button>
      </div>

      <div className="salary">{salaryText(job)}</div>

      <div className="job-company">
        <div className="job-company-text">
          <span className="job-company-name">
            {job.company}
            {!job.own && <SealCheck size={18} weight="fill" className="verified" aria-label="Tasdiqlangan" />}
          </span>
          <span className="job-place">{job.city} <i className="job-place-dot" /> {catName(job.category)}</span>
        </div>
        <CompanyLogo name={job.company} color={job.color} size={compact ? 42 : 52} />
      </div>

      {!compact && (
        <>
          <div className="chips">
            <span className="chip">{job.experience ? `Tajriba ${job.experience}+ yil` : 'Tajriba shart emas'}</span>
            <span className="chip">Format: {job.type}</span>
          </div>
          {job.tags?.[0] && <span className="chip chip-green">{job.tags[0]}</span>}
          <span className="job-posted">{job.posted} · {job.applicants} ariza</span>
        </>
      )}

      {showActions && (
        <div className="job-actions">
          <button type="button" className="btn btn-primary" disabled={applied} onClick={quickApply}>
            {applied ? 'Ariza yuborildi' : 'Ariza yuborish'}
          </button>
          <button type="button" className="btn btn-soft" onClick={() => nav(`/jobs/${job.id}`)}>Bog'lanish</button>
        </div>
      )}
    </article>
  )
}

export function CourseCard({ c }) {
  return (
    <Link to={`/courses/${c.id}`} className="course-card">
      <div className="course-art">
        <Icon3D name={c.icon} size={92} />
        <span className={`price-tag ${c.price ? '' : 'free'}`}>{c.price ? `${formatSum(c.price)} so'm` : 'Bepul'}</span>
      </div>
      <div className="course-body">
        <h3>{c.title}</h3>
        <span className="muted">{c.provider}</span>
        <div className="course-meta">
          <span><Icon name="star" size={14} fill="#FBBF24" style={{ color: '#FBBF24' }} /> {c.rating}</span>
          <span><Icon name="clock" size={14} /> {c.duration}</span>
          <span><Icon name="users" size={14} /> {c.students}</span>
        </div>
      </div>
    </Link>
  )
}

export function Empty({ icon = 'folder', title, text, action }) {
  return (
    <div className="empty">
      <Icon3D name={icon} size={110} />
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  )
}

export function Sheet({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Yopish"><Icon name="x" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function SectionHead({ title, to, link = 'Barchasi' }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {to && <Link to={to}>{link} <Icon name="right" size={16} /></Link>}
    </div>
  )
}

/* Sahifa raqamlari: 1 … 4 5 6 … 12 ko'rinishida qisqartiriladi */
function pageList(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages))
  const nums = [...set].sort((a, b) => a - b)
  return nums.flatMap((n, i) => (i && n - nums[i - 1] > 1 ? ['…', n] : [n]))
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null
  return (
    <nav className="pager" aria-label="Sahifalar">
      <button className="pager-btn pager-nav" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Oldingi sahifa">
        <CaretLeft size={18} weight="bold" />
      </button>
      {pageList(page, pages).map((n, i) =>
        n === '…' ? <span key={`d${i}`} className="pager-dots">…</span> : (
          <button key={n} className={`pager-btn ${n === page ? 'on' : ''}`} onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}>{n}</button>
        ))}
      <button className="pager-btn pager-nav" disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Keyingi sahifa">
        <CaretRight size={18} weight="bold" />
      </button>
    </nav>
  )
}
