// SEO: sahifa sarlavhasi, tavsifi, canonical manzil, Open Graph va JSON-LD (Google uchun strukturali ma'lumot).
// Google JavaScript'ni bajaradi — bu teglar har sahifada brauzerda o'rnatiladi.
import { useEffect } from 'react'
import { matchPath } from 'react-router-dom'

const BRAND = 'AyolQadami'
const HOME_TITLE = "AyolQadami — O'zbekistonda ayollar uchun ish va karyera platformasi"
const DEFAULT_DESC = "Ayollar uchun vakansiyalar: ofis, ta'lim, tibbiyot, IT, masofaviy va yarim stavka ishlar. Rezyume yarating, QadamAI bilan mos ishni toping va bepul kurslarda o'qing."

// Asosiy domen: VITE_SITE_URL (masalan https://ayolqadami.uz) yoki joriy manzil
export const siteUrl = () => (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '')

// URL uchun o'qiladigan nom — server/src/lib/slug.ts bilan bir xil qoida
const CYR = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu',
  я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
}
export function slugify(s, max = 60) {
  const out = String(s || '')
    .toLowerCase()
    .replace(/[Ѐ-ӿ]/g, (c) => CYR[c] ?? '')
    .replace(/[ʻʼ'‘’`]/g, '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return out.slice(0, max).replace(/-+[^-]*$/, (m) => (out.length > max ? '' : m)).replace(/-+$/, '')
}

// Vakansiya manzili: /jobs/1001-frontend-dasturchi-toshkent. Raqami yo'q (bot/lokal) e'lonlar — /jobs/<id>
// server bergan path faqat /jobs/<raqam>-<nom> ko'rinishida qabul qilinadi (tashqi manbadan //evil.com kabi kelmasin)
export const jobPath = (j) =>
  (/^\/jobs\/[a-z0-9-]+$/.test(j?.path || '') && j.path) || (j?.number ?`/jobs/${j.number}-${slugify(`${j.title} ${j.city || ''}`)}`.replace(/-$/, '') : `/jobs/${encodeURIComponent(j?.id ?? '')}`)
export const jobNumberFromRef = (ref) => (/^\d{1,9}(-|$)/.test(ref || '') ? Number(ref.split('-')[0]) : null)
export const findJobByRef = (jobs, ref) => {
  const n = jobNumberFromRef(ref)
  return jobs.find((j) => (n ? j.number === n : j.id === ref)) || jobs.find((j) => j.id === ref)
}

// ---- <head> teglari ----
function meta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (content == null || content === '') { el?.remove(); return }
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', content)
}
function link(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!href) { el?.remove(); return }
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el) }
  el.setAttribute('href', href)
}
function ldScript(id, data) {
  let el = document.getElementById(id)
  if (!data) { el?.remove(); return }
  if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = id; document.head.appendChild(el) }
  el.textContent = JSON.stringify(data).replace(/</g, '\\u003c')
}
const clip = (s, n = 160) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t }

let lastPath = ''
export const seoAppliedFor = () => lastPath

// title — "Sahifa" (brend qo'shiladi) | full — to'liq sarlavha; path — canonical (query'siz)
export function applySeo({ title, full, description, path, image, jsonLd, noindex } = {}) {
  const t = full || (title ? `${title} | ${BRAND}` : HOME_TITLE)
  const desc = clip(description || DEFAULT_DESC)
  const url = siteUrl() + (path ?? window.location.pathname)
  const img = image ? (image.startsWith('http') ? image : siteUrl() + image) : siteUrl() + '/logo.png'
  document.title = t
  meta('name', 'description', desc)
  meta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
  link('canonical', noindex ? '' : url)
  meta('property', 'og:title', t)
  meta('property', 'og:description', desc)
  meta('property', 'og:url', url)
  meta('property', 'og:image', img)
  meta('property', 'og:type', jsonLd?.['@type'] === 'Article' ? 'article' : 'website')
  meta('name', 'twitter:title', t)
  meta('name', 'twitter:description', desc)
  ldScript('ld-page', jsonLd || null)
  lastPath = window.location.pathname
}

