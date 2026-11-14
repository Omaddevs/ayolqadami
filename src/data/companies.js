// Kompaniyalar vakansiyalardan yig'iladi: har bir ish beruvchi — o'z e'lonlari bilan.

// Shaxsiy (kompaniya bo'lmagan) ish beruvchilar va «kompaniya ko'rsatilmagan» belgilari ro'yxatga kirmaydi
const PRIVATE_RE = /^(xususiy( oila| shaxs)?|aniq emas|ko.?rsatilmagan|noma.?lum|yo.?q|-+|—)$/i
const isPrivate = (name) => PRIVATE_RE.test(String(name).trim())

export const companySlug = (name) => encodeURIComponent(name)

// jobs → [{ name, color, jobs, categories, cities, applicants, perks, verified, own, ...info }]
// profiles — admin paneldagi kompaniyalar (content.companies): tavsif, hajm, yil va «tasdiqlangan» belgisi shulardan olinadi.
// Admin qo'shgan, hali vakansiyasi yo'q kompaniya ham ro'yxatda chiqadi
export function buildCompanies(jobs, owner, profiles = []) {
  const map = new Map()
  const profileOf = new Map(profiles.map((p) => [p.name, p]))
  for (const j of jobs) {
    if (!j.company || isPrivate(j.company)) continue
    const c = map.get(j.company) || { name: j.company, color: j.color, jobs: [], own: false }
    c.jobs.push(j)
    if (j.own) c.own = true
    map.set(j.company, c)
  }
  for (const p of profiles) if (!map.has(p.name) && !isPrivate(p.name)) map.set(p.name, { name: p.name, color: p.color, jobs: [], own: false })
  return [...map.values()].map((c) => {
    const p = profileOf.get(c.name)
    return {
      ...c,
      color: p?.color || c.color,
      about: p?.about || (c.own && owner?.company === c.name ? owner.about : '') || '',
      size: p?.size || undefined,
      since: p?.since || undefined,
      verified: Boolean(p?.verified),
      categories: [...new Set(c.jobs.map((j) => j.category))],
      cities: [...new Set(c.jobs.map((j) => j.city))],
      applicants: c.jobs.reduce((n, j) => n + (j.applicants || 0), 0),
      perks: [...new Set(c.jobs.flatMap((j) => j.tags || []))],
    }
  })
}
