import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin } from '@phosphor-icons/react'
import { CompanyLogo } from './UI'
import { CATEGORIES, catShort } from '../data/mock'
import { jobPath } from '../lib/seo'
import { postedAt, postedText } from '../lib/time'
import { tr, tx, useT } from '../i18n'

// «So'nggi ish imkoniyatlari»: chapda soha ro'yxati (e'lonlar soni bilan), o'ngda gorizontal karusel.
// Birinchi karta — brend rangida ajratilgan; strelkalar karuselni bir karta kengligida suradi
const mln = (v) => (v / 1e6).toFixed(1).replace(/\.0$/, '').replace('.', ',')
const pay = (j) => {
  const a = Number(j.salaryFrom) || 0
  const b = Number(j.salaryTo) || 0
  if (a && b) return tr("{a}–{b} mln so'm", { a: mln(a), b: mln(b) })
  if (a || b) return tr("{a} mln so'mdan", { a: mln(a || b) })
  return tr('Kelishilgan holda')
}

export default function LatestJobs({ jobs }) {
  const t = useT()
  const [cat, setCat] = useState('')
  const track = useRef(null)
  const [edge, setEdge] = useState({ start: true, end: false })

  // e'loni bor sohalar (ko'pidan kamiga), eng ko'pi bilan 10 ta
  const cats = useMemo(() => {
    const n = {}
    for (const j of jobs) n[j.category] = (n[j.category] || 0) + 1
    return CATEGORIES.filter((c) => n[c.id]).map((c) => ({ ...c, n: n[c.id] })).sort((a, b) => b.n - a.n).slice(0, 10)
  }, [jobs])
  const menu = useRef(null)
  const [hold, setHold] = useState(false) // sichqoncha/fokus bo'lim ustida — aylanish to'xtaydi
  const ids = useMemo(() => ['', ...cats.map((c) => c.id)], [cats])

  // menyu karuseli: soha har 6 soniyada keyingisiga o'tadi (oxiridan — boshiga); bosilsa hisob qaytadan boshlanadi
  useEffect(() => {
    if (hold || ids.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setCat((c) => ids[(ids.indexOf(c) + 1) % ids.length]), 6000)
    return () => clearInterval(id)
  }, [hold, ids, cat])
  // faol soha menyu oynasining o'rtasiga suriladi (desktopda — vertikal, mobilda — gorizontal)
  useEffect(() => {
    const box = menu.current
    const el = box?.querySelector('.on')
    if (!el) return
    // joylashuv ekrandagi koordinatalardan: offsetTop menyuga emas, yuqoriroqdagi ota elementga nisbatan bo'ladi
    const b = box.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const vertical = box.scrollHeight > box.clientHeight + 2
    box.scrollTo(vertical
      ? { top: box.scrollTop + r.top - b.top - (b.height - r.height) / 2, behavior: 'smooth' }
      : { left: box.scrollLeft + r.left - b.left - (b.width - r.width) / 2, behavior: 'smooth' })
  }, [cat])
  const perCompany = useMemo(() => {
    const m = {}
    for (const j of jobs) m[j.company] = (m[j.company] || 0) + 1
    return m
  }, [jobs])
  const list = useMemo(() => {
    const ts = (j) => postedAt(j)?.getTime() || 0
    return jobs.filter((j) => !cat || j.category === cat).sort((a, b) => ts(b) - ts(a)).slice(0, 12)
  }, [jobs, cat])

  const sync = () => {
    const el = track.current
    if (!el) return
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 })
  }
  useEffect(() => { track.current?.scrollTo({ left: 0, behavior: 'instant' }); sync() }, [cat])
  const slide = (dir) => {
    const el = track.current
    const card = el?.firstElementChild
    if (card) el.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: 'smooth' })
  }

  if (!list.length && !cat) return null

  return (
    <section className="lj" aria-labelledby="lj-h" onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHold(false) }}>
      <div className="lj-head">
        <h2 id="lj-h">
          <span className="lj-accent">{t("So'nggi")}</span>{' '}
          {t('ish imkoniyatlari')}
        </h2>
        <div className="lj-nav">
          <button type="button" aria-label={t('Oldingi')} disabled={edge.start} onClick={() => slide(-1)}><ArrowLeft size={18} weight="bold" /></button>
          <button type="button" aria-label={t('Keyingi')} disabled={edge.end} onClick={() => slide(1)} className="dark"><ArrowRight size={18} weight="bold" /></button>
        </div>
      </div>

      <div className="lj-body">
        <nav className="lj-cats" ref={menu} aria-label={t('Sohalar')}>
          <button type="button" className={!cat ? 'on' : ''} aria-pressed={!cat} onClick={() => setCat('')}>
            {t('Barchasi')} <em>{jobs.length}</em>
          </button>
          {cats.map((c, i) => (
            <button key={c.id} type="button" className={cat === c.id ? 'on' : ''} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              {t(c.short)} <em>{c.n}</em>
            </button>
          ))}
        </nav>

        <div className="lj-track" ref={track} onScroll={sync}>
          {list.map((j, i) => (
            <Link key={`${cat}-${j.id}`} to={jobPath(j)} className={`lj-card${i === 0 ? ' is-hot' : ''}`} style={{ '--d': `${Math.min(i, 5) * 70}ms` }}>
              <b className="lj-title">{tx(j.title)}</b>
              <div className="lj-tags">
                {j.type && <span>{t(j.type)}</span>}
                {catShort(j.category) !== t(j.type) && <span>{catShort(j.category)}</span>}
              </div>
              <strong className="lj-pay">{pay(j)}</strong>
              <div className="lj-time"><i />{postedText(j)}</div>
              <div className="lj-co">
                <CompanyLogo name={j.company || '?'} color={j.color || '#5B57F0'} size={38} />
                <span><b>{j.company}</b><small><MapPin size={12} /> {tx(j.city)}</small></span>
                <em>{t("{n} ta e'lon", { n: perCompany[j.company] || 1 })}</em>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
