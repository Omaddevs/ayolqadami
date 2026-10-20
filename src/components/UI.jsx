import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Briefcase, Buildings, CaretDown, CaretLeft, CaretRight, Check, Heart, House, MapTrifold, Plus, SealCheck, SortAscending, Sparkle, UsersThree } from '@phosphor-icons/react'
import Icon from './Icons'
import Icon3D from './Icon3D'
import { useApp } from '../context/AppContext'
import { catName, salaryText, formatSum } from '../data/mock'

/* photo — foydalanuvchi yuklagan rasm; silhouette — rasm yo'q bo'lsa harflar o'rniga standart ayol siluyeti */
export function Avatar({ name = '', color = '#6366F6', size = 40, radius, photo, silhouette }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  if (silhouette && !photo) color = '#5B57F0' // siluet doim loyiha rangida
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, borderRadius: radius ?? size * 0.32,
      background: `linear-gradient(135deg, ${color}AA, ${color})` }}>
      {photo ? <img className="avatar-img" src={photo} alt="" />
        : silhouette ? <img className="avatar-sil" src="/avatar-default.svg" alt="" />
        : initials || '?'}
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

// Profil ikonkasi: uzun sochli ayol yuzi (Phosphor ikonkalari bilan bir xil API: size, weight)
export function WomanFace({ size = 24, weight = 'regular', className, style }) {
  const fill = weight === 'fill'
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      {fill ? (
        <path fill="currentColor" stroke="none" fillRule="evenodd"
          d="M12 2.6C7.5 2.6 4.6 5.8 4.6 10.4v5c0 2.3-.6 3.8-1.7 4.9 2.1.4 4.1-.1 5.5-1.3h7.2c1.4 1.2 3.4 1.7 5.5 1.3-1.1-1.1-1.7-2.6-1.7-4.9v-5c0-4.6-2.9-7.8-7.4-7.8zM12 7.4c-1.2 1.9-3.2 3-5.3 3.2-.1.4-.1.9-.1 1.4 0 3 2.4 5.6 5.4 5.6s5.4-2.6 5.4-5.6c0-.5 0-1-.1-1.4-1.3-.6-2.5-1.7-3.3-3.2z" />
      ) : (
        <>
          <path d="M8.2 19.1c-1.4 1.1-3.3 1.5-5.2 1.2 1.1-1.1 1.7-2.6 1.7-4.9v-5c0-4.6 2.9-7.8 7.3-7.8s7.3 3.2 7.3 7.8v5c0 2.3.6 3.8 1.7 4.9-1.9.3-3.8-.1-5.2-1.2" />
          <path d="M6.7 10.5c2.3-.2 4.2-1.3 5.4-3.2.8 1.5 2 2.6 3.3 3.2" />
          <path d="M6.6 11.6c0 3.1 2.4 5.8 5.4 5.8s5.4-2.7 5.4-5.8" />
        </>
      )}
      <path d="M10.2 14.2c1 .8 2.6.8 3.6 0" stroke={fill ? 'currentColor' : undefined} />
    </svg>
  )
}

export function navItems(role) {
  return role === 'employer'
    ? [
        { to: '/', icon: 'home', ph: House, label: 'Bosh sahifa', tab: 'Asosiy', end: true },
        { to: '/candidates', icon: 'users', ph: UsersThree, label: 'Nomzodlar' },
        { to: '/post-job', icon: 'plus', ph: Plus, label: 'Joylash', fab: true },
        { to: '/qadam-ai', icon: 'sparkle', ph: Sparkle, label: 'QadamAI' },
        { to: '/profile', icon: 'user', ph: WomanFace, label: 'Profil' },
      ]
    : [
        { to: '/', icon: 'home', ph: House, label: 'Bosh sahifa', tab: 'Asosiy', end: true },
        { to: '/jobs', icon: 'briefcase', ph: Briefcase, label: 'Vakansiyalar', tab: 'Ishlar' },
        { to: '/companies', icon: 'building', ph: Buildings, label: 'Kompaniyalar', tab: 'Kompaniya' },
        { to: '/map', icon: 'pin', ph: MapTrifold, label: 'Xarita' },
        { to: '/profile', icon: 'user', ph: WomanFace, label: 'Profil', end: true },
      ]
}

