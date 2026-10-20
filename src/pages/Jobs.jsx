import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import {
  ArrowLeft, Briefcase, Buildings, EyeSlash, CheckCircle, Phone, TelegramLogo, Clock, CurrencyCircleDollar, Export, Heart, HeartStraight, Info, MapPin, PaperPlaneTilt, SealCheck, Sparkle, UsersThree,
} from '@phosphor-icons/react'
import { CompanyLogo, Dropdown, Empty, JobCard, Pagination, Sheet, TopBar } from '../components/UI'
import { useApp } from '../context/AppContext'
import { CATEGORIES, JOB_TYPES, catIcon, catName, salaryText } from '../data/mock'
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

export function JobDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { jobsAll, user, saved, toggleSave, applications, apply, notify, hiddenJobs, hiddenCompanies, hideJob, hideCompany, requireAuth } = useApp()
  const job = jobsAll.find((j) => j.id === id)
  const [open, setOpen] = useState(false)
  const [letter, setLetter] = useState('')

  if (!job) return <div className="page"><TopBar title="Vakansiya" /><Empty title="Vakansiya topilmadi" /></div>

  const applied = applications.some((a) => a.jobId === job.id)
  const isSaved = saved.includes(job.id)
  const send = () => {
    apply(job.id, letter)
    setOpen(false)
    notify('Arizangiz yuborildi!')
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: job.title, text: `${job.title} — ${job.company}`, url })
      else { await navigator.clipboard.writeText(url); notify('Havola nusxalandi') }
    } catch { /* foydalanuvchi bekor qildi */ }
  }
  const back = () => (window.history.length > 1 ? nav(-1) : nav('/jobs'))
  const facts = jobFacts(job)
  const contactPhone = job.contact?.ways?.includes('phone') && job.contact.phone
  const contactTg = job.contact?.ways?.includes('telegram') && job.contact.telegram

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

      <div className="jd-body">
        <section className="jd-card jd-head">
          <CompanyLogo name={job.company} color={job.color} size={58} />
          <h2>{job.title}</h2>
          <span className="jd-sub">
            <Link to={`/companies/${encodeURIComponent(job.company)}`} className="jd-company-link">{job.company}</Link>
            {!job.own && <SealCheck size={16} weight="fill" className="verified" aria-label="Tasdiqlangan" />}
            <i>•</i>{job.type}
          </span>
          <div className="jd-salary">{salaryText(job)}<small>/ oyiga</small></div>
          <hr />
          <div className="jd-meta">
            <span><Clock size={17} /> {job.posted}</span>
            <b />
            <span><UsersThree size={17} /> {job.applicants} ariza</span>
          </div>
          <div className="jd-meta-chips">
            <span><MapPin size={15} weight="fill" /> {job.city}</span>
            <span><Briefcase size={15} weight="fill" /> {job.experience ? `${job.experience}+ yil tajriba` : 'Tajriba shart emas'}</span>
            <span><Icon3D name={catIcon(job.category)} size={16} /> {catName(job.category)}</span>
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

        {facts.length > 0 && (
          <section className="jd-card">
            <h3>Ish sharoiti</h3>
            <dl className="jd-facts">{facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </section>
        )}

        {job.skills?.length > 0 && (
          <section className="jd-card">
            <h3>Ko'nikmalar</h3>
            <div className="jd-skills">{job.skills.map((s) => <span key={s}>{s}</span>)}</div>
          </section>
        )}

        <section className="jd-card jd-text">
          <h3>Vakansiya haqida</h3>
          <p>{job.description}</p>
          {job.duties?.length > 0 && (
            <>
              <h4>Vazifalar</h4>
              <ul>{job.duties.map((r) => <li key={r}>{r}</li>)}</ul>
            </>
          )}
          {job.requirements?.length > 0 && (
            <>
              <h4>Talablar</h4>
              <ul>{job.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
            </>
          )}
          {job.conditions?.length > 0 && (
            <>
              <h4>Sharoitlar</h4>
              <ul>{job.conditions.map((r) => <li key={r}>{r}</li>)}</ul>
            </>
          )}
        </section>

        {user?.role !== 'employer' && (contactPhone || contactTg) && (
          <section className="jd-card">
            <h3>Bog'lanish</h3>
            {job.contact.name && <p className="jd-contact-name">{job.contact.name}</p>}
            <div className="jd-contact">
              {contactPhone && <a className="btn btn-soft" href={`tel:${contactPhone.replace(/\s/g, '')}`}><Phone size={18} weight="fill" /> {contactPhone}</a>}
              {contactTg && <a className="btn btn-soft" href={`https://t.me/${contactTg.replace(/^@/, '')}`} target="_blank" rel="noreferrer"><TelegramLogo size={18} weight="fill" /> {contactTg}</a>}
            </div>
          </section>
        )}

        {user?.role !== 'employer' && !job.own && (
          <section className="jd-card jd-hide">
            <p>Bu vakansiya sizga mos emasmi? Uni ro'yxatlardan yashiring — Sozlamalar orqali qaytarish mumkin.</p>
            <div className="jd-hide-btns">
              <button type="button" disabled={hiddenJobs.includes(job.id)}
                onClick={() => { hideJob(job.id); notify('Vakansiya yashirildi'); back() }}>
                <EyeSlash size={18} weight="bold" /> {hiddenJobs.includes(job.id) ? 'Yashirilgan' : 'Vakansiyani yashirish'}
              </button>
              <button type="button" disabled={hiddenCompanies.includes(job.company)}
                onClick={() => { hideCompany(job.company); notify(`«${job.company}» vakansiyalari yashirildi`); back() }}>
                <Buildings size={18} weight="bold" /> {hiddenCompanies.includes(job.company) ? 'Kompaniya yashirilgan' : 'Kompaniyani yashirish'}
              </button>
            </div>
          </section>
        )}
      </div>

      {user?.role !== 'employer' && (
        <div className="jd-cta">
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
    </div>
  )
}
