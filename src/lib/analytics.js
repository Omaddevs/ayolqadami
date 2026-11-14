import { apiEnabled, fire } from './api'

// Google Analytics 4. Yoqish: VITE_GA_ID=G-XXXXXXXXXX (Vercel → Environment Variables yoki deploy/.env → GA_ID).
// SPA: sahifa almashganda page_view qo'lda yuboriladi. Inline skript yo'q — CSP bilan mos.
const GA_ID = import.meta.env.VITE_GA_ID
export const analyticsEnabled = /^G-[A-Z0-9]+$/.test(GA_ID || '')

let ready = false
export function initAnalytics() {
  if (!analyticsEnabled || ready) return
  ready = true
  window.dataLayer = window.dataLayer || []
  // gtag `arguments` obyektini kutadi (massiv emas)
  window.gtag = function gtag() { window.dataLayer.push(arguments) } // eslint-disable-line prefer-rest-params
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true })
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
  document.head.appendChild(s)
}

// Sarlavha sahifa yuklangach o'rnatiladi — shuning uchun biroz kutib yuboriladi
let timer = 0
// Ichki statistika (admin panel → Statistika): anonim tashrifchi va tashrif (30 daq. faolsizlik) identifikatorlari
const rid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
function ids() {
  try {
    let vid = localStorage.getItem('aq_vid')
    if (!vid) localStorage.setItem('aq_vid', (vid = rid()))
    let [sid, at] = (sessionStorage.getItem('aq_sid') || '').split(':')
    if (!sid || Date.now() - Number(at) > 30 * 60_000) sid = rid()
    sessionStorage.setItem('aq_sid', `${sid}:${Date.now()}`)
    return { vid, sid }
  } catch { return null }
}
let lastPath = ''
let firstRef = document.referrer
function trackInternal(path) {
  if (!apiEnabled || path === lastPath) return
  lastPath = path
  const id = ids()
  if (!id) return
  let tz = ''
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch { /* eski brauzer */ }
  fire('/track', { method: 'POST', body: { path, ...id, ref: firstRef, tz, lang: navigator.language || '' } })
  firstRef = '' // tashqi manba faqat birinchi sahifaga yoziladi
}

export function trackPage(path) {
  trackInternal(path.split('?')[0])
  if (!analyticsEnabled) return
  clearTimeout(timer)
  timer = setTimeout(() => {
    window.gtag?.('event', 'page_view', { page_path: path, page_location: window.location.href, page_title: document.title })
  }, 400)
}

// Muhim hodisalar: sign_up, login, apply (ariza), job_post, banner_click
export function trackEvent(name, params = {}) {
  if (analyticsEnabled) window.gtag?.('event', name, params)
}
