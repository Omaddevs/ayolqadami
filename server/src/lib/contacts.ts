import 'server-only'
// Vakansiya bo'yicha bog'lanishlar (qo'ng'iroq, Telegram, savol) statistikasi — admin panel uchun
import type { ContactKind, Prisma } from '@prisma/client'
import { db } from './db'

export const CONTACT_KIND: Record<ContactKind, { label: string; tone: 'green' | 'blue' | 'purple' }> = {
  CALL: { label: "Qo'ng'iroq", tone: 'green' },
  TELEGRAM: { label: 'Telegram', tone: 'blue' },
  MESSAGE: { label: 'Savol', tone: 'purple' },
}

const DAY = 86_400_000
// Toshkent vaqti bo'yicha kun kaliti (YYYY-MM-DD)
const dayKey = (d: Date) => new Date(d.getTime() + 5 * 3600_000).toISOString().slice(0, 10)

// Turlar bo'yicha jami, noyob bog'langanlar va kunlik grafik (oxirgi `days` kun)
export async function contactStats(where: Prisma.JobContactWhereInput = {}, days = 14) {
  const since = new Date(Date.now() - (days - 1) * DAY)
  since.setUTCHours(-5, 0, 0, 0) // Toshkent yarim tuni
  const [byKind, unique, recent] = await Promise.all([
    db.jobContact.groupBy({ by: ['kind'], where, _count: true }),
    db.jobContact.groupBy({ by: ['viewer'], where }).then((r) => r.length),
    db.jobContact.findMany({ where: { ...where, createdAt: { gte: since } }, select: { kind: true, createdAt: true } }),
  ])
  const n = (k: ContactKind) => byKind.find((x) => x.kind === k)?._count ?? 0
  const keys = Array.from({ length: days }, (_, i) => dayKey(new Date(since.getTime() + i * DAY + 5 * 3600_000)))
  const perDay = new Map(keys.map((k) => [k, { calls: 0, writes: 0 }]))
  for (const c of recent) {
    const d = perDay.get(dayKey(c.createdAt))
    if (d) d[c.kind === 'CALL' ? 'calls' : 'writes']++
  }
  const label = (k: string) => `${k.slice(8, 10)}.${k.slice(5, 7)}`
  return {
    calls: n('CALL'),
    telegram: n('TELEGRAM'),
    messages: n('MESSAGE'),
    total: n('CALL') + n('TELEGRAM') + n('MESSAGE'),
    unique,
    week: recent.filter((c) => c.createdAt.getTime() > Date.now() - 7 * DAY).length,
    chart: keys.map((k) => ({ label: label(k), value: perDay.get(k)!.calls + perDay.get(k)!.writes })),
  }
}

// Ko'rishdan bog'lanishga o'tish foizi
export const conversion = (contacts: number, views: number) => (views ? Math.round((contacts / views) * 1000) / 10 : 0)
