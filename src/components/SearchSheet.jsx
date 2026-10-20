import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icons'
import Icon3D from './Icon3D'
import { Avatar, CompanyLogo } from './UI'
import { CANDIDATES, CATEGORIES, salaryText } from '../data/mock'

const norm = (s) => s.toLowerCase().replace(/[‘’ʼ`ʻ]/g, "'")

/*
 * To'liq ekranli qidiruv oynasi — pastdan silliq chiqadi.
 * Ish izlovchi: vakansiyalar bo'yicha jonli qidiruv. Ish beruvchi: nomzodlar + QadamAI.
 */
export default function SearchSheet({ open, onClose, isEmp, jobs, inputRef }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [drag, setDrag] = useState(null)
  const dragStart = useRef(null)
  const bodyRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      inputRef.current?.blur()
      if (bodyRef.current) bodyRef.current.scrollTop = 0
    }
  }, [open, inputRef])

  const results = useMemo(() => {
    const nq = norm(q.trim())
    if (!nq) return []
    return isEmp
      ? CANDIDATES.filter((c) => norm(`${c.name} ${c.headline} ${c.skills.join(' ')} ${c.city}`).includes(nq)).slice(0, 6)
      : jobs.filter((j) => norm(`${j.title} ${j.company} ${j.skills.join(' ')} ${j.city} ${j.type}`).includes(nq)).slice(0, 6)
  }, [q, isEmp, jobs])

  const submit = (e) => {
    e.preventDefault()
    const t = q.trim()
    if (!t) return
    nav(isEmp ? `/qadam-ai?q=${encodeURIComponent(t)}` : `/jobs?q=${encodeURIComponent(t)}`)
  }

  // Tutqichni pastga tortib yopish
  const onDown = (e) => { dragStart.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId) }
  const onMove = (e) => { if (dragStart.current != null) setDrag(Math.max(0, e.clientY - dragStart.current)) }
  const onUp = (e) => {
    if (dragStart.current == null) return
    const dy = e.clientY - dragStart.current
    dragStart.current = null
    setDrag(null)
    if (dy > 90 || Math.abs(dy) < 6) onClose()
  }

  const popular = isEmp ? ['React', 'Buxgalter', 'SMM', 'Hamshira', 'Figma'] : ['Masofaviy', 'React', 'Buxgalter', "O'qituvchi", 'SMM']

  return (
    <div className={`search-sheet ${open ? 'open' : ''} ${drag != null ? 'dragging' : ''}`}
      style={drag != null ? { '--drag': `${drag}px` } : undefined} aria-hidden={!open} role="dialog" aria-label="Qidiruv">
      <div className="ss-head">
        <div className="sheet-grab" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          role="button" aria-label="Yopish"><span /></div>
        <div className="search-row">
          <form className="search" onSubmit={submit}>
            <Icon name="search" size={22} />
            <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" tabIndex={open ? 0 : -1}
              placeholder={isEmp ? 'Kimni qidiryapsiz?' : "Kasb, kompaniya yoki ko'nikma"} />
            {q && <button type="button" className="icon-btn sm" onClick={() => setQ('')} aria-label="Tozalash"><Icon name="x" size={16} /></button>}
          </form>
          <button type="button" className="search-cancel" onClick={onClose} tabIndex={open ? 0 : -1}>Bekor</button>
        </div>
      </div>

      <div className="ss-body" ref={bodyRef}>
        {q.trim() ? (
          <>
            {results.length > 0 ? (
              <div className="ss-results">
                {results.map((r) =>
                  isEmp ? (
                    <Link key={r.id} to={`/candidates/${r.id}`} className="ss-result">
                      <Avatar name={r.name} color={r.color} size={44} />
                      <div className="grow"><b>{r.name}</b><span className="muted">{r.headline} · {r.city}</span></div>
                      <Icon name="right" size={18} />
                    </Link>
                  ) : (
                    <Link key={r.id} to={`/jobs/${r.id}`} className="ss-result">
                      <CompanyLogo name={r.company} color={r.color} size={44} />
                      <div className="grow"><b>{r.title}</b><span className="muted">{r.company} · {salaryText(r)}</span></div>
                      <Icon name="right" size={18} />
                    </Link>
                  )
                )}
              </div>
            ) : (
              <div className="ss-empty">
                <Icon3D name="sparkle" size={80} />
                <b>Aniq mos natija yo'q</b>
                <span className="muted">QadamAI so'rovingizni tahlil qilib, eng yaqin variantlarni topadi</span>
              </div>
            )}
            <Link to={`/qadam-ai?q=${encodeURIComponent(q.trim())}`} className="ss-ai">
              <Icon3D name="sparkle" size={40} />
              <span className="grow">«{q.trim()}» — <b>QadamAI bilan izlash</b></span>
              <Icon name="right" size={18} />
            </Link>
          </>
        ) : (
          <>
            <span className="search-panel-title">Ko'p qidirilganlar</span>
            <div className="chips ss-popular">
              {popular.map((t) => (
                <button key={t} type="button" className="chip chip-search" onClick={() => setQ(t)} tabIndex={open ? 0 : -1}>
                  <Icon name="search" size={13} /> {t}
                </button>
              ))}
            </div>

            <span className="search-panel-title">Kategoriyalar</span>
            <div className="cats">
              {CATEGORIES.map((c) => (
                <Link key={c.id} to={isEmp ? `/candidates?cat=${c.id}` : `/jobs?cat=${c.id}`} className="cat" tabIndex={open ? 0 : -1}>
                  <div className="cat-ico"><Icon3D name={c.icon} size={62} /></div>
                  <span>{c.short}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
