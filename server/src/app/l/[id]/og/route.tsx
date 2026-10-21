// Vakansiya kartochkasi rasmi (1200×630) — Telegram havola ko'rinishi uchun
import { ImageResponse } from 'next/og'
import { db } from '@/lib/db'
import { salaryText } from '@/lib/format'

export const dynamic = 'force-dynamic'

const BRAND = '#5B57F0'

// Sayt shrifti (Inter). Bir marta yuklanib, xotirada saqlanadi; internet bo'lmasa — ichki shrift bilan chiziladi
type Font = { name: string; data: ArrayBuffer; weight: 400 | 800; style: 'normal' }
let fonts: Promise<Font[]> | null = null
async function loadInter(weight: 400 | 800): Promise<Font> {
  // brauzer bo'lmagan so'rovga Google bitta to'liq TTF (lotin + kirill) qaytaradi — satori woff2 o'qiy olmaydi
  const css = await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`, { signal: AbortSignal.timeout(5000) }).then((r) => r.text())
  const urls = [...css.matchAll(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/g)].map((m) => m[1])
  if (!urls.length) throw new Error('font url')
  const data = await fetch(urls[urls.length - 1], { signal: AbortSignal.timeout(5000) }).then((r) => r.arrayBuffer())
  return { name: 'Inter', data, weight, style: 'normal' }
}
const getFonts = () =>
  (fonts ??= Promise.all([loadInter(400), loadInter(800)]).catch((e) => {
    console.error('[og] font', (e as Error).message)
    fonts = null // keyingi so'rovda qayta urinadi
    return []
  }))

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await db.job.findUnique({ where: { id } })
  if (!job) return new Response('Not found', { status: 404 })
  const place = [job.city, job.district].filter(Boolean).join(', ')
  const salary = job.salaryFrom || job.salaryTo ? salaryText(job.salaryFrom, job.salaryTo) : 'Kelishiladi'
  const title = job.title.length > 90 ? job.title.slice(0, 88).trimEnd() + '…' : job.title
  const loaded = await getFonts()

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', padding: '64px 72px', position: 'relative', fontFamily: loaded.length ? 'Inter' : 'sans-serif' }}>
        <div style={{ position: 'absolute', right: -120, bottom: -160, width: 460, height: 460, borderRadius: 9999, background: '#E2E1FF', display: 'flex' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: BRAND, letterSpacing: -1, display: 'flex' }}>AyolQadami</div>
          <div style={{ fontSize: 28, color: '#111', maxWidth: 520, display: 'flex', textAlign: 'right' }}>{job.companyName}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 70 }}>
          <div style={{ fontSize: title.length > 50 ? 60 : 72, fontWeight: 800, color: '#111', lineHeight: 1.1, maxWidth: 980, display: 'flex' }}>{title}</div>
          <div style={{ fontSize: 30, color: '#555', marginTop: 16, display: 'flex' }}>{place}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
          <div style={{ fontSize: 28, color: '#888', display: 'flex' }}>Maosh:</div>
          <div style={{ fontSize: 56, fontWeight: 800, color: BRAND, display: 'flex' }}>{salary}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, ...(loaded.length && { fonts: loaded }), headers: { 'Cache-Control': 'public, max-age=86400' } },
  )
}
