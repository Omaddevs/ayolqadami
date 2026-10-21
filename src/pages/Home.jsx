import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import GlassIcon from '../components/GlassIcon'
import { CompanyLogo, JobCard, SectionHead, Sheet, ThemeToggle } from '../components/UI'
import SearchSheet from '../components/SearchSheet'
import HomeFooter from '../components/HomeFooter'
import ArticlesRail from '../components/ArticlesRail'
import { useApp } from '../context/AppContext'
import { ArrowRight, Bell, CaretRight, ChatCircleText, Fire, Heart, MagnifyingGlass, SlidersHorizontal, SquaresFour } from '@phosphor-icons/react'
import CandidateCard from '../components/CandidateCard'
import { CANDIDATES, CATEGORIES, JOB_TYPES, NOTIFICATIONS, catShort } from '../data/mock'
import { buildCompanies, companySlug } from '../data/companies'

// Bosh sahifa bannerlari — yangi banner qo'shish uchun rasmni public/banners/ ga qo'yib, shu ro'yxatga yozing
const BANNERS = [
  { to: '/courses', img: '/banners/haydovchilik.jpg', alt: 'Haydovchilik kursi' },
  { to: '/courses', promo: { chip: 'Bepul', title: 'Python noldan: ayollar uchun dasturlash', sub: '8 hafta · sertifikat · stajirovka' } },
]

function BannerCarousel() {
  const trackRef = useRef(null)
  const [cur, setCur] = useState(0)
  const paused = useRef(false)

  const goTo = (i) => {
    const el = trackRef.current
    const slide = el?.children[i]
    if (slide) el.scrollTo({ left: slide.offsetLeft - (el.clientWidth - slide.offsetWidth) / 2, behavior: 'smooth' })
  }

  const onScroll = () => {
    const el = trackRef.current
    const mid = el.scrollLeft + el.clientWidth / 2
    let best = 0
    ;[...el.children].forEach((c, i) => {
      const cm = c.offsetLeft + c.offsetWidth / 2
      const bm = el.children[best].offsetLeft + el.children[best].offsetWidth / 2
      if (Math.abs(cm - mid) < Math.abs(bm - mid)) best = i
    })
    setCur(best)
  }

  useEffect(() => {
    if (BANNERS.length < 2) return
    const id = setInterval(() => {
      if (!paused.current) goTo((cur + 1) % BANNERS.length)
    }, 4500)
    return () => clearInterval(id)
  }, [cur])

  return (
    <div className="hb">
      <div className="hb-track" ref={trackRef} onScroll={onScroll}
        onPointerDown={() => { paused.current = true }} onPointerUp={() => { paused.current = false }}
        onPointerLeave={() => { paused.current = false }}>
        {BANNERS.map((b, i) => (
          <Link key={i} to={b.to} className={`hb-slide ${i === cur ? 'on' : ''}`}>
            {b.img ? <img src={b.img} alt={b.alt} draggable="false" /> : (
              <div className="promo">
                <div className="promo-text">
                  <span className="chip chip-light">{b.promo.chip}</span>
                  <b>{b.promo.title}</b>
                  <span>{b.promo.sub}</span>
                </div>
                <Icon3D name="laptop" size={110} className="promo-art" />
              </div>
            )}
          </Link>
        ))}
      </div>
      {BANNERS.length > 1 && (
        <div className="hb-dots">
          {BANNERS.map((_, i) => (
            <button key={i} type="button" className={i === cur ? 'on' : ''} onClick={() => goTo(i)} aria-label={`${i + 1}-banner`} />
          ))}
        </div>
      )}
    </div>
  )
}

// Desktop bosh sahifasi: sarlavha, bo'lim tanlovi va soha kartalari (mobil hero o'rniga)
// rasmlar: public/categories/<id>.png (public/hero/hero-imageN.png dan kesib olingan)
// kartaga sig'ishi uchun qisqa nomlar
const DK_NAMES = { food: 'Restoran mehmonxona' }
const DK_CATS = ['office', 'edu', 'med', 'sales', 'beauty', 'it', 'home', 'remote', 'production', 'food', 'marketing', 'other']