// Sahifa komponentida: useSeo({ ... }, [bog'liqliklar])
export function useSeo(opts, deps = []) {
  useEffect(() => { if (opts) applySeo(opts) }, deps) // eslint-disable-line react-hooks/exhaustive-deps
}

// ---- Bo'limlar (ro'yxat sahifalari) — App'dagi RouteSeo shu jadvaldan oladi; tafsilot sahifalari o'zi useSeo chaqiradi ----
const PRIVATE = { noindex: true }
export const ROUTE_SEO = [
  ['/', { full: HOME_TITLE, description: DEFAULT_DESC }],
  // Ish beruvchilar bosh sahifasi — alohida manzil, Google'da «xodim topish», «vakansiya joylash» so'rovlari uchun
  ['/ish-beruvchilar', { full: "Ish beruvchilar uchun — bepul vakansiya joylash va xodim topish | AyolQadami", description: "Vakansiyangizni bepul joylang: QadamAI HR nomzodlarni ko'nikma, tajriba va shahar bo'yicha saralab, eng mos xodimlarni bir necha daqiqada taklif qiladi." }],
  ['/jobs', { title: 'Vakansiyalar — ayollar uchun ish', description: "Ayollar uchun eng so'nggi vakansiyalar: to'liq va yarim stavka, masofaviy va gibrid ish. Maosh, shahar va soha bo'yicha saralang, bir bosishda ariza yuboring." }],
  ['/map', { title: "Xaritada ish qidirish", description: "Uyingizga yaqin vakansiyalarni xaritada toping: shahar va tuman bo'yicha ish e'lonlari." }],
  ['/companies', { title: 'Kompaniyalar va ish beruvchilar', description: "Ayollarga qulay sharoit yaratgan kompaniyalar, ularning ochiq vakansiyalari va ish sharoitlari." }],
  ['/categories', { title: "Kasblar va sohalar", description: "Ofis, ta'lim, tibbiyot, IT, savdo, go'zallik, ishlab chiqarish va boshqa sohalar bo'yicha vakansiyalar." }],
  ['/courses', { title: "O'quv kurslar", description: "Yangi kasb o'rganing: bepul va pullik kurslar, sertifikat va hamkor kompaniyalarda stajirovka." }],
  ['/articles', { title: 'Karyera bo\'yicha maqolalar', description: "Rezyume yozish, ish suhbatiga tayyorgarlik, masofaviy ish va karyera bo'yicha foydali maslahatlar." }],
  ['/qadam-ai', { title: 'QadamAI — karyera yordamchisi', description: "QadamAI talablaringizga mos vakansiyalarni topadi, rezyume va ish suhbati bo'yicha maslahat beradi." }],
  ['/events', { title: 'Tadbirlar', description: "Karyera forumlari, ish yarmarkalari va ayollar uchun meetuplar." }],
  ['/support', { title: 'Texnik yordam', description: "Savol yoki muammo bo'lsa — AyolQadami texnik yordam xizmatiga yozing." }],
  ['/privacy', { title: 'Maxfiylik siyosati', description: "AyolQadami shaxsga doir ma'lumotlarni qanday yig'adi, saqlaydi va himoya qiladi." }],
  ['/terms', { title: 'Foydalanish shartlari', description: "AyolQadami platformasidan foydalanish qoidalari: ish izlovchilar va ish beruvchilar uchun." }],
  ['/more', { title: "Qo'shimcha" }],
  ['/candidates/*', { title: 'Nomzodlar', ...PRIVATE }],
  ['/candidates', { title: 'Nomzodlar', ...PRIVATE }],
  ['/profile/*', { title: 'Profil', ...PRIVATE }],
  ['/profile', { title: 'Profil', ...PRIVATE }],
  ['/applications', { title: 'Arizalarim', ...PRIVATE }],
  ['/notifications', { title: 'Bildirishnomalar', ...PRIVATE }],
  ['/settings/*', { title: 'Sozlamalar', ...PRIVATE }],
  ['/settings', { title: 'Sozlamalar', ...PRIVATE }],
  ['/post-job', { title: "Vakansiya joylash", ...PRIVATE }],
  ['/401', { title: 'Kirish talab qilinadi', ...PRIVATE }],
]
// tafsilot sahifalari (o'zlari useSeo chaqiradi) — jadvaldagi umumiy qiymat ularni bosib ketmasin
const DETAIL = ['/jobs/:id', '/courses/:id', '/articles/:id', '/companies/:name']

