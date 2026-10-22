# AyolQadami — ishga tushirish (launch) hujjati

## 1. Arxitektura

```
┌──────────────────────┐   HTTPS + Bearer JWT   ┌───────────────────────────────┐
│ Web ilova (Vite/React)│ ─────────────────────▶ │ server/ (Next.js 15)          │
│ ayolqadami.uz         │      /api/v1/*         │  • REST API  /api/v1          │
│ Telegram Mini App     │                        │  • Admin panel /admin         │──▶ PostgreSQL 16
└──────────────────────┘                        │  • Prisma ORM, Zod, jose      │
                                                 └───────────────────────────────┘
```

Web ilova `VITE_API_URL` bo'lmasa oflayn demo rejimida qoladi — backend tayyor bo'lmagan muhitda ham ishlaydi.

## 2. QA tahlili — topilgan muammolar va holati

| # | Muammo | Xavf | Holat |
|---|---|---|---|
| 1 | Backend yo'q: hisoblar, parollar, arizalar faqat brauzer `localStorage`ida — boshqa qurilmadan kirib bo'lmaydi, ish beruvchi arizalarni ko'rmaydi | Kritik | ✅ Hal qilindi — `server/` |
| 2 | Parol brauzerda kriptografik bo'lmagan xesh bilan saqlanadi; istalgan kishi DevTools orqali "hisob yaratishi" mumkin | Kritik | ✅ Serverda bcrypt; oflayn rejim faqat demo |
| 3 | Google kirish: email mijoz tomonda olinadi, server tekshiruvi yo'q (soxtalashtirish mumkin) | Yuqori | ✅ Server Google tokenini o'zi tekshiradi |
| 4 | Vakansiyalar moderatsiyasiz to'g'ridan-to'g'ri chiqadi (firibgarlik e'lonlari xavfi) | Yuqori | ✅ Moderatsiya navbati + rad etish sababi |
| 5 | Kurs, maqola, tadbirlar kodga yozilgan — o'zgartirish uchun dasturchi kerak | O'rta | ✅ Admin paneldan boshqariladi |
| 6 | Texnik yordam chati faqat avtomatik javob; operator yo'q | O'rta | ✅ Murojaatlar admin panelga tushadi, operator javobi chatda chiqadi |
| 7 | JS bandl bitta faylda 1.16 MB (gzip 338 KB) | O'rta | ✅ Sahifalar bo'yicha bo'lindi: 754 KB (gzip 236 KB) |
| 8 | `public/hero/` — 12 ta 1–2.7 MB PNG (~20 MB), ilovada ishlatilmaydi, lekin `dist`ga ko'chadi | O'rta | ✅ `design/hero/` ga ko'chirildi (dist 26 MB kichraydi) |
| 9 | Bosh bandl hali ham 754 KB — `@phosphor-icons` va `react-icons` ikkalasi | Past | ⚠️ Tavsiya: bitta ikonka kutubxonasiga o'tish |
| 10 | Nomzodlar bazasi (`CANDIDATES`) demo ma'lumot | O'rta | ⚠️ Keyingi bosqich: ish izlovchi rezyumelari asosida `/api/v1/candidates` (rozilik bilan) |
| 11 | Telefon raqami tasdiqlanmaydi — birov boshqa odamning raqami bilan ro'yxatdan o'tishi mumkin | Yuqori | ✅ Telegram kirish boti (@ayolqadami_kirish_bot): kontakt ulashish + 6 xonali kod; parolni tiklash ham shu orqali |
| 12 | `robots.txt`, `sitemap.xml`, Open Graph meta yo'q | Past | ✅ Qo'shildi (sitemap build paytida `WEB_DOMAIN` bilan) |
| 14 | Google access token auditoriyasi (`aud`) tekshirilmagan — boshqa saytga berilgan token bilan shu odam nomidan kirish mumkin edi | Yuqori | ✅ `tokeninfo` orqali `GOOGLE_CLIENT_ID` bilan solishtiriladi; `email_verified` qat'iy |
| 15 | Profil rasmi sifatida istalgan URL (`javascript:`, `data:text/html`, SVG) saqlanardi | O'rta | ✅ Faqat `https://` yoki `data:image/png|jpeg|webp` |
| 16 | `server/docker-compose.yml` serverni barcha interfeyslarda (0.0.0.0) ochardi — proksini chetlab XFF soxtalashtirish va HTTPS'siz kirish | O'rta | ✅ `127.0.0.1` ga bog'landi; production'da `deploy/` (faqat 80/443 ochiq) |
| 17 | Web saytda xavfsizlik sarlavhalari/CSP yo'q, SPA hosting konfiguratsiyasi yo'q | O'rta | ✅ `deploy/Caddyfile`: CSP, HSTS, kesh, SPA fallback; inline skript `theme-init.js` ga chiqarildi |
| 18 | `react-router` (high: open redirect / DoS) | Yuqori | ✅ `npm audit fix` (qolgan moderate — faqat SSR va foydalanuvchi bergan yo'lga navigate; ilovada yo'q) |
| 19 | `next` ichidagi `postcss` zaifliklari | Past | ✅ Next 16.4.2 + React 19.2.9 ga o'tildi (`middleware.ts` → `proxy.ts`) |
| 20 | Maxfiylik siyosati, foydalanish shartlari va rozilik yo'q; hisobni o'chirish tugmasi yo'q | Yuqori | ✅ `/privacy`, `/terms`, ro'yxatdan o'tishda majburiy rozilik (`termsAcceptedAt`), Sozlamalar → «Hisobni o'chirish» |
| 21 | `prisma` CLI ichidagi `deepmerge-ts` (faqat migratsiya paytida, runtime'da yo'q) | Past | ⚠️ Prisma 7 ga o'tganda yopiladi |
| 13 | Telegram Mini App `initData` serverda tekshirilmaydi | O'rta | ⚠️ Mini App orqali avtomatik kirish kerak bo'lsa — HMAC tekshiruvi qo'shiladi |

## 3. Bajarilgan tekshiruvlar

- API: ro'yxatdan o'tish, takroriy raqam (409), validatsiya (400), kirish/xato parol, rol cheklovi (403), soxta JWT (401), moderatsiyadagi vakansiyaga ariza (404), CORS ruxsat/rad
- Admin: kirish, vakansiyani tasdiqlash → saytda chiqishi, foydalanuvchini bloklash → tokeni darhol bekor bo'lishi, amallar jurnali
- Brauzer E2E: web ilova serverdagi vakansiya va kurslarni ko'rsatadi, kirish (xato va to'g'ri parol), sessiya tiklanishi
- `npm test` (6 unit test), `tsc --noEmit`, `next build`, `vite build` — xatosiz
- Admin panel: 1440px desktop va 390px mobil ko'rinish

## 4. Launch'dan oldin ro'yxat

> Deploy qadamlari: [`deploy/README.md`](deploy/README.md) — `cd deploy && docker compose up -d --build`

**Infratuzilma**
- [ ] VPS (2 vCPU / 4 GB yetarli) yoki boshqariladigan PostgreSQL (kunlik zaxira nusxa bilan)
- [ ] Domenlar: `ayolqadami.uz` (web), `api.ayolqadami.uz` (server + /admin)
- [ ] HTTPS (Caddy yoki Nginx + Let's Encrypt)
- [ ] PostgreSQL zaxira nusxasi: `pg_dump` har kuni, 14 kun saqlash, tiklashni bir marta sinab ko'rish

**Konfiguratsiya (`server/.env`)**
- [ ] `JWT_SECRET` — 48+ belgili tasodifiy (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`)
- [ ] `POSTGRES_PASSWORD` — kuchli parol; port tashqariga ochilmagan (compose'da faqat 127.0.0.1)
- [ ] `WEB_ORIGINS=https://ayolqadami.uz,https://www.ayolqadami.uz`
- [ ] `npm run db:seed` — administrator va maqolalar
- [ ] Administrator: `npm run admin:create -- +998XXXXXXXXX "KuchliParol" "Ism" ADMIN`, so'ng birinchi kirishda parolni almashtirish
- [ ] Web ilova: `VITE_API_URL=https://api.ayolqadami.uz`, `VITE_GOOGLE_CLIENT_ID` (Google Console'da production origin qo'shilgan)

**Telegram**
- [ ] `server/.env`: `TELEGRAM_LOGIN_BOT_TOKEN` — kirish boti. Bitta token bilan faqat **bitta** server polling qilsin (lokal `npm run dev` production bilan bir vaqtda ishlasa — 409 xato, kodlar kelmay qoladi)
- [ ] @BotFather'da production bot, admin panel → Telegram → token, rejim **Webhook**, server manzili `https://api.ayolqadami.uz`
- [ ] Web ilova manzili (`https://ayolqadami.uz`) — Mini App tugmasi va vakansiya havolalari uchun
- [ ] Botni kanal(lar)ga administrator qilib qo'shish, soha/shahar filtrlarini sozlash, test post yuborish

**Huquqiy**
- [x] Maxfiylik siyosati va foydalanish shartlari sahifalari (`src/pages/Legal.jsx`)
- [ ] `src/pages/Legal.jsx` dagi `LEGAL` — yuridik shaxs nomi, STIR, manzil, email'ni to'ldirish; matnni yuristga ko'rsatish
- [ ] Serverni **O'zbekiston hududidagi** data-markazda joylashtirish (O'RQ-547, 27¹-modda)
- [x] Ro'yxatdan o'tishda shartlarga rozilik belgisi

**Monitoring**
- [ ] `GET /api/health` — UptimeRobot yoki shunga o'xshash xizmatga ulash
- [ ] Xatolarni kuzatish (Sentry) — ixtiyoriy, lekin tavsiya etiladi

**Ishga tushirish kuni**
- [ ] `docker compose up -d --build` → `/api/health` = `{"ok":true}`
- [ ] Admin panelga kirish, test vakansiya joylash → moderatsiya → saytda ko'rinishini tekshirish
- [ ] Telefondan (Telegram Mini App ichida ham) ro'yxatdan o'tish va ariza topshirish

## 5. SEO va Google

**Nima qilingan**
- Har sahifada o'z sarlavhasi, tavsifi, canonical manzili va Open Graph teglari; shaxsiy sahifalar (`/profile`, `/settings`…) — `noindex`
- Vakansiya manzillari: `/jobs/1001-hamshira-tungi-smena-fargona` (raqam 1001 dan boshlanadi, nom — o'qish uchun). Eski havolalar va noto'g'ri nom avtomatik to'g'ri manzilga o'tadi
- Strukturali ma'lumot (JSON-LD): `Organization` + `WebSite` (Google'da sayt nomi va logotip), vakansiyalarda `JobPosting` (**Google for Jobs** — qidiruvda alohida vakansiya kartochkasi), `BreadcrumbList`, kurslarda `Course`, maqolalarda `Article`
- `/sitemap.xml` — dinamik: barcha faol vakansiyalar, kompaniyalar, maqolalar, kurslar (yangi vakansiya tasdiqlanishi bilan qo'shiladi); `/robots.txt`

**Launch'dan keyin (siz)**
1. [Google Search Console](https://search.google.com/search-console) → domenni qo'shish (DNS TXT orqali tasdiqlash)
2. Sitemaps → `https://ayolqadami.uz/sitemap.xml` yuborish
3. URL Inspection → bosh sahifa va bitta vakansiya → "Request indexing"
4. Vercel → Environment Variables: `VITE_SITE_URL` va `SITE_URL` = `https://ayolqadami.uz`, `VITE_API_URL` = API manzili → Redeploy
5. Google Analytics: analytics.google.com → yangi property → Web stream → `G-XXXXXXXXXX` ni `VITE_GA_ID` ga (VPS'da `deploy/.env` → `GA_ID`). Hodisalar: `page_view`, `sign_up`, `login`, `apply`, `banner_click`
6. [Rich Results Test](https://search.google.com/test/rich-results) — vakansiya sahifasi `JobPosting` deb tanilishini tekshirish

> Mohirdev'dagi kabi sitelinks (Kurslar, Biz haqimizda…) ni Google o'zi tanlaydi: sayt bir necha hafta indekslangach, aniq bo'limlar, sarlavhalar va sitemap bo'lsa paydo bo'ladi. Ularni qo'lda qo'shib bo'lmaydi.

## 6. Bannerlar

Admin panel → **Bannerlar** (chap menyu): rasm yuklash (PNG/JPEG/WebP, 3 MB gacha) yoki havola, bosilganda qayerga olib borishi (`/courses` yoki `https://…`), ko'rsatish davri, tartib, yoqish/o'chirish, bosishlar soni. O'zgarish saytda 1 daqiqa ichida ko'rinadi.

## 7. Botdan e'lon berish (@ayolqadam_bot → admin panel → kanallar)

**Oqim:** botda «📢 E'lon berish» → shablon (💼 Xodim kerak · 💻 IT vakansiya · 🏠 Uy xizmati kerak · 👩‍🍼 Xizmat taklif qilaman · 🙋‍♀️ Ish joyi kerak · 🎓 Shogird kerak) → savollar birma-bir → ko'rib chiqish → yuborish → **Admin panel → E'lonlar** → tekshirish/tahrirlash → kanal va guruhlarni belgilab **«Tasdiqlash va joylash»** → post loyiha rangidagi tugmalar bilan chiqadi, vakansiyalar saytda ham ochiladi, e'lon beruvchiga natija botda xabar qilinadi (rad etilsa — sababi bilan).

- Shablonlar bitta joyda: `server/src/lib/ad-templates.ts` — o'zgartirilsa bot 5 daqiqada yangilaydi
- Avtomatik ogohlantirishlar: nomzoddan pul so'rash (pullik «amaliyot»), boshqa kanal reklamasi, xorijga ishga jo'natish, voyaga yetmagan
- Bot menyusi — inline tugmalar (Telegram faqat 3 rang beradi: ko'k/yashil/qizil, matn oq; loyiha rangiga eng yaqini — ko'k). Pastki doimiy tugma faqat adminlarga: «🛠 Admin panel»

**Sozlash**
- [ ] `ayolqadam-bot/.env`: `SERVER_URL=https://api.ayolqadami.uz`, `SERVER_API_KEY` = serverdagi `BOT_API_KEY` (bo'sh bo'lsa `WEB_API_KEY` olinadi — hozir ikkalasi bir xil)
- [ ] Admin panel → Telegram → Sozlamalar: @ayolqadam_bot tokeni (kanalga shu bot yozadi; rejim **Off** qolsin — botning o'zi Python'da ishlaydi, server faqat xabar yuboradi)
- [ ] Botni kanal/guruhlarga **administrator** qilib qo'shing va ularni Admin panel → Telegram'da ro'yxatga oling; «avtomatik» belgilanganlari tasdiqlashda oldindan tanlangan bo'ladi
