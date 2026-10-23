import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import GlassIcon from '../components/GlassIcon'
import QaIcon from '../components/QaIcon'
import '../styles/qadam-ai.css'
import { Empty, JobCard, SectionHead, Select, Sheet, ThemeToggle } from '../components/UI'
import SearchSheet from '../components/SearchSheet'
import HomeFooter from '../components/HomeFooter'
import ArticlesRail from '../components/ArticlesRail'
import { useApp, useContent } from '../context/AppContext'
import { Bell, CaretRight, Fire, Heart, MagnifyingGlass, MapPin, SignIn, SlidersHorizontal, Sparkle, Star, X } from '@phosphor-icons/react'
import CandidateCard from '../components/CandidateCard'
import { CANDIDATES, CATEGORIES, CITIES, JOB_TYPES } from '../data/mock'
import { buildCompanies } from '../data/companies'
import { api as server, apiEnabled } from '../lib/api'
import { trackEvent } from '../lib/analytics'
import { EMPTY, EXP_STEPS, SALARY_STEPS, activeCount, filtersToSearch, matchJob } from '../lib/jobFilters'
import { PERIODS } from '../lib/time'
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
          const img = <img src={b.img} alt={b.title} draggable="false" loading={i ? 'lazy' : 'eager'} decoding="async" fetchpriority={i ? undefined : 'high'} />
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

