import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { fetchBotJobs, sendJobToBot } from '../lib/botApi'
import { api as server, apiEnabled, getToken, setToken } from '../lib/api'
import { normalizeMode, switchTheme, useThemeEffect } from '../lib/theme'
import { trackEvent } from '../lib/analytics'
import { normalizeLang, setLang } from '../i18n'

const KEY = 'ayolkaryera_v1'
// Oflayn rejim (VITE_API_URL yo'q): yaratilgan hisoblar telefon raqami bo'yicha brauzerda saqlanadi, "Kirish" shu yerdan tiklaydi
const ACC_KEY = 'ayolkaryera_accounts'
const digits = (phone) => String(phone || '').replace(/\D/g, '')
const loadAccounts = () => { try { return JSON.parse(localStorage.getItem(ACC_KEY)) || {} } catch { return {} } }
export const findAccount = (phone) => loadAccounts()[digits(phone)] || null
const findByEmail = (email) => Object.values(loadAccounts()).find((u) => email && u.email === email) || null
// Parollar alohida saqlanadi (faqat xesh). Bu demo — haqiqiy himoya server tomonida bo'lishi kerak.
const PW_KEY = 'ayolkaryera_pw'
const loadPw = () => { try { return JSON.parse(localStorage.getItem(PW_KEY)) || {} } catch { return {} } }
function hashPw(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}
const Ctx = createContext(null)

// Kurslar, maqolalar, tadbirlar va bannerlar — admin paneldan (API) keladi
const STATIC_CONTENT = { courses: [], articles: [], events: [], banners: [] }
const listOr = (v, fallback) => (Array.isArray(v) ? v : fallback)
const normalizeContent = (d) => ({
  courses: listOr(d?.courses, []),
  articles: listOr(d?.articles, []),
  events: listOr(d?.events, []),
  banners: listOr(d?.banners, []),
})

const initial = {
  user: null, // { role: 'seeker' | 'employer', name, phone, city, ... }
  saved: [],
  applications: [], // { jobId, date, status, letter }
  courses: [], // enrolled course ids
  posted: [], // employer's own jobs
  ads: [], // foydalanuvchi joylagan e'lonlar
  invites: [], // candidate ids invited by employer
  savedCands: [], // ish beruvchi saqlagan nomzodlar
  hiddenJobs: [], // yashirilgan vakansiya id'lari
  hiddenCompanies: [], // yashirilgan kompaniya nomlari
  support: [], // texnik yordam chati: { id, from: 'me' | 'bot', text, time }
  prefs: { lang: 'uz', theme: 'system', notif: { jobs: true, ai: true, apps: true, courses: true, events: false, email: false } },
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial
    const s = { ...initial, ...JSON.parse(raw) }
    // eski versiyalardan qolgan buzuq qiymatlarni tiklaymiz
    for (const k of ['saved', 'applications', 'courses', 'posted', 'ads', 'invites', 'savedCands', 'hiddenJobs', 'hiddenCompanies', 'support']) if (!Array.isArray(s[k])) s[k] = []
    s.prefs = { ...initial.prefs, ...s.prefs, notif: { ...initial.prefs.notif, ...s.prefs?.notif } }
    s.prefs.theme = normalizeMode(s.prefs.theme)
    s.prefs.lang = normalizeLang(s.prefs.lang)
    if (s.user && (typeof s.user !== 'object' || !s.user.role)) s.user = null
    return s
  } catch {
    return initial
  }
}

