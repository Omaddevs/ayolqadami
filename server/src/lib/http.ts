import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message || code)
  }
}

export const json = (data: unknown, init?: number | ResponseInit) =>
  NextResponse.json(data, typeof init === 'number' ? { status: init } : init)

export const fail = (status: number, code: string, message?: string) => json({ error: { code, message: message || code } }, status)

type Handler<C> = (req: Request, ctx: C) => Promise<Response>

// Barcha API handlerlari shu o'ram orqali: xatolar yagona JSON formatda qaytadi, ichki tafsilotlar tashqariga chiqmaydi
export function api<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx)
    } catch (e) {
      if (e instanceof ApiError) return fail(e.status, e.code, e.message)
      if (e instanceof ZodError) {
        return json({ error: { code: 'validation', message: "Ma'lumotlar noto'g'ri", fields: e.flatten().fieldErrors } }, 400)
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') return fail(409, 'conflict', 'Bunday yozuv allaqachon mavjud')
        if (e.code === 'P2025') return fail(404, 'not_found', 'Topilmadi')
      }
      if (e instanceof SyntaxError) return fail(400, 'bad_json', "So'rov tanasi noto'g'ri JSON")
      console.error('[api]', req.method, new URL(req.url).pathname, e)
      return fail(500, 'internal', 'Serverda xatolik')
    }
  }
}

export async function body<T>(req: Request, schema: { parse: (v: unknown) => T }): Promise<T> {
  const len = Number(req.headers.get('content-length') || 0)
  if (len > 256 * 1024) throw new ApiError(413, 'too_large', "So'rov hajmi juda katta")
  return schema.parse(await req.json())
}

// Mijoz IP manzili. X-Forwarded-For'ning eng o'ngidagi qiymati — bizning proksi (Nginx/Caddy) qo'shgani;
// chapdagilarni mijoz o'zi yozishi mumkin, shuning uchun ularga ishonilmaydi.
export function ipFromHeaders(h: Headers): string {
  const xff = h.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map((x) => x.trim()).filter(Boolean)
    if (parts.length) return parts[parts.length - 1]
  }
  return h.get('x-real-ip') || 'unknown'
}
export const clientIp = (req: Request) => ipFromHeaders(req.headers)

export function pageParams(url: URL, defLimit = 20, maxLimit = 100) {
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const limit = Math.min(maxLimit, Math.max(1, Number(url.searchParams.get('limit')) || defLimit))
  return { page, limit, skip: (page - 1) * limit }
}