// Chat sahifalarida tab bar ko'rsatilmaydi — yozish maydoni pastga tushadi, orqaga tugmasi yetarli
const CHAT_ROUTES = ['/qadam-ai', '/support']

const isOn = (it, pathname) => (it.end ? pathname === it.to : pathname === it.to || pathname.startsWith(it.to + '/'))

// Tab bar geometriyasi (px): doira radiusi, markazining paneldan balandligi, chuqurcha atrofidagi bo'shliq
const ORB_R = 27, ORB_Y = 2, NOTCH_GAP = 6, NOTCH_D = ORB_Y + ORB_R + NOTCH_GAP, NOTCH_HW = 60, BAR_H = 72, BAR_PAD = 8

const notchPath = (w, x, d) =>
  `M0 0 H${x - NOTCH_HW} C${x - NOTCH_HW + 20} 0 ${x - 32} ${d} ${x} ${d} ` +
  `C${x + 32} ${d} ${x + NOTCH_HW - 20} 0 ${x + NOTCH_HW} 0 H${w} V${BAR_H + 200} H0 Z`

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
  const chat = CHAT_ROUTES.includes(pathname)
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <div className={`shell ${chat ? 'no-tabs' : ''}`}>
      <aside className="sidebar">
        <Link to="/" className="brand">
          <img src="/logo.png" alt="" />
          <span>Ayol<b>Qadami</b></span>
        </Link>
        <nav>
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className="side-link">
              <Icon name={it.icon} size={20} /> {it.fab ? 'Vakansiya joylash' : it.label}
            </NavLink>
          ))}
          {user?.role !== 'employer' && (
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

      {!chat && <TabBar items={items} pathname={pathname} />}

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

/* Forma uchun tanlov maydoni (native select o'rniga). options: ['Toshkent', ...] yoki [{ value, label }]
   Menyu portal orqali chiziladi — fieldset/sheet ichida kesilib qolmaydi, joy bo'lmasa tepaga ochiladi */
export function Select({ value, options, onChange, placeholder = 'Tanlang' }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState(-1)
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const current = opts.find((o) => o.value === value)

  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    const gap = 6
    const below = window.innerHeight - r.bottom - gap - 12
    const above = r.top - gap - 12
    const up = below < 220 && above > below
    const width = Math.min(Math.max(r.width, 200), window.innerWidth - 24)
    const left = Math.max(12, Math.min(r.left, window.innerWidth - width - 12))
    setPos({ left, width, up, maxHeight: Math.min(300, up ? above : below),
      top: up ? undefined : r.bottom + gap, bottom: up ? window.innerHeight - r.top + gap : undefined })
  }, [])

  useEffect(() => {
    if (!open) return
    place()
    const onDown = (e) => {
      if (!btnRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false)
    }
    const onScroll = (e) => { if (!menuRef.current?.contains(e.target)) place() }
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, place])

  useEffect(() => {
    if (!open || focus < 0) return
    const el = menuRef.current?.children[focus]
    el?.focus({ preventScroll: true })
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, focus, pos])

  const close = () => { setOpen(false); btnRef.current?.focus() }
  const toggle = () => {
    setFocus(Math.max(0, opts.indexOf(current)))
    setOpen((o) => !o)
  }
  const pick = (v) => { onChange(v); close() }
  const onKey = (e) => {
    if (e.key === 'Escape' || e.key === 'Tab') { if (open) { e.preventDefault(); close() } return }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return toggle()
      const d = e.key === 'ArrowDown' ? 1 : -1
      setFocus((f) => (f + d + opts.length) % opts.length)
    }
  }

  return (
    <>
      <button type="button" ref={btnRef} className={`sel-btn ${open ? 'open' : ''}`} onClick={toggle} onKeyDown={onKey}
        aria-haspopup="listbox" aria-expanded={open}>
        <span className={current ? 'sel-val' : 'sel-val sel-ph'}>{current ? current.label : placeholder}</span>
        <CaretDown size={16} weight="bold" className="sel-caret" />
      </button>
      {open && pos && createPortal(
        <div className={`sel-menu ${pos.up ? 'up' : ''}`} role="listbox" ref={menuRef} onKeyDown={onKey}
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}>
          {opts.map((o) => {
            const on = o.value === value
            return (
              <button key={o.value} type="button" role="option" aria-selected={on}
                className={`sel-item ${on ? 'on' : ''}`} onClick={() => pick(o.value)}>
                <span>{o.label}</span>
                {on && <Check size={16} weight="bold" />}
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </>
  )
}

const norm = (s) => s.toLowerCase().replace(/[ʻʼ‘’`´]/g, "'").trim()

/* Combo — erkin matn kiritiladigan input + mavjud variantlar ro'yxati (yozilganga qarab filtrlanadi).
   options: [{ value, hint? }] */
export function Combo({ value, options, onChange, onPick, placeholder, maxLength }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [pos, setPos] = useState(null)
  const inputRef = useRef(null)
  const menuRef = useRef(null)
  const q = norm(value || '')
  const list = q ? options.filter((o) => norm(o.value).includes(q)) : options
  const show = open && pos && list.length > 0

  const place = useCallback(() => {
    const r = inputRef.current?.getBoundingClientRect()
    if (!r) return
    const gap = 6
    const below = window.innerHeight - r.bottom - gap - 12
    const above = r.top - gap - 12
    const up = below < 220 && above > below
    const width = Math.min(r.width, window.innerWidth - 24)
    const left = Math.max(12, Math.min(r.left, window.innerWidth - width - 12))
    setPos({ left, width, up, maxHeight: Math.min(300, up ? above : below),
      top: up ? undefined : r.bottom + gap, bottom: up ? window.innerHeight - r.top + gap : undefined })
  }, [])

  useEffect(() => {
    if (!open) return
    place()
    const onDown = (e) => {
      if (!inputRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false)
    }
    const onScroll = (e) => { if (!menuRef.current?.contains(e.target)) place() }
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, place])

  useEffect(() => {
    if (show && active >= 0) menuRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [show, active])

  const pick = (o) => { onChange(o.value); onPick?.(o); setOpen(false); setActive(-1) }
  const onKey = (e) => {
    if (e.key === 'Escape') { if (show) { e.preventDefault(); setOpen(false) } return }
    if (e.key === 'Enter' && show && active >= 0) { e.preventDefault(); return pick(list[active]) }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return setOpen(true)
      if (!list.length) return
      const d = e.key === 'ArrowDown' ? 1 : -1
      setActive((a) => (a + d + list.length) % list.length)
    }
  }

  return (
    <>
      <input ref={inputRef} value={value} maxLength={maxLength} placeholder={placeholder} autoComplete="off"
        role="combobox" aria-expanded={!!show} aria-autocomplete="list"
        onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onKeyDown={onKey}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1) }} />
      {show && createPortal(
        <div className={`sel-menu ${pos.up ? 'up' : ''}`} role="listbox" ref={menuRef}
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}>
          {list.map((o, i) => (
            <button key={o.value} type="button" role="option" tabIndex={-1} aria-selected={i === active}
              className={`sel-item ${i === active ? 'active' : ''} ${norm(o.value) === q ? 'on' : ''}`}
              onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)}>
              <span>{o.value}</span>
              {o.hint && <small className="sel-hint">{o.hint}</small>}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
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
  const { user, saved, toggleSave, applications, apply, notify, requireAuth } = useApp()
  const nav = useNavigate()
  const isSaved = saved.includes(job.id)
  const applied = applications.some((a) => a.jobId === job.id)
  const showActions = !compact && user?.role !== 'employer' && !job.own
  const quickApply = () => requireAuth(() => {
    apply(job.id, '')
    notify('Arizangiz yuborildi!')
  })

  return (
    <article className={`job-card ${compact ? 'compact' : ''}`}>
      <div className="job-title-row">
        {/* sarlavha havolasi butun kartani bosiladigan qiladi (::after orqali) */}
        <h3><Link to={`/jobs/${job.id}`} className="job-link">{job.title}</Link></h3>
        <button type="button" className={`save-btn ${isSaved ? 'on' : ''}`} aria-label="Saqlash" aria-pressed={isSaved}
          onClick={() => requireAuth(() => toggleSave(job.id))}>
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
  // body'ga chiqariladi: ota-elementning stacking context'i (masalan xarita) sheet'ni tab bar ostida qoldirmasligi uchun
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Yopish"><Icon name="x" /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body
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
