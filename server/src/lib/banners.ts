import 'server-only'
import type { Banner } from '@prisma/client'
import { db } from './db'
import { absoluteMedia } from './media'

// Havola: sayt ichidagi yo'l (/courses) yoki tashqi https manzil. javascript:, //evil.com va h.k. — yo'q
export const isSafeLink = (v: string) => v === '' || /^\/(?!\/)[^\s]*$/.test(v) || /^https:\/\/[^\s"'<>]+$/i.test(v)
export const isSafeImage = (v: string) => /^\/(?!\/)[^\s"'<>]+$/.test(v) || /^https:\/\/[^\s"'<>]+$/i.test(v)

export function activeBanners() {
  const now = new Date()
  return db.banner.findMany({
    where: { active: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }] },
    orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    take: 10,
  })
}

export const bannerOut = (b: Banner, origin: string) => ({
  id: b.id,
  title: b.title,
  img: absoluteMedia(b.imageUrl, origin),
  to: b.linkUrl,
  external: /^https:\/\//i.test(b.linkUrl),
})
