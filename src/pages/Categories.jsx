import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MagnifyingGlass } from '@phosphor-icons/react'
import Icon3D from '../components/Icon3D'
import { useApp } from '../context/AppContext'
import { CATEGORIES } from '../data/mock'
import { useT } from '../i18n'

// "Barcha kategoriyalar" sahifasi: 3D ikonka (Icon3D) va (bo'lsa) public/categories/<id>.webp rasmi
const IDS = ['office', 'edu', 'med', 'sales', 'beauty', 'it', 'home', 'remote', 'production', 'food', 'marketing', 'finance', 'law', 'logistics', 'other']
const NO_IMG = ['finance', 'law', 'logistics']
const norm = (s) => String(s || '').toLowerCase().replace(/[‘’`ʻʼ]/g, "'")

export default function Categories() {
  const { user, allJobs } = useApp()
  const t = useT()
  const [q, setQ] = useState('')
  const listPath = user?.role === 'employer' ? '/candidates' : '/jobs'

  const cats = useMemo(() => IDS.map((id) => CATEGORIES.find((c) => c.id === id)).filter(Boolean)
    .map((c) => ({ ...c, count: allJobs.filter((j) => j.category === c.id).length })), [allJobs])
  const total = cats.reduce((n, c) => n + c.count, 0)
  const list = cats.filter((c) => !q.trim() || norm(c.name).includes(norm(q.trim())) || norm(t(c.name)).includes(norm(q.trim())))

  return (
    <div className="page cats-page">
      <div className="cats-wrap">
        <nav className="cats-crumbs" aria-label={t("Yo'l")}>
          <Link to="/">{t('Bosh sahifa')}</Link> <span>/</span> <span aria-current="page">{t('Kategoriyalar')}</span>
        </nav>
        <div className="cats-head">
          <div>
            <h1>{t('Barcha kategoriyalar')}</h1>
            <p>{t("Ayollar uchun {n} ta yo'nalish — jami {total} ta ochiq imkoniyat", { n: cats.length, total: total.toLocaleString('ru-RU') })}</p>
          </div>
          <label className="cats-search">
            <MagnifyingGlass size={19} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Kategoriya qidirish...')} />
          </label>
        </div>

        {list.length ? (
          <div className="cats-grid">
            {list.map((c) => (
              <Link key={c.id} to={`${listPath}?cat=${c.id}`} className="cats-card">
                <span className="cats-ico"><Icon3D name={c.icon} size={36} /></span>
                <span className="cats-txt"><b>{t(c.name)}</b><small>{t("{n} ta e'lon", { n: c.count })}</small></span>
                {NO_IMG.includes(c.id)
                  ? <ArrowRight size={20} className="cats-arrow" />
                  : <img src={`/categories/${c.id}.webp`} alt="" className="cats-img" loading="lazy" decoding="async" draggable="false" />}
              </Link>
            ))}
          </div>
        ) : (
          <p className="cats-empty">{t("“{q}” bo'yicha kategoriya topilmadi", { q })}</p>
        )}
      </div>
    </div>
  )
}
