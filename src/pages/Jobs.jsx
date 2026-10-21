import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import {
  ArrowLeft, Buildings, CaretRight, ChatCircleText, CheckCircle, Clock, CurrencyCircleDollar, DotsThree, Export, EyeSlash, Flag, Heart, HeartStraight, Info, MapPin, PaperPlaneTilt, Phone, SealCheck, Sparkle, TelegramLogo, UsersThree,
} from '@phosphor-icons/react'
import { CompanyLogo, Dropdown, Empty, JobCard, Pagination, Sheet, TopBar } from '../components/UI'
import { useApp } from '../context/AppContext'
import { CATEGORIES, JOB_TYPES, catName, salaryText } from '../data/mock'
import { placeJobs } from '../data/geo'
import { companySlug } from '../data/companies'
import { WORK_MODES, WORK_TIME } from '../data/resume'
import { breadcrumbLd, findJobByRef, jobPath, jobPostingLd, siteUrl, useSeo } from '../lib/seo'
import { api as server, apiEnabled } from '../lib/api'
import { tr, tx, useT } from '../i18n'

const PER_PAGE = 20

// Vakansiya joylash ustasi orqali kiritilgan qo'shimcha ma'lumotlar (eski vakansiyalarda bo'lmaydi)
function jobFacts(job) {
  const pick = (list, ids) => list.filter((o) => ids?.includes(o.id)).map((o) => tr(o.label)).join(', ')
  return [
    [tr("Bo'sh o'rinlar"), job.count > 1 && tr('{n} ta', { n: job.count })],
    [tr('Manzil'), tx([job.district, job.address].filter(Boolean).join(', '))],
    [tr('Ish soatlari'), job.hours],
    [tr('Ish vaqti'), pick(WORK_TIME, job.workTime)],
    [tr('Ish usuli'), pick(WORK_MODES, job.workMode)],
    [tr("Ta'lim"), tr(job.education)],
    [tr('Tillar'), job.langs?.map((l) => `${tr(l.lang)}${l.level && l.level !== 'native' ? ` (${tr('{level} va yuqori', { level: l.level })})` : ''}`).join(', ')],
    [tr('Haydovchilik guvohnomasi'), job.driving?.length > 0 && job.driving.join(', ')],
  ].filter(([, v]) => v)
}

const SORTS = [
  { value: 'new', label: 'Avval yangilari', icon: Clock },
  { value: 'salary', label: "Maosh bo'yicha", icon: CurrencyCircleDollar },
  { value: 'few', label: 'Kam arizali', icon: UsersThree },
]

