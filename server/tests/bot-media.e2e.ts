// Bot kanal posti uchun rasm yuklashi: POST /api/v1/bot/media → ochiq havola (lokal PostgreSQL).
// Ishga tushirish: npm run test:e2e
import { test, after, before } from 'node:test'
import assert from 'node:assert/strict'

const KEY = 'test-bot-api-key-0123456789abcdef'
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1])
const created: string[] = []

before(() => {
  process.env.BOT_API_KEY = KEY
  process.env.PUBLIC_URL = 'https://api.example.uz'
})

after(async () => {
  const { db } = await import('../src/lib/db')
  await db.media.deleteMany({ where: { id: { in: created } } })
  await db.$disconnect()
})

const upload = async (data: Uint8Array, key = KEY) => {
  const { POST } = await import('../src/app/api/v1/bot/media/route')
  const res: Response = await POST(new Request('http://t/api/v1/bot/media', { method: 'POST', headers: { 'x-api-key': key }, body: Buffer.from(data) }), {})
  return { status: res.status, json: (await res.json()) as any }
}

test('bot rasmi: kalit bilan yuklanadi, ochiq havola orqali o\'qiladi', async () => {
  const r = await upload(JPEG)
  assert.equal(r.status, 201)
  assert.match(r.json.url, /^https:\/\/api\.example\.uz\/media\/[a-z0-9]+$/)
  const id = r.json.url.split('/').pop()
  created.push(id)

  const { GET } = await import('../src/app/media/[id]/route')
  const img: Response = await GET(new Request(`http://t/media/${id}`), { params: Promise.resolve({ id }) })
  assert.equal(img.status, 200)
  assert.equal(img.headers.get('content-type'), 'image/jpeg')
  assert.deepEqual(new Uint8Array(await img.arrayBuffer()), JPEG)
})

test("bot rasmi: kalitsiz va rasm bo'lmagan fayl rad etiladi", async () => {
  assert.equal((await upload(JPEG, 'wrong-key-wrong-key-wrong-key-00')).status, 401)
  const html = await upload(new TextEncoder().encode('<html><script>alert(1)</script></html>'))
  assert.equal(html.status, 400)
  assert.equal(html.json.error.code, 'bad_image')
})
