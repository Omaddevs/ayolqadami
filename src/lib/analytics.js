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
export function trackPage(path) {
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