function DesktopIntro({ isEmp }) {
  const { allJobs, user } = useApp()
  const [tab, setTab] = useState('cats')
  const listPath = isEmp ? '/candidates' : '/jobs'
  const companies = useMemo(() => buildCompanies(allJobs, user)
    .sort((a, b) => b.jobs.length - a.jobs.length).slice(0, 12), [allJobs, user])
  const cats = DK_CATS.map((id) => CATEGORIES.find((c) => c.id === id)).filter(Boolean)

  return (
    <section className="dk-intro">
      <div className="dk-intro-head">
        <div>
          <h1>{isEmp ? "Nomzodlar O'zbekistonda" : "Ish e'lonlari O'zbekistonda"}</h1>
          <p>{isEmp ? 'Jamoangiz uchun eng yaxshi mutaxassislar' : 'Ayollar uchun eng yaxshi imkoniyatlar'}</p>
        </div>
        <div className="dk-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'cats'} className={tab === 'cats' ? 'on' : ''} onClick={() => setTab('cats')}>Ish yo'nalishlari</button>
          {/* vaqtincha yopiq — qaytarish uchun: <button ... onClick={() => setTab('companies')}>Kompaniyalar</button> */}
          <span className="dk-tab-soon" aria-disabled="true">Kompaniyalar <em>Soon</em></span>
          <span className="dk-tab-soon" aria-disabled="true">Kurslar <em>Soon</em></span>
        </div>
      </div>

      {tab === 'cats' ? (
        // rasmdagidek: yuqori qatorda 6 ta, pastki qatorda 6 ta + "Barcha kategoriyalar"
        [cats.slice(0, 6), cats.slice(6)].map((row, r) => (
          <div key={r} className="dk-row">
            {row.map((c) => (
              <Link key={c.id} to={`${listPath}?cat=${c.id}`} className="dk-cat">
                <b>{DK_NAMES[c.id] || c.name}</b>
                <img src={`/categories/${c.id}.png`} alt="" className="dk-cat-img" loading="lazy" draggable="false" />
              </Link>
            ))}
            {r === 1 && (
              <Link to="/categories" className="dk-cat dk-cat-all">
                <SquaresFour size={30} weight="fill" />
                <b>Barcha kategoriyalar <ArrowRight size={16} weight="bold" /></b>
              </Link>
            )}
          </div>
        ))
      ) : (
        <div className="dk-cats dk-cos">
          {companies.map((c) => (
            <Link key={c.name} to={`/companies/${companySlug(c.name)}`} className="dk-co">
              <CompanyLogo name={c.name} color={c.color} size={52} />
              <b>{c.name}</b>
              <span>{c.jobs.length} ta vakansiya · {catShort(c.categories[0])}</span>
            </Link>
          ))}
          <Link to="/companies" className="dk-cat dk-cat-all">
            <SquaresFour size={30} weight="fill" />
            <b>Barcha kompaniyalar <ArrowRight size={16} weight="bold" /></b>
          </Link>
        </div>
      )}
    </section>
  )
}

