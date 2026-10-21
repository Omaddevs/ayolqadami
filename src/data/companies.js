// Kompaniyalar vakansiyalardan yig'iladi: har bir ish beruvchi — o'z e'lonlari bilan.

// Shaxsiy (kompaniya bo'lmagan) ish beruvchilar ro'yxatga kirmaydi
const PRIVATE = ['Xususiy oila']

export const companySlug = (name) => encodeURIComponent(name)

// jobs → [{ name, color, jobs, categories, cities, applicants, perks, verified, own, ...info }]
export function buildCompanies(jobs, owner) {
  const map = new Map()
  for (const j of jobs) {
    if (!j.company || PRIVATE.includes(j.company)) continue
    const c = map.get(j.company) || { name: j.company, color: j.color, jobs: [], own: false }
    c.jobs.push(j)
    if (j.own) c.own = true
    map.set(j.company, c)
  }
  return [...map.values()].map((c) => {
    return {
      ...c,
      about: c.own && owner?.company === c.name ? owner.about : '',
      verified: !c.own,
      categories: [...new Set(c.jobs.map((j) => j.category))],
      cities: [...new Set(c.jobs.map((j) => j.city))],
      applicants: c.jobs.reduce((n, j) => n + (j.applicants || 0), 0),
      perks: [...new Set(c.jobs.flatMap((j) => j.tags || []))],
    }
  })
}
