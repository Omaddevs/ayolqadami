// Telefonni kirish boti orqali tasdiqlash — to'liq oqim (lokal PostgreSQL + soxta Telegram API).
// Ishga tushirish: npm run test:e2e   (server/.env dagi DATABASE_URL va JWT_SECRET ishlatiladi)
import { test, after, before } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'

type Sent = { method: string; body: Record<string, any> }
const sent: Sent[] = []
let fake: Server

before(async () => {
  fake = createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      const method = req.url!.split('/').pop()!
      const body = raw ? JSON.parse(raw) : {}
      sent.push({ method, body })
      const result = method === 'getMe' ? { id: 1, is_bot: true, first_name: 'Test', username: 'test_login_bot' } : method === 'sendMessage' ? { message_id: 1 } : true
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: true, result }))
    })
  })
  await new Promise<void>((r) => fake.listen(0, '127.0.0.1', r))
  process.env.TELEGRAM_API_BASE = `http://127.0.0.1:${(fake.address() as { port: number }).port}`
  process.env.TELEGRAM_LOGIN_BOT_TOKEN = '123456:fake-token-for-tests-only-xxxxxxxxxxxx'
})

const PHONE = '9989' + String(Date.now()).slice(-8) // 998 9X XXX XX XX — har ishga tushirishda yangi
const DISPLAY = `+${PHONE}`
const ME = 700000000 + Math.floor(Math.random() * 1e6)
const OTHER = ME + 1

const post = async (mod: string, data: unknown) => {
  const { POST } = await import(mod)
  const res: Response = await POST(new Request('http://t/api', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) }), {})
  return { status: res.status, json: (await res.json()) as any }
}
const msg = (from: number, extra: Record<string, unknown>) => ({
  update_id: 1, message: { message_id: 1, date: 0, from: { id: from, is_bot: false, first_name: 'Test' }, chat: { id: from, type: 'private' }, ...extra },
})
const lastText = () => [...sent].reverse().find((s) => s.method === 'sendMessage')?.body as { text: string; reply_markup?: any }
const codeFrom = (text: string) => /<code>(\d{6})<\/code>/.exec(text)?.[1]

after(async () => {
  const { db } = await import('../src/lib/db')
  await db.user.deleteMany({ where: { phone: PHONE } })
  await db.phoneVerification.deleteMany({ where: { phone: PHONE } })
  await db.telegramPhone.deleteMany({ where: { telegramId: { in: [String(ME), String(OTHER)] } } })
  await db.$disconnect()
  fake.close()
})

const regBody = { role: 'seeker', name: 'Test Foydalanuvchi', phone: DISPLAY, password: 'secret12', acceptTerms: true, categories: ['it'] }

test("ro'yxatdan o'tish: tasdiqlashsiz va rozilikisiz rad etiladi", async () => {
  const noTerms = await post('../src/app/api/v1/auth/register/route', { ...regBody, acceptTerms: false })
  assert.equal(noTerms.json.error.code, 'terms')
  const r = await post('../src/app/api/v1/auth/register/route', regBody)
  assert.equal(r.status, 400)
  assert.equal(r.json.error.code, 'phone_unverified')
})

