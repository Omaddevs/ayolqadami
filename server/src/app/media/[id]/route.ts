import { db } from '@/lib/db'

// Admin yuklagan rasmlar. ID o'zgarmas — abadiy keshlanadi
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[a-z0-9]{10,40}$/.test(id)) return new Response('Not found', { status: 404 })
  const m = await db.media.findUnique({ where: { id } })
  if (!m) return new Response('Not found', { status: 404 })
  return new Response(new Uint8Array(m.data), {
    headers: {
      'Content-Type': m.mime,
      'Content-Length': String(m.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      // sayt boshqa domenda — rasm u yerda ko'rinishi uchun
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  })
}
