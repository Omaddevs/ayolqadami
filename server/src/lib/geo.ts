import 'server-only'
import { REGION_CENTERS, findRegion } from './regions'

export type LatLng = [number, number]

const inUz = (lat: number, lng: number) => lat > 36 && lat < 46 && lng > 55 && lng < 74
const pair = (a: string, b: string): LatLng | null => {
  const lat = Number(a), lng = Number(b)
  return Number.isFinite(lat) && Number.isFinite(lng) && inUz(lat, lng) ? [lat, lng] : null
}

// Yandex / Google xarita havolasidan koordinata: Google — «lat,lng», Yandex — «lng,lat»
export function coordsFromMapUrl(raw: string): LatLng | null {
  let s = raw
  try { s = decodeURIComponent(raw) } catch { /* buzilgan havola — xom holida */ }
  const num = '(-?\\d{1,3}\\.\\d+)'
  const google = [
    new RegExp(`!3d${num}!4d${num}`), // aniq belgilangan joy (@ dan ustun)
    new RegExp(`[?&](?:q|query|ll|destination|center)=${num},\\s*${num}`),
    new RegExp(`@${num},${num}`),
    new RegExp(`/place/${num},\\s*${num}`),
  ]
  const yandex = [
    new RegExp(`[?&](?:pt|whatshere\\[point\\])=${num},${num}`),
    new RegExp(`[?&]ll=${num},${num}`),
  ]
  if (/yandex\./i.test(s)) {
    for (const re of yandex) { const m = s.match(re); if (m) { const p = pair(m[2], m[1]); if (p) return p } }
  }
  for (const re of google) { const m = s.match(re); if (m) { const p = pair(m[1], m[2]); if (p) return p } }
  // oddiy «41.31, 69.27» matni
  const m = s.trim().match(new RegExp(`^${num},\\s*${num}$`))
  return m ? pair(m[1], m[2]) : null
}

export const isMapUrl = (u: string) => /^https:\/\/([a-z0-9-]+\.)*(yandex\.(uz|ru|com)|google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl)\//i.test(u)

// Qisqa havolalar (maps.app.goo.gl, yandex.uz/maps/-/...) — yo'naltirishdan keyingi to'liq manzil bo'yicha
async function resolveShort(url: string): Promise<LatLng | null> {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'Mozilla/5.0 (AyolQadami)' } })
    const hit = coordsFromMapUrl(res.url)
    if (hit) return hit
    const html = (await res.text()).slice(0, 200_000)
    return coordsFromMapUrl(html.match(/https:\/\/[^"'\s]*(?:@|ll=|pt=)[^"'\s]*/)?.[0] || '')
  } catch { return null }
}

// Tuman markazi (OpenStreetMap Nominatim); topilmasa — viloyat markazi
async function districtCenter(regionId: string, district: string): Promise<LatLng | null> {
  const region = findRegion(regionId)
  if (!region) return null
  if (district) {
    const name = district.replace(/ sh\.$/, '').replace(/ tumani$/, '')
    const q = `${name}, ${region.name}, O'zbekiston`
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=uz&q=${encodeURIComponent(q)}`, {
        signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'AyolQadami/1.0', 'Accept-Language': 'uz' },
      })
      const [hit] = (await res.json()) as { lat: string; lon: string }[]
      const p = hit && pair(hit.lat, hit.lon)
      if (p) return p
    } catch { /* tarmoq xatosi — viloyat markazi */ }
  }
  return REGION_CENTERS[regionId] ?? null
}

// Kiritilgan kenglik/uzunlik → xarita havolasi → tuman markazi (tartib bo'yicha)
export async function resolveJobLocation(o: { lat: string; lng: string; mapUrl: string; region: string; district: string }) {
  const typed = o.lat && o.lng ? pair(o.lat.replace(',', '.'), o.lng.replace(',', '.')) : null
  if (o.lat || o.lng) {
    if (!typed) return { error: "Kenglik va uzunlik noto'g'ri (O'zbekiston hududida bo'lishi kerak, masalan 41.3111 va 69.2797)" }
    return { pos: typed, exact: true }
  }
  if (o.mapUrl) {
    const fromUrl = coordsFromMapUrl(o.mapUrl) || (await resolveShort(o.mapUrl))
    if (fromUrl) return { pos: fromUrl, exact: true }
  }
  const center = await districtCenter(o.region, o.district)
  return { pos: center, exact: false }
}