test("to'liq oqim: bot havolasi → kontakt → kod → ro'yxatdan o'tish → parolni tiklash", async () => {
  const { handleLoginUpdate } = await import('../src/lib/login-bot')

  const start = await post('../src/app/api/v1/auth/phone/start/route', { phone: DISPLAY, purpose: 'register' })
  assert.equal(start.status, 201)
  assert.equal(start.json.sent, false)
  const payload = /start=(v_[\w-]+)/.exec(start.json.botUrl)![1]

  // havolani ochish → kontakt so'raladi
  await handleLoginUpdate(msg(ME, { text: `/start ${payload}` }))
  assert.equal(lastText().reply_markup.keyboard[0][0].request_contact, true)

  // boshqa Telegram hisobi shu havolani ocha olmaydi
  await handleLoginUpdate(msg(OTHER, { text: `/start ${payload}` }))
  assert.match(lastText().text, /boshqa Telegram/)

  // birovning kontakti (user_id boshqa) qabul qilinmaydi
  await handleLoginUpdate(msg(ME, { contact: { phone_number: PHONE, first_name: 'X', user_id: OTHER } }))
  assert.match(lastText().text, /o'zingizning/)

  // o'z raqami, lekin saytdagiga mos emas
  await handleLoginUpdate(msg(ME, { contact: { phone_number: '+998935554433', first_name: 'T', user_id: ME } }))
  assert.match(lastText().text, /mos kelmaydi/)

  // to'g'ri raqam → kod
  await handleLoginUpdate(msg(ME, { contact: { phone_number: '+' + PHONE, first_name: 'T', user_id: ME } }))
  const code = codeFrom(lastText().text)
  assert.ok(code, 'kod yuborilmadi')

  const wrong = await post('../src/app/api/v1/auth/phone/verify/route', { id: start.json.id, code: code === '000000' ? '111111' : '000000' })
  assert.equal(wrong.json.error.code, 'code_invalid')
  const ok = await post('../src/app/api/v1/auth/phone/verify/route', { id: start.json.id, code })
  assert.equal(ok.status, 200)
  const { phoneToken } = ok.json

  // reset uchun ishlatib bo'lmaydi (maqsad boshqa)
  const misuse = await post('../src/app/api/v1/auth/reset/route', { phone: DISPLAY, phoneToken, password: 'newpass12' })
  assert.equal(misuse.status, 404) // hisob hali yo'q

  const reg = await post('../src/app/api/v1/auth/register/route', { ...regBody, phoneToken })
  assert.equal(reg.status, 201, JSON.stringify(reg.json))
  assert.ok(reg.json.token)

  // tokenni qayta ishlatib bo'lmaydi
  const { db } = await import('../src/lib/db')
  const MOVED = '99870' + PHONE.slice(5) // har doim boshqa raqam (operator kodi 70)
  await db.user.update({ where: { phone: PHONE }, data: { phone: MOVED } })
  const again = await post('../src/app/api/v1/auth/register/route', { ...regBody, phoneToken })
  assert.equal(again.json.error.code, 'phone_unverified')
  await db.user.update({ where: { phone: MOVED }, data: { phone: PHONE } })

  // parolni tiklash: raqam endi botga ulangan — kod darhol shu chatga keladi
  const before = sent.length
  const rs = await post('../src/app/api/v1/auth/phone/start/route', { phone: DISPLAY, purpose: 'reset' })
  assert.equal(rs.json.sent, true)
  const resetCode = codeFrom(sent.slice(before).find((s) => s.method === 'sendMessage')!.body.text)!
  assert.equal(sent.slice(before).find((s) => s.method === 'sendMessage')!.body.chat_id, String(ME))
  // «Saytga o'tish» tugmasi parolni tiklash bo'limini ochadi
  const siteBtn = sent.slice(before).find((s) => s.method === 'sendMessage')!.body.reply_markup.inline_keyboard.flat().find((b: any) => b.url)
  if (siteBtn) assert.match(siteBtn.url, /\/\?auth=reset$/)
  const v2 = await post('../src/app/api/v1/auth/phone/verify/route', { id: rs.json.id, code: resetCode })
  const reset = await post('../src/app/api/v1/auth/reset/route', { phone: DISPLAY, phoneToken: v2.json.phoneToken, password: 'newpass12' })
  assert.equal(reset.status, 200)

  const login = await post('../src/app/api/v1/auth/login/route', { phone: DISPLAY, password: 'newpass12' })
  assert.equal(login.status, 200)
  const oldPw = await post('../src/app/api/v1/auth/login/route', { phone: DISPLAY, password: 'secret12' })
  assert.equal(oldPw.status, 401)
})

test('kod urinishlari 5 ta bilan cheklangan', async () => {
  const { db } = await import('../src/lib/db')
  const { createVerification, setCode } = await import('../src/lib/phone-verify')
  const v = await createVerification(PHONE, 'reset')
  const { code } = await setCode(v.id, String(ME), 'reset')
  const bad = code === '000000' ? '111111' : '000000'
  for (let i = 0; i < 5; i++) await post('../src/app/api/v1/auth/phone/verify/route', { id: v.id, code: bad })
  const r = await post('../src/app/api/v1/auth/phone/verify/route', { id: v.id, code })
  assert.equal(r.json.error.code, 'code_attempts')
  await db.phoneVerification.delete({ where: { id: v.id } })
})

const cb = (from: number, data: string, messageId = 5) => ({
  update_id: 2, callback_query: { id: 'q', from: { id: from, is_bot: false, first_name: 'Test' }, data, message: { message_id: messageId, date: 0, chat: { id: from, type: 'private' }, text: 'x' } },
})
const sentSince = (n: number, method = 'sendMessage') => sent.slice(n).filter((s) => s.method === method)

test("bot menyusi: kirish kodi → saytda kod bilan kirish → xabar → «Bu men emasman»", async () => {
  const { handleLoginUpdate } = await import('../src/lib/login-bot')
  const { db } = await import('../src/lib/db')

  // menyu tugmasi «🔑 Kirish kodi» — raqam ulangan (oldingi test), hisob bor
  let n = sent.length
  await handleLoginUpdate(msg(ME, { text: '🔑 Kirish kodi' }))
  const codeMsg = sentSince(n)[0].body
  const code = codeFrom(codeMsg.text)!
  assert.ok(code)
  assert.match(codeMsg.text, /Kirish kodi/)
  assert.match(codeMsg.text, /5 daqiqa/)
  const kb = codeMsg.reply_markup.inline_keyboard
  assert.equal(kb[0][0].copy_text.text, code) // 📋 Nusxalash
  assert.match(kb[0][1].callback_data, /^lc:new:/) // 🔄 Yangi kod

  // saytda shu raqam bilan «kod bilan kirish» — yangi kod yuborilmaydi, botdagisi ishlaydi
  n = sent.length
  const start = await post('../src/app/api/v1/auth/phone/start/route', { phone: DISPLAY, purpose: 'login' })
  assert.equal(start.json.sent, true)
  assert.equal(sentSince(n).length, 0)

  // 🔄 Yangi kod: eski kod bekor bo'ladi
  n = sent.length
  await handleLoginUpdate(cb(ME, kb[0][1].callback_data))
  assert.equal(sentSince(n, 'editMessageText').length, 1)
  const code2 = codeFrom(sentSince(n)[0].body.text)!
  if (code2 !== code) {
    const old = await post('../src/app/api/v1/auth/phone/verify/route', { id: start.json.id, code })
    assert.equal(old.json.error.code, 'code_invalid')
  }
  const ok = await post('../src/app/api/v1/auth/phone/verify/route', { id: start.json.id, code: code2 })
  assert.equal(ok.status, 200)

  n = sent.length
  const login = await post('../src/app/api/v1/auth/phone/login/route', { phone: DISPLAY, phoneToken: ok.json.phoneToken })
  assert.equal(login.status, 200)
  assert.ok(login.json.token)
  const again = await post('../src/app/api/v1/auth/phone/login/route', { phone: DISPLAY, phoneToken: ok.json.phoneToken })
  assert.equal(again.json.error.code, 'phone_unverified')

  // kirish haqida xabar (fonda yuboriladi)
  await new Promise((r) => setTimeout(r, 300))
  const alert = sentSince(n).find((s) => /Hisobingizga kirildi/.test(s.body.text))
  assert.ok(alert, 'kirish xabari kelmadi')
  assert.equal(alert!.body.reply_markup.inline_keyboard[0][0].callback_data, 'lg:revoke')

  const before = (await db.user.findUnique({ where: { phone: PHONE } }))!.tokenVersion
  await handleLoginUpdate(cb(OTHER, 'lg:revoke')) // boshqa Telegram — ta'sir qilmaydi
  assert.equal((await db.user.findUnique({ where: { phone: PHONE } }))!.tokenVersion, before)
  await handleLoginUpdate(cb(ME, 'lg:revoke'))
  assert.equal((await db.user.findUnique({ where: { phone: PHONE } }))!.tokenVersion, before + 1)
})

test('bot menyusi: profil, sozlamalar (til, xabarlar), yordam', async () => {
  const { handleLoginUpdate } = await import('../src/lib/login-bot')
  const { db } = await import('../src/lib/db')
  let n = sent.length
  await handleLoginUpdate(msg(ME, { text: '👤 Profil' }))
  assert.match(sentSince(n)[0].body.text, /Test Foydalanuvchi/)
  assert.match(sentSince(n)[0].body.text, /Raqam tasdiqlangan/)

  await handleLoginUpdate(cb(ME, 'st:notify'))
  assert.equal((await db.telegramPhone.findUnique({ where: { telegramId: String(ME) } }))!.notifyLogin, false)
  n = sent.length
  await handleLoginUpdate(cb(ME, 'st:lang'))
  assert.equal((await db.telegramPhone.findUnique({ where: { telegramId: String(ME) } }))!.lang, 'ru')
  assert.match(sentSince(n, 'editMessageText')[0].body.text, /Настройки/)
  assert.equal(sentSince(n)[0].body.reply_markup.keyboard[0][0].text, '🔑 Код для входа')

  // ruscha menyu tugmasi ham ishlaydi
  n = sent.length
  await handleLoginUpdate(msg(ME, { text: '🆘 Помощь' }))
  assert.match(sentSince(n)[0].body.text, /Помощь/)

  // ulanmagan Telegram — avval raqam so'raladi
  n = sent.length
  await handleLoginUpdate(msg(OTHER, { text: '🔑 Kirish kodi' }))
  assert.equal(sentSince(n)[0].body.reply_markup.keyboard[0][0].request_contact, true)
})

test('kod bilan kirish: raqam botga ulanmagan foydalanuvchi — havola → kontakt → kod → kirish', async () => {
  const { handleLoginUpdate } = await import('../src/lib/login-bot')
  const { db } = await import('../src/lib/db')
  const phone2 = '99891' + String(Date.now()).slice(-7)
  const NEW_TG = ME + 7
  await db.user.create({ data: { phone: phone2, name: 'Ulanmagan', role: 'SEEKER' } })
  try {
    const start = await post('../src/app/api/v1/auth/phone/start/route', { phone: '+' + phone2, purpose: 'login' })
    assert.equal(start.status, 201)
    assert.equal(start.json.sent, false)
    const payload = /start=(v_[\w-]+)/.exec(start.json.botUrl)![1]
    await handleLoginUpdate(msg(NEW_TG, { text: `/start ${payload}` }))
    assert.equal(lastText().reply_markup.keyboard[0][0].request_contact, true)
    const n = sent.length
    await handleLoginUpdate(msg(NEW_TG, { contact: { phone_number: '+' + phone2, first_name: 'U', user_id: NEW_TG } }))
    const code = sentSince(n).map((s) => codeFrom(s.body.text)).find(Boolean)
    assert.ok(code, 'kontakt ulashilgach kirish kodi kelmadi')
    const v = await post('../src/app/api/v1/auth/phone/verify/route', { id: start.json.id, code })
    const login = await post('../src/app/api/v1/auth/phone/login/route', { phone: '+' + phone2, phoneToken: v.json.phoneToken })
    assert.equal(login.status, 200)
  } finally {
    await db.phoneVerification.deleteMany({ where: { phone: phone2 } })
    await db.telegramPhone.deleteMany({ where: { telegramId: String(NEW_TG) } })
    await db.user.deleteMany({ where: { phone: phone2 } })
  }
})
