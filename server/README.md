# AyolQadami Server — API + Admin panel

Next.js 15 (App Router) · Prisma 6 · PostgreSQL 16 · TypeScript

| Qism | Manzil | Vazifasi |
|---|---|---|
| REST API | `/api/v1/*` | Web ilova (Vite) uchun: kirish, vakansiyalar, arizalar, kurslar, murojaatlar |
| Admin panel | `/admin` | Moderatsiya, foydalanuvchilar, kontent, statistika, jurnal |
| Health | `/api/health` | Monitoring / load balancer tekshiruvi |

## Lokal ishga tushirish

```bash
cd server
cp .env.example .env              # JWT_SECRET va ADMIN_PASSWORD ni to'ldiring
docker compose up -d db           # PostgreSQL → 127.0.0.1:5440
npm install
npx prisma migrate deploy         # jadvallar
npm run db:seed                   # administrator + maqolalar
npm run dev                       # http://localhost:3100/admin
```

Web ilovani serverga ulash (loyiha ildizida `.env.local`):

```
VITE_API_URL=http://localhost:3100
```

`VITE_API_URL` bo'lmasa web ilova avvalgidek oflayn (localStorage) rejimida ishlaydi.

## Buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` / `build` / `start` | ishlab chiqish / production build / ishga tushirish |
| `npm run db:migrate -- --name x` | sxema o'zgargach yangi migratsiya |
| `npm run db:deploy` | production'da migratsiyalarni qo'llash |
| `npm run db:seed` | administrator va maqolalar (demo ma'lumotlar yo'q) |
| `npm run admin:create -- +998901234567 "Parol" "Ism" ADMIN` | administrator/moderator yaratish yoki parolini tiklash |
| `npm test` · `npm run typecheck` | unit testlar · tip tekshiruvi |

## API qisqacha

Avtorizatsiya: `Authorization: Bearer <token>` (token 30 kun). Xatolar: `{ "error": { "code", "message", "fields?" } }`.

| Metod | Yo'l | Kim |
|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/google` | hamma |
| GET/PATCH/DELETE | `/me` | foydalanuvchi |
| POST | `/me/password` | foydalanuvchi |
| GET | `/me/applications`, `/me/courses` | foydalanuvchi |
| GET | `/me/jobs` | ish beruvchi |
| GET | `/jobs?q&category&city&type&page&limit` · `/jobs/:id` | hamma |
| POST | `/jobs` · DELETE `/jobs/:id` | ish beruvchi |
| POST | `/jobs/:id/apply` | ish izlovchi |
| GET | `/content` (kurslar, maqolalar, tadbirlar) | hamma |
| POST | `/courses/:id/enroll` | foydalanuvchi |
| GET/POST | `/support` | foydalanuvchi |
| POST | `/invites` | ish beruvchi |

## Telegram bot va kanallar

Admin panel → **Telegram**:

| Bo'lim | Imkoniyatlar |
|---|---|
| Bot sozlamalari | Token (@BotFather), rejim: o'chiq / polling (lokal, HTTPS shart emas) / webhook (production), web ilova manzili (Mini App tugmasi), /start matni, post oxiridagi matn |
| Kanallar va postlar | Kanal/guruh qo'shish (@username, t.me havola yoki -100… ID), soha va shahar filtri, avtomatik yuborish, postlar tarixi, postni kanaldan o'chirish |
| Post yuborish | HTML matn, rasm, tugma; kanallarga va bot obunachilariga tarqatish (jonli ko'rinish bilan) |
| Vakansiya sahifasi | Tanlangan kanallarga qo'lda yuborish, qaysi kanalga chiqqani |

Avtomatik oqimlar: vakansiya tasdiqlanganda mos kanallarga chiqadi; botga yozilgan xabar «Murojaatlar»ga tushadi va
operator javobi bot orqali qaytadi; botni kanalga administrator qilib qo'shsangiz, kanal ro'yxatda o'zi paydo bo'ladi.
Bot buyruqlari: `/start`, `/jobs`, `/help`. Webhook `X-Telegram-Bot-Api-Secret-Token` bilan himoyalangan.

## Xavfsizlik

- Parollar bcrypt (12 raund); kirishda raqam bor-yo'qligi vaqt orqali oshkor bo'lmaydi
- JWT HS256, ilova va admin tokenlari alohida auditoriyada; `tokenVersion` orqali bloklash/parol almashtirishda barcha sessiyalar darhol bekor bo'ladi
- Admin sessiyasi — `httpOnly`, `SameSite=Strict`, `Secure` cookie (12 soat); server action'lar Origin tekshiruvi bilan CSRF'dan himoyalangan
- Rollar: `ADMIN` (hammasi) va `MODERATOR` (o'chirish, rollar va sozlamalarsiz)
- Rate limit: kirish, ro'yxatdan o'tish, ariza, murojaat
- Zod validatsiya, so'rov hajmi cheklovi (256 KB), CORS faqat `WEB_ORIGINS`
- CSV eksportda formula injeksiyasidan himoya; barcha admin amallari `AuditLog`da
- Xavfsizlik sarlavhalari: HSTS, X-Frame-Options, nosniff, Referrer-Policy; admin `noindex`

## Production'ga chiqarish (VPS + Docker)

```bash
cd server
cp .env.example .env    # haqiqiy qiymatlar: kuchli JWT_SECRET, POSTGRES_PASSWORD, WEB_ORIGINS=https://ayolqadami.uz
docker compose up -d --build
# boshlang'ich ma'lumotlar — bir marta, serverning o'zidan (baza 127.0.0.1:5440 da):
npm ci && npm run db:seed
```

Server konteyneri har ishga tushganda `prisma migrate deploy` bajaradi. Oldiga Nginx/Caddy (HTTPS) qo'ying va
`api.ayolqadami.uz → :3000` ga proksi qiling. Web ilova: `VITE_API_URL=https://api.ayolqadami.uz npm run build`.

Ishga tushirishdan oldingi tekshiruv ro'yxati — loyiha ildizidagi `LAUNCH.md`.
