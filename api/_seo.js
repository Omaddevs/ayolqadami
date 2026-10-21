// Vercel funksiyalari uchun umumiy: sayt manzili, yopiq bo'limlar, statik sahifalar
export const PRIVATE = ['/profile', '/applications', '/settings', '/notifications', '/post-job', '/candidates', '/401']

export const STATIC_URLS = [
  ['/', 'daily', 1], ['/jobs', 'hourly', 0.9], ['/companies', 'daily', 0.7], ['/courses', 'weekly', 0.7], ['/articles', 'weekly', 0.6],
  ['/categories', 'weekly', 0.6], ['/map', 'daily', 0.5], ['/qadam-ai', 'monthly', 0.5], ['/events', 'weekly', 0.4],
  ['/support', 'monthly', 0.3], ['/privacy', 'monthly', 0.2], ['/terms', 'monthly', 0.2],
].map(([path, changefreq, priority]) => ({ path, changefreq, priority }))

export const requestHost = (req) => String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim()

// SITE_URL berilsa — u (asosiy domen), aks holda so'rov kelgan host
export function siteBase(req) {
  const env = (process.env.SITE_URL || '').replace(/\/$/, '')
  if (/^https:\/\//.test(env)) return env
  const host = requestHost(req)
  return host ? `https://${host}` : 'https://localhost'
}
