// Botdagi e'lon shablonlari: tekshirish, ogohlantirishlar, kanal posti, saytdagi vakansiya
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AD_TEMPLATES, adToJob, adWarnings, cleanFields, renderAdPost, templateById, templatesForBot } from '../src/lib/ad-templates'

test('har bir shablonda sarlavha, aloqa maydonlari va yagona kalitlar bor', () => {
  for (const t of AD_TEMPLATES) {
    const keys = t.fields.map((f) => f.key)
    assert.equal(new Set(keys).size, keys.length, `${t.id}: takroriy kalit`)
    assert.ok(t.fields.some((f) => f.title), `${t.id}: sarlavha maydoni yo'q`)
    // kartochka shablonlarida aloqa — bitta «Murojaat uchun» (telefon) maydoni
    assert.ok(keys.includes('phone') && (t.layout === 'card' || keys.includes('tg')), `${t.id}: aloqa maydonlari yo'q`)
    for (const f of t.fields) assert.ok(f.ask.uz && f.ask.ru, `${t.id}.${f.key}: savol matni yo'q`)
  }
  const bot = templatesForBot()
  assert.equal(bot.templates.length, AD_TEMPLATES.length)
  assert.ok(bot.categories.length > 10 && bot.cities.includes('Toshkent'))
})

