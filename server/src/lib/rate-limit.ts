import { ApiError } from './http'

// Oddiy xotiradagi cheklovchi (bitta server nusxasi uchun yetarli).
// Bir nechta nusxada ishlatilsa — Redis asosidagi cheklovchiga almashtiring.
const buckets = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs)
  if (hits.length >= limit) {
    buckets.set(key, hits)
    throw new ApiError(429, 'rate_limited', "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring")
  }
  hits.push(now)
  buckets.set(key, hits)
  if (buckets.size > 10000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k)
  }
}
