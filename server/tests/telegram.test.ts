// Telegram modulining bazasiz unit testlari
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_CHANNEL_BUTTONS, esc, jobKeyboard, jobPostHtml, parseChannelButtons, sanitizeTelegramHtml } from '../src/lib/telegram/format'
import { isTokenFormat, maskToken } from '../src/lib/telegram/config'

process.env.DATABASE_URL ||= 'postgresql://x:y@127.0.0.1:1/x'

test('kanal manzilini aniqlash', async () => {
  const { parseChatRef } = await import('../src/lib/telegram/service')
  assert.equal(parseChatRef('@ayolqadami'), '@ayolqadami')
  assert.equal(parseChatRef('https://t.me/ayolqadami'), '@ayolqadami')
  assert.equal(parseChatRef('t.me/ayolqadami/'), '@ayolqadami')
  assert.equal(parseChatRef('ayolqadami'), '@ayolqadami')
  assert.equal(parseChatRef('-1001234567890'), '-1001234567890')
  assert.equal(parseChatRef('https://evil.com/x'), null)
  assert.equal(parseChatRef('@a b'), null)
})

test('HTML ekranlash va ruxsat etilgan teglar', () => {
  assert.equal(esc('<b>&'), '&lt;b&gt;&amp;')
  assert.equal(sanitizeTelegramHtml('<b>ok</b> <script>x</script>'), '<b>ok</b> &lt;script&gt;x&lt;/script&gt;')
  assert.equal(sanitizeTelegramHtml('<a href="https://a.uz">x</a>'), '<a href="https://a.uz">x</a>')
  assert.equal(sanitizeTelegramHtml('<a href="javascript:alert(1)">x</a>'), '&lt;a href="javascript:alert(1)"&gt;x</a>')
  assert.equal(sanitizeTelegramHtml('<b onclick="x">y</b>'), '<b>y</b>')
})

test('vakansiya posti: maydonlar ekranlangan, heshteglar', () => {
  const job = {
    id: 'j1', title: 'Dasturchi <React>', companyName: 'A & B', city: "Farg'ona", type: 'Gibrid', salaryFrom: 5_000_000, salaryTo: 0,
    experience: 2, tags: ['Onalar uchun qulay'], description: 'x'.repeat(500), requirements: ['React'], category: 'it',
  } as unknown as Parameters<typeof jobPostHtml>[0]
  const html = jobPostHtml(job, { jobFooter: '' })
  assert.match(html, /Dasturchi &lt;React&gt;/)
  assert.match(html, /A &amp; B/)
  assert.match(html, /5 000 000 so'mdan/)
  assert.match(html, /#IT_va_dizayn #Fargona/)
  assert.ok(html.length < 1024 + 200, 'tavsif qisqartiriladi')
})

test('kanal posti: skrinshotdagi format, telefon va qisqa havola', () => {
  const job = {
    id: 'abc', title: 'Buxgalter', companyName: 'Turkish baby', city: 'Toshkent', district: 'Usta Shirin', type: "To'liq stavka",
    salaryFrom: 0, salaryTo: 0, tags: [], category: 'finance', details: { contact: { name: 'Malika', phone: '+998 90 123 45 67', telegram: '@hr_uz' } },
  } as unknown as Parameters<typeof jobPostHtml>[0]
  const html = jobPostHtml(job, { jobFooter: '', publicUrl: 'https://api.ayolqadami.uz', webAppUrl: 'https://ayolqadami.uz' })
  assert.match(html, /^<b>Buxgalter<\/b>\n\n🏢 Kompaniya: Turkish baby\n\n📍 Hudud: Toshkent, Usta Shirin\n\n💰 Maosh: Kelishilgan/)
  assert.match(html, /☎️ Aloqa: \+998 90 123 45 67 \(Malika\)/)
  assert.match(html, /✈️ Telegram: @hr_uz/)
  assert.match(html, /📞 Batafsil: https:\/\/api\.ayolqadami\.uz\/l\/abc/)
})

test('rangli tugmalar', () => {
  const kb = jobKeyboard({ id: 'abc', number: 1001, title: 'Dasturchi', city: 'Toshkent' }, { webAppUrl: 'https://ayolqadami.uz', botUsername: 'ayolqadami_bot', channelButtons: DEFAULT_CHANNEL_BUTTONS })!
  assert.deepEqual(kb.inline_keyboard, [
    [{ text: "📢 E'lon joylash / Разместить вакансию", url: 'https://t.me/ayolqadami_bot?start=post', style: 'primary' }],
    [{ text: '💼 Website AyolQadami', url: 'https://ayolqadami.uz', style: 'success' }],
  ])
  const b = parseChannelButtons('A | https://t.me/addlist/x | qizil\nB | {job} |\n# izoh | https://x.uz | red\nC | javascript:x | green', { job: 'https://s.uz/jobs/1' })
  assert.deepEqual(b, [{ text: 'A', url: 'https://t.me/addlist/x', style: 'danger' }, { text: 'B', url: 'https://s.uz/jobs/1' }])
})

test('maoshni tushunish', async () => {
  const { parseSalary } = await import('../src/lib/telegram/post-flow')
  assert.deepEqual(parseSalary('5 000 000'), { from: 5_000_000, to: 0 })
  assert.deepEqual(parseSalary('4-6 mln'), { from: 4_000_000, to: 6_000_000 })
  assert.deepEqual(parseSalary('3000000 - 4500000'), { from: 3_000_000, to: 4_500_000 })
  assert.deepEqual(parseSalary('800 ming'), { from: 800_000, to: 0 })
  assert.deepEqual(parseSalary('Kelishilgan'), { from: 0, to: 0 })
  assert.equal(parseSalary('yaxshi'), null)
  assert.equal(parseSalary('5'), null)
})

test('token formati va niqoblash', () => {
  assert.ok(isTokenFormat('123456789:AAHfakeTokenForTestingPurposes1234567'))
  assert.ok(!isTokenFormat('123:abc'))
  assert.equal(maskToken('123456789:AAHfakeTokenForTestingPurposes1234567'), '123456789:AA…567')
})