test("vakansiya (WESTER School namunasi): tekshirish, post va saytdagi vakansiya", () => {
  const tpl = templateById('vacancy')!
  const { fields, errors } = cleanFields(tpl, {
    title: 'Marketolog', company: '“WESTER School” o\'quv markazi', category: 'marketing', city: 'Andijon shahri', format: 'Oflayn',
    schedule: '09:00-18:00, 6/1', salary: 'Suhbat asosida', experience: '3 yildan',
    requirements: "😊 Marketing sohasida kamida 3 yillik tajriba\n😊 Digital marketing (SMM, target)",
    conditions: '😊 Natijaga qarab bonus va premiyalar', tg: '@muhammadqodir_abdullaev',
  })
  assert.deepEqual(errors, {})
  const post = renderAdPost(tpl, fields, { link: 'https://api.ayolqadami.uz/l/1001' })
  assert.match(post, /^💼 <b>Xodim kerak: Marketolog<\/b>/)
  assert.match(post, /🏢 Kompaniya: “WESTER School” o'quv markazi/)
  assert.match(post, /📍 Manzil: Andijon shahri/)
  assert.match(post, /✅ <b>Talablar:<\/b>\n• Marketing sohasida kamida 3 yillik tajriba\n• Digital marketing/) // emoji-markerlar • ga aylanadi
  assert.match(post, /✈️ Telegram: @muhammadqodir_abdullaev/)
  assert.match(post, /🔗 Batafsil: https:\/\/api\.ayolqadami\.uz\/l\/1001/)
  assert.match(post, /#vakansiya #Marketing_va_media #Andijon/)
  const job = adToJob(tpl, fields)
  assert.equal(job.city, 'Andijon')
  assert.equal(job.category, 'marketing')
  assert.equal(job.requirements.length, 2)
  assert.equal(job.salaryFrom, 0) // "Suhbat asosida" — raqam yo'q
})

test('IT vakansiya: dollar maosh saytda raqam sifatida qo\'yilmaydi, texnologiyalar ko\'nikma bo\'ladi', () => {
  const tpl = templateById('it_vacancy')!
  const { fields, errors } = cleanFields(tpl, {
    title: 'Middle Fullstack JavaScript Developer', company: 'PROSIGHT DEV — IT Park rezidenti', tech: 'JavaScript, TypeScript, React, NestJS',
    experience: '1–3 yil', format: 'Gibrid', salary: "$1 500–2 000, qo'lga", city: 'Toshkent, Shayxontohur tumani', phone: '+998 90 123 45 67',
  })
  assert.deepEqual(errors, {})
  assert.equal(fields.phone, '+998 90 123 45 67')
  const job = adToJob(tpl, fields)
  assert.equal(job.salaryFrom, 0)
  assert.equal(job.category, 'it')
  assert.equal(job.type, 'Gibrid')
  assert.deepEqual(job.skills, ['JavaScript', 'TypeScript', 'React', 'NestJS'])
  assert.equal(job.companyName, 'PROSIGHT DEV')
  assert.equal(job.district, 'Toshkent, Shayxontohur tumani')
})

test("so'm maosh oralig'i saytda raqamga aylanadi", () => {
  const tpl = templateById('vacancy')!
  const { fields } = cleanFields(tpl, { title: 'Hamshira', company: 'Klinika', category: 'med', city: 'Toshkent', format: 'Oflayn', salary: "5 000 000 – 8 000 000 so'm", phone: '901234567' })
  const job = adToJob(tpl, fields)
  assert.equal(job.salaryFrom, 5_000_000)
  assert.equal(job.salaryTo, 8_000_000)
})

test("xizmat taklifi (enaga namunasi) va majburiy maydonlar", () => {
  const tpl = templateById('service_offer')!
  const bad = cleanFields(tpl, { service: 'Enaga', age: '12', city: 'Toshkent' })
  assert.equal(bad.errors.age, "yosh 14–80 oralig'ida")
  assert.ok(bad.errors.schedule && bad.errors.salary && bad.errors.experience)
  assert.equal(bad.errors.phone, 'telefon yoki Telegram — kamida bittasi kerak')
  const { fields, errors } = cleanFields(tpl, {
    service: 'Enaga', age: '25', city: 'Toshkent, Sergeli, Xonobod massivi', schedule: '09:00 dan 17:00 gacha, dushanba–juma',
    salary: '6 000 000 yoki kuniga 350 000', experience: "O'zimning 3 yoshli farzandim bor, mehr bilan qarayman", phone: '998947025560',
  })
  assert.deepEqual(errors, {})
  const post = renderAdPost(tpl, fields)
  assert.match(post, /^👩‍🍼 <b>Xizmat taklif qilaman: Enaga<\/b>/)
  assert.match(post, /🎂 Yosh: 25/)
  assert.match(post, /📞 Aloqa: \+998 94 702 55 60/)
  assert.doesNotMatch(post, /Batafsil/) // vakansiya emas — sayt havolasi yo'q
})

test("noto'g'ri qiymatlar: telefon, Telegram, tanlov", () => {
  const tpl = templateById('job_seek')!
  const { errors } = cleanFields(tpl, { name: 'Faxriddin', age: '18', title: 'Frontend', skills: 'React', city: 'Toshkent', phone: '12345', tg: 'bad name!' })
  assert.equal(errors.phone, "telefon raqami noto'g'ri")
  assert.equal(errors.tg, "Telegram manzil noto'g'ri")
  const v = cleanFields(templateById('vacancy')!, { title: 'X', company: 'Y', category: 'yoq', city: 'T', format: 'Kosmos', salary: '1', phone: '901234567' })
  assert.equal(v.errors.category, "ro'yxatdan tanlang")
  assert.equal(v.errors.format, "ro'yxatdan tanlang")
})

test('firibgarlik va reklama belgilari (Finerox namunasi)', () => {
  const w = adWarnings({ notes: "amaliyot qilish pullik amaliyot narxi 1 500 000 so'm (amaliyotga 1.500.000 so'm to'lov qilib ishga kiring)\n👉 @UstozShogird kanaliga ulanish" })
  assert.ok(w.some((x) => x.startsWith("Nomzoddan pul so'ralmoqda")))
  assert.ok(w.some((x) => x.startsWith('Boshqa kanal')))
  assert.deepEqual(adWarnings({ title: 'Marketolog', salary: 'Suhbat asosida' }), [])
})

test("HTML ekranlanadi — e'lon matni orqali teg kiritib bo'lmaydi", () => {
  const tpl = templateById('mentor')!
  const { fields } = cleanFields(tpl, { name: '<b>Ali</b>', title: '<script>x</script>', city: 'Toshkent', salary: 'Bepul', tg: '@ustoz_ali' })
  const post = renderAdPost(tpl, fields)
  assert.doesNotMatch(post, /<script>|<b>Ali/)
  assert.match(post, /&lt;script&gt;/)
})

test("kartochka (ISHCHI KERAK!): rol bo'yicha shablon, post ko'rinishi va saytdagi vakansiya", () => {
  const tpl = templateById('worker_need')!
  assert.deepEqual(tpl.roles, ['employer'])
  assert.deepEqual(templateById('job_wanted')!.roles, ['seeker'])
  const { fields, errors } = cleanFields(tpl, {
    title: 'Sotuvchi', company: 'Baraka', city: 'Toshkent, Chilonzor', schedule: '09:00–18:00', salary: "4 000 000 so'm",
    requirements: '20–35 yosh\nTajriba shart emas', phone: '901234567',
  })
  assert.deepEqual(errors, {})
  const post = renderAdPost(tpl, fields, { footer: 'kanal' })
  assert.ok(post.startsWith('📢 <b>ISHCHI KERAK!</b>\n\n💼 <b>Ish turi / Lavozim:</b> Sotuvchi\n🏢 <b>Ish joyi:</b> Baraka'))
  assert.match(post, /📋 <b>Talablar:<\/b>\n20–35 yosh\nTajriba shart emas/)
  assert.match(post, /📩 <b>Murojaat uchun:<\/b> \+998 90 123 45 67/)
  assert.doesNotMatch(post, /Qo'shimcha/) // to'ldirilmagan ixtiyoriy maydon chiqmaydi
  assert.equal(adToJob(tpl, fields).title, 'Sotuvchi')
  assert.ok(cleanFields(tpl, { ...fields, phone: '' }).errors.phone)
})
