// URL uchun o'qiladigan nom (slug): "Bosh buxgalter (1C), Farg'ona" → "bosh-buxgalter-1c-fargona".
// Web ilovadagi src/lib/seo.js bilan bir xil qoida — ikkalasi bir xil havola yasaydi.
const CYR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu',
  я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
}

export function slugify(s: string, max = 60) {
  const out = (s || '')
    .toLowerCase()
    .replace(/[Ѐ-ӿ]/g, (c) => CYR[c] ?? '')
    .replace(/[ʻʼ'‘’`]/g, '') // o'zbekcha tutuq belgisi: o'qituvchi → oqituvchi
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return out.slice(0, max).replace(/-+[^-]*$/, (m) => (out.length > max ? '' : m)).replace(/-+$/, '')
}

// Vakansiyaning ochiq manzili: /jobs/1001-frontend-dasturchi-toshkent (raqam — asosiy, nom — o'qish uchun)
export const jobPath = (j: { number: number; title: string; city?: string | null }) =>
  `/jobs/${j.number}-${slugify(`${j.title} ${j.city || ''}`)}`.replace(/-$/, '')

// "/jobs/1001-..." dagi ref → raqam (eski cuid havolalar ham ishlayveradi)
export const jobNumberFromRef = (ref: string) => (/^\d{1,9}(-|$)/.test(ref) ? Number(ref.split('-')[0]) : null)
