import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import GlassIcon from '../components/GlassIcon'
import { CompanyLogo, Empty, JobCard, SectionHead, Sheet, ThemeToggle } from '../components/UI'
import SearchSheet from '../components/SearchSheet'
import HomeFooter from '../components/HomeFooter'
import ArticlesRail from '../components/ArticlesRail'
import { useApp, useContent } from '../context/AppContext'
import { ArrowRight, Bell, CaretRight, ChatCircleText, Fire, Heart, MagnifyingGlass, SlidersHorizontal, SquaresFour } from '@phosphor-icons/react'
import CandidateCard from '../components/CandidateCard'
import { CANDIDATES, CATEGORIES, JOB_TYPES, catShort } from '../data/mock'
import { buildCompanies, companySlug } from '../data/companies'
import { api as server, apiEnabled } from '../lib/api'
import { trackEvent } from '../lib/analytics'
import { useT } from '../i18n'

// Bosh sahifa bannerlari — admin panel → Bannerlar (rasm, havola, ko'rsatish davri, yoqish/o'chirish)
function BannerCarousel() {
  const t = useT()
  const BANNERS = useContent().banners || []
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
  }, [cur, BANNERS.length])

  if (!BANNERS.length) return null
  const click = (b) => { if (apiEnabled) server.bannerClick(b.id); trackEvent('banner_click', { banner: b.title }) }
  return (
    <div className="hb">
      <div className={`hb-track ${BANNERS.length === 1 ? 'single' : ''}`} ref={trackRef} onScroll={onScroll}
        onPointerDown={() => { paused.current = true }} onPointerUp={() => { paused.current = false }}
        onPointerLeave={() => { paused.current = false }}>
        {BANNERS.map((b, i) => {
          const img = <img src={b.img} alt={b.title} draggable="false" loading={i ? 'lazy' : 'eager'} />
          const cls = `hb-slide ${i === cur ? 'on' : ''}`
          // tashqi havola — yangi oynada; sayt ichidagi — Link; havolasiz — oddiy rasm
          return b.external ? <a key={b.id} href={b.to} target="_blank" rel="noopener noreferrer" className={cls} onClick={() => click(b)}>{img}</a>
            : b.to ? <Link key={b.id} to={b.to} className={cls} onClick={() => click(b)}>{img}</Link>
            : <div key={b.id} className={cls}>{img}</div>
        })}
      </div>
      {BANNERS.length > 1 && (
        <div className="hb-dots">
          {BANNERS.map((_, i) => (
            <button key={i} type="button" className={i === cur ? 'on' : ''} onClick={() => goTo(i)} aria-label={t('{n}-banner', { n: i + 1 })} />
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
  const t = useT()
  const [tab, setTab] = useState('cats')
  const listPath = isEmp ? '/candidates' : '/jobs'
  const companies = useMemo(() => buildCompanies(allJobs, user)
    .sort((a, b) => b.jobs.length - a.jobs.length).slice(0, 12), [allJobs, user])
  const cats = DK_CATS.map((id) => CATEGORIES.find((c) => c.id === id)).filter(Boolean)

  return (
    <section className="dk-intro">
      <div className="dk-intro-head">
        <div>
          <h1>{isEmp ? t("Nomzodlar O'zbekistonda") : t("Ish e'lonlari O'zbekistonda")}</h1>
          <p>{isEmp ? t('Jamoangiz uchun eng yaxshi mutaxassislar') : t('Ayollar uchun eng yaxshi imkoniyatlar')}</p>
        </div>
        <div className="dk-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'cats'} className={tab === 'cats' ? 'on' : ''} onClick={() => setTab('cats')}>{t("Ish yo'nalishlari")}</button>
          {/* vaqtincha yopiq — qaytarish uchun: <button ... onClick={() => setTab('companies')}>Kompaniyalar</button> */}
          <span className="dk-tab-soon" aria-disabled="true">{t('Kompaniyalar')} <em>{t('Soon')}</em></span>
          <span className="dk-tab-soon" aria-disabled="true">{t('Kurslar')} <em>{t('Soon')}</em></span>
        </div>
      </div>

      {tab === 'cats' ? (
        // rasmdagidek: yuqori qatorda 6 ta, pastki qatorda 6 ta + "Barcha kategoriyalar"
        <div className="dk-grid">
        {[cats.slice(0, 6), cats.slice(6)].map((row, r) => (
          <div key={r} className="dk-row">
            {row.map((c) => (
              <Link key={c.id} to={`${listPath}?cat=${c.id}`} className="dk-cat">
                <b>{t(DK_NAMES[c.id] || c.name)}</b>
                <img src={`/categories/${c.id}.png`} alt="" className="dk-cat-img" loading="lazy" draggable="false" />
              </Link>
            ))}
            {r === 1 && (
              <Link to="/categories" className="dk-cat dk-cat-all">
                <SquaresFour size={30} weight="fill" />
                <b>{t('Barcha kategoriyalar')} <ArrowRight size={16} weight="bold" /></b>
              </Link>
            )}
          </div>
        ))}
        </div>
      ) : (
        <div className="dk-cats dk-cos">
          {companies.map((c) => (
            <Link key={c.name} to={`/companies/${companySlug(c.name)}`} className="dk-co">
              <CompanyLogo name={c.name} color={c.color} size={52} />
              <b>{c.name}</b>
              <span>{t('{n} ta vakansiya', { n: c.jobs.length })} · {catShort(c.categories[0])}</span>
            </Link>
          ))}
          <Link to="/companies" className="dk-cat dk-cat-all">
            <SquaresFour size={30} weight="fill" />
            <b>{t('Barcha kompaniyalar')} <ArrowRight size={16} weight="bold" /></b>
          </Link>
        </div>
      )}
    </section>
  )
}

export default function Home() {
  const { user, allJobs, applications, posted, saved } = useApp()
  const t = useT()
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
        { to: '/applications', label: t("E'lonlarim"), icon: 'folder', img: '/arizalar.png', badge: posted.length || null },
        { to: '/candidates', label: t('Nomzod-\nlar'), icon: 'users' },
        { to: '/courses', label: t("O'quv\nkurslar"), icon: 'cap', img: '/kurslar-cap.png', wide: true, soon: true },
        { to: '/events', label: t('Tadbirlar'), icon: 'calendar', img: '/tadbirlar.png' },
      ]
    : [
        { to: '/applications', label: t('Ariza-\nlarim'), icon: 'folder', img: '/arizalar.png', badge: applications.length || null },
        { to: '/jobs', label: t('Yangi\nishlar'), icon: 'briefcase', img: '/yangi-ishlar.png' },
        { to: '/courses', label: t("O'quv\nkurslar"), icon: 'cap', img: '/kurslar-cap.png', wide: true, soon: true },
        { to: '/events', label: t('Tadbirlar'), icon: 'calendar', img: '/tadbirlar.png' },
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
              <Link to="/notifications" className="hero-btn" aria-label={t('Bildirishnomalar')}>
                <Bell size={25} />
              </Link>
              <Link to="/qadam-ai" className="hero-btn" aria-label="QadamAI"><ChatCircleText size={25} /></Link>
            </div>
          </div>

          <div className="tiles">
            {tiles.map((tile) => {
              const inner = (
                <>
                  {tile.img
                    ? <img src={tile.img} alt="" className={`tile-ico tile-img${tile.wide ? ' wide' : ''}`} />
                    : <GlassIcon name={tile.icon} size={64} className="tile-ico" />}
                  <span>{tile.label}</span>
                  {tile.soon ? <em className="tile-soon">{t('Soon')}</em> : tile.badge && <em className="badge">{tile.badge}</em>}
                </>
              )
              // tez orada ochiladigan bo'limlar bosilmaydi
              return tile.soon
                ? <div key={tile.to} className="tile is-soon" aria-disabled="true">{inner}</div>
                : <Link key={tile.to} to={tile.to} className="tile">{inner}</Link>
            })}
          </div>
        </div>
      </header>

      <section className="sheet-body">

        <div className="search-bar">
          <button type="button" className="search search-trigger" onClick={openSearch}>
            <MagnifyingGlass size={22} />
            <span>{isEmp ? t("Kasb, ko'nikma, ism") : t("Lavozim, kalit so'zlar")}</span>
          </button>
          <button type="button" className="search-btn" aria-label={t('Filtrlar')} onClick={() => setFilterOpen(true)}>
            <SlidersHorizontal size={22} />
          </button>
          {!isEmp && (
            <Link to="/applications?tab=saved" className="search-btn" aria-label={t('Saqlanganlar')}>
              <Heart size={22} />
              {saved.length > 0 && <em className="search-badge">{saved.length}</em>}
            </Link>
          )}
        </div>


        <div className="feature-grid">
          {isEmp ? (
            <Link to="/post-job" className="fcard fcard-big">
              <b>{t('Vakansiya joylash')}</b>
              <span>{t("E'lon bering, arizalar oling")}</span>
              <img src="/vacancy-plus.png" alt="" className="fcard-art plus-art" draggable="false" />
            </Link>
          ) : (
            <Link to="/profile/edit" className="fcard fcard-big">
              <b>{t('Rezyume yaratish')}</b>
              <span>{t("Profilingizni to'ldiring")}</span>
              <img src="/rezyume.png" alt="" className="fcard-art resume-art" />
            </Link>
          )}
          <Link to="/qadam-ai" className="fcard fcard-ai">
            <b>QadamAI</b>
            <span className="ai-sub">{isEmp ? t('Mos kadr') : t('Mos ish')}</span>
            <img src="/qadam-ai.png" alt="" className="fcard-art ai-art" />
          </Link>
          {isEmp ? (
            <Link to="/candidates" className="fcard">
              <b>{t('Nomzodlar')}</b>
              <Icon3D name="users" size={80} className="fcard-art" />
            </Link>
          ) : (
            <div className="fcard is-soon" aria-disabled="true">
              <em className="tile-soon">{t('Soon')}</em>
              <b>{t('Kurslar')}</b>
              <img src="/kurslar.png" alt="" className="fcard-art books-art" />
            </div>
          )}
        </div>

        <BannerCarousel />


        {isEmp ? (
          CANDIDATES.length > 0 && (
            <section className="rec-box">
              <div className="rec-head">
                <span className="rec-ico"><Fire size={24} weight="fill" /></span>
                <div className="grow">
                  <h2>{t('Tavsiya etilgan nomzodlar')}</h2>
                  <span>{t('Sizning talabingizga mos nomzodlar')}</span>
                </div>
                <Link to="/candidates" className="rec-all">{t('Barchasi')} <CaretRight size={14} weight="bold" /></Link>
              </div>
              <div className="rec-list">
                {CANDIDATES.filter((c) => !myCats.length || myCats.includes(c.category)).concat(CANDIDATES)
                  .filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i).slice(0, 4)
                  .map((c) => <CandidateCard key={c.id} c={c} />)}
              </div>
            </section>
          )
        ) : uniqueRec.length === 0 ? (
          <Empty icon="briefcase" title={t("Hozircha vakansiyalar yo'q")} text={t("Yangi e'lonlar joylanishi bilan shu yerda ko'rinadi")} />
        ) : (
          <>
            <SectionHead title={t('Siz uchun vakansiyalar')} to="/jobs" />
            <div className="list-grid">{uniqueRec.map((j) => <JobCard key={j.id} job={j} />)}</div>
            <Link to="/jobs" className="btn btn-soft btn-lg btn-block all-jobs-btn">
              {t("Barcha e'lonlar")} <span className="all-jobs-count">{allJobs.length}</span>
              <Icon name="right" size={18} />
            </Link>
          </>
        )}

        <ArticlesRail />
      </section>

      <HomeFooter />

      <SearchSheet open={open} onClose={closeSearch} isEmp={isEmp} jobs={allJobs} inputRef={inputRef} />

      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title={t('Filtrlar')}>
        <span className="search-panel-title">{t('Soha')}</span>
        <div className="pill-row wrap">
          <button type="button" className={`pill ${!fCat ? 'on' : ''}`} onClick={() => setFCat('')}>{t('Barchasi')}</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className={`pill ${fCat === c.id ? 'on' : ''}`} onClick={() => setFCat(c.id)}>
              <Icon3D name={c.icon} size={22} /> {t(c.short)}
            </button>
          ))}
        </div>
        {!isEmp && (
          <>
            <span className="search-panel-title">{t('Ish formati')}</span>
            <div className="pill-row wrap">
              {['', ...JOB_TYPES].map((jt) => (
                <button key={jt || 'all'} type="button" className={`pill pill-sm ${fType === jt ? 'on' : ''}`} onClick={() => setFType(jt)}>
                  {t(jt || 'Har qanday format')}
                </button>
              ))}
            </div>
            <span className="search-panel-title">{t('Saralash')}</span>
            <div className="pill-row wrap">
              {[['new', 'Avval yangilari'], ['salary', "Maosh bo'yicha"], ['few', 'Kam arizali']].map(([v, l]) => (
                <button key={v} type="button" className={`pill pill-sm ${fSort === v ? 'on' : ''}`} onClick={() => setFSort(v)}>{t(l)}</button>
              ))}
            </div>
          </>
        )}
        <div className="filter-actions">
          <button type="button" className="btn btn-soft btn-lg" onClick={() => { setFCat(''); setFType(''); setFSort('new') }}>{t('Tozalash')}</button>
          <button type="button" className="btn btn-primary btn-lg" onClick={applyFilters}>{t("Natijalarni ko'rish")}</button>
        </div>
      </Sheet>
    </div>
  )
}