export default function Home() {
  const { user, allJobs, applications, posted, saved } = useApp()
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const isEmp = user?.role === 'employer'
  const closeSearch = useCallback(() => setOpen(false), [])
  const nav = useNavigate()
  const [filterOpen, setFilterOpen] = useState(false)
  const [fCat, setFCat] = useState('')
  const [fType, setFType] = useState('')
  const [fSort, setFSort] = useState('new')
  const applyFilters = () => {
    const p = new URLSearchParams()
    if (fCat) p.set('cat', fCat)
    if (!isEmp && fType) p.set('type', fType)
    if (!isEmp && fSort !== 'new') p.set('sort', fSort)
    const qs = p.toString()
    setFilterOpen(false)
    nav(`${isEmp ? '/candidates' : '/jobs'}${qs ? `?${qs}` : ''}`)
  }
  const openSearch = () => {
    setOpen(true)
    // fokus shu bosish ichida beriladi — iOS'da klaviatura darhol ochiladi
    inputRef.current?.focus({ preventScroll: true })
  }

  const tiles = isEmp
    ? [
        { to: '/applications', label: "E'lonlarim", icon: 'folder', img: '/arizalar.png', badge: posted.length || null },
        { to: '/candidates', label: 'Nomzod-\nlar', icon: 'users' },
        { to: '/courses', label: "O'quv\nkurslar", icon: 'cap', img: '/kurslar-cap.png', wide: true, soon: true },
        { to: '/events', label: 'Tadbirlar', icon: 'calendar', img: '/tadbirlar.png' },
      ]
    : [
        { to: '/applications', label: 'Ariza-\nlarim', icon: 'folder', img: '/arizalar.png', badge: applications.length || null },
        { to: '/jobs', label: 'Yangi\nishlar', icon: 'briefcase', img: '/yangi-ishlar.png' },
        { to: '/courses', label: "O'quv\nkurslar", icon: 'cap', img: '/kurslar-cap.png', wide: true, soon: true },
        { to: '/events', label: 'Tadbirlar', icon: 'calendar', img: '/tadbirlar.png' },
      ]

  const myCats = user?.categories?.length ? user.categories : user?.category ? [user.category] : []
  // avval foydalanuvchi sohasiga moslari, keyin qolganlari — takrorlarsiz 30 ta
  const recommended = allJobs.filter((j) => !myCats.length || myCats.includes(j.category)).concat(allJobs)
  const uniqueRec = [...new Map(recommended.map((j) => [j.id, j])).values()].slice(0, 30)

  return (
    <div className="home">
      <DesktopIntro isEmp={isEmp} />
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-top">
            <Link to="/" className="hero-user hero-brand" aria-label="AyolQadami">
              <img src="/ayolqadami-mark.png" alt="" width="34" height="34" />
              <span>AyolQadami</span>
            </Link>
            <div className="hero-actions">
              <ThemeToggle className="hero-btn" size={24} />
              <Link to="/notifications" className="hero-btn" aria-label="Bildirishnomalar">
                <Bell size={25} />
                {NOTIFICATIONS.length > 0 && <em className="hero-badge">{NOTIFICATIONS.length}</em>}
              </Link>
              <Link to="/qadam-ai" className="hero-btn" aria-label="QadamAI"><ChatCircleText size={25} /></Link>
            </div>
          </div>

          <div className="tiles">
            {tiles.map((t) => {
              const inner = (
                <>
                  {t.img
                    ? <img src={t.img} alt="" className={`tile-ico tile-img${t.wide ? ' wide' : ''}`} />
                    : <GlassIcon name={t.icon} size={64} className="tile-ico" />}
                  <span>{t.label}</span>
                  {t.soon ? <em className="tile-soon">Soon</em> : t.badge && <em className="badge">{t.badge}</em>}
                </>
              )
              // tez orada ochiladigan bo'limlar bosilmaydi
              return t.soon
                ? <div key={t.to + t.label} className="tile is-soon" aria-disabled="true">{inner}</div>
                : <Link key={t.to + t.label} to={t.to} className="tile">{inner}</Link>
            })}
          </div>
        </div>
      </header>

      <section className="sheet-body">

        <div className="search-bar">
          <button type="button" className="search search-trigger" onClick={openSearch}>
            <MagnifyingGlass size={22} />
            <span>{isEmp ? "Kasb, ko'nikma, ism" : "Lavozim, kalit so'zlar"}</span>
          </button>
          <button type="button" className="search-btn" aria-label="Filtrlar" onClick={() => setFilterOpen(true)}>
            <SlidersHorizontal size={22} />
          </button>
          {!isEmp && (
            <Link to="/applications?tab=saved" className="search-btn" aria-label="Saqlanganlar">
              <Heart size={22} />
              {saved.length > 0 && <em className="search-badge">{saved.length}</em>}
            </Link>
          )}
        </div>


        <div className="feature-grid">
          {isEmp ? (
            <Link to="/post-job" className="fcard fcard-big">
              <b>Vakansiya joylash</b>
              <span>E'lon bering, arizalar oling</span>
              <img src="/vacancy-plus.png" alt="" className="fcard-art plus-art" draggable="false" />
            </Link>
          ) : (
            <Link to="/profile/edit" className="fcard fcard-big">
              <b>Rezyume yaratish</b>
              <span>Profilingizni to'ldiring</span>
              <img src="/rezyume.png" alt="" className="fcard-art resume-art" />
            </Link>
          )}
          <Link to="/qadam-ai" className="fcard fcard-ai">
            <b>QadamAI</b>
            <span className="ai-sub">{isEmp ? 'Mos kadr' : 'Mos ish'}</span>
            <img src="/qadam-ai.png" alt="" className="fcard-art ai-art" />
          </Link>
          {isEmp ? (
            <Link to="/candidates" className="fcard">
              <b>Nomzodlar</b>
              <Icon3D name="users" size={80} className="fcard-art" />
            </Link>
          ) : (
            <div className="fcard is-soon" aria-disabled="true">
              <em className="tile-soon">Soon</em>
              <b>Kurslar</b>
              <img src="/kurslar.png" alt="" className="fcard-art books-art" />
            </div>
          )}
        </div>

        <BannerCarousel />


        {isEmp ? (
          <>
            <section className="rec-box">
              <div className="rec-head">
                <span className="rec-ico"><Fire size={24} weight="fill" /></span>
                <div className="grow">
                  <h2>Tavsiya etilgan nomzodlar</h2>
                  <span>Sizning talabingizga mos nomzodlar</span>
                </div>
                <Link to="/candidates" className="rec-all">Barchasi <CaretRight size={14} weight="bold" /></Link>
              </div>
              <div className="rec-list">
                {CANDIDATES.filter((c) => !myCats.length || myCats.includes(c.category)).concat(CANDIDATES).slice(0, 4)
                  .filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i)
                  .map((c) => <CandidateCard key={c.id} c={c} />)}
              </div>
            </section>
          </>
        ) : (
          <>
            <SectionHead title="Siz uchun vakansiyalar" to="/jobs" />
            <div className="list-grid">{uniqueRec.map((j) => <JobCard key={j.id} job={j} />)}</div>
            <Link to="/jobs" className="btn btn-soft btn-lg btn-block all-jobs-btn">
              Barcha e'lonlar <span className="all-jobs-count">{allJobs.length}</span>
              <Icon name="right" size={18} />
            </Link>
          </>
        )}

        <ArticlesRail />
      </section>

      <HomeFooter />

      <SearchSheet open={open} onClose={closeSearch} isEmp={isEmp} jobs={allJobs} inputRef={inputRef} />

      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filtrlar">
        <span className="search-panel-title">Soha</span>
        <div className="pill-row wrap">
          <button type="button" className={`pill ${!fCat ? 'on' : ''}`} onClick={() => setFCat('')}>Barchasi</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className={`pill ${fCat === c.id ? 'on' : ''}`} onClick={() => setFCat(c.id)}>
              <Icon3D name={c.icon} size={22} /> {c.short}
            </button>
          ))}
        </div>
        {!isEmp && (
          <>
            <span className="search-panel-title">Ish formati</span>
            <div className="pill-row wrap">
              {['', ...JOB_TYPES].map((t) => (
                <button key={t || 'all'} type="button" className={`pill pill-sm ${fType === t ? 'on' : ''}`} onClick={() => setFType(t)}>
                  {t || 'Har qanday format'}
                </button>
              ))}
            </div>
            <span className="search-panel-title">Saralash</span>
            <div className="pill-row wrap">
              {[['new', 'Avval yangilari'], ['salary', "Maosh bo'yicha"], ['few', 'Kam arizali']].map(([v, l]) => (
                <button key={v} type="button" className={`pill pill-sm ${fSort === v ? 'on' : ''}`} onClick={() => setFSort(v)}>{l}</button>
              ))}
            </div>
          </>
        )}
        <div className="filter-actions">
          <button type="button" className="btn btn-soft btn-lg" onClick={() => { setFCat(''); setFType(''); setFSort('new') }}>Tozalash</button>
          <button type="button" className="btn btn-primary btn-lg" onClick={applyFilters}>Natijalarni ko'rish</button>
        </div>
      </Sheet>
    </div>
  )
}
