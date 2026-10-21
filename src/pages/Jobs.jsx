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
import { WORK_MODES, WORK_TIME } from '../data/resume'

const PER_PAGE = 20

// Vakansiya joylash ustasi orqali kiritilgan qo'shimcha ma'lumotlar (eski vakansiyalarda bo'lmaydi)
function jobFacts(job) {
  const pick = (list, ids) => list.filter((o) => ids?.includes(o.id)).map((o) => o.label).join(', ')
  return [
    ["Bo'sh o'rinlar", job.count > 1 && `${job.count} ta`],
    ['Manzil', [job.district, job.address].filter(Boolean).join(', ')],
    ['Ish soatlari', job.hours],
    ['Ish vaqti', pick(WORK_TIME, job.workTime)],
    ['Ish usuli', pick(WORK_MODES, job.workMode)],
    ["Ta'lim", job.education],
    ['Tillar', job.langs?.map((l) => `${l.lang}${l.level && l.level !== 'native' ? ` (${l.level} va yuqori)` : ''}`).join(', ')],
    ['Haydovchilik guvohnomasi', job.driving?.length > 0 && job.driving.join(', ')],
  ].filter(([, v]) => v)
}

const SORTS = [
  { value: 'new', label: 'Avval yangilari', icon: Clock },
  { value: 'salary', label: "Maosh bo'yicha", icon: CurrencyCircleDollar },
  { value: 'few', label: 'Kam arizali', icon: UsersThree },
]

