import 'server-only'
import { headers } from 'next/headers'
import type { Prisma } from '@prisma/client'
import { db } from './db'
import { ipFromHeaders } from './http'

// Admin panelda bajarilgan har bir o'zgarish jurnalga yoziladi
export async function audit(actorId: string | null, action: string, entity: string, entityId?: string | null, meta: Prisma.InputJsonValue = {}) {
  let ip: string | null = null
  try {
    const h = await headers()
    ip = ipFromHeaders(h)
  } catch {
    /* so'rov kontekstidan tashqarida */
  }
  await db.auditLog
    .create({ data: { actorId, action, entity, entityId: entityId ?? null, meta, ip } })
    .catch((e) => console.error('[audit]', e))
}
