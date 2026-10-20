import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CaretLeft, CaretRight, Check, Crosshair, MapPinLine, MapTrifold, NavigationArrow, Buildings } from '@phosphor-icons/react'
import { Sheet } from './UI'
import { useApp } from '../context/AppContext'
import { CITIES } from '../data/mock'
import { CITY_COORDS, UZ_CENTER } from '../data/geo'

// koordinataga eng yaqin shahar (MVP: reverse-geocoding o'rniga)
const nearestCity = ([lat, lng]) => {
  let best = null, min = Infinity
  for (const [name, [y, x]] of Object.entries(CITY_COORDS)) {
    const d = (y - lat) ** 2 + ((x - lng) * Math.cos((lat * Math.PI) / 180)) ** 2
    if (d < min) { min = d; best = name }
  }
  return best
}

// Xaritada nuqta tanlash: pin markazda turadi, foydalanuvchi xaritani suradi
function MapPick({ start, onPick }) {
  const boxRef = useRef(null)
  const mapRef = useRef(null)
  const [center, setCenter] = useState(start)

  useEffect(() => {
    const map = L.map(boxRef.current, { zoomControl: false, center: start, zoom: start === UZ_CENTER ? 6 : 13, minZoom: 5, maxZoom: 18 })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map)
    map.attributionControl.setPrefix(false)
    map.on('move', () => { const c = map.getCenter(); setCenter([c.lat, c.lng]) })
    mapRef.current = map
    // sheet animatsiyasidan keyin o'lchamni qayta hisoblash
    const t = setTimeout(() => map.invalidateSize(), 250)
    return () => { clearTimeout(t); map.remove() }
  }, [])

  const locate = () => navigator.geolocation?.getCurrentPosition(
    ({ coords }) => mapRef.current?.flyTo([coords.latitude, coords.longitude], 15, { duration: 0.8 }),
    () => {}, { enableHighAccuracy: true, timeout: 10000 },
  )

  return (
    <>
      <div className="loc-map">
        <div ref={boxRef} className="loc-map-box" />
        <MapPinLine className="loc-map-pin" size={40} weight="fill" />
        <button type="button" className="loc-map-me" onClick={locate} aria-label="Joylashuvim"><NavigationArrow size={20} weight="fill" /></button>
      </div>
      <p className="loc-map-hint">Shahar: <b>{nearestCity(center)}</b></p>
      <button type="button" className="btn btn-primary btn-block" onClick={() => onPick(center)}>Shu joyni tanlash</button>
    </>
  )
}

export default function LocationSheet({ open, onClose }) {
  const { user, updateUser, notify } = useApp()
  const [step, setStep] = useState('menu') // menu | city | map | address
  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (open) { setStep('menu'); setAddress(user.address || '') } }, [open])

  const close = () => onClose()
  const save = (patch, msg) => { updateUser(patch); notify?.(msg || 'Manzil saqlandi'); close() }
  const fromCoords = (ll) => save({ city: nearestCity(ll), lat: ll[0], lng: ll[1] })

  const detect = () => {
    if (!navigator.geolocation) return notify?.("Qurilmangiz joylashuvni aniqlay olmaydi")
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setBusy(false); fromCoords([coords.latitude, coords.longitude]) },
      () => { setBusy(false); notify?.('Joylashuvga ruxsat berilmadi') },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const titles = { menu: 'Manzil', city: 'Shaharni tanlang', map: 'Xaritadan tanlash', address: "Manzil qo'shish" }
  const back = step !== 'menu' && (
    <button type="button" className="loc-back" onClick={() => setStep('menu')}><CaretLeft size={16} weight="bold" /> Orqaga</button>
  )
  const mapStart = user.lat && user.lng ? [user.lat, user.lng] : CITY_COORDS[user.city] || UZ_CENTER

  const items = [
    { id: 'detect', icon: Crosshair, label: busy ? 'Aniqlanmoqda…' : 'Joylashuvimni aniqlash', hint: 'GPS orqali avtomatik', onClick: detect },
    { id: 'map', icon: MapTrifold, label: 'Xaritadan tanlash', hint: "Xaritada aniq joyni belgilang", onClick: () => setStep('map') },
    { id: 'city', icon: Buildings, label: "Shaharni o'zgartirish", hint: user.city || "Ko'rsatilmagan", onClick: () => setStep('city') },
    { id: 'address', icon: MapPinLine, label: user.address ? "Manzilni o'zgartirish" : "Manzil qo'shish", hint: user.address || "Ko'cha, uy, mo'ljal", onClick: () => setStep('address') },
  ]

  return (
    <Sheet open={open} onClose={close} title={titles[step]}>
      {back}
      {step === 'menu' && (
        <div className="pf-options">
          {items.map(({ id, icon: Ico, label, hint, onClick }) => (
            <button key={id} type="button" className="pf-option" onClick={onClick} disabled={id === 'detect' && busy}>
              <span className="loc-ico"><Ico size={22} weight="bold" /></span>
              <span className="pf-option-text"><b>{label}</b><span>{hint}</span></span>
              <CaretRight size={18} />
            </button>
          ))}
        </div>
      )}

      {step === 'city' && (
        <div className="pf-options loc-cities">
          {CITIES.map((c) => (
            <button key={c} type="button" className={`pf-option ${c === user.city ? 'on' : ''}`}
              onClick={() => save({ city: c, lat: null, lng: null })}>
              <span className="pf-option-text"><b>{c}</b></span>
              {c === user.city && <Check size={20} weight="bold" />}
            </button>
          ))}
        </div>
      )}

      {step === 'map' && <MapPick start={mapStart} onPick={fromCoords} />}

      {step === 'address' && (
        <form onSubmit={(e) => { e.preventDefault(); save({ address: address.trim() }) }}>
          <label className="field"><span>Manzil</span>
            <input autoFocus value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Masalan: Navoiy ko'chasi 12-uy" />
          </label>
          <button type="submit" className="btn btn-primary btn-block">Saqlash</button>
        </form>
      )}
    </Sheet>
  )
}