export function AppProvider({ children }) {
  const [state, setState] = useState(load)
  const [toast, setToast] = useState(null)
  // Mehmon rejimi: kirish talab qilinadigan amalda ro'yxatdan o'tish oynasi ochiladi,
  // muvaffaqiyatli o'tgach kutib turgan amal bajariladi
  const [authOpen, setAuthOpen] = useState(false)
  // kirish oynasi qaysi bo'limdan ochilsin: welcome | login | signup | code (bot havolasi: /?auth=signup)
  const [authMode, setAuthMode] = useState('welcome')
  const pending = useRef(null)
  const userRef = useRef(state.user)
  userRef.current = state.user
  useThemeEffect(state.prefs.theme)
  // til modul darajasida o'rnatiladi — bolalar shu render ichida yangi tilda chiziladi
  setLang(state.prefs.lang)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
      if (!apiEnabled && state.user?.phone) localStorage.setItem(ACC_KEY, JSON.stringify({ ...loadAccounts(), [digits(state.user.phone)]: state.user }))
    } catch { /* storage mavjud emas */ }
  }, [state])

  const notify = useCallback((text) => {
    setToast({ text, id: Date.now() })
    setTimeout(() => setToast(null), 2400)
  }, [])

  const api = useMemo(() => {
    const set = (fn) => setState((s) => ({ ...s, ...fn(s) }))
    return {
      register: (user) => set(() => ({ user: { skills: [], experience: [], languages: ["O'zbek"], ...user } })),
      // til va mavzu — qurilma sozlamasi, hisobdan chiqilganda saqlanib qoladi
      logout: () => { setToken(null); setState((s) => ({ ...initial, prefs: s.prefs })) },
      updateUser: (patch) => {
        set((s) => ({ user: { ...s.user, ...patch } }))
        if (apiEnabled) {
          // asosiy soha o'zgarsa — server uchun sohalar ro'yxati ham yangilanadi
          const cats = userRef.current?.categories || []
          const extra = patch.category && !patch.categories ? { categories: [patch.category, ...cats.filter((c) => c !== patch.category)].slice(0, 3) } : {}
          server.updateMe({ ...patch, ...extra })
        }
      },
      switchRole: () => set((s) => ({ user: { ...s.user, role: s.user.role === 'seeker' ? 'employer' : 'seeker' } })),
      toggleSave: (id) => set((s) => ({ saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })),
      apply: (jobId, letter) => {
        if (apiEnabled) server.apply(jobId, letter)
        trackEvent('apply', { job_id: jobId })
        set((s) => ({
          applications: [{ jobId, letter, date: new Date().toISOString(), status: "Ko'rib chiqilmoqda" }, ...s.applications.filter((a) => a.jobId !== jobId)],
        }))
      },
      enroll: (id) => { if (apiEnabled) server.enroll(id); set((s) => ({ courses: s.courses.includes(id) ? s.courses : [...s.courses, id] })) },
      // Serverli rejimda vakansiya moderatsiyaga tushadi; saqlangan vakansiya (status: PENDING | ACTIVE) qaytariladi
      postJob: async (job) => {
        if (!apiEnabled) {
          sendJobToBot(job)
          const local = { id: 'p' + Date.now(), ...job, posted: 'Hozirgina', applicants: 0, own: true }
          set((s) => ({ posted: [local, ...s.posted] }))
          return local
        }
        const { id, ...data } = job // eslint-disable-line no-unused-vars
        const { job: saved } = await server.postJob(data)
        set((s) => ({ posted: [saved, ...s.posted] }))
        return saved
      },
      removeJob: (id) => { if (apiEnabled) server.removeJob(id); set((s) => ({ posted: s.posted.filter((j) => j.id !== id) })) },
      addAd: (ad) => set((s) => ({ ads: [{ ...ad, id: 'u' + Date.now(), posted: 'Hozirgina', own: true }, ...s.ads] })),
      removeAd: (id) => set((s) => ({ ads: s.ads.filter((a) => a.id !== id) })),
      setPrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),
      setNotif: (key, on) => set((s) => ({ prefs: { ...s.prefs, notif: { ...s.prefs.notif, [key]: on } } })),
      hideJob: (id) => set((s) => ({ hiddenJobs: s.hiddenJobs.includes(id) ? s.hiddenJobs : [...s.hiddenJobs, id] })),
      unhideJob: (id) => set((s) => ({ hiddenJobs: s.hiddenJobs.filter((x) => x !== id) })),
      hideCompany: (name) => set((s) => ({ hiddenCompanies: s.hiddenCompanies.includes(name) ? s.hiddenCompanies : [...s.hiddenCompanies, name] })),
      unhideCompany: (name) => set((s) => ({ hiddenCompanies: s.hiddenCompanies.filter((x) => x !== name) })),
      addSupport: (msg) => { if (apiEnabled && msg.from === 'me') server.sendSupport(msg.text); set((s) => ({ support: [...s.support, { id: Date.now() + Math.random(), time: new Date().toISOString(), ...msg }] })) },
      // operator (admin panel) javoblarini chatga qo'shadi
      mergeSupport: (msgs) => set((s) => {
        const have = new Set(s.support.map((m) => m.id))
        const add = msgs.filter((m) => m.operator && !have.has(m.id)).map((m) => ({ id: m.id, from: 'bot', operator: true, text: m.text, time: m.time }))
        return add.length ? { support: [...s.support, ...add].sort((a, b) => String(a.time).localeCompare(String(b.time))) } : {}
      }),
      clearSupport: () => set(() => ({ support: [] })),
      invite: (id) => { if (apiEnabled) server.invite(id); set((s) => ({ invites: s.invites.includes(id) ? s.invites : [...s.invites, id] })) },
      toggleSaveCand: (id) => set((s) => ({ savedCands: s.savedCands.includes(id) ? s.savedCands.filter((x) => x !== id) : [...s.savedCands, id] })),
    }
  }, [])

  // Mavzuni almashtirish. origin — bosilgan tugma markazi: yangi mavzu shu nuqtadan yoyiladi
  const setTheme = useCallback((mode, origin) => {
    switchTheme(() => flushSync(() => api.setPrefs({ theme: normalizeMode(mode) })), origin)
  }, [api])

  const requireAuth = useCallback((fn) => {
    if (userRef.current) { fn?.(); return true }
    pending.current = fn || null
    setAuthOpen(true)
    return false
  }, [])
  const closeAuth = useCallback(() => { pending.current = null; setAuthOpen(false); setAuthMode('welcome') }, [])
  // Kirish botidagi «Saytga o'tish» / «Ro'yxatdan o'tish» havolalari: ?auth=login|signup|code
  useEffect(() => {
    const url = new URL(window.location.href)
    const mode = url.searchParams.get('auth')
    if (!['login', 'signup', 'code'].includes(mode)) return
    url.searchParams.delete('auth')
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
    if (userRef.current) return
    setAuthMode(mode)
    setAuthOpen(true)
  }, [])
  const finishAuth = useCallback((user) => {
    api.register(user)
    const fn = pending.current
    pending.current = null
    setAuthOpen(false)
    if (fn) setTimeout(fn, 0)
  }, [api])
  // Serverdan kelgan sessiya: token saqlanadi, foydalanuvchi holati serverdagisi bilan almashtiriladi
  const acceptSession = useCallback(({ token, user }) => {
    setToken(token)
    finishAuth(user)
  }, [finishAuth])

  // Ro'yxatdan o'tish. Natija: 'ok' yoki xato kodi ('exists', 'email_exists', 'validation', 'network', ...)
  // extra: { phoneToken, acceptTerms } — raqam kirish boti orqali tasdiqlangani va shartlarga rozilik
  const signUp = useCallback(async (user, password, googleAccessToken, extra = {}) => {
    if (apiEnabled) {
      try {
        acceptSession(await server.register({ ...user, password: password || undefined, googleAccessToken, ...extra }))
        trackEvent('sign_up', { method: googleAccessToken ? 'google' : 'phone', role: user.role })
        return 'ok'
      } catch (e) {
        return e.code || 'error'
      }
    }
    if (password) {
      try { localStorage.setItem(PW_KEY, JSON.stringify({ ...loadPw(), [digits(user.phone)]: hashPw(digits(user.phone) + password) })) } catch { /* storage yo'q */ }
    }
    finishAuth(user)
    return 'ok'
  }, [acceptSession, finishAuth])
  // telefon + parol bilan kirish: 'ok' | 'nouser' | 'badpass' | 'google' | 'blocked' | 'network'
  const signIn = useCallback(async (phone, password) => {
    if (apiEnabled) {
      try {
        acceptSession(await server.login(phone, password))
        trackEvent('login', { method: 'password' })
        return 'ok'
      } catch (e) {
        return e.code || 'error'
      }
    }
    const acc = findAccount(phone)
    if (!acc) return 'nouser'
    const saved = loadPw()[digits(phone)]
    if (!saved) return acc.google ? 'google' : 'badpass'
    if (saved !== hashPw(digits(phone) + password)) return 'badpass'
    finishAuth(acc)
    return 'ok'
  }, [acceptSession, finishAuth])
  // Parolsiz kirish: kirish botidan olingan kod tasdiqlangach. 'ok' | xato kodi
  const signInCode = useCallback(async (phone, phoneToken) => {
    try {
      acceptSession(await server.phoneLogin(phone, phoneToken))
      trackEvent('login', { method: 'telegram_code' })
      return 'ok'
    } catch (e) {
      return e.code || 'error'
    }
  }, [acceptSession])
  // Parolni tiklash (raqam kirish boti orqali tasdiqlangandan keyin): 'ok' | xato kodi
  const resetPassword = useCallback(async (phone, phoneToken, password) => {
    try {
      acceptSession(await server.resetPassword(phone, phoneToken, password))
      return 'ok'
    } catch (e) {
      return e.code || 'error'
    }
  }, [acceptSession])
  // Google profili bo'yicha mavjud hisobga kirish; topilmasa false (ro'yxatdan o'tish davom etadi)
  const signInGoogle = useCallback(async (profile) => {
    if (apiEnabled) {
      try {
        acceptSession(await server.google(profile.token))
        return true
      } catch (e) {
        if (e.code === 'nouser') return false
        throw e
      }
    }
    const acc = findByEmail(profile.email)
    if (!acc) return false
    finishAuth({ ...acc, photo: acc.photo || profile.photo })
    return true
  }, [acceptSession, finishAuth])

  // --- Server bilan sinxronlash (VITE_API_URL berilgan bo'lsa) ---
  const [serverJobs, setServerJobs] = useState(null) // null — yuklanmagan yoki xato: faqat o'z va bot e'lonlari ko'rsatiladi
  const [content, setContent] = useState(STATIC_CONTENT)
  useEffect(() => {
    if (!apiEnabled) return
    const ctrl = new AbortController()
    server.jobs(ctrl.signal).then((d) => { if (Array.isArray(d?.items)) setServerJobs(d.items) }).catch(() => {})
    server.content(ctrl.signal).then((d) => setContent(normalizeContent(d))).catch(() => {})
    return () => ctrl.abort()
  }, [])
  // Sessiya tiklanadi: profil, arizalar, kurslar va ish beruvchining vakansiyalari serverdagidek bo'ladi
  const userId = state.user?.id
  useEffect(() => {
    if (!apiEnabled || !getToken()) return
    const ctrl = new AbortController()
    server.me(ctrl.signal).then(async (d) => {
      if (!d?.user?.role) return
      const posted = d.user.role === 'employer' ? listOr((await server.myJobs(ctrl.signal))?.items, []) : []
      setState((s) => ({
        ...s,
        user: { ...s.user, ...d.user },
        applications: listOr(d.applications, s.applications),
        courses: listOr(d.courses, s.courses),
        invites: listOr(d.invites, s.invites),
        posted,
      }))
    }).catch((e) => {
      // token eskirgan, foydalanuvchi bloklangan yoki o'chirilgan — hisobdan chiqamiz
      if (e.status === 401) { setToken(null); setState((s) => ({ ...initial, prefs: s.prefs })) }
    })
    return () => ctrl.abort()
  }, [userId])

  // Telegram botdagi vakansiyalar (VITE_BOT_API_URL sozlangan bo'lsa)
  const [botJobs, setBotJobs] = useState([])
  useEffect(() => {
    const ctrl = new AbortController()
    fetchBotJobs(ctrl.signal).then(setBotJobs)
    return () => ctrl.abort()
  }, [])

  // jobsAll — hammasi (tafsilot, arizalar uchun); allJobs — yashirilganlarsiz (ro'yxatlar uchun)
  const jobsAll = useMemo(() => {
    const list = [...state.posted, ...botJobs, ...(serverJobs || [])]
    const seen = new Set()
    return list.filter((j) => !seen.has(j.id) && seen.add(j.id)) // o'z vakansiyasi umumiy ro'yxatda ham bor
  }, [state.posted, botJobs, serverJobs])
  const allJobs = useMemo(
    () => jobsAll.filter((j) => !state.hiddenJobs.includes(j.id) && !state.hiddenCompanies.includes(j.company)),
    [jobsAll, state.hiddenJobs, state.hiddenCompanies],
  )

  const value = { ...state, ...api, setTheme, jobsAll, allJobs, content, notify, toast, authOpen, requireAuth, closeAuth, authMode, signUp, signIn, signInGoogle, signInCode, resetPassword }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useApp = () => useContext(Ctx)
// Kontent har doim to'liq obyekt: provider yo'q/eskirgan bo'lsa ham (masalan, hot-reload'dan keyin) sahifa yiqilmaydi
export const useContent = () => useContext(Ctx)?.content || STATIC_CONTENT

export function profileCompletion(u) {
  if (!u) return 0
  const checks = [u.name, u.phone, u.city, u.headline, u.about, u.skills?.length, u.experience?.length, u.education, u.languages?.length, u.salary]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}