export function routeSeo(pathname) {
  if (DETAIL.some((p) => matchPath(p, pathname))) return null
  const hit = ROUTE_SEO.find(([p]) => matchPath(p, pathname))
  return hit ? hit[1] : { title: 'Sahifa topilmadi', noindex: true }
}

// ---- Sayt bo'yicha strukturali ma'lumot (bir marta): tashkilot va sayt nomi — Google qidiruvida nom va logotip ----
export function initSiteSeo() {
  const base = siteUrl()
  ldScript('ld-site', [
    {
      '@context': 'https://schema.org', '@type': 'Organization', '@id': `${base}/#organization`,
      name: BRAND, url: base, logo: `${base}/icon-192.png`,
      description: "O'zbekistonda ayollar uchun ish, rezyume va karyera platformasi",
    },
    {
      '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${base}/#website`,
      name: BRAND, alternateName: ['Ayol Qadami', 'AyolQadami.uz'], url: base, inLanguage: 'uz',
      publisher: { '@id': `${base}/#organization` },
      potentialAction: { '@type': 'SearchAction', target: `${base}/jobs?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
    },
  ])
}

// ---- JSON-LD yasovchilar ----
const TYPE = { "To'liq stavka": 'FULL_TIME', 'Yarim stavka': 'PART_TIME', Masofaviy: 'FULL_TIME', Gibrid: 'FULL_TIME', Smenali: 'FULL_TIME', Vaqtincha: 'TEMPORARY', Stajirovka: 'INTERN' }

// Google for Jobs: vakansiya qidiruv natijalarida alohida kartochka bo'lib chiqadi
export function jobPostingLd(job) {
  const base = siteUrl()
  const posted = job.publishedAt || new Date().toISOString()
  const desc = [job.description, job.requirements?.length && `Talablar: ${job.requirements.join('; ')}`, job.conditions?.length && `Sharoitlar: ${job.conditions.join('; ')}`]
    .filter(Boolean).join('\n\n') || job.title
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: desc.replace(/[<>]/g, ''),
    identifier: job.number ? { '@type': 'PropertyValue', name: BRAND, value: String(job.number) } : undefined,
    datePosted: posted.slice(0, 10),
    validThrough: job.expires || undefined,
    employmentType: TYPE[job.type] || 'FULL_TIME',
    hiringOrganization: { '@type': 'Organization', name: job.company, sameAs: `${base}/companies/${encodeURIComponent(job.company)}` },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.city, addressRegion: job.region || job.city, streetAddress: job.district || undefined, addressCountry: 'UZ' } },
    ...(job.type === 'Masofaviy' && { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'Uzbekistan' } }),
    ...((job.salaryFrom || job.salaryTo) && {
      baseSalary: {
        '@type': 'MonetaryAmount', currency: 'UZS',
        value: { '@type': 'QuantitativeValue', ...(job.salaryFrom && { minValue: job.salaryFrom }), ...(job.salaryTo && { maxValue: job.salaryTo }), unitText: 'MONTH' },
      },
    }),
    ...(job.experience ? { experienceRequirements: { '@type': 'OccupationalExperienceRequirements', monthsOfExperience: job.experience * 12 } } : {}),
    directApply: true,
    url: base + jobPath(job),
  }
}

export const breadcrumbLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: siteUrl() + path })),
})
