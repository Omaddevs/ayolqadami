'use client'
import { useState } from 'react'
import { REGIONS } from '@/lib/regions'

// Xarita logotiplari (vakansiya sahifasidagi tugmalar bilan bir xil)
export const YandexMapsLogo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#FC3F1D" d="M12 1.5a8 8 0 0 0-8 8c0 5.6 6.4 12 7.3 12.8a1 1 0 0 0 1.4 0C13.6 21.5 20 15.1 20 9.5a8 8 0 0 0-8-8Z" />
    <circle cx="12" cy="9.5" r="3.2" fill="#fff" />
  </svg>
)
export const GoogleMapsLogo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#34A853" d="M7.2 15.6 12 22.3c.9-1 7.5-7.6 7.9-12.4L7.2 15.6Z" />
    <path fill="#FBBC04" d="M4.4 12.3c.7 1.2 1.7 2.3 2.8 3.3l5.9-6.9-4.6-3.9a7.9 7.9 0 0 0-4.1 7.5Z" />
    <path fill="#4285F4" d="m13.1 8.7-5.9 6.9L19.9 9.9A7.9 7.9 0 0 0 17.4 4l-4.3 4.7Z" />
    <path fill="#1A73E8" d="M17.4 4A8 8 0 0 0 8.5 4.8l4.6 3.9L17.4 4Z" />
    <path fill="#EA4335" d="M8.5 4.8a8 8 0 0 0-4.1 7.5l4.1-4.8 4.6 1.2-4.6-3.9Z" />
    <circle cx="12" cy="9.6" r="2.6" fill="#fff" />
  </svg>
)

type Props = { region: string; district: string; address: string; mapUrl: string; lat: string; lng: string; legacyCity?: string }

export function JobLocationFields(p: Props) {
  const [region, setRegion] = useState(p.region)
  const [district, setDistrict] = useState(p.district)
  const r = REGIONS.find((x) => x.id === region)
  const districts = r ? [...new Set([...(district && !r.districts.includes(district) ? [district] : []), ...r.districts])] : []
  return (
    <>
      <div className="field">
        <label htmlFor="region">Viloyat / shahar *</label>
        <select id="region" className="select" name="region" value={region} required onChange={(e) => { setRegion(e.target.value); setDistrict('') }}>
          <option value="" disabled>Tanlang</option>
          {REGIONS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        {p.legacyCity && !p.region && <small>Avval: {p.legacyCity}</small>}
      </div>
      <div className="field">
        <label htmlFor="district">Tuman / shahar</label>
        <select id="district" className="select" name="district" value={district} disabled={!r} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">{r ? 'Tanlang' : 'Avval viloyatni tanlang'}</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="field full"><label htmlFor="address">Manzil (ko&apos;cha, uy, mo&apos;ljal)</label><input id="address" className="input" name="address" defaultValue={p.address} maxLength={200} placeholder="Masalan: Bunyodkor ko'chasi 12, Chilonzor metrosi yonida" /></div>
      <div className="field full">
        <label htmlFor="mapUrl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <YandexMapsLogo size={16} /><GoogleMapsLogo size={16} /> Lokatsiya — Yandex yoki Google xarita havolasi
        </label>
        <input id="mapUrl" className="input" name="mapUrl" type="url" defaultValue={p.mapUrl} maxLength={500} placeholder="https://yandex.uz/maps/... yoki https://maps.app.goo.gl/..." />
        <small>Ixtiyoriy. Xaritada joyni tanlab «Ulashish» → havolani nusxalang. Koordinata havoladan avtomatik olinadi</small>
      </div>
      <div className="field"><label htmlFor="lat">Kenglik (latitude)</label><input id="lat" className="input" name="lat" inputMode="decimal" defaultValue={p.lat} placeholder="41.3111" /></div>
      <div className="field">
        <label htmlFor="lng">Uzunlik (longitude)</label><input id="lng" className="input" name="lng" inputMode="decimal" defaultValue={p.lng} placeholder="69.2797" />
        <small>Ixtiyoriy. Kiritilmasa — havoladan, u ham bo&apos;lmasa tanlangan tuman markazi xaritaga qo&apos;yiladi</small>
      </div>
    </>
  )
}