// Mobil sarlavhadagi menyu: tezkor kartalar blur fon ustida popup bo'lib ochiladi
function QuickMenu({ children }) {
  const t = useT()
  const [state, setState] = useState('closed') // closed | open | closing
  // yopilish animatsiyasi tugagach olib tashlanadi (reduced-motion'da animationend kelmaydi — shuning uchun taymer)
  const close = useCallback(() => setState((s) => (s === 'open' ? 'closing' : s)), [])
  useEffect(() => {
    if (state !== 'closing') return
    const id = setTimeout(() => setState('closed'), 240)
    return () => clearTimeout(id)
  }, [state])

  useEffect(() => {
    if (state !== 'open') return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey) }
  }, [state, close])

  return (
    <>
      <button type="button" className={`hero-btn qm-burger ${state === 'open' ? 'on' : ''}`} aria-label={t('Menyu')}
        aria-expanded={state === 'open'} onClick={() => setState('open')}>
        <span /><span /><span />
      </button>
      {state !== 'closed' && createPortal(
        <div className={`qm-backdrop ${state}`} onClick={close}>
          <div className="qm-panel" role="dialog" aria-modal="true" aria-label={t('Menyu')} onClick={(e) => e.stopPropagation()}>
            <div className="qm-head">
              <b>{t('Menyu')}</b>
              <button type="button" className="qm-close" onClick={close} aria-label={t('Yopish')} autoFocus><X size={20} weight="bold" /></button>
            </div>
            {/* karta bosilganda sahifa almashadi — menyu ham yopiladi */}
            <div onClick={(e) => { if (e.target.closest('a')) setState('closed') }}>{children}</div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

// Hamkorlar lentasi — admin panel → Hamkorlar. Yo'q bo'lsa — ko'rinmaydi, 5 tagacha — qotib turadi,
// ko'proq bo'lsa — uzluksiz aylanadi (ro'yxat ekrandan keng bo'lishi uchun takrorlanadi, ikkinchi nusxa — siljish uchun)
function PartnersStrip() {
  const partners = useContent().partners || []
  if (!partners.length) return null
  const moving = partners.length > 5
  const item = (p, i, hidden) => {
    const img = <img src={p.img} alt={p.name} title={p.name} loading="lazy" draggable={false} />
    const key = `${p.id}-${i}`
    const props = { className: 'dk-hb-partner', tabIndex: hidden ? -1 : undefined }
    if (!p.to) return <span key={key} {...props}>{img}</span>
    return p.external
      ? <a key={key} {...props} href={p.to} target="_blank" rel="noopener noreferrer">{img}</a>
      : <Link key={key} {...props} to={p.to}>{img}</Link>
  }
  if (!moving) return <div className="dk-hb-logos dk-hb-logos--static">{partners.map((p, i) => item(p, i))}</div>
  const set = Array.from({ length: Math.ceil(12 / partners.length) }, () => partners).flat()
  return (
    <div className="dk-hb-logos">
      <div className="dk-hb-track" style={{ animationDuration: `${set.length * 3.5}s` }}>
        {[0, 1].map((k) => (
          <div key={k} className="dk-hb-set" aria-hidden={k === 1 || undefined}>
            {set.map((p, i) => item(p, i, k === 1))}
          </div>
        ))}
      </div>
    </div>
  )
}

// QadamAI maketidagi namunaviy nomzodlar (faqat ko'rinish uchun — haqiqiy ma'lumot emas)
const EMP_DEMO = [
  { n: 'Dilnoza R.', r: 'Buxgalter', y: 3, m: 96, h: 262 },
  { n: 'Madina K.', r: 'Bosh buxgalter', y: 5, m: 91, h: 18 },
  { n: 'Shahnoza T.', r: 'Hisobchi', y: 2, m: 84, h: 330 },
]
// tarjima qilingan gapdagi **…** qismlari qalin chiqadi (so'z tartibi tilga qarab o'zgaradi)
const boldMarks = (s) => s.split('**').map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x))

const EMP_SUB = "Vakansiyangizni **bepul** joylang — **QadamAI** nomzodlarni ko'nikma, tajriba va shahar bo'yicha saralab, eng mos kadrlarni **bir necha daqiqada** taklif qiladi"

// Desktop bosh sahifasi — ish beruvchi rejimi: oq fonli katta sarlavha, ikki tugma,
// ostida QadamAI ishlashini ko'rsatuvchi brauzer maketi va atrofida suzib turuvchi ikonalar
function EmployerIntro() {
  const { allJobs, user, requireAuth } = useApp()
  const t = useT()
  const nav = useNavigate()
  const companies = buildCompanies(allJobs).length
  const postJob = () => nav('/post-job')

  return (
    <section className="dk-intro dk-emp">
      <div className="dk-emp-head">
        <div className="dk-emp-proof">
          <span className="dk-emp-faces" aria-hidden="true">
            {['#F4B3C2', '#B9B6FF', '#FFD39A'].map((bg, i) => <i key={bg} style={{ background: bg }}>{['D', 'M', 'S'][i]}</i>)}
          </span>
          <span>
            <span className="dk-emp-stars" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={10} weight="fill" />)}</span>
            {companies > 0 ? t('{n}+ kompaniya ishonadi').replace('{n}', companies) : t('Ish beruvchilar ishonadi')}
          </span>
        </div>

        <h1>
          {t('AyolQadami va Qadam AI HR bilan')}
          <em>{t('mos kadr topish oson')}</em>
        </h1>
        <p>{boldMarks(t(EMP_SUB))}</p>

        <div className="dk-emp-ctas">
          <button type="button" className="dk-emp-btn dk-emp-btn--main" onClick={postJob}>
            {t('Bepul vakansiya joylash')} <CaretRight size={16} weight="bold" />
          </button>
          {user ? (
            <Link to="/qadam-ai" className="dk-emp-btn dk-emp-btn--ghost"><Sparkle size={18} weight="fill" /> {t('QadamAI bilan izlash')}</Link>
          ) : (
            <button type="button" className="dk-emp-btn dk-emp-btn--ghost" onClick={() => requireAuth()}><SignIn size={18} /> {t('Kirish')}</button>
          )}
        </div>
      </div>

      <div className="dk-emp-stage">
        <svg className="dk-emp-wires" viewBox="0 0 1200 420" preserveAspectRatio="none" aria-hidden="true">
          <path d="M70 90 C 150 90, 120 230, 230 230" />
          <path d="M110 330 C 170 330, 160 300, 230 300" />
          <path d="M1130 80 C 1050 80, 1080 200, 970 200" />
          <path d="M1090 320 C 1030 320, 1040 280, 970 280" />
        </svg>
        <Link to="/post-job" className="dk-emp-float f1" aria-label={t('Vakansiya joylash')}><GlassIcon name="briefcase" tone="brand" size={46} /></Link>
        <a href="https://t.me/ayolqadam_bot" target="_blank" rel="noopener noreferrer" className="dk-emp-float f2" aria-label="Telegram bot"><GlassIcon name="plane" tone="brand" size={42} /></a>
        <Link to="/candidates" className="dk-emp-float f3" aria-label={t('Nomzodlar')}><GlassIcon name="users" tone="brand" size={46} /></Link>
        <Link to="/profile/edit" className="dk-emp-float f4" aria-label={t('Rezyume')}><GlassIcon name="resume" tone="brand" size={42} /></Link>

        <div className="dk-emp-win" aria-hidden="true">
          <div className="dk-emp-bar">
            <span className="dots"><i /><i /><i /></span>
            <span className="url">ayolqadami.uz/qadam-ai</span>
            <span className="dots dots--r"><i /><i /></span>
          </div>
          {/* QadamHR AI sahifasining kichraytirilgan nusxasi: lavanda ramka, chapda suhbatlar, o'ngda oq chat paneli */}
          <div className="dk-qa">
            <aside className="dk-qa-side">
              <div className="dk-qa-brand">
                <span className="dk-qa-logo"><QaIcon name="ai-magic" size={13} /></span>
                <b>QadamHR <span>AI</span></b>
                <QaIcon name="sidebar-left" size={15} />
              </div>
              <span className="dk-qa-new"><QaIcon name="add-01" size={13} strokeWidth={2} /> {t('Yangi suhbat')}</span>
              <span className="dk-qa-search"><QaIcon name="search-01" size={12} /> {t('Suhbatlardan qidirish')} <kbd>Ctrl K</kbd></span>
              <nav className="dk-qa-nav">
                <span><QaIcon name="user-group" size={14} /> {t('Nomzodlar')}</span>
                <span><QaIcon name="add-square" size={14} /> {t('Vakansiya joylash')}</span>
                <span><QaIcon name="building-03" size={14} /> {t('Kompaniyalar')}</span>
              </nav>
              <small>{t('Bugun')}</small>
              <span className="dk-qa-hist on">{t('Toshkentda 2+ yil tajribali buxgalter')}</span>
              <span className="dk-qa-hist">{t('Masofaviy SMM menejer')}</span>
            </aside>
            <div className="dk-qa-main">
              <div className="dk-qa-top">
                <span className="dk-qa-model"><span className="dk-qa-logo dk-qa-logo--sm"><QaIcon name="ai-magic" size={9} /></span> QadamHR AI <em>· {t('Nomzod izlash')}</em></span>
                <span className="dk-qa-cta">{t('Vakansiya joylash')}</span>
              </div>
              <div className="dk-qa-thread">
                <div className="dk-qa-me">{t("Toshkentda 2+ yil tajribali buxgalter kerak, 1C bilishi shart")}</div>
                <div className="dk-qa-ai">
                  <span className="qa-orb qa-orb--sm" aria-hidden="true"><i /></span>
                  <div>
                    <b className="dk-qa-name">QadamHR AI</b>
                    <div className="dk-qa-crit"><span>{t('Aniqlangan mezonlar:')}</span><em>1C</em><em>2+ {t('yil')}</em><em>{t('Toshkent')}</em></div>
                    <p>{t('3 ta mos nomzod topdim. Eng mosi —')} <b>Dilnoza R.</b></p>
                    <div className="dk-qa-res">
                      {EMP_DEMO.slice(0, 2).map((c) => (
                        <div key={c.n}>
                          <i style={{ background: `hsl(${c.h} 80% 88%)`, color: `hsl(${c.h} 45% 35%)` }}>{c.n[0]}</i>
                          <span><b>{c.n}</b><small>{t(c.r)} · {c.y} {t('yil')}</small></span>
                          <em style={{ '--v': c.m }}>{c.m}%</em>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="dk-qa-box">
                <span className="dk-qa-ph">{t('Talablarni yozing…')}</span>
                <span className="dk-qa-pill"><QaIcon name="ai-magic" size={12} /> {t('Chuqur tahlil')}</span>
                <span className="dk-qa-send"><QaIcon name="arrow-up-02" size={13} strokeWidth={2} /></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PartnersStrip />
    </section>
  )
}

// Ish beruvchi bosh sahifasi (desktop), maket ostida: 1) «Nega AyolQadami?» — katta sarlavha va 2×2 raqamli kartalar,
// 2) imkoniyatlar — bento to'r: ko'rish/ariza grafigi, e'lon tekshiruvi, yangi ariza bildirishnomasi, e'lonni tarqatish.
// Raqamlar sayt ma'lumotidan (kompaniya, faol vakansiya, shahar); grafik, rasm va postlar — namunaviy ko'rinish
const WHY_HEAD = "QadamAI HR **sun'iy intellekt** yordamida mos xodimni **topish, saralash** va yollashni bir joyda jamlaydi"
const BARS = [58, 46, 78, 44, 38, 62]
// Ovozsiz, takrorlanuvchi fon video: ekranda ko'ringanda o'ynaydi, chiqib ketsa to'xtaydi (protsessor/batareya tejaladi).
// muted ref orqali ham beriladi — React atributni HTML'ga yozmaydi, usiz ba'zi brauzerlar avto-o'ynatishni bloklaydi.
// «Harakatni kamaytirish» yoqilgan bo'lsa — faqat poster ko'rinadi
function LoopVideo({ src, poster }) {
  const ref = useRef(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true
    v.defaultMuted = true
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause() }, { threshold: 0.2 })
    io.observe(v)
    return () => io.disconnect()
  }, [])
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" disablePictureInPicture aria-hidden="true" tabIndex={-1} />
}

