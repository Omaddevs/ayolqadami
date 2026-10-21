// Next 16: avvalgi middleware.ts — "proxy" deb nomlanadi va Node.js runtime'da ishlaydi
import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, verifyToken } from './lib/token'

// 1) /api/v1/* — web ilova (boshqa domen) uchun CORS. Ruxsat etilgan manzillar: WEB_ORIGINS
// 2) /admin/* — admin cookie bo'lmasa kirish sahifasiga yo'naltiriladi.
//    Bu birinchi to'siq; bloklangan/eskirgan sessiyani sahifalardagi requireAdmin() baza orqali tekshiradi.

const origins = () => (process.env.WEB_ORIGINS || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean)

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !origins().includes(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/v1')) {
    const headers = corsHeaders(req.headers.get('origin'))
    if (req.method === 'OPTIONS') return new NextResponse(null, { status: 204, headers })
    const res = NextResponse.next()
    for (const [k, v] of Object.entries(headers)) res.headers.set(k, v)
    return res
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get(ADMIN_COOKIE)?.value
    const p = token ? await verifyToken(token, 'admin') : null
    if (!p || !['ADMIN', 'MODERATOR'].includes(p.role)) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname)}`
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = { matcher: ['/api/v1/:path*', '/admin/:path*'] }
