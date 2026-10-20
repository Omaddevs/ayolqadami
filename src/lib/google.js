// Google orqali kirish (Google Identity Services, OAuth token oqimi).
// Ishlashi uchun .env.local faylida VITE_GOOGLE_CLIENT_ID bo'lishi kerak (.env.example ga qarang).
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
export const googleEnabled = Boolean(CLIENT_ID)

let loading = null
export function preloadGoogle() {
  if (!CLIENT_ID) return Promise.resolve()
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  loading ||= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = resolve
    s.onerror = () => { loading = null; reject(new Error('load')) }
    document.head.appendChild(s)
  })
  return loading
}

// Google hisob tanlash oynasini ochadi va { email, name, photo } qaytaradi.
// Skript oldindan yuklangan bo'lsa (preloadGoogle), popup bosish ichida ochiladi va bloklanmaydi.
export async function googleSignIn() {
  if (!CLIENT_ID) throw new Error('not-configured')
  if (!window.google?.accounts?.oauth2) await preloadGoogle()
  const token = await new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'openid email profile',
      callback: (r) => (r.error ? reject(new Error(r.error)) : resolve(r.access_token)),
      error_callback: (e) => reject(new Error(e?.type || 'popup')),
    })
    client.requestAccessToken({ prompt: 'select_account' })
  })
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('userinfo')
  const u = await res.json()
  return { email: u.email, name: u.name || '', photo: u.picture || '' }
}
