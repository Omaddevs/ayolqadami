import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Briefcase, Buildings, CalendarBlank, HeartStraight, MapPin, SealCheck, UsersThree } from '@phosphor-icons/react'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import { CompanyLogo, Empty, JobCard, TopBar } from '../components/UI'
import { useApp } from '../context/AppContext'
import { CATEGORIES, catName, catShort } from '../data/mock'
import { buildCompanies, companySlug } from '../data/companies'
import { tr, tx, useT } from '../i18n'

const norm = (s) => String(s || '').toLowerCase().replace(/[‘’ʼ`ʻ]/g, "'")
const vacText = (n) => tr('{n} ta vakansiya', { n })

function useCompanies() {
  const { allJobs, user } = useApp()
  return useMemo(() => buildCompanies(allJobs, user), [allJobs, user])
}

export function Companies() {
  const companies = useCompanies()
  const t = useT()
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
      <TopBar title={t('Kompaniyalar')} back={false} />
      <div className="page-body">
        <div className="search search-solid">
          <Icon name="search" size={22} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Kompaniya, soha yoki shahar')} />
        </div>
        <div className="pill-row">
          <button className={`pill ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>{t('Barchasi')}</button>
          {cats.map((c) => (
            <button key={c.id} className={`pill ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}><Icon3D name={c.icon} size={22} /> {t(c.short)}</button>
          ))}
        </div>
        <div className="result-bar">
          <div className="result-count"><b>{t('{n} ta kompaniya', { n: list.length })}</b><span>{t('{n} ta ochiq vakansiya', { n: list.reduce((n, c) => n + c.jobs.length, 0) })}</span></div>
        </div>

        {list.length ? (
          <div className="list-grid">
            {list.map((c) => (
              <Link key={c.name} to={`/companies/${companySlug(c.name)}`} className="co-card">
                <div className="co-top">
                  <CompanyLogo name={c.name} color={c.color} size={52} />
                  <div className="grow">
                    <b>{c.name}{c.verified && <SealCheck size={17} weight="fill" className="verified" aria-label={t('Tasdiqlangan')} />}</b>
                    <span>{c.categories.slice(0, 2).map(catShort).join(', ')}{c.categories.length > 2 && ` +${c.categories.length - 2}`}</span>
                  </div>
                  <em className="co-count">{vacText(c.jobs.length)}</em>
                </div>
                {c.about && <p className="co-about">{tx(c.about)}</p>}
                <div className="co-meta">
                  <span><MapPin size={15} weight="fill" /> {tx(c.cities.slice(0, 3).join(', '))}{c.cities.length > 3 && '…'}</span>
                  {c.size && <span><UsersThree size={15} weight="fill" /> {t('{n} xodim', { n: c.size })}</span>}
                </div>
                {c.perks.length > 0 && <div className="co-perks">{c.perks.slice(0, 2).map((p) => <span key={p}>{t(p)}</span>)}</div>}
              </Link>
            ))}
          </div>
        ) : <Empty icon="building" title={t('Kompaniya topilmadi')} text={t("Boshqa so'z yoki soha bilan izlab ko'ring")} />}
      </div>
    </div>
  )
}

export function CompanyDetail() {
  const { name } = useParams()
  const companies = useCompanies()
  const t = useT()
  const c = companies.find((x) => x.name === name)
  if (!c) return <div className="page"><TopBar title={t('Kompaniya')} /><Empty icon="building" title={t('Kompaniya topilmadi')} action={<Link to="/companies" className="btn btn-primary">{t('Barcha kompaniyalar')}</Link>} /></div>

  return (
    <div className="page detail">
      <TopBar title={t('Kompaniya')} />
      <div className="page-body">
        <div className="detail-hero">
          <CompanyLogo name={c.name} color={c.color} size={84} />
          <h1 className="co-name">{c.name}{c.verified && <SealCheck size={22} weight="fill" className="verified" aria-label={t('Tasdiqlangan')} />}</h1>
          <div className="chips center">{c.categories.map((id) => <span key={id} className="chip chip-primary">{catName(id)}</span>)}</div>
        </div>

        <div className="co-stats">
          <div><Briefcase size={20} weight="fill" /><b>{c.jobs.length}</b><span>{t('vakansiya')}</span></div>
          <div><MapPin size={20} weight="fill" /><b>{c.cities.length}</b><span>{c.cities.length === 1 ? tx(c.cities[0]) : t('shahar')}</span></div>
          {c.size
            ? <div><UsersThree size={20} weight="fill" /><b>{c.size}</b><span>{t('xodim')}</span></div>
            : <div><UsersThree size={20} weight="fill" /><b>{c.applicants}</b><span>{t('ariza')}</span></div>}
        </div>

        {c.about && <div className="block"><h2>{t('Kompaniya haqida')}</h2><p>{tx(c.about)}</p></div>}

        <div className="block">
          <h2>{t("Ma'lumotlar")}</h2>
          <dl className="jd-facts">
            <div><dt><Buildings size={15} /> {t('Shaharlar')}</dt><dd>{tx(c.cities.join(', '))}</dd></div>
            {c.since && <div><dt><CalendarBlank size={15} /> {t('Faoliyat boshlagan')}</dt><dd>{t('{n}-yil', { n: c.since })}</dd></div>}
          </dl>
        </div>

        {c.perks.length > 0 && (
          <div className="block">
            <h2><HeartStraight size={20} weight="fill" className="co-heart" /> {t('Ayollar uchun qulayliklar')}</h2>
            <div className="co-perks">{c.perks.map((p) => <span key={p}>{t(p)}</span>)}</div>
          </div>
        )}

        <div className="block">
          <h2>{t('Ochiq vakansiyalar')} ({c.jobs.length})</h2>
          <div className="list-grid">{c.jobs.map((j) => <JobCard key={j.id} job={j} />)}</div>
        </div>
      </div>
    </div>
  )
}