const norm = (s) => s.toLowerCase().replace(/[‘’ʼ`ʻ]/g, "'")

export function Jobs() {
  const { allJobs } = useApp()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const cat = params.get('cat') || ''
  const [type, setType] = useState(params.get('type') || '')
  const [sort, setSort] = useState(params.get('sort') || 'new')
  // sarlavhadagi qidiruvdan kelgan so'rov (sahifa ochiq turganda ham) maydonga tushadi
  const urlQ = params.get('q')
  useEffect(() => { if (urlQ !== null) setQ(urlQ) }, [urlQ])

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
      (!nq || norm(`${j.title} ${j.company} ${j.skills.join(' ')} ${j.city}`).includes(nq)))
    if (sort === 'salary') r = [...r].sort((a, b) => (b.salaryTo || 0) - (a.salaryTo || 0))
    if (sort === 'few') r = [...r].sort((a, b) => (a.applicants || 0) - (b.applicants || 0))
    return r
  }, [allJobs, q, cat, type, sort])

  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE))
  const cur = Math.min(page, pages)
  const shown = list.slice((cur - 1) * PER_PAGE, cur * PER_PAGE)

  return (
    <div className="page">
      <TopBar title="Vakansiyalar" back={false} right={<Link to="/qadam-ai" className="icon-btn ai" aria-label="QadamAI"><Icon name="sparkle" /></Link>} />
      <div className="page-body">
        <div className="search search-solid">
          <Icon name="search" size={22} />
          <input value={q} onChange={(e) => { setQ(e.target.value); resetPage() }} placeholder="Kasb, kompaniya yoki ko'nikma" />
          {q && <button className="icon-btn sm" onClick={() => { setQ(''); resetPage() }} aria-label="Tozalash"><Icon name="x" size={18} /></button>}
        </div>

        <div className="pill-row">
          <button className={`pill ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>Barchasi</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={`pill ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>
              <Icon3D name={c.icon} size={22} /> {c.short}
            </button>
          ))}
        </div>
        <div className="pill-row">
          {['', ...JOB_TYPES].map((t) => (
            <button key={t || 'all'} className={`pill pill-sm ${type === t ? 'on' : ''}`} onClick={() => { setType(t); resetPage() }}>{t || 'Har qanday format'}</button>
          ))}
        </div>

        <div className="result-bar">
          <div className="result-count">
            <b>{list.length} ta vakansiya</b>
            {pages > 1 && <span>{(cur - 1) * PER_PAGE + 1}–{(cur - 1) * PER_PAGE + shown.length} ko'rsatilmoqda</span>}
          </div>
          <Dropdown value={sort} options={SORTS} label="Saralash" onChange={(v) => { setSort(v); resetPage() }} />
        </div>

        {list.length ? (
          <>
            <div className="list-grid">{shown.map((j) => <JobCard key={j.id} job={j} />)}</div>
            <Pagination page={cur} pages={pages} onChange={setPage} />
          </>
        ) : (
          <Empty icon="briefcase" title="Hech narsa topilmadi" text="Filtrlarni o'zgartirib ko'ring yoki QadamAI'dan so'rang"
            action={<Link to="/qadam-ai" className="btn btn-primary">QadamAI bilan izlash</Link>} />
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
  const { id } = useParams()
  const nav = useNavigate()
  const { jobsAll, allJobs, user, saved, toggleSave, applications, apply, notify, hiddenJobs, hiddenCompanies, hideJob, hideCompany, requireAuth } = useApp()
  const job = jobsAll.find((j) => j.id === id)
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

  if (!job) return <div className="page"><TopBar title="Vakansiya" /><Empty title="Vakansiya topilmadi" /></div>

  const applied = applications.some((a) => a.jobId === job.id)
  const isSaved = saved.includes(job.id)
  const seeker = user?.role !== 'employer'
  const send = () => {
    apply(job.id, letter)
    setOpen(false)
    notify('Arizangiz yuborildi!')
  }

  const share = async () => {
    setMenu(false)
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: job.title, text: `${job.title} — ${job.company}`, url })
      else { await navigator.clipboard.writeText(url); notify('Havola nusxalandi') }
    } catch { /* foydalanuvchi bekor qildi */ }
  }
  const back = () => (window.history.length > 1 ? nav(-1) : nav('/jobs'))
  const contactPhone = job.contact?.ways?.includes('phone') && job.contact.phone
  const contactTg = job.contact?.ways?.includes('telegram') && job.contact.telegram
  const hasContacts = !!(contactPhone || contactTg)
  const companyJobs = allJobs.filter((j) => j.company === job.company).length

  const facts = [
    ['Ish tajribasi', job.experience ? `${job.experience}+ yil` : 'Talab qilinmaydi'],
    ['Ish formati', job.type],
    ['Soha', catName(job.category)],
    ...jobFacts(job),
  ]
  const applyBtn = (cls = '') => (
    <button type="button" className={`btn ${applied ? 'btn-done' : 'btn-primary'} ${cls}`} disabled={applied} onClick={() => requireAuth(() => setOpen(true))}>
      {applied ? <><CheckCircle size={19} weight="fill" /> Ariza yuborilgan</> : 'Ariza topshirish'}
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
        <button className="jd-round" onClick={back} aria-label="Orqaga"><ArrowLeft size={20} weight="bold" /></button>
        <h1><Info size={18} weight="fill" /> Vakansiya</h1>
        <div className="jd-top-right">
          <button className={`jd-round ${isSaved ? 'saved' : ''}`} onClick={() => requireAuth(() => toggleSave(job.id))} aria-label="Saqlash" aria-pressed={isSaved}>
            <Heart size={20} weight={isSaved ? 'fill' : 'bold'} />
          </button>
          <button className="jd-round" onClick={share} aria-label="Ulashish"><Export size={20} weight="bold" /></button>
        </div>
      </header>

      <div className="jd-body jd-layout">
        <div className="jd-main">
          {/* Asosiy karta: nom, maosh, shartlar va amallar */}
          <section className="jd-card jd-hero">
            <h2>{job.title}</h2>
            <div className="jd-hero-salary">{salaryText(job)} <small>oyiga, soliqdan oldin</small></div>
            <dl className="jd-rows">
              {facts.map(([k, v]) => <div key={k}><dt>{k}:</dt><dd>{v}</dd></div>)}
            </dl>
            <p className="jd-live">
              <UsersThree size={16} /> {job.applicants ? `${job.applicants} kishi ariza topshirgan` : "Birinchilardan bo'lib ariza topshiring"}
            </p>
            <div className="jd-actions">
              {seeker && applyBtn('jd-apply-inline')}
              {seeker && <button type="button" className="btn btn-soft" onClick={contact}><ChatCircleText size={19} weight="bold" /> Bog'lanish</button>}
              <button type="button" className={`jd-sq ${isSaved ? 'saved' : ''}`} onClick={() => requireAuth(() => toggleSave(job.id))} aria-label="Saqlash" aria-pressed={isSaved}>
                <Heart size={20} weight={isSaved ? 'fill' : 'bold'} />
              </button>
              <div className="jd-more" ref={menuRef}>
                <button type="button" className="jd-sq" onClick={() => setMenu((m) => !m)} aria-label="Boshqa amallar" aria-haspopup="menu" aria-expanded={menu}>
                  <DotsThree size={22} weight="bold" />
                </button>
                {menu && (
                  <div className="jd-menu" role="menu">
                    <button type="button" role="menuitem" onClick={share}><Export size={18} /> Ulashish</button>
                    {seeker && !job.own && (
                      <>
                        <button type="button" role="menuitem" disabled={hiddenJobs.includes(job.id)}
                          onClick={() => { hideJob(job.id); notify('Vakansiya yashirildi'); back() }}>
                          <EyeSlash size={18} /> {hiddenJobs.includes(job.id) ? 'Yashirilgan' : 'Vakansiyani yashirish'}
                        </button>
                        <button type="button" role="menuitem" disabled={hiddenCompanies.includes(job.company)}
                          onClick={() => { hideCompany(job.company); notify(`«${job.company}» vakansiyalari yashirildi`); back() }}>
                          <Buildings size={18} /> {hiddenCompanies.includes(job.company) ? 'Kompaniya yashirilgan' : 'Kompaniyani yashirish'}
                        </button>
                        <button type="button" role="menuitem" className="danger" onClick={() => { setMenu(false); setReport('') }}><Flag size={18} /> Shikoyat qilish</button>
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
                <b>Ayollar uchun qulayliklar</b>
                <div className="jd-perk-tags">{job.tags.map((t) => <span key={t}>{t}</span>)}</div>
              </div>
            </section>
          )}

          <section className="jd-card jd-text">
            <h3>Vakansiya haqida</h3>
            <p>{job.description}</p>
            {job.duties?.length > 0 && <><h4>Vazifalar</h4><ul>{job.duties.map((r) => <li key={r}>{r}</li>)}</ul></>}
            {job.requirements?.length > 0 && <><h4>Talablar</h4><ul>{job.requirements.map((r) => <li key={r}>{r}</li>)}</ul></>}
            {job.conditions?.length > 0 && <><h4>Sharoitlar</h4><ul>{job.conditions.map((r) => <li key={r}>{r}</li>)}</ul></>}
            {job.skills?.length > 0 && (
              <>
                <h4>Asosiy ko'nikmalar</h4>
                <div className="jd-skills">{job.skills.map((s) => <span key={s}>{s}</span>)}</div>
              </>
            )}
          </section>

          {seeker && hasContacts && (
            <section className="jd-card" id="jd-contacts">
              <h3>Kontaktlar</h3>
              {job.contact.name && <p className="jd-contact-name">{job.contact.name}</p>}
              {showContacts ? (
                <div className="jd-contact fade-in">
                  {contactPhone && <a className="btn btn-soft" href={`tel:${contactPhone.replace(/\s/g, '')}`}><Phone size={18} weight="fill" /> {contactPhone}</a>}
                  {contactTg && <a className="btn btn-soft" href={`https://t.me/${contactTg.replace(/^@/, '')}`} target="_blank" rel="noreferrer"><TelegramLogo size={18} weight="fill" /> {contactTg}</a>}
                </div>
              ) : (
                <button type="button" className="btn btn-soft" onClick={() => requireAuth(() => setShowContacts(true))}><Phone size={18} weight="fill" /> Kontaktlarni ko'rsatish</button>
              )}
            </section>
          )}

          {seeker && !job.own && (
            <section className="jd-card">
              <h3>Ish beruvchiga savol bering</h3>
              <p className="jd-note">Savolingiz shu vakansiya bo'yicha murojaat sifatida yuboriladi</p>
              <div className="jd-questions">
                {QUESTIONS.map((q) => <button key={q} type="button" onClick={() => requireAuth(() => setAsk(q))}>{q}</button>)}
                <button type="button" className="alt" onClick={() => requireAuth(() => setAsk(''))}>Boshqa savol</button>
              </div>
            </section>
          )}

          {pos && (
            <section className="jd-card">
              <h3>Qayerda ishlash kerak</h3>
              <p className="jd-address"><MapPin size={17} weight="fill" /> {[job.city, job.district, job.address].filter(Boolean).join(', ')}</p>
              <JobMiniMap pos={pos} />
              <Link to="/map" className="jd-link">Katta xaritada ko'rish <CaretRight size={14} weight="bold" /></Link>
            </section>
          )}

          <p className="jd-posted">Vakansiya {job.posted} e'lon qilingan · {job.city}</p>

          {seeker && (
            <div className="jd-foot">
              {applyBtn()}
              {!job.own && <button type="button" className="btn jd-report" onClick={() => setReport('')}><Flag size={18} /> Vakansiyadan shikoyat qilish</button>}
            </div>
          )}
        </div>

        {/* O'ng ustun: kompaniya, QadamAI, o'xshash vakansiyalar */}
        <aside className="jd-aside">
          <Link to={`/companies/${encodeURIComponent(job.company)}`} className="jd-card jd-company">
            <CompanyLogo name={job.company} color={job.color} size={52} />
            <div className="jd-company-info">
              <b>{job.company} {!job.own && <SealCheck size={16} weight="fill" className="verified" aria-label="Tasdiqlangan" />}</b>
              <span>{companyJobs} ta faol vakansiya</span>
            </div>
            <CaretRight size={18} weight="bold" className="jd-company-go" />
          </Link>

          {seeker && (
            <Link to={`/qadam-ai?q=${encodeURIComponent(job.title)}`} className="jd-promo">
              <div>
                <b>Bu ish sizga qanchalik mos?</b>
                <span>QadamAI rezyumengizni vakansiya bilan solishtiradi</span>
                <em>Tekshirish <Sparkle size={14} weight="fill" /></em>
              </div>
              <img src="/qadam-ai.png" alt="" draggable="false" />
            </Link>
          )}

          {similar.length > 0 && (
            <section className="jd-similar">
              <h3>Sizga mos boshqa vakansiyalar</h3>
              {similar.slice(0, 3).map((j) => (
                <Link key={j.id} to={`/jobs/${j.id}`} className="jd-card jd-sim">
                  <b>{j.title}</b>
                  <span className="jd-sim-pay">{salaryText(j)}</span>
                  <span className="jd-sim-co"><CompanyLogo name={j.company} color={j.color} size={26} /> {j.company} · {j.city}</span>
                </Link>
              ))}
              {similar.length > 3 && (
                <Link to={`/jobs?cat=${job.category}`} className="jd-link">Yana {similar.length - 3} ta o'xshash vakansiya <CaretRight size={14} weight="bold" /></Link>
              )}
            </section>
          )}
        </aside>
      </div>

      {seeker && (
        <div className="jd-cta jd-cta-mobile">
          <Link to={`/qadam-ai?q=${encodeURIComponent(job.title)}`} className="jd-cta-ai" aria-label="QadamAI moslik">
            <Sparkle size={22} weight="fill" />
          </Link>
          <button className="jd-cta-main" disabled={applied} onClick={() => requireAuth(() => setOpen(true))}>
            {applied ? <><CheckCircle size={20} weight="fill" /> Ariza yuborilgan</> : <>Ariza topshirish <PaperPlaneTilt size={19} weight="fill" /></>}
          </button>
        </div>
      )}
      {user?.role === 'employer' && job.own && (
        <div className="jd-cta">
          <button className="jd-cta-main" onClick={() => nav(`/qadam-ai?q=${encodeURIComponent(job.title + ' ' + (job.skills || []).join(' '))}`)}>
            <Sparkle size={20} weight="fill" /> QadamAI bilan nomzod topish
          </button>
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Ariza topshirish">
        <div className="apply-head">
          <CompanyLogo name={job.company} color={job.color} />
          <div><b>{job.title}</b><span className="muted">{job.company}</span></div>
        </div>
        <label className="field"><span>Qo'shimcha xat (ixtiyoriy)</span>
          <textarea rows={5} value={letter} onChange={(e) => setLetter(e.target.value)}
            placeholder="Nima uchun aynan siz bu lavozimga mossiz?" /></label>
        <p className="muted small">Arizaga profilingizdagi rezyume avtomatik biriktiriladi.</p>
        <button className="btn btn-primary btn-lg btn-block" onClick={send}><Icon name="send" size={18} /> Yuborish</button>
      </Sheet>

      <Sheet open={ask !== null} onClose={() => setAsk(null)} title="Ish beruvchiga savol">
        <div className="apply-head">
          <CompanyLogo name={job.company} color={job.color} />
          <div><b>{job.title}</b><span className="muted">{job.company}</span></div>
        </div>
        <label className="field"><span>Savolingiz</span>
          <textarea rows={4} value={ask || ''} onChange={(e) => setAsk(e.target.value)} placeholder="Savolingizni yozing" /></label>
        <button className="btn btn-primary btn-lg btn-block" disabled={!ask?.trim()}
          onClick={() => { setAsk(null); notify('Savolingiz ish beruvchiga yuborildi') }}><Icon name="send" size={18} /> Yuborish</button>
      </Sheet>

      <Sheet open={report !== null} onClose={() => setReport(null)} title="Vakansiyadan shikoyat">
        <div className="jd-reasons" role="radiogroup" aria-label="Shikoyat sababi">
          {REPORTS.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={report === r} className={report === r ? 'on' : ''} onClick={() => setReport(r)}>
              <i /> {r}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-lg btn-block" disabled={!report}
          onClick={() => { setReport(null); notify('Shikoyatingiz qabul qilindi. Rahmat!') }}>Yuborish</button>
      </Sheet>
    </div>
  )
}
