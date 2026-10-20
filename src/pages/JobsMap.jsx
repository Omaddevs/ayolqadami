import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CaretLeft, ListBullets, MagnifyingGlass, Minus, NavigationArrow, Plus, ScribbleLoop, SlidersHorizontal, X } from '@phosphor-icons/react'
import Icon3D from '../components/Icon3D'
import { JobCard, Sheet } from '../components/UI'
import { useApp } from '../context/AppContext'
import { CATEGORIES, JOB_TYPES } from '../data/mock'
import { CITY_COORDS, placeJobs, rangeShort, salaryShort } from '../data/geo'

const MIN_SALARIES = [0, 3e6, 5e6, 8e6, 12e6]

const ME_HTML = `<div class="jm-me">
  <div class="jm-me-tag"><i><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2" fill="currentColor" stroke="none"/><path d="M5 8.5l7 1.5 7-1.5M12 10v4.5M12 14.5l-3.5 6M12 14.5l3.5 6"/></svg></i><b>Siz shu yerdasiz</b></div>
  <s class="jm-me-stem"></s><span class="jm-me-dot"></span>
</div>`
const CITY_MODE_ZOOM = 10 // bundan kichik zoomda vakansiyalar shahar bo'yicha guruhlanadi
const norm = (s) => s.toLowerCase().replace(/[‘’ʼ`ʻ]/g, "'")
// nuqta chizilgan ko'pburchak ichidami (ray casting, [lat, lng])
const inPoly = ([y, x], poly) => {
  let inside = false
  for (let i = 0, k = poly.length - 1; i < poly.length; k = i++) {
    const [yi, xi] = poly[i], [yk, xk] = poly[k]
    if ((yi > y) !== (yk > y) && x < ((xk - xi) * (y - yi)) / (yk - yi) + xi) inside = !inside
  }
  return inside
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

export default function JobsMap() {
  const nav = useNavigate()
  const { allJobs, user, notify } = useApp()
  const boxRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const meRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [cat, setCat] = useState('')
  const [type, setType] = useState('')
  const [minSalary, setMinSalary] = useState(0)
  const [view, setView] = useState(0) // xarita siljiganda belgilarni qayta joylash uchun
  const [drawing, setDrawing] = useState(false)
  const [area, setArea] = useState(null) // chizilgan hudud: [[lat, lng], ...]
  const drawRef = useRef(null)
  const pathRef = useRef(null)
  const ptsRef = useRef([])

  const jobs = useMemo(() => {
    const nq = norm(q.trim())
    return placeJobs(allJobs).filter((j) =>
      (!cat || j.category === cat) &&
      (!type || j.type === type) &&
      (!minSalary || (j.salaryTo || j.salaryFrom || 0) >= minSalary) &&
      (!area || inPoly(j.pos, area)) &&
      (!nq || norm(`${j.title} ${j.company} ${j.skills.join(' ')}`).includes(nq)))
  }, [allJobs, q, cat, type, minSalary, area])

  const activeFilters = (cat ? 1 : 0) + (type ? 1 : 0) + (minSalary ? 1 : 0)
  const selectedJob = jobs.find((j) => j.id === selected)

  // xaritani bir marta yaratamiz
  useEffect(() => {
    const start = CITY_COORDS[user?.city] || CITY_COORDS.Toshkent
    const map = L.map(boxRef.current, { zoomControl: false, attributionControl: true, center: start, zoom: 12, minZoom: 5, maxZoom: 18 })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map)
    map.attributionControl.setPrefix(false)
    layerRef.current = L.layerGroup().addTo(map)
    const bump = () => setView((v) => v + 1)
    map.on('moveend zoomend', bump)
    map.on('click', () => setSelected(null))
    mapRef.current = map
    bump()
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // belgilarni chizish: kichik zoomda shaharlar, kattada vakansiyalar (ustma-ust tushganlari yashiriladi)
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    const size = map.getSize()

    if (map.getZoom() < CITY_MODE_ZOOM) {
      const byCity = {}
      jobs.forEach((j) => { (byCity[j.city] ||= []).push(j) })
      Object.entries(byCity).forEach(([city, list]) => {
        const c = CITY_COORDS[city]
        if (!c) return
        const icon = L.divIcon({
          className: 'jm-wrap',
          html: `<div class="jm-pin jm-city"><b>${esc(city)}</b><span>${rangeShort(list)}</span></div>`,
          iconSize: null,
        })
        L.marker(c, { icon, keyboard: true, title: city })
          .on('click', () => map.flyTo(c, 12, { duration: 0.8 }))
          .addTo(layer)
      })
      return
    }

    // tanlangan va yuqori maoshlilar birinchi joylashadi
    const ordered = [...jobs].sort((a, b) => (b.id === selected) - (a.id === selected) || (b.salaryTo || 0) - (a.salaryTo || 0))
    const placed = []
    const W = 132, H = 46
    ordered.forEach((j) => {
      const pt = map.latLngToContainerPoint(j.pos)
      if (pt.x < -W || pt.y < -H || pt.x > size.x + W || pt.y > size.y + H) return
      const r = { x1: pt.x - W / 2, y1: pt.y - H, x2: pt.x + W / 2, y2: pt.y }
      const hit = placed.some((p) => r.x1 < p.x2 && r.x2 > p.x1 && r.y1 < p.y2 && r.y2 > p.y1)
      if (hit && j.id !== selected) return
      placed.push(r)
      const on = j.id === selected
      const icon = L.divIcon({
        className: 'jm-wrap',
        html: `<div class="jm-pin ${on ? 'on' : ''}"><b>${salaryShort(j)}</b><span>${esc(j.title)}</span></div>`,
        iconSize: null,
      })
      L.marker(j.pos, { icon, keyboard: true, title: j.title, zIndexOffset: on ? 1000 : 0 })
        .on('click', (e) => { L.DomEvent.stopPropagation(e); setSelected(j.id) })
        .addTo(layer)
    })
  }, [jobs, selected, view])

  // chizilgan hudud: tashqarisi xiralashadi, chegarasi ko'rinadi
  useEffect(() => {
    const map = mapRef.current
    if (!map || !area) return
    const world = [[90, -360], [90, 360], [-90, 360], [-90, -360]]
    const mask = L.polygon([world, area], { stroke: false, fillColor: '#12131A', fillOpacity: 0.28, interactive: false }).addTo(map)
    const edge = L.polygon(area, { color: '#5B57F0', weight: 3, fill: false, interactive: false }).addTo(map)
    return () => { mask.remove(); edge.remove() }
  }, [area])

  // filtr o'zgarganda tanlangan vakansiya ro'yxatdan chiqsa, kartani yopamiz
  useEffect(() => { if (selected && !selectedJob) setSelected(null) }, [selected, selectedJob])

  const locate = (silent = false) => {
    if (!navigator.geolocation) return silent || notify("Qurilmangiz joylashuvni aniqlay olmaydi")
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const map = mapRef.current
        if (!map) return
        const ll = [coords.latitude, coords.longitude]
        meRef.current?.remove()
        meRef.current = L.marker(ll, { icon: L.divIcon({ className: 'jm-wrap', html: ME_HTML, iconSize: null }), interactive: false, zIndexOffset: 2000 }).addTo(map)
        map.flyTo(ll, 14, { duration: 0.9 })
      },
      () => silent || notify("Joylashuvga ruxsat berilmadi"),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  // sahifaga kirganda joylashuvga ruxsat so'raymiz (brauzer o'z oynasini ko'rsatadi)
  useEffect(() => { locate(true) }, [])

  // barmoq/sichqoncha bilan hudud chizish
  const drawPoint = (e) => {
    const r = drawRef.current.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }
  const drawStart = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    ptsRef.current = [drawPoint(e)]
  }
  const drawMove = (e) => {
    const pts = ptsRef.current
    if (!pts.length) return
    const p = drawPoint(e)
    const last = pts[pts.length - 1]
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 5) return
    pts.push(p)
    pathRef.current?.setAttribute('d', 'M' + pts.map((t) => t.join(' ')).join('L'))
  }
  const drawEnd = () => {
    const pts = ptsRef.current
    ptsRef.current = []
    pathRef.current?.setAttribute('d', '')
    const map = mapRef.current
    if (!map || pts.length < 6) return // juda qisqa chiziq — qaytadan chizish mumkin
    setArea(pts.map(([x, y]) => { const ll = map.containerPointToLatLng([x, y]); return [ll.lat, ll.lng] }))
    setSelected(null)
    setDrawing(false)
  }
  const toggleDraw = () => {
    if (area) return setArea(null)
    setDrawing((d) => !d)
  }

  const resetFilters = () => { setCat(''); setType(''); setMinSalary(0) }

  return (
    <div className="jm">
      <div ref={boxRef} className="jm-map" />

      <div className="jm-top">
        <button type="button" className="jm-btn" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))} aria-label="Orqaga">
          <CaretLeft size={22} weight="bold" />
        </button>
        {searchOpen ? (
          <div className="jm-search">
            <MagnifyingGlass size={20} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lavozim, kompaniya…" />
            <button type="button" onClick={() => { setQ(''); setSearchOpen(false) }} aria-label="Yopish"><X size={18} weight="bold" /></button>
          </div>
        ) : (
          <>
            <div className="jm-title"><b>{area ? 'Chizilgan hudud' : 'Xarita'}</b><span>{jobs.length} ta vakansiya</span></div>
            <button type="button" className="jm-btn" onClick={() => setSearchOpen(true)} aria-label="Qidirish">
              <MagnifyingGlass size={22} weight="bold" />
            </button>
          </>
        )}
        <button type="button" className={`jm-btn ${activeFilters ? 'on' : ''}`} onClick={() => setFilterOpen(true)} aria-label="Filtrlar">
          <SlidersHorizontal size={22} weight="bold" />
          {activeFilters > 0 && <em className="jm-badge">{activeFilters}</em>}
        </button>
      </div>

      <div className="jm-side">
        <button type="button" className="jm-btn" onClick={() => locate()} aria-label="Mening joylashuvim"><NavigationArrow size={22} weight="bold" style={{ transform: 'scaleX(-1)' }} /></button>
        <div className="jm-zoom">
          <button type="button" className="jm-btn" onClick={() => mapRef.current?.zoomIn()} aria-label="Yaqinlashtirish"><Plus size={22} weight="bold" /></button>
          <button type="button" className="jm-btn" onClick={() => mapRef.current?.zoomOut()} aria-label="Uzoqlashtirish"><Minus size={22} weight="bold" /></button>
        </div>
      </div>

      {drawing && (
        <div ref={drawRef} className="jm-draw" onPointerDown={drawStart} onPointerMove={drawMove} onPointerUp={drawEnd} onPointerCancel={drawEnd}>
          <svg><path ref={pathRef} /></svg>
        </div>
      )}
      {drawing && <div className="jm-hint">Qidiriladigan hududni barmog'ingiz bilan chizing</div>}

      {!selectedJob && (
        <button type="button" className={`jm-btn jm-draw-btn ${drawing || area ? 'on' : ''}`} onClick={toggleDraw}
          aria-label={area ? 'Hududni tozalash' : drawing ? 'Chizishni bekor qilish' : 'Hududni chizib qidirish'}>
          {drawing || area ? <X size={22} weight="bold" /> : <ScribbleLoop size={24} weight="bold" />}
        </button>
      )}

      {selectedJob ? (
        <div className="jm-card" key={selectedJob.id}>
          <button type="button" className="jm-card-x" onClick={() => setSelected(null)} aria-label="Yopish"><X size={16} weight="bold" /></button>
          <JobCard job={selectedJob} />
        </div>
      ) : (
        <button type="button" className="jm-list" onClick={() => nav('/jobs')}>
          <ListBullets size={20} weight="bold" /> Ro'yxat ko'rinishida
        </button>
      )}

      {jobs.length === 0 && !drawing && <div className="jm-empty">{area ? "Bu hududda vakansiya topilmadi" : "Bu filtrlar bo'yicha vakansiya topilmadi"}</div>}

      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filtrlar">
        <div className="jm-filters">
          <span className="search-panel-title">Soha</span>
          <div className="pill-row wrap">
            <button className={`pill ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>Barchasi</button>
            {CATEGORIES.map((c) => (
              <button key={c.id} className={`pill ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>
                <Icon3D name={c.icon} size={22} /> {c.short}
              </button>
            ))}
          </div>
          <span className="search-panel-title">Ish formati</span>
          <div className="pill-row wrap">
            {['', ...JOB_TYPES].map((t) => (
              <button key={t || 'all'} className={`pill pill-sm ${type === t ? 'on' : ''}`} onClick={() => setType(t)}>{t || 'Har qanday'}</button>
            ))}
          </div>
          <span className="search-panel-title">Oylik maosh</span>
          <div className="pill-row wrap">
            {MIN_SALARIES.map((s) => (
              <button key={s} className={`pill pill-sm ${minSalary === s ? 'on' : ''}`} onClick={() => setMinSalary(s)}>
                {s ? `${s / 1e6} mln dan` : 'Har qanday'}
              </button>
            ))}
          </div>
          <div className="jm-filter-actions">
            <button className="btn btn-ghost" onClick={resetFilters} disabled={!activeFilters}>Tozalash</button>
            <button className="btn btn-primary" onClick={() => setFilterOpen(false)}>{jobs.length} ta vakansiyani ko'rsatish</button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}

