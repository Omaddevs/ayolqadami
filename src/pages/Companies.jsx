import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Briefcase, Buildings, CalendarBlank, HeartStraight, MapPin, SealCheck, UsersThree } from '@phosphor-icons/react'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import { CompanyLogo, Empty, JobCard, TopBar } from '../components/UI'
import { useApp } from '../context/AppContext'
import { CATEGORIES, catName, catShort } from '../data/mock'
import { buildCompanies, companySlug } from '../data/companies'

const norm = (s) => s.toLowerCase().replace(/[‘’ʼ`ʻ]/g, "'")
const vacText = (n) => `${n} ta vakansiya`

function useCompanies() {
  const { allJobs, user } = useApp()
  return useMemo(() => buildCompanies(allJobs, user), [allJobs, user])
}

export function Companies() {
  const companies = useCompanies()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  // faqat vakansiyasi bor sohalar filtrda ko'rinadi
  const cats = CATEGORIES.filter((c) => companies.some((co) => co.categories.includes(c.id)))
  const list = useMemo(() => {
    const nq = norm(q.trim())
    return companies
      .filter((c) => (!cat || c.categories.includes(cat)) &&
        (!nq || norm(`${c.name} ${c.cities.join(' ')} ${c.categories.map(catName).join(' ')}`).includes(nq)))
      .sort((a, b) => b.jobs.length - a.jobs.length || a.name.localeCompare(b.name))
  }, [companies, q, cat])

  return (
    <div className="page">
      <TopBar title="Kompaniyalar" back={false} />
      <div className="page-body">
        <div className="search search-solid">
          <Icon name="search" size={22} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kompaniya, soha yoki shahar" />
        </div>
        <div className="pill-row">
          <button className={`pill ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>Barchasi</button>
          {cats.map((c) => (
            <button key={c.id} className={`pill ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}><Icon3D name={c.icon} size={22} /> {c.short}</button>
          ))}
        </div>
        <div className="result-bar">
          <div className="result-count"><b>{list.length} ta kompaniya</b><span>{list.reduce((n, c) => n + c.jobs.length, 0)} ta ochiq vakansiya</span></div>
        </div>

        {list.length ? (
          <div className="list-grid">
            {list.map((c) => (
              <Link key={c.name} to={`/companies/${companySlug(c.name)}`} className="co-card">
                <div className="co-top">
                  <CompanyLogo name={c.name} color={c.color} size={52} />
                  <div className="grow">
                    <b>{c.name}{c.verified && <SealCheck size={17} weight="fill" className="verified" aria-label="Tasdiqlangan" />}</b>
                    <span>{c.categories.slice(0, 2).map(catShort).join(', ')}{c.categories.length > 2 && ` +${c.categories.length - 2}`}</span>
                  </div>
                  <em className="co-count">{vacText(c.jobs.length)}</em>
                </div>
                {c.about && <p className="co-about">{c.about}</p>}
                <div className="co-meta">
                  <span><MapPin size={15} weight="fill" /> {c.cities.slice(0, 3).join(', ')}{c.cities.length > 3 && '…'}</span>
                  {c.size && <span><UsersThree size={15} weight="fill" /> {c.size} xodim</span>}
                </div>
                {c.perks.length > 0 && <div className="co-perks">{c.perks.slice(0, 2).map((t) => <span key={t}>{t}</span>)}</div>}
              </Link>
            ))}
          </div>
        ) : <Empty icon="building" title="Kompaniya topilmadi" text="Boshqa so'z yoki soha bilan izlab ko'ring" />}
      </div>
    </div>
  )
}

export function CompanyDetail() {
  const { name } = useParams()
  const companies = useCompanies()
  const c = companies.find((x) => x.name === name)
  if (!c) return <div className="page"><TopBar title="Kompaniya" /><Empty icon="building" title="Kompaniya topilmadi" /></div>

  return (
    <div className="page detail">
      <TopBar title="Kompaniya" />
      <div className="page-body">
        <div className="detail-hero">
          <CompanyLogo name={c.name} color={c.color} size={84} />
          <h1 className="co-name">{c.name}{c.verified && <SealCheck size={22} weight="fill" className="verified" aria-label="Tasdiqlangan" />}</h1>
          <div className="chips center">{c.categories.map((id) => <span key={id} className="chip chip-primary">{catName(id)}</span>)}</div>
        </div>

        <div className="co-stats">
          <div><Briefcase size={20} weight="fill" /><b>{c.jobs.length}</b><span>vakansiya</span></div>
          <div><MapPin size={20} weight="fill" /><b>{c.cities.length}</b><span>{c.cities.length === 1 ? c.cities[0] : 'shahar'}</span></div>
          {c.size
            ? <div><UsersThree size={20} weight="fill" /><b>{c.size}</b><span>xodim</span></div>
            : <div><UsersThree size={20} weight="fill" /><b>{c.applicants}</b><span>ariza</span></div>}
        </div>

        {c.about && <div className="block"><h2>Kompaniya haqida</h2><p>{c.about}</p></div>}

        <div className="block">
          <h2>Ma'lumotlar</h2>
          <dl className="jd-facts">
            <div><dt><Buildings size={15} /> Shaharlar</dt><dd>{c.cities.join(', ')}</dd></div>
            {c.since && <div><dt><CalendarBlank size={15} /> Faoliyat boshlagan</dt><dd>{c.since}-yil</dd></div>}
          </dl>
        </div>

        {c.perks.length > 0 && (
          <div className="block">
            <h2><HeartStraight size={20} weight="fill" className="co-heart" /> Ayollar uchun qulayliklar</h2>
            <div className="co-perks">{c.perks.map((t) => <span key={t}>{t}</span>)}</div>
          </div>
        )}

        <div className="block">
          <h2>Ochiq vakansiyalar ({c.jobs.length})</h2>
          <div className="list-grid">{c.jobs.map((j) => <JobCard key={j.id} job={j} />)}</div>
        </div>
      </div>
    </div>
  )
}