function EmployerWhy() {
  const { allJobs } = useApp()
  const t = useT()
  const companies = buildCompanies(allJobs).length
  const cities = new Set(allJobs.map((j) => j.city).filter(Boolean)).size
  const stats = [
    { v: `${companies}+`, l: 'Kompaniya bizga ishonadi', tone: 'brand' },
    { v: allJobs.length, l: 'Faol vakansiya', tone: 'plain' },
    { v: cities, l: 'Shahar va viloyat', tone: 'brand' },
    { v: t("0 so'm"), l: 'Vakansiya joylash narxi', tone: 'plain' },
  ]
  return (
    <section className="dk-why" aria-labelledby="dk-why-h">
      <div className="dk-why-top">
        <div className="dk-why-lead">
          <span className="dk-why-tag">{t('Nega AyolQadami?')}</span>
          <h2 id="dk-why-h">{t(WHY_HEAD).split('**').map((x, i) => (i % 2 ? <em key={i}>{x}</em> : x))}</h2>
        </div>
        <div className="dk-why-stats">
          {stats.map((s) => (
            <div key={s.l} className={`dk-why-stat is-${s.tone}`}>
              <b>{s.v}</b>
              <span>{t(s.l)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* imkoniyatlar: 3 ustunli bento — grafik, tekshiruv, (baland) yangi ariza, (keng) e'lon tarqatish */}
      <div className="dk-why-panel">
        <div className="dk-why-panel-head">
          <h2>{t('Nomzod izlash va saralash')}<br />{t('endi qiyin emas')}</h2>
          <p>{t("Ish beruvchilar uchun yaratilgan platforma: vakansiyani joylang — QadamAI nomzodlarni saralaydi, e'loningiz esa sayt va Telegram kanallarga o'zi tarqaladi")}</p>
        </div>
        <div className="dk-bn">
          <article className="dk-bn-card dk-bn--chart">
            <div className="dk-bn-chart" aria-hidden="true">
              <span className="dk-bn-tip"><b>1 240 {t("ko'rish")}</b><small>{t('Arizalar')}: 86</small></span>
              {BARS.map((h, i) => <i key={i} style={{ '--h': `${h}%`, animationDelay: `${i * 70}ms` }} />)}
            </div>
            <div className="dk-bn-cap"><h3>{t("Ko'rishlar va arizalar")}</h3><p>{t("Har bir vakansiya necha marta ko'rilgani va nechta ariza kelganini kuzatib borasiz")}</p></div>
          </article>

          <article className="dk-bn-card dk-bn--check">
            <div className="dk-bn-glow" aria-hidden="true">
              <QaIcon name="security-check" size={64} strokeWidth={1.4} />
              <i /><i /><i />
            </div>
            <div className="dk-bn-cap"><h3>{t("Har bir e'lon tekshiriladi")}</h3><p>{t("E'lonlar moderatsiyadan o'tadi — nomzodlar ishonchli ish beruvchini ko'radi")}</p></div>
          </article>

          <article className="dk-bn-card dk-bn--apply">
            <div className="dk-bn-photo" aria-hidden="true">
              <LoopVideo src="/media/new-application.mp4" poster="/media/new-application.webp" />
              <span className="dk-bn-badge dk-bn-badge--l"><span className="dk-bn-heart"><QaIcon name="heart-solid" size={17} /></span><small>96%</small></span>
              <span className="dk-bn-badge dk-bn-badge--r"><span><QaIcon name="user-multiple-02" size={17} /></span><small>12</small></span>
              <span className="dk-bn-new"><QaIcon name="checkmark-circle-02" size={22} strokeWidth={2} />{t('Yangi ariza keldi')}</span>
            </div>
            <div className="dk-bn-cap"><h3>{t('Arizalar haqida darhol xabar')}</h3><p>{t("Nomzod ariza yuborishi bilan sayt va Telegram bot orqali bildirishnoma olasiz")}</p></div>
          </article>

          <article className="dk-bn-card dk-bn--spread">
            <div className="dk-bn-cap"><h3>{t("Bir e'lon — hamma joyda")}</h3><p>{t("Vakansiyangiz saytda, @ayolqadam_bot va AyolQadam ish kanallarida bir vaqtda e'lon qilinadi")}</p></div>
            <div className="dk-bn-flow" aria-hidden="true">
              <div className="dk-bn-posts">
                {[['Buxgalter', 262], ['SMM menejer', 18], ['Operator', 330], ["O'qituvchi", 200]].map(([n, h]) => (
                  <span key={n} style={{ '--h': h }}><i>{n[0]}</i><b>{t(n)}</b><em /></span>
                ))}
              </div>
              <span className="dk-bn-line" />
              <span className="dk-bn-pill p1"><QaIcon name="link-04" size={14} strokeWidth={1.8} /> {t('Ariza yuborish')}</span>
              <span className="dk-bn-tg t1"><QaIcon name="telegram-solid" size={30} /></span>
              <span className="dk-bn-tg t2"><QaIcon name="telegram-solid" size={24} /></span>
              <span className="dk-bn-pill p2"><QaIcon name="link-04" size={14} strokeWidth={1.8} /> {t('Batafsil')}</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

// Desktop bosh sahifasi (mobil hero o'rniga). Ish izlovchi: fon rasmli katta karta — sarlavha, qidiruv, statistika,
// tezkor tugmalar va pastda hamkorlar lentasi. Fon rasmi: public/hero-bg.webp (bo'lmasa — brend gradienti)
function DesktopIntro({ isEmp }) {
  if (isEmp) return <EmployerIntro />
  return <SeekerIntro />
}

function SeekerIntro() {
  const { allJobs } = useApp()
  const t = useT()
  const nav = useNavigate()
  // qidiruv + kengaytirilgan filtrlar: natija /jobs?... manziliga o'tadi (u yerda ham tahrirlanadi)
  const [f, setFState] = useState(EMPTY)
  const setF = (k, v) => setFState((s) => ({ ...s, [k]: v }))
  const { q, city } = f
  const setQ = (v) => setF('q', v)
  const setCity = (v) => setF('city', v)
  const [panel, setPanel] = useState(false)
  const formRef = useRef(null)
  const cityOpts = useMemo(() => [{ value: '', label: t("O'zbekiston bo'ylab") }, ...CITIES.map((c) => ({ value: c, label: c }))], [t])
  const count = useMemo(() => allJobs.filter((j) => matchJob(j, f)).length, [allJobs, f])
  const active = activeCount(f) - (city ? 1 : 0) // shahar alohida maydonda ko'rinib turadi

  useEffect(() => {
    if (!panel) return
    // Select ro'yxati portal orqali body'da ochiladi — unga bosish panelni yopmasin
    const onDown = (e) => { if (!formRef.current?.contains(e.target) && !e.target.closest('.sel-menu')) setPanel(false) }
    const onKey = (e) => { if (e.key === 'Escape') setPanel(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [panel])

  const submit = (e) => {
    e?.preventDefault()
    setPanel(false)
    nav(`/jobs${filtersToSearch(f)}`)
  }
  const pills = (key, opts) => (
    <div className="dk-hf-pills">
      {opts.map((o) => (
        <button key={o.value || 'any'} type="button" className={f[key] === o.value ? 'on' : ''} aria-pressed={f[key] === o.value} onClick={() => setF(key, o.value)}>
          {o.icon && <Icon3D name={o.icon} size={20} />}{t(o.label)}
        </button>
      ))}
    </div>
  )

  const stats = [
    { icon: 'briefcase', value: allJobs.length, label: t('Vakansiyalar'), to: '/jobs' },
    { icon: 'building', value: buildCompanies(allJobs).length, label: t('Kompaniyalar'), to: '/companies' },
    { icon: 'grid', value: CATEGORIES.length, label: t("Ish yo'nalishlari"), to: '/categories' },
  ]

  return (
    <section className="dk-intro dk-hb">
      <div className="dk-hb-top">
        <div className="dk-hb-main">
          <h1>{t('Ayollar va ish beruvchilar uchun')}<br />{t('ishonchli raqamli platforma!')}</h1>
          <form ref={formRef} className="dk-hb-search" onSubmit={submit} role="search">
            <label className="dk-hb-q">
              <MagnifyingGlass size={19} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Kasb, lavozim nomi')} aria-label={t('Kasb, lavozim nomi')} />
              {q && <button type="button" className="dk-hb-x" aria-label={t('Tozalash')} onClick={() => setQ('')}><X size={15} weight="bold" /></button>}
            </label>
            <div className="dk-hb-city">
              <MapPin size={19} />
              <Select value={city} options={cityOpts} onChange={setCity} />
            </div>
            <button type="button" className={`dk-hb-fbtn${panel ? ' open' : ''}`} aria-expanded={panel} aria-controls="dk-hf" onClick={() => setPanel((v) => !v)}>
              <SlidersHorizontal size={19} /> {t('Filtrlar')}
              {active > 0 && <em>{active}</em>}
            </button>
            <button type="submit" className="dk-hb-go">{t('Qidirish')}</button>

            {panel && (
              <div id="dk-hf" className="dk-hf" role="dialog" aria-label={t('Filtrlar')}>
                <div className="dk-hf-grid">
                  <section className="dk-hf-wide">
                    <h3>{t("Yo'nalish")}</h3>
                    {pills('cat', [{ value: '', label: 'Barchasi' }, ...CATEGORIES.map((c) => ({ value: c.id, label: c.short, icon: c.icon }))])}
                  </section>
                  <section>
                    <h3>{t('Maosh (oyiga)')}</h3>
                    {pills('min', SALARY_STEPS)}
                  </section>
                  <section>
                    <h3>{t('Ish formati')}</h3>
                    {pills('type', [{ value: '', label: 'Har qanday format' }, ...JOB_TYPES.map((v) => ({ value: v, label: v }))])}
                  </section>
                  <section>
                    <h3>{t('Ish tajribasi')}</h3>
                    {pills('exp', EXP_STEPS)}
                  </section>
                  <section>
                    <h3>{t('Joylangan vaqti')}</h3>
                    {pills('period', PERIODS)}
                  </section>
                  <section>
                    <h3>{t('Saralash')}</h3>
                    {pills('sort', [{ value: 'new', label: 'Avval yangilari' }, { value: 'salary', label: "Maosh bo'yicha" }, { value: 'popular', label: "Ko'p ko'rilgan" }, { value: 'few', label: 'Kam arizali' }])}
                  </section>
                </div>
                <div className="dk-hf-foot">
                  <button type="button" className="dk-hf-reset" onClick={() => setFState((s) => ({ ...EMPTY, q: s.q }))}>{t('Tozalash')}</button>
                  <button type="button" className="dk-hf-show" disabled={!count} onClick={submit}>
                    {count ? t('{n} ta vakansiyani ko\'rsatish', { n: count }) : t('Mos vakansiya yo\'q')}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="dk-hb-line" />

      <div className="dk-hb-bottom">
        <div>
          <div className="dk-hb-stats">
            {stats.map(({ icon, value, label, to }) => (
              <Link key={label} to={to} className="dk-hb-stat">
                <GlassIcon name={icon} size={48} className="dk-hb-gico" />
                <span><b>{value.toLocaleString('ru-RU')}</b><small>{label}</small></span>
              </Link>
            ))}
          </div>
          <div className="dk-hb-apps">
            <a href="https://t.me/ayolqadam_bot" target="_blank" rel="noopener noreferrer" className="dk-hb-app">
              <GlassIcon name="plane" size={34} className="dk-hb-gico" />
              <span><small>{t('Telegram bot')}</small>@ayolqadam_bot</span>
            </a>
            <a href="https://t.me/addlist/URvgf3qbEus5ZDcy" target="_blank" rel="noopener noreferrer" className="dk-hb-app">
              <GlassIcon name="folder" size={34} className="dk-hb-gico" />
              <span><small>{t('Telegram papka')}</small>{t('Ish kanallari')}</span>
            </a>
          </div>
        </div>
        <div className="dk-hb-ctas">
          <Link to="/profile/edit" className="dk-hb-cta"><GlassIcon name="resume" tone="brand" size={32} className="dk-hb-gico" /> {t('Rezyume joylash')}</Link>
          <Link to="/post-job" className="dk-hb-cta"><GlassIcon name="briefcase" tone="brand" size={32} className="dk-hb-gico" /> {t('Vakansiya joylash')}</Link>
        </div>
      </div>

      <PartnersStrip />
    </section>
  )
}

// Bosh sahifa ikki manzilda: / — ish izlovchilar, /ish-beruvchilar — ish beruvchilar (audience="employer").
// Manzil ko'rinishni belgilaydi: Google har birini alohida sahifa sifatida indekslaydi
export default function Home({ audience }) {
  const { user, viewRole, setViewRole, allJobs, applications, posted, saved, unreadNotifs } = useApp()
  const t = useT()
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const isEmp = audience ? audience === 'employer' : viewRole === 'employer'
  const closeSearch = useCallback(() => setOpen(false), [])
  const nav = useNavigate()
  // /ish-beruvchilar ochilsa — sayt ish beruvchi ko'rinishiga o'tadi; / da ish beruvchi ko'rinishi tanlangan bo'lsa — o'z manziliga
  useEffect(() => {
    if (audience) { if (viewRole !== audience) setViewRole(audience) }
    else if (viewRole === 'employer') nav('/ish-beruvchilar', { replace: true })
  }, [audience]) // eslint-disable-line react-hooks/exhaustive-deps
  const [filterOpen, setFilterOpen] = useState(false)
  const [fCat, setFCat] = useState('')
  const [fType, setFType] = useState('')
  const [fSort, setFSort] = useState('new')
  const [fMin, setFMin] = useState('')
  const [fExp, setFExp] = useState('')
  const applyFilters = () => {
    const p = new URLSearchParams()
    if (fCat) p.set('cat', fCat)
    if (!isEmp && fType) p.set('type', fType)
    if (!isEmp && fMin) p.set('min', fMin)
    if (!isEmp && fExp) p.set('exp', fExp)
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
        { to: '/applications', label: t("E'lonlarim"), icon: 'folder', img: '/arizalar.webp', badge: posted.length || null },
        { to: '/candidates', label: t('Nomzod-\nlar'), icon: 'users' },
        { to: '/courses', label: t("O'quv\nkurslar"), icon: 'cap', img: '/kurslar-cap.webp', wide: true, soon: true },
        { to: '/events', label: t('Tadbirlar'), icon: 'calendar', img: '/tadbirlar.webp' },
      ]
    : [
        { to: '/applications', label: t('Ariza-\nlarim'), icon: 'folder', img: '/arizalar.webp', badge: applications.length || null },
        { to: '/jobs?period=3d&sort=new', label: t('Yangi\nishlar'), icon: 'briefcase', img: '/yangi-ishlar.webp' },
        { to: '/courses', label: t("O'quv\nkurslar"), icon: 'cap', img: '/kurslar-cap.webp', wide: true, soon: true },
        { to: '/events', label: t('Tadbirlar'), icon: 'calendar', img: '/tadbirlar.webp' },
      ]

  // tezkor kartalar: desktopda sahifada, mobilda sarlavhadagi menyu ichida
  const features = (
    <div className="feature-grid">
      {isEmp ? (
        <Link to="/post-job" className="fcard fcard-big">
          <b>{t('Vakansiya joylash')}</b>
          <span>{t("E'lon bering, arizalar oling")}</span>
          <img src="/vacancy-plus.webp" alt="" decoding="async" className="fcard-art plus-art" draggable="false" />
        </Link>
      ) : (
        <Link to="/profile/edit" className="fcard fcard-big">
          <b>{t('Rezyume yaratish')}</b>
          <span>{t("Profilingizni to'ldiring")}</span>
          <img src="/rezyume.webp" alt="" decoding="async" className="fcard-art resume-art" />
        </Link>
      )}
      <Link to="/qadam-ai" className="fcard fcard-ai">
        <b>QadamAI</b>
        <span className="ai-sub">{t('HR yordamchi')}</span>
        <img src="/qadam-ai.webp" alt="" decoding="async" className="fcard-art ai-art" />
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
          <img src="/kurslar.webp" alt="" decoding="async" className="fcard-art books-art" />
        </div>
      )}
    </div>
  )

  const myCats = user?.categories?.length ? user.categories : user?.category ? [user.category] : []
  // avval foydalanuvchi sohasiga moslari, keyin qolganlari — takrorlarsiz 30 ta
  const recommended = allJobs.filter((j) => !myCats.length || myCats.includes(j.category)).concat(allJobs)
  const uniqueRec = [...new Map(recommended.map((j) => [j.id, j])).values()].slice(0, 30)

  return (
    <div className="home">
      <DesktopIntro isEmp={isEmp} />
      {isEmp && <EmployerWhy />}
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-top">
            <Link to="/" className="hero-user hero-brand" aria-label="AyolQadami">
              <img src="/ayolqadami-mark.webp" alt="" width="34" height="34" />
              <span>AyolQadami</span>
            </Link>
            <div className="hero-actions">
              <ThemeToggle className="hero-btn" size={24} />
              <Link to="/notifications" className="hero-btn" aria-label={t('Bildirishnomalar')}>
                <Bell size={25} />
                {unreadNotifs > 0 && <span className="dot" />}
              </Link>
              <QuickMenu>{features}</QuickMenu>
            </div>
          </div>

          <div className="tiles">
            {tiles.map((tile) => {
              const inner = (
                <>
                  {tile.img
                    ? <img src={tile.img} alt="" decoding="async" className={`tile-ico tile-img${tile.wide ? ' wide' : ''}`} />
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
            <span className="search-panel-title">{t('Maosh (oyiga)')}</span>
            <div className="pill-row wrap">
              {SALARY_STEPS.map((s) => (
                <button key={s.value || 'any'} type="button" className={`pill pill-sm ${fMin === s.value ? 'on' : ''}`} onClick={() => setFMin(s.value)}>{t(s.label)}</button>
              ))}
            </div>
            <span className="search-panel-title">{t('Ish tajribasi')}</span>
            <div className="pill-row wrap">
              {EXP_STEPS.map((s) => (
                <button key={s.value || 'any'} type="button" className={`pill pill-sm ${fExp === s.value ? 'on' : ''}`} onClick={() => setFExp(s.value)}>{t(s.label)}</button>
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
          <button type="button" className="btn btn-soft btn-lg" onClick={() => { setFCat(''); setFType(''); setFSort('new'); setFMin(''); setFExp('') }}>{t('Tozalash')}</button>
          <button type="button" className="btn btn-primary btn-lg" onClick={applyFilters}>{t("Natijalarni ko'rish")}</button>
        </div>
      </Sheet>
    </div>
  )
}
