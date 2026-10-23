import 'server-only'
import type { Partner } from '@prisma/client'
import { db } from './db'
import { absoluteMedia } from './media'

export const activePartners = () =>
  db.partner.findMany({ where: { active: true }, orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }], take: 40 })

export const partnerOut = (p: Partner, origin: string) => ({
  id: p.id,
  name: p.name,
  img: absoluteMedia(p.imageUrl, origin),
  to: p.linkUrl,
  external: /^https:\/\//i.test(p.linkUrl),
})
