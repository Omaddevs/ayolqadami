// AyolQadami backend (server/ papkasi, Next.js) bilan bog'lanish.
// VITE_API_URL berilmasa ilova avvalgidek oflayn (localStorage) rejimida ishlaydi.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'ayolkaryera_token'

export const apiEnabled = Boolean(BASE)

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }
export const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* storage yo'q */ }
}

export class ApiError extends Error {
  constructor(status, code, message, data) {
    super(message || code)
    this.status = status
    this.code = code
    this.data = data
  }
}

export async function request(path, { method = 'GET', body, signal, auth = true } = {}) {
  if (!BASE) throw new ApiError(0, 'disabled')
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = auth && getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(`${BASE}/api/v1${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ApiError(0, 'network', "Internet aloqasini tekshiring")
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data.error?.code || 'error', data.error?.message, data)
  return data
}

// Javobni kutmaydigan amallar (saqlash, ariza va h.k.) — xato bo'lsa konsolga yoziladi, UI to'xtamaydi
export const fire = (path, opts) => request(path, opts).catch((e) => { console.warn('[api]', path, e.code || e); return null })

export const api = {
  register: (data) => request('/auth/register', { method: 'POST', body: data, auth: false }),
  login: (phone, password) => request('/auth/login', { method: 'POST', body: { phone, password }, auth: false }),
  phoneStart: (phone, purpose) => request('/auth/phone/start', { method: 'POST', body: { phone, purpose }, auth: false }),
  phoneVerify: (id, code) => request('/auth/phone/verify', { method: 'POST', body: { id, code }, auth: false }),
  phoneLogin: (phone, phoneToken) => request('/auth/phone/login', { method: 'POST', body: { phone, phoneToken }, auth: false }),
  resetPassword: (phone, phoneToken, password) => request('/auth/reset', { method: 'POST', body: { phone, phoneToken, password }, auth: false }),
  google: (accessToken) => request('/auth/google', { method: 'POST', body: { accessToken }, auth: false }),
  me: (signal) => request('/me', { signal }),
  deleteMe: () => request('/me', { method: 'DELETE' }),
  updateMe: (patch) => fire('/me', { method: 'PATCH', body: patch }),
  jobs: (signal) => request('/jobs?limit=500', { signal, auth: false }),
  job: (ref, signal) => request(`/jobs/${encodeURIComponent(ref)}`, { signal }),
  bannerClick: (id) => fire(`/banners/${encodeURIComponent(id)}/click`, { method: 'POST', auth: false }),
  myJobs: (signal) => request('/me/jobs', { signal }),
  postJob: (job) => request('/jobs', { method: 'POST', body: job }),
  removeJob: (id) => fire(`/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  like: (id, on) => fire(`/jobs/${encodeURIComponent(id)}/like`, { method: on ? 'POST' : 'DELETE' }),
  view: (id) => fire(`/jobs/${encodeURIComponent(id)}/view`, { method: 'POST' }),
  contact: (id, kind, text) => fire(`/jobs/${encodeURIComponent(id)}/contact`, { method: 'POST', body: { kind, ...(text && { text }) } }),
  apply: (id, letter) => fire(`/jobs/${encodeURIComponent(id)}/apply`, { method: 'POST', body: { letter: letter || '' } }),
  enroll: (id) => fire(`/courses/${encodeURIComponent(id)}/enroll`, { method: 'POST' }),
  invite: (candidateId) => fire('/invites', { method: 'POST', body: { candidateId } }),
  content: (signal) => request('/content', { signal, auth: false }),
  support: () => request('/support'),
  sendSupport: (text) => fire('/support', { method: 'POST', body: { text } }),
  notifications: (signal) => request('/notifications', { signal }),
  readNotifications: () => fire('/notifications/read', { method: 'POST' }),
}