const norm = (s) => String(s || '').toLowerCase().replace(/[‘’ʼ`ʻ]/g, "'")

export function Jobs() {
  const { allJobs } = useApp()
  const t = useT()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const cat = params.get('cat') || ''
  const [type, setType] = useState(params.get('type') || '')
  const [sort, setSort] = useState(params.get('sort') || 'new')
  // sarlavhadagi qidiruv yoki filtr oynasidan kelgan qiymatlar (sahifa ochiq turganda ham) holatga tushadi
  const urlQ = params.get('q')
  const urlType = params.get('type')
  const urlSort = params.get('sort')
  useEffect(() => { if (urlQ !== null) setQ(urlQ) }, [urlQ])
  useEffect(() => { if (urlType !== null) setType(urlType) }, [urlType])
  useEffect(() => { if (urlSort !== null) setSort(urlSort) }, [urlSort])

  const setCat = (id) => {
    const p = new URLSearchParams(params)
    id ? p.set('cat', id) : p.delete('cat')
    p.delete('page')
    setParams(p, { replace: true })
  }
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1)
  const setPage = (n) => {
    const p = new URLSearchParams(params)
    n > 1 ? p.set('page', n) : p.delete('page')
    setParams(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  // qidiruv yoki filtr o'zgarsa — birinchi sahifaga qaytamiz
  const resetPage = () => {
    if (!params.get('page')) return
    const p = new URLSearchParams(params)
    p.delete('page')
    setParams(p, { replace: true })
  }

  const list = useMemo(() => {
    const nq = norm(q.trim())
    let r = allJobs.filter((j) =>
      (!cat || j.category === cat) &&
      (!type || j.type === type) &&
      (!nq || norm(`${j.title} ${j.company} ${(j.skills || []).join(' ')} ${j.city}`).includes(nq) || norm(tx(j.title)).includes(nq)))
    if (sort === 'salary') r = [...r].sort((a, b) => (b.salaryTo || 0) - (a.salaryTo || 0))
    if (sort === 'few') r = [...r].sort((a, b) => (a.applicants || 0) - (b.applicants || 0))
    return r
  }, [allJobs, q, cat, type, sort])

  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE))
  const cur = Math.min(page, pages)
  const shown = list.slice((cur - 1) * PER_PAGE, cur * PER_PAGE)

  return (
    <div className="page">
      <TopBar title={t('Vakansiyalar')} back={false} right={<Link to="/qadam-ai" className="icon-btn ai" aria-label="QadamAI"><Icon name="sparkle" /></Link>} />
      <div className="page-body">
        <div className="search search-solid">
          <Icon name="search" size={22} />
          <input value={q} onChange={(e) => { setQ(e.target.value); resetPage() }} placeholder={t("Kasb, kompaniya yoki ko'nikma")} />
          {q && <button className="icon-btn sm" onClick={() => { setQ(''); resetPage() }} aria-label={t('Tozalash')}><Icon name="x" size={18} /></button>}
        </div>

        <div className="pill-row">
          <button className={`pill ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>{t('Barchasi')}</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={`pill ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>
              <Icon3D name={c.icon} size={22} /> {t(c.short)}
            </button>
          ))}
        </div>
        <div className="pill-row">
          {['', ...JOB_TYPES].map((jt) => (
            <button key={jt || 'all'} className={`pill pill-sm ${type === jt ? 'on' : ''}`} onClick={() => { setType(jt); resetPage() }}>{t(jt || 'Har qanday format')}</button>
          ))}
        </div>

        <div className="result-bar">
          <div className="result-count">
            <b>{t('{n} ta vakansiya', { n: list.length })}</b>
            {pages > 1 && <span>{t("{range} ko'rsatilmoqda", { range: `${(cur - 1) * PER_PAGE + 1}–${(cur - 1) * PER_PAGE + shown.length}` })}</span>}
          </div>
          <Dropdown value={sort} options={SORTS.map((o) => ({ ...o, label: t(o.label) }))} label={t('Saralash')} onChange={(v) => { setSort(v); resetPage() }} />
        </div>

        {list.length ? (
          <>
            <div className="list-grid">{shown.map((j) => <JobCard key={j.id} job={j} />)}</div>
            <Pagination page={cur} pages={pages} onChange={setPage} />
          </>
        ) : (
          <Empty icon="briefcase" title={t('Hech narsa topilmadi')} text={t("Filtrlarni o'zgartirib ko'ring yoki QadamAI'dan so'rang")}
            action={<Link to="/qadam-ai" className="btn btn-primary">{t('QadamAI bilan izlash')}</Link>} />
        )}
      </div>
    </div>
  )
}

const QUESTIONS = ['Ish joyi qayerda joylashgan?', 'Qanday ish jadvali?', 'Vakansiya hali ochiqmi?', 'Ish haqi qancha?', "Siz bilan qanday bog'lanish mumkin?"]
const REPORTS = ["Firibgarlik yoki to'lov talab qilinmoqda", "Noto'g'ri yoki eskirgan ma'lumot", 'Kamsituvchi talablar', 'Boshqa sabab']

// Ish joyi xaritasi (kichik, faqat ko'rish uchun)
function JobMiniMap({ pos }) {
  const boxRef = useRef(null)
  useEffect(() => {
    const map = L.map(boxRef.current, { center: pos, zoom: 14, scrollWheelZoom: false })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map)
    L.marker(pos, { icon: L.divIcon({ className: 'jd-map-wrap', html: '<span class="jd-map-pin"></span>', iconSize: null }), interactive: false }).addTo(map)
    return () => map.remove()
  }, [pos[0], pos[1]]) // eslint-disable-line react-hooks/exhaustive-deps
  return <div ref={boxRef} className="jd-map" />
}

export function JobDetail() {
  const { id: ref } = useParams()
  const nav = useNavigate()
  const { jobsAll, allJobs, user, saved, toggleSave, applications, apply, notify, hiddenJobs, hiddenCompanies, hideJob, hideCompany, requireAuth } = useApp()
  const t = useT()
  // /jobs/1001-nom (raqam) yoki eski /jobs/<id>; ro'yxatda bo'lmasa — serverdan (to'g'ridan-to'g'ri havola, Google)
  const [loaded, setLoaded] = useState(null) // null — kutilmoqda, false — topilmadi
  const listed = findJobByRef(jobsAll, ref)
  const job = listed || loaded || undefined
  const id = job?.id
  useEffect(() => {
    if (listed || !apiEnabled) return
    const ctrl = new AbortController()
    setLoaded(null)
    server.job(ref, ctrl.signal).then((d) => setLoaded(d?.job || false)).catch((e) => { if (e.name !== 'AbortError') setLoaded(false) })
    return () => ctrl.abort()
  }, [ref, listed])
  // manzil eski yoki nomi o'zgargan bo'lsa — kanonik manzilga (dublikat sahifa bo'lmasin)
  useEffect(() => {
    if (job?.number && decodeURIComponent(window.location.pathname) !== jobPath(job)) nav(jobPath(job), { replace: true })
  }, [job?.number, job?.title]) // eslint-disable-line react-hooks/exhaustive-deps
  useSeo(job ? {
    title: `${job.title} — ${job.company}, ${job.city}`,
    description: `${job.title} vakansiyasi: ${job.company}, ${job.city}. Maosh: ${salaryText(job)}. ${job.type || ''}. ${String(job.description || '').slice(0, 110)}`,
    path: jobPath(job),
    jsonLd: [jobPostingLd(job), breadcrumbLd([['AyolQadami', '/'], ['Vakansiyalar', '/jobs'], [job.title, jobPath(job)]])],
  } : { title: 'Vakansiya topilmadi', noindex: true }, [job?.id, job?.title])
  const [open, setOpen] = useState(false)
  const [letter, setLetter] = useState('')
  const [ask, setAsk] = useState(null) // savol matni (null — oyna yopiq)
  const [report, setReport] = useState(null) // shikoyat sababi (null — oyna yopiq)
  const [menu, setMenu] = useState(false)
  const [showContacts, setShowContacts] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menu) return
    const close = (e) => { if (!menuRef.current?.contains(e.target)) setMenu(false) }
    const esc = (e) => { if (e.key === 'Escape') setMenu(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc) }
  }, [menu])

  const pos = useMemo(() => placeJobs(jobsAll).find((j) => j.id === id)?.pos, [jobsAll, id])
  const similar = useMemo(() => (job ? allJobs.filter((j) => j.id !== job.id && j.category === job.category) : []), [allJobs, job])

  if (!job && loaded === null && apiEnabled) return <div className="page" aria-busy="true"><TopBar title={t('Vakansiya')} /></div>
  if (!job) return <div className="page"><TopBar title={t('Vakansiya')} /><Empty title={t('Vakansiya topilmadi')} action={<Link to="/jobs" className="btn btn-primary">{t('Barcha vakansiyalar')}</Link>} /></div>

  const applied = applications.some((a) => a.jobId === job.id)
  const isSaved = saved.includes(job.id)
  const seeker = user?.role !== 'employer'
  const send = () => {
    apply(job.id, letter)
    setOpen(false)
    setLetter('')
    notify(t('Arizangiz yuborildi!'))
  }

  const share = async () => {
    setMenu(false)
    const url = siteUrl() + jobPath(job)
    try {
      if (navigator.share) await navigator.share({ title: job.title, text: `${job.title} — ${job.company}`, url })
      else { await navigator.clipboard.writeText(url); notify(t('Havola nusxalandi')) }
    } catch { /* foydalanuvchi bekor qildi */ }
  }
  const back = () => (window.history.length > 1 ? nav(-1) : nav('/jobs'))
  const contactPhone = job.contact?.ways?.includes('phone') && job.contact.phone
  const contactTg = job.contact?.ways?.includes('telegram') && job.contact.telegram
  const hasContacts = !!(contactPhone || contactTg)
  const companyJobs = allJobs.filter((j) => j.company === job.company).length

  const facts = [
    [t('Ish tajribasi'), job.experience ? t('{n}+ yil', { n: job.experience }) : t('Talab qilinmaydi')],
    [t('Ish formati'), t(job.type)],
    [t('Soha'), catName(job.category)],
    ...jobFacts(job),
  ]
  const applyBtn = (cls = '') => (
    <button type="button" className={`btn ${applied ? 'btn-done' : 'btn-primary'} ${cls}`} disabled={applied} onClick={() => requireAuth(() => setOpen(true))}>
      {applied ? <><CheckCircle size={19} weight="fill" /> {t('Ariza yuborilgan')}</> : t('Ariza topshirish')}
    </button>
  )
  // kontakt bo'lsa — kontaktlar bo'limiga o'tamiz, bo'lmasa savol yozish oynasini ochamiz
  const contact = () => {
    if (!hasContacts) return requireAuth(() => setAsk(''))
    setShowContacts(true)
    document.getElementById('jd-contacts')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="page jd">
      <header className="jd-top">
        <button className="jd-round" onClick={back} aria-label={t('Orqaga')}><ArrowLeft size={20} weight="bold" /></button>
        <h1><Info size={18} weight="fill" /> {t('Vakansiya')}</h1>
        <div className="jd-top-right">
          <button className={`jd-round ${isSaved ? 'saved' : ''}`} onClick={() => requireAuth(() => toggleSave(job.id))} aria-label={t('Saqlash')} aria-pressed={isSaved}>
            <Heart size={20} weight={isSaved ? 'fill' : 'bold'} />
          </button>
          <button className="jd-round" onClick={share} aria-label={t('Ulashish')}><Export size={20} weight="bold" /></button>
        </div>
      </header>

      <div className="jd-body jd-layout">
        <div className="jd-main">
          {/* Asosiy karta: nom, maosh, shartlar va amallar */}
          <section className="jd-card jd-hero">
            <h2>{tx(job.title)}</h2>
            <div className="jd-hero-salary">{salaryText(job)} <small>{t('oyiga, soliqdan oldin')}</small></div>
            <dl className="jd-rows">
              {facts.map(([k, v]) => <div key={k}><dt>{k}:</dt><dd>{v}</dd></div>)}
            </dl>
            <p className="jd-live">
              <UsersThree size={16} /> {job.applicants ? t('{n} kishi ariza topshirgan', { n: job.applicants }) : t("Birinchilardan bo'lib ariza topshiring")}
            </p>
            <div className="jd-actions">
              {seeker && applyBtn('jd-apply-inline')}
              {seeker && <button type="button" className="btn btn-soft" onClick={contact}><ChatCircleText size={19} weight="bold" /> {t("Bog'lanish")}</button>}
              <button type="button" className={`jd-sq ${isSaved ? 'saved' : ''}`} onClick={() => requireAuth(() => toggleSave(job.id))} aria-label={t('Saqlash')} aria-pressed={isSaved}>
                <Heart size={20} weight={isSaved ? 'fill' : 'bold'} />
              </button>
              <div className="jd-more" ref={menuRef}>
                <button type="button" className="jd-sq" onClick={() => setMenu((m) => !m)} aria-label={t('Boshqa amallar')} aria-haspopup="menu" aria-expanded={menu}>
                  <DotsThree size={22} weight="bold" />
                </button>
                {menu && (
                  <div className="jd-menu" role="menu">
                    <button type="button" role="menuitem" onClick={share}><Export size={18} /> {t('Ulashish')}</button>
                    {seeker && !job.own && (
                      <>
                        <button type="button" role="menuitem" disabled={hiddenJobs.includes(job.id)}
                          onClick={() => { hideJob(job.id); notify(t('Vakansiya yashirildi')); back() }}>
                          <EyeSlash size={18} /> {hiddenJobs.includes(job.id) ? t('Yashirilgan') : t('Vakansiyani yashirish')}
                        </button>
                        <button type="button" role="menuitem" disabled={hiddenCompanies.includes(job.company)}
                          onClick={() => { hideCompany(job.company); notify(t('«{name}» vakansiyalari yashirildi', { name: job.company })); back() }}>
                          <Buildings size={18} /> {hiddenCompanies.includes(job.company) ? t('Kompaniya yashirilgan') : t('Kompaniyani yashirish')}
                        </button>
                        <button type="button" role="menuitem" className="danger" onClick={() => { setMenu(false); setReport('') }}><Flag size={18} /> {t('Shikoyat qilish')}</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {job.tags?.length > 0 && (
            <section className="jd-card jd-perks">
              <span className="jd-perk-ico"><HeartStraight size={20} weight="fill" /></span>
              <div>
                <b>{t('Ayollar uchun qulayliklar')}</b>
                <div className="jd-perk-tags">{job.tags.map((tag) => <span key={tag}>{t(tag)}</span>)}</div>
              </div>
            </section>
          )}

          <section className="jd-card jd-text">
            <h3>{t('Vakansiya haqida')}</h3>
            <p>{tx(job.description)}</p>
            {job.duties?.length > 0 && <><h4>{t('Vazifalar')}</h4><ul>{job.duties.map((r) => <li key={r}>{tx(r)}</li>)}</ul></>}
            {job.requirements?.length > 0 && <><h4>{t('Talablar')}</h4><ul>{job.requirements.map((r) => <li key={r}>{tx(r)}</li>)}</ul></>}
            {job.conditions?.length > 0 && <><h4>{t('Sharoitlar')}</h4><ul>{job.conditions.map((r) => <li key={r}>{tx(r)}</li>)}</ul></>}
            {job.skills?.length > 0 && (
              <>
                <h4>{t("Asosiy ko'nikmalar")}</h4>
                <div className="jd-skills">{job.skills.map((s) => <span key={s}>{s}</span>)}</div>
              </>
            )}
          </section>

          {seeker && hasContacts && (
            <section className="jd-card" id="jd-contacts">
              <h3>{t('Kontaktlar')}</h3>
              {job.contact.name && <p className="jd-contact-name">{job.contact.name}</p>}
              {showContacts ? (
                <div className="jd-contact fade-in">
                  {contactPhone && <a className="btn btn-soft" href={`tel:${contactPhone.replace(/\s/g, '')}`}><Phone size={18} weight="fill" /> {contactPhone}</a>}
                  {contactTg && <a className="btn btn-soft" href={`https://t.me/${contactTg.replace(/^@/, '')}`} target="_blank" rel="noreferrer"><TelegramLogo size={18} weight="fill" /> {contactTg}</a>}
                </div>
              ) : (
                <button type="button" className="btn btn-soft" onClick={() => requireAuth(() => setShowContacts(true))}><Phone size={18} weight="fill" /> {t("Kontaktlarni ko'rsatish")}</button>
              )}
            </section>
          )}

          {seeker && !job.own && (
            <section className="jd-card">
              <h3>{t('Ish beruvchiga savol bering')}</h3>
              <p className="jd-note">{t("Savolingiz shu vakansiya bo'yicha murojaat sifatida yuboriladi")}</p>
              <div className="jd-questions">
                {QUESTIONS.map((q) => <button key={q} type="button" onClick={() => requireAuth(() => setAsk(t(q)))}>{t(q)}</button>)}
                <button type="button" className="alt" onClick={() => requireAuth(() => setAsk(''))}>{t('Boshqa savol')}</button>
              </div>
            </section>
          )}

          {pos && (
            <section className="jd-card">
              <h3>{t('Qayerda ishlash kerak')}</h3>
              <p className="jd-address"><MapPin size={17} weight="fill" /> {tx([job.city, job.district, job.address].filter(Boolean).join(', '))}</p>
              <JobMiniMap pos={pos} />
              <Link to="/map" className="jd-link">{t("Katta xaritada ko'rish")} <CaretRight size={14} weight="bold" /></Link>
            </section>
          )}

          <p className="jd-posted">{t("Vakansiya {when} e'lon qilingan", { when: t(job.posted) })} · {tx(job.city)}</p>

          {seeker && (
            <div className="jd-foot">
              {applyBtn()}
              {!job.own && <button type="button" className="btn jd-report" onClick={() => setReport('')}><Flag size={18} /> {t('Vakansiyadan shikoyat qilish')}</button>}
            </div>
          )}
        </div>

        {/* O'ng ustun: kompaniya, QadamAI, o'xshash vakansiyalar */}
        <aside className="jd-aside">
          <Link to={`/companies/${companySlug(job.company)}`} className="jd-card jd-company">
            <CompanyLogo name={job.company} color={job.color} size={52} />
            <div className="jd-company-info">
              <b>{job.company} {!job.own && <SealCheck size={16} weight="fill" className="verified" aria-label={t('Tasdiqlangan')} />}</b>
              <span>{t('{n} ta faol vakansiya', { n: companyJobs })}</span>
            </div>
            <CaretRight size={18} weight="bold" className="jd-company-go" />
          </Link>

          {seeker && (
            <Link to={`/qadam-ai?q=${encodeURIComponent(job.title)}`} className="jd-promo">
              <div>
                <b>{t('Bu ish sizga qanchalik mos?')}</b>
                <span>{t('QadamAI rezyumengizni vakansiya bilan solishtiradi')}</span>
                <em>{t('Tekshirish')} <Sparkle size={14} weight="fill" /></em>
              </div>
              <img src="/qadam-ai.png" alt="" draggable="false" />
            </Link>
          )}

          {similar.length > 0 && (
            <section className="jd-similar">
              <h3>{t('Sizga mos boshqa vakansiyalar')}</h3>
              {similar.slice(0, 3).map((j) => (
                <Link key={j.id} to={jobPath(j)} className="jd-card jd-sim">
                  <b>{tx(j.title)}</b>
                  <span className="jd-sim-pay">{salaryText(j)}</span>
                  <span className="jd-sim-co"><CompanyLogo name={j.company} color={j.color} size={26} /> {j.company} · {tx(j.city)}</span>
                </Link>
              ))}
              {similar.length > 3 && (
                <Link to={`/jobs?cat=${job.category}`} className="jd-link">{t("Yana {n} ta o'xshash vakansiya", { n: similar.length - 3 })} <CaretRight size={14} weight="bold" /></Link>
              )}
            </section>
          )}
        </aside>
      </div>

      {seeker && (
        <div className="jd-cta jd-cta-mobile">
          <Link to={`/qadam-ai?q=${encodeURIComponent(job.title)}`} className="jd-cta-ai" aria-label={t('QadamAI moslik')}>
            <Sparkle size={22} weight="fill" />
          </Link>
          <button className="jd-cta-main" disabled={applied} onClick={() => requireAuth(() => setOpen(true))}>
            {applied ? <><CheckCircle size={20} weight="fill" /> {t('Ariza yuborilgan')}</> : <>{t('Ariza topshirish')} <PaperPlaneTilt size={19} weight="fill" /></>}
          </button>
        </div>
      )}
      {user?.role === 'employer' && job.own && (
        <div className="jd-cta">
          <button className="jd-cta-main" onClick={() => nav(`/qadam-ai?q=${encodeURIComponent(job.title + ' ' + (job.skills || []).join(' '))}`)}>
            <Sparkle size={20} weight="fill" /> {t('QadamAI bilan nomzod topish')}
          </button>
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={t('Ariza topshirish')}>
        <div className="apply-head">
          <CompanyLogo name={job.company} color={job.color} />
          <div><b>{tx(job.title)}</b><span className="muted">{job.company}</span></div>
        </div>
        <label className="field"><span>{t("Qo'shimcha xat (ixtiyoriy)")}</span>
          <textarea rows={5} value={letter} onChange={(e) => setLetter(e.target.value)}
            placeholder={t('Nima uchun aynan siz bu lavozimga mossiz?')} /></label>
        <p className="muted small">{t('Arizaga profilingizdagi rezyume avtomatik biriktiriladi.')}</p>
        <button className="btn btn-primary btn-lg btn-block" onClick={send}><Icon name="send" size={18} /> {t('Yuborish')}</button>
      </Sheet>

      <Sheet open={ask !== null} onClose={() => setAsk(null)} title={t('Ish beruvchiga savol')}>
        <div className="apply-head">
          <CompanyLogo name={job.company} color={job.color} />
          <div><b>{tx(job.title)}</b><span className="muted">{job.company}</span></div>
        </div>
        <label className="field"><span>{t('Savolingiz')}</span>
          <textarea rows={4} value={ask || ''} onChange={(e) => setAsk(e.target.value)} placeholder={t('Savolingizni yozing')} /></label>
        <button className="btn btn-primary btn-lg btn-block" disabled={!ask?.trim()}
          onClick={() => { setAsk(null); notify(t('Savolingiz ish beruvchiga yuborildi')) }}><Icon name="send" size={18} /> {t('Yuborish')}</button>
      </Sheet>

      <Sheet open={report !== null} onClose={() => setReport(null)} title={t('Vakansiyadan shikoyat')}>
        <div className="jd-reasons" role="radiogroup" aria-label={t('Shikoyat sababi')}>
          {REPORTS.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={report === r} className={report === r ? 'on' : ''} onClick={() => setReport(r)}>
              <i /> {t(r)}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-lg btn-block" disabled={!report}
          onClick={() => { setReport(null); notify(t('Shikoyatingiz qabul qilindi. Rahmat!')) }}>{t('Yuborish')}</button>
      </Sheet>
    </div>
  )
}
