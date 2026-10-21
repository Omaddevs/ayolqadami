import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MagnifyingGlass } from '@phosphor-icons/react'
import Icon3D from '../components/Icon3D'
import { useApp } from '../context/AppContext'
import { CATEGORIES } from '../data/mock'

// "Barcha kategoriyalar" sahifasi: 3D ikonka (Icon3D) va (bo'lsa) public/categories/<id>.png rasmi
const IDS = ['office', 'edu', 'med', 'sales', 'beauty', 'it', 'home', 'remote', 'production', 'food', 'marketing', 'finance', 'law', 'logistics', 'other']
const NO_IMG = ['finance', 'law', 'logistics']
const norm = (s) => s.toLowerCase().replace(/[‘’`ʻʼ]/g, "'")

export default function Categories() {
  const { user, allJobs } = useApp()
  const [q, setQ] = useState('')
  const listPath = user?.role === 'employer' ? '/candidates' : '/jobs'

  const cats = useMemo(() => IDS.map((id) => CATEGORIES.find((c) => c.id === id)).filter(Boolean)
    .map((c) => ({ ...c, count: allJobs.filter((j) => j.category === c.id).length })), [allJobs])
  const total = cats.reduce((n, c) => n + c.count, 0)
  const list = cats.filter((c) => !q.trim() || norm(c.name).includes(norm(q.trim())))

  return (
    <div className="page cats-page">
      <div className="cats-wrap">
        <nav className="cats-crumbs" aria-label="Yo'l">
          <Link to="/">Bosh sahifa</Link> <span>/</span> <span aria-current="page">Kategoriyalar</span>
        </nav>
        <div className="cats-head">
          <div>
            <h1>Barcha kategoriyalar</h1>
            <p>Ayollar uchun {cats.length} ta yo'nalish — jami {total.toLocaleString('ru-RU')} ta ochiq imkoniyat</p>
          </div>
          <label className="cats-search">
            <MagnifyingGlass size={19} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kategoriya qidirish..." />
          </label>
        </div>

        {list.length ? (
          <div className="cats-grid">
            {list.map((c) => (
              <Link key={c.id} to={`${listPath}?cat=${c.id}`} className="cats-card">
                <span className="cats-ico"><Icon3D name={c.icon} size={36} /></span>
                <span className="cats-txt"><b>{c.name}</b><small>{c.count} ta e'lon</small></span>
                {NO_IMG.includes(c.id)
                  ? <ArrowRight size={20} className="cats-arrow" />
                  : <img src={`/categories/${c.id}.png`} alt="" className="cats-img" loading="lazy" draggable="false" />}
              </Link>
            ))}
          </div>
        ) : (
          <p className="cats-empty">“{q}” bo'yicha kategoriya topilmadi</p>
        )}
      </div>
    </div>
  )
}
