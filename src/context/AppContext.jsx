import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { JOBS } from '../data/mock'

const KEY = 'ayolkaryera_v1'
const Ctx = createContext(null)

const initial = {
  user: null, // { role: 'seeker' | 'employer', name, phone, city, ... }
  saved: [],
  applications: [], // { jobId, date, status, letter }
  courses: [], // enrolled course ids
  posted: [], // employer's own jobs
  invites: [], // candidate ids invited by employer
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial
    const s = { ...initial, ...JSON.parse(raw) }
    // eski versiyalardan qolgan buzuq qiymatlarni tiklaymiz
    for (const k of ['saved', 'applications', 'courses', 'posted', 'invites']) if (!Array.isArray(s[k])) s[k] = []
    if (s.user && (typeof s.user !== 'object' || !s.user.role)) s.user = null
    return s
  } catch {
    return initial
  }
}

export function AppProvider({ children }) {
  const [state, setState] = useState(load)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage mavjud emas */ }
  }, [state])

  const notify = useCallback((text) => {
    setToast({ text, id: Date.now() })
    setTimeout(() => setToast(null), 2400)
  }, [])

  const api = useMemo(() => {
    const set = (fn) => setState((s) => ({ ...s, ...fn(s) }))
    return {
      register: (user) => set(() => ({ ...initial, user: { skills: [], experience: [], languages: ["O'zbek"], ...user } })),
      logout: () => setState(initial),
      updateUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),
      switchRole: () => set((s) => ({ user: { ...s.user, role: s.user.role === 'seeker' ? 'employer' : 'seeker' } })),
      toggleSave: (id) => set((s) => ({ saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })),
      apply: (jobId, letter) =>
        set((s) => ({
          applications: [{ jobId, letter, date: new Date().toISOString(), status: "Ko'rib chiqilmoqda" }, ...s.applications.filter((a) => a.jobId !== jobId)],
        })),
      enroll: (id) => set((s) => ({ courses: s.courses.includes(id) ? s.courses : [...s.courses, id] })),
      postJob: (job) => set((s) => ({ posted: [{ ...job, id: 'p' + Date.now(), posted: 'Hozirgina', applicants: 0, own: true }, ...s.posted] })),
      removeJob: (id) => set((s) => ({ posted: s.posted.filter((j) => j.id !== id) })),
      invite: (id) => set((s) => ({ invites: s.invites.includes(id) ? s.invites : [...s.invites, id] })),
    }
  }, [])

  const allJobs = useMemo(() => [...state.posted, ...JOBS], [state.posted])

  const value = { ...state, ...api, allJobs, notify, toast }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useApp = () => useContext(Ctx)

export function profileCompletion(u) {
  if (!u) return 0
  const checks = [u.name, u.phone, u.city, u.headline, u.about, u.skills?.length, u.experience?.length, u.education, u.languages?.length, u.salary]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}
