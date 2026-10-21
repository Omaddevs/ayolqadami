// Vakansiya kartochkasi rasmi (1200×630) — Telegram/Facebook havola ko'rinishi uchun.
// Loyiha rangida: indigo gradient fon, oq logotip va matn, maosh/hudud/ish turi belgilari.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { db } from '@/lib/db'
import { salaryText } from '@/lib/format'
import { catName } from '@/lib/catalog'
import { jobNumberFromRef } from '@/lib/slug'

export const dynamic = 'force-dynamic'

// sayt bilan bir xil ranglar (src/styles: --primary #6366F6)
const C1 = '#6E6AF8'
const C2 = '#4338CA'
const INK = '#1E1B4B'

// Sayt shrifti (Inter). Bir marta yuklanib, xotirada saqlanadi; internet bo'lmasa — ichki shrift bilan chiziladi
type Font = { name: string; data: ArrayBuffer; weight: 400 | 600 | 800; style: 'normal' }
let fonts: Promise<Font[]> | null = null
async function loadInter(weight: 400 | 600 | 800): Promise<Font> {
  // brauzer bo'lmagan so'rovga Google bitta to'liq TTF (lotin + kirill) qaytaradi — satori woff2 o'qiy olmaydi
  const css = await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`, { signal: AbortSignal.timeout(5000) }).then((r) => r.text())
  const urls = [...css.matchAll(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/g)].map((m) => m[1])
  if (!urls.length) throw new Error('font url')
  const data = await fetch(urls[urls.length - 1], { signal: AbortSignal.timeout(5000) }).then((r) => r.arrayBuffer())
  return { name: 'Inter', data, weight, style: 'normal' }
}
const getFonts = () =>
  (fonts ??= Promise.all([loadInter(400), loadInter(600), loadInter(800)]).catch((e) => {
    console.error('[og] font', (e as Error).message)
    fonts = null // keyingi so'rovda qayta urinadi
    return []
  }))

// Oq logotip (server/public/logo.png) — data URL sifatida bir marta o'qiladi
let logo: Promise<string | null> | null = null
const getLogo = () =>
  (logo ??= readFile(path.join(process.cwd(), 'public', 'logo.png'))
    .then((b) => `data:image/png;base64,${b.toString('base64')}`)
    .catch(() => null))

const Chip = ({ children, strong }: { children: string; strong?: boolean }) => (
  <div style={{
    display: 'flex', alignItems: 'center', padding: '12px 26px', borderRadius: 999, fontSize: 30, fontWeight: 600,
    color: strong ? INK : '#fff', background: strong ? '#fff' : 'rgba(255,255,255,0.16)', border: strong ? 'none' : '2px solid rgba(255,255,255,0.28)',
  }}>{children}</div>
)

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const num = jobNumberFromRef(id)
  const job = await db.job.findUnique({ where: num ? { number: num } : { id } })
  if (!job) return new Response('Not found', { status: 404 })
  const place = [job.city, job.district].filter(Boolean).join(', ')
  const salary = job.salaryFrom || job.salaryTo ? salaryText(job.salaryFrom, job.salaryTo) : 'Kelishiladi'
  const title = job.title.length > 80 ? job.title.slice(0, 78).trimEnd() + '…' : job.title
  const [loaded, logoSrc] = await Promise.all([getFonts(), getLogo()])

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '56px 72px', position: 'relative',
        background: `linear-gradient(135deg, ${C1} 0%, ${C2} 100%)`, color: '#fff', fontFamily: loaded.length ? 'Inter' : 'sans-serif',
      }}>
        {/* bezak doiralar */}
        <div style={{ position: 'absolute', right: -140, top: -160, width: 520, height: 520, borderRadius: 9999, background: 'rgba(255,255,255,0.10)', display: 'flex' }} />
        <div style={{ position: 'absolute', right: 120, bottom: -220, width: 420, height: 420, borderRadius: 9999, background: 'rgba(255,255,255,0.07)', display: 'flex' }} />

        {/* yuqori qator: logotip + soha */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {logoSrc && <img src={logoSrc} width={64} height={64} alt="" />}
            <div style={{ display: 'flex', fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>AyolQadami</div>
          </div>
          <div style={{ display: 'flex', fontSize: 26, fontWeight: 600, padding: '10px 22px', borderRadius: 999, background: 'rgba(255,255,255,0.16)' }}>
            {catName(job.category)}
          </div>
        </div>

        {/* sarlavha va kompaniya */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 54 }}>
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 600, color: 'rgba(255,255,255,0.82)' }}>{job.companyName}</div>
          <div style={{ display: 'flex', fontSize: title.length > 46 ? 62 : 76, fontWeight: 800, lineHeight: 1.08, marginTop: 10, maxWidth: 1000, letterSpacing: -1.5 }}>
            {title}
          </div>
        </div>

        {/* pastki qator: maosh, hudud, ish turi */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 'auto', alignItems: 'center' }}>
          <Chip strong>{`💰 ${salary}`}</Chip>
          {place ? <Chip>{`📍 ${place}`}</Chip> : null}
          {job.type ? <Chip>{job.type}</Chip> : null}
        </div>
      </div>
    ),
    { width: 1200, height: 630, ...(loaded.length && { fonts: loaded }), headers: { 'Cache-Control': 'public, max-age=86400' } },
  )
}
