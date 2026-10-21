import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { JOBS } from '../data/mock'
import { fetchBotJobs, sendJobToBot } from '../lib/botApi'

const KEY = 'ayolkaryera_v1'
// Backend yo'q: yaratilgan hisoblar telefon raqami bo'yicha brauzerda saqlanadi, "Kirish" shu yerdan tiklaydi
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
  prefs: { lang: 'uz', notif: { jobs: true, ai: true, apps: true, courses: true, events: false, email: false } },
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial
    const s = { ...initial, ...JSON.parse(raw) }
    // eski versiyalardan qolgan buzuq qiymatlarni tiklaymiz
    for (const k of ['saved', 'applications', 'courses', 'posted', 'ads', 'invites', 'savedCands', 'hiddenJobs', 'hiddenCompanies', 'support']) if (!Array.isArray(s[k])) s[k] = []
    s.prefs = { ...initial.prefs, ...s.prefs, notif: { ...initial.prefs.notif, ...s.prefs?.notif } }
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
  const pending = useRef(null)
  const userRef = useRef(state.user)
  userRef.current = state.user

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
      if (state.user?.phone) localStorage.setItem(ACC_KEY, JSON.stringify({ ...loadAccounts(), [digits(state.user.phone)]: state.user }))
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
      logout: () => setState(initial),
      updateUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),
      switchRole: () => set((s) => ({ user: { ...s.user, role: s.user.role === 'seeker' ? 'employer' : 'seeker' } })),
      toggleSave: (id) => set((s) => ({ saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })),
      apply: (jobId, letter) =>
        set((s) => ({
          applications: [{ jobId, letter, date: new Date().toISOString(), status: "Ko'rib chiqilmoqda" }, ...s.applications.filter((a) => a.jobId !== jobId)],
        })),
      enroll: (id) => set((s) => ({ courses: s.courses.includes(id) ? s.courses : [...s.courses, id] })),
      postJob: (job) => {
        sendJobToBot(job)
        set((s) => ({ posted: [{ id: 'p' + Date.now(), ...job, posted: 'Hozirgina', applicants: 0, own: true }, ...s.posted] }))
      },
      removeJob: (id) => set((s) => ({ posted: s.posted.filter((j) => j.id !== id) })),
      addAd: (ad) => set((s) => ({ ads: [{ ...ad, id: 'u' + Date.now(), posted: 'Hozirgina', own: true }, ...s.ads] })),
      removeAd: (id) => set((s) => ({ ads: s.ads.filter((a) => a.id !== id) })),
      setPrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),
      setNotif: (key, on) => set((s) => ({ prefs: { ...s.prefs, notif: { ...s.prefs.notif, [key]: on } } })),
      hideJob: (id) => set((s) => ({ hiddenJobs: s.hiddenJobs.includes(id) ? s.hiddenJobs : [...s.hiddenJobs, id] })),
      unhideJob: (id) => set((s) => ({ hiddenJobs: s.hiddenJobs.filter((x) => x !== id) })),
      hideCompany: (name) => set((s) => ({ hiddenCompanies: s.hiddenCompanies.includes(name) ? s.hiddenCompanies : [...s.hiddenCompanies, name] })),
      unhideCompany: (name) => set((s) => ({ hiddenCompanies: s.hiddenCompanies.filter((x) => x !== name) })),
      addSupport: (msg) => set((s) => ({ support: [...s.support, { id: Date.now() + Math.random(), time: new Date().toISOString(), ...msg }] })),
      clearSupport: () => set(() => ({ support: [] })),
      invite: (id) => set((s) => ({ invites: s.invites.includes(id) ? s.invites : [...s.invites, id] })),
      toggleSaveCand: (id) => set((s) => ({ savedCands: s.savedCands.includes(id) ? s.savedCands.filter((x) => x !== id) : [...s.savedCands, id] })),
    }
  }, [])

  const requireAuth = useCallback((fn) => {
    if (userRef.current) { fn?.(); return true }
    pending.current = fn || null
    setAuthOpen(true)
    return false
  }, [])
  const closeAuth = useCallback(() => { pending.current = null; setAuthOpen(false) }, [])
  const signUp = useCallback((user, password) => {
    if (password) {
      try { localStorage.setItem(PW_KEY, JSON.stringify({ ...loadPw(), [digits(user.phone)]: hashPw(digits(user.phone) + password) })) } catch { /* storage yo'q */ }
    }
    api.register(user)
    const fn = pending.current
    pending.current = null
    setAuthOpen(false)
    if (fn) setTimeout(fn, 0)
  }, [api])
  // telefon + parol bilan kirish: 'ok' | 'nouser' | 'badpass' | 'google' (parolsiz, Google orqali ochilgan hisob)
  const signIn = useCallback((phone, password) => {
    const acc = findAccount(phone)
    if (!acc) return 'nouser'
    const saved = loadPw()[digits(phone)]
    if (!saved) return acc.google ? 'google' : 'badpass'
    if (saved !== hashPw(digits(phone) + password)) return 'badpass'
    signUp(acc)
    return 'ok'
  }, [signUp])
  // Google profili bo'yicha mavjud hisobga kirish; topilmasa false (ro'yxatdan o'tish davom etadi)
  const signInGoogle = useCallback((profile) => {
    const acc = findByEmail(profile.email)
    if (!acc) return false
    signUp({ ...acc, photo: acc.photo || profile.photo })
    return true
  }, [signUp])

  // Telegram botdagi vakansiyalar (VITE_BOT_API_URL sozlangan bo'lsa)
  const [botJobs, setBotJobs] = useState([])
  useEffect(() => {
    const ctrl = new AbortController()
    fetchBotJobs(ctrl.signal).then(setBotJobs)
    return () => ctrl.abort()
  }, [])

  // jobsAll — hammasi (tafsilot, arizalar uchun); allJobs — yashirilganlarsiz (ro'yxatlar uchun)
  const jobsAll = useMemo(() => [...state.posted, ...botJobs, ...JOBS], [state.posted, botJobs])
  const allJobs = useMemo(
    () => jobsAll.filter((j) => !state.hiddenJobs.includes(j.id) && !state.hiddenCompanies.includes(j.company)),
    [jobsAll, state.hiddenJobs, state.hiddenCompanies],
  )

  const value = { ...state, ...api, jobsAll, allJobs, notify, toast, authOpen, requireAuth, closeAuth, signUp, signIn, signInGoogle }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useApp = () => useContext(Ctx)

export function profileCompletion(u) {
  if (!u) return 0
  const checks = [u.name, u.phone, u.city, u.headline, u.about, u.skills?.length, u.experience?.length, u.education, u.languages?.length, u.salary]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}
