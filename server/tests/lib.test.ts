// Bazasiz unit testlar: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatUzPhone, normalizeUzPhone } from '../src/lib/phone'
import { jobInputSchema, loginSchema, registerSchema } from '../src/lib/validators'
import { salaryText, timeAgo } from '../src/lib/format'
import { signToken, verifyToken } from '../src/lib/token'
import { articleBodyToText } from '../src/lib/article'

process.env.JWT_SECRET ||= 'test-secret-test-secret-test-secret-123'

test('telefon raqami normalizatsiyasi', () => {
  assert.equal(normalizeUzPhone('+998 90 123 45 67'), '998901234567')
  assert.equal(normalizeUzPhone('90 123 45 67'), '998901234567')
  assert.equal(normalizeUzPhone('+7 900 123 45 67'), null)
  assert.equal(normalizeUzPhone('123'), null)
  assert.equal(formatUzPhone('998901234567'), '+998 90 123 45 67')
})

test("ro'yxatdan o'tish validatsiyasi", () => {
  const ok = registerSchema.parse({ role: 'seeker', name: 'Malika R', phone: '+998 90 123 45 67', password: 'secret1' })
  assert.equal(ok.phone, '998901234567')
  assert.throws(() => registerSchema.parse({ role: 'seeker', name: 'Malika', phone: '+998901234567' }), /Parol/)
  assert.throws(() => registerSchema.parse({ role: 'employer', name: 'Malika', phone: '+998901234567', password: 'secret1' }), /Kompaniya/)
  assert.throws(() => registerSchema.parse({ role: 'admin', name: 'Hacker', phone: '+998901234567', password: 'secret1' }))
  assert.throws(() => loginSchema.parse({ phone: '+998901234567', password: '' }))
})

test('vakansiya validatsiyasi: cheklovlar va qo\'shimcha maydonlar', () => {
  const j = jobInputSchema.parse({ title: 'Hamshira', category: 'med', city: 'Toshkent', salaryFrom: '5000000', workMode: ['shift'] })
  assert.equal(j.salaryFrom, 5_000_000)
  assert.deepEqual((j as Record<string, unknown>).workMode, ['shift'])
  assert.throws(() => jobInputSchema.parse({ title: 'ab', category: 'med', city: 'T' }))
  assert.throws(() => jobInputSchema.parse({ title: 'Hamshira', category: 'med', city: 'T', salaryFrom: -1 }))
})

test('formatlash', () => {
  assert.equal(salaryText(5_000_000, 7_000_000), "5 000 000 – 7 000 000 so'm")
  assert.equal(salaryText(0, 0), 'Kelishilgan holda')
  const now = Date.now()
  assert.equal(timeAgo(new Date(now - 30_000), now), 'Hozirgina')
  assert.equal(timeAgo(new Date(now - 2 * 3600_000), now), '2 soat oldin')
  assert.equal(timeAgo(new Date(now - 26 * 3600_000), now), 'Kecha')
})

test('JWT: auditoriya ajratilgan, soxtasi qabul qilinmaydi', async () => {
  const t = await signToken({ sub: 'u1', role: 'SEEKER', v: 0 }, 'app')
  assert.equal((await verifyToken(t, 'app'))?.sub, 'u1')
  assert.equal(await verifyToken(t, 'admin'), null) // ilova tokeni admin panelga yaramaydi
  assert.equal(await verifyToken(t.slice(0, -2) + 'xx', 'app'), null)
  assert.equal(await verifyToken('eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.', 'app'), null)
})

test('maqola matni ↔ bloklar', () => {
  const text = articleBodyToText([{ h: 'Sarlavha' }, { p: 'Matn' }, { list: ['a', 'b'] }])
  assert.equal(text, '## Sarlavha\n\nMatn\n\n- a\n- b')
})

test("slug va vakansiya manzili: lotin, kirill, o'zbekcha tutuq belgisi", async () => {
  const { slugify, jobPath, jobNumberFromRef } = await import('../src/lib/slug')
  assert.equal(slugify("Bosh buxgalter (1C), Farg'ona"), 'bosh-buxgalter-1c-fargona')
  assert.equal(slugify('Ингliz тили ўқитувчиси'), 'ingliz-tili-oqituvchisi')
  assert.equal(slugify("O‘qituvchi"), 'oqituvchi')
  assert.equal(jobPath({ number: 1024, title: 'Frontend dasturchi (React)', city: 'Toshkent' }), '/jobs/1024-frontend-dasturchi-react-toshkent')
  assert.equal(jobNumberFromRef('1024-frontend-dasturchi'), 1024)
  assert.equal(jobNumberFromRef('1024'), 1024)
  assert.equal(jobNumberFromRef('cmvi8a8mb000bvtxc9xfzwn25'), null)
  assert.ok(slugify('a'.repeat(200)).length <= 60)
})
