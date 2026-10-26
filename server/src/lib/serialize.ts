import type { Application, Article, Course, Event, Job, User } from '@prisma/client'
import { formatUzPhone } from './phone'
import { timeAgo } from './format'
import { jobPath } from './slug'

type JobWithCount = Job & { _count?: { applications: number } }
const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})

// Web ilova kutgan vakansiya shakli (src/data/mock.js bilan bir xil)
export function jobOut(j: JobWithCount) {
  const { applicantsBase, ...details } = obj(j.details)
  return {
    ...details,
    id: j.id,
    number: j.number,
    path: jobPath(j),
    title: j.title,
    company: j.companyName,
    color: j.color,
    category: j.category,
    subcategory: j.subcategory ?? undefined,
    city: j.city,
    region: j.region ?? undefined,
    district: j.district ?? undefined,
    salaryFrom: j.salaryFrom,
    salaryTo: j.salaryTo,
    type: j.type,
    experience: j.experience,
    tags: j.tags,
    skills: j.skills,
    description: j.description,
    requirements: j.requirements,
    conditions: j.conditions,
    posted: timeAgo(j.publishedAt || j.createdAt),
    publishedAt: (j.publishedAt || j.createdAt).toISOString(),
    expires: j.expiresAt?.toISOString(),
    // seed vakansiyalarda dastlabki ko'rsatkich details.applicantsBase'da saqlanadi
    applicants: (Number(applicantsBase) || 0) + (j._count?.applications ?? 0),
    views: j.views,
    likes: j.likes,
    calls: j.calls,
    writes: j.writes,
    status: j.status,
    rejectReason: j.rejectReason ?? undefined,
  }
}

const ROLE_OUT = { SEEKER: 'seeker', EMPLOYER: 'employer', MODERATOR: 'seeker', ADMIN: 'seeker' } as const

// Web ilovadagi user obyekti: asosiy maydonlar + profile (rezyume) ichidagilar
export function userOut(u: User) {
  return {
    ...obj(u.profile),
    id: u.id,
    role: ROLE_OUT[u.role],
    name: u.name,
    phone: formatUzPhone(u.phone),
    email: u.email || '',
    city: u.city || '',
    region: u.region || undefined,
    company: u.company || '',
    categories: u.categories,
    category: u.categories[0],
    ...(u.role === 'EMPLOYER' && { industry: u.categories[0] }),
    photo: u.photo || '',
    google: Boolean(u.googleSub),
    createdAt: u.createdAt.toISOString(),
  }
}

export const APP_STATUS_UZ: Record<string, string> = {
  NEW: 'Yangi',
  REVIEWING: "Ko'rib chiqilmoqda",
  INTERVIEW: 'Suhbatga taklif',
  OFFER: 'Taklif yuborildi',
  HIRED: 'Ishga qabul qilindi',
  REJECTED: 'Rad etildi',
}

export const appOut = (a: Application) => ({
  id: a.id,
  jobId: a.jobId,
  letter: a.letter,
  date: a.createdAt.toISOString(),
  // web ilovada yangi ariza ham "Ko'rib chiqilmoqda" deb ko'rinadi
  status: a.status === 'NEW' ? APP_STATUS_UZ.REVIEWING : APP_STATUS_UZ[a.status],
  state: a.status,
})

export const courseOut = (c: Course) => ({
  id: c.id, title: c.title, provider: c.provider, category: c.category, icon: c.icon, price: c.price, duration: c.duration,
  lessons: c.lessons, level: c.level, rating: c.rating, students: c.students, certificate: c.certificate, format: c.format,
  description: c.description, modules: c.modules,
})

export const articleOut = (a: Article) => ({
  id: a.id, tag: a.tag, icon: a.icon, cover: a.cover, img: a.img || undefined, date: a.dateLabel, read: a.readMinutes,
  title: a.title, excerpt: a.excerpt, body: a.body,
})

export const eventOut = (e: Event) => ({
  id: e.id, title: e.title, date: e.dateLabel, place: e.place, tag: e.tag, cover: e.cover, img: e.img || '', desc: e.description,
})
