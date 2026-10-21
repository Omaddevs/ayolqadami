import 'server-only'
import { db } from './db'

export type AppSettings = {
  jobModeration: boolean // ish beruvchi vakansiyasi avval moderatsiyadan o'tadi
  registrationOpen: boolean
  phoneVerification: boolean // ro'yxatdan o'tishda raqam kirish boti orqali tasdiqlanadi
  supportGreeting: string
  goals: { users: number; jobs: number; hires: number } // dashboard'dagi "Maqsadlar"
}

const DEFAULTS: AppSettings = {
  jobModeration: process.env.JOB_MODERATION !== 'false',
  registrationOpen: true,
  phoneVerification: process.env.PHONE_VERIFICATION !== 'false',
  supportGreeting: 'Murojaatingiz qabul qilindi. Operatorlarimiz tez orada javob berishadi.',
  goals: { users: 1000, jobs: 100, hires: 50 },
}

export async function getSettings(): Promise<AppSettings> {
  const row = await db.setting.findUnique({ where: { key: 'app' } })
  const saved = (row?.value as Partial<AppSettings>) || {}
  return { ...DEFAULTS, ...saved, goals: { ...DEFAULTS.goals, ...saved.goals } }
}

export async function saveSettings(patch: Partial<AppSettings>) {
  const next = { ...(await getSettings()), ...patch }
  await db.setting.upsert({ where: { key: 'app' }, create: { key: 'app', value: next }, update: { value: next } })
  return next
}
