# Production deploy (bitta VPS, ~15 daqiqa)

Natija: `https://ayolqadami.uz` — sayt, `https://api.ayolqadami.uz` — API, `https://api.ayolqadami.uz/admin` — admin panel.
HTTPS sertifikatlari Caddy orqali avtomatik (Let's Encrypt).

## 1. DNS (domen registratori panelida)

| Turi | Nomi | Qiymati |
|---|---|---|
| A | `@` | VPS IP |
| A | `www` | VPS IP |
| A | `api` | VPS IP |

Tekshirish: `nslookup api.ayolqadami.uz` VPS IP'ni qaytarsin. DNS tarqalmaguncha sertifikat olinmaydi.

## 2. Server (Ubuntu 22.04/24.04)

```bash
curl -fsSL https://get.docker.com | sh
ufw allow 22,80,443/tcp && ufw allow 443/udp && ufw enable
git clone <repo> ayolqadami && cd ayolqadami
```

## 3. Sozlamalar

```bash
cp server/.env.example server/.env
#  JWT_SECRET  → openssl rand -base64 48
#  JOB_MODERATION="true"
#  TELEGRAM_LOGIN_BOT_TOKEN → kirish boti (@ayolqadami_kirish_bot) tokeni — telefonni tasdiqlash kodlari
#  DATABASE_URL / WEB_ORIGINS / GOOGLE_CLIENT_ID — deploy/.env'dan avtomatik olinadi
cp deploy/.env.example deploy/.env
#  WEB_DOMAIN, API_DOMAIN, ACME_EMAIL, POSTGRES_PASSWORD (openssl rand -base64 24), GOOGLE_CLIENT_ID
```

Google Cloud Console → OAuth Client → **Authorized JavaScript origins**: `https://ayolqadami.uz` (va `https://www.ayolqadami.uz`).

## 4. Ishga tushirish

```bash
cd deploy
docker compose up -d --build          # migratsiyalar server ishga tushganda avtomatik qo'llanadi
docker compose ps                     # hammasi "running/healthy"
curl https://api.ayolqadami.uz/api/health   # {"ok":true,"db":"up",...}
```

Birinchi administrator (bir marta; vaqtinchalik Node konteyneri ichki tarmoq orqali bazaga ulanadi):

```bash
set -a; . ./.env; set +a
docker run --rm --network deploy_default -v "$PWD/../server:/app" -w /app   -e DATABASE_URL="postgresql://ayolqadami:$POSTGRES_PASSWORD@db:5432/ayolqadami?schema=public"   node:22-alpine sh -c "apk add -q openssl && npm ci --silent && npx prisma generate >/dev/null && npx tsx scripts/create-admin.ts +998XXXXXXXXX 'KuchliParol' 'Ism' ADMIN"
```

So'ng `https://api.ayolqadami.uz/admin` → kirish → Sozlamalar'da parolni almashtiring.

## 5. Yangilash / zaxira

```bash
git pull && cd deploy && docker compose up -d --build
```

Zaxira nusxalar har kuni `deploy/backups/` ga yoziladi (14 kun). Tiklash:
`docker compose exec -T db pg_restore -U ayolqadami -d ayolqadami --clean < backups/ayolqadami-YYYY-MM-DD.dump`

## Telefonni tasdiqlash (kirish boti)

Ro'yxatdan o'tish va parolni tiklashda raqam SMS o'rniga Telegram bot orqali tasdiqlanadi:
sayt → «Telegram'da kodni olish» → bot «📱 Raqamni ulashish» so'raydi → raqam mos kelsa 6 xonali kod.
Bot polling rejimida ishlaydi (webhook/HTTPS shart emas). **Bir token bilan faqat bitta server** ishlashi kerak —
production ishga tushgach lokal dev serverda boshqa (test) bot tokenidan foydalaning.
Tasdiqlashni vaqtincha o'chirish: admin panel → Sozlamalar.

## Xavfsizlik bo'yicha eslatmalar

- Tashqariga faqat 80/443 ochiq; PostgreSQL va Next.js faqat ichki Docker tarmog'ida.
- Saytda qat'iy Content-Security-Policy; Telegram Mini App uchun `frame-ancestors` telegram.org'ga ruxsat beradi.
- `server/.env` va `deploy/.env` gitga tushmaydi — hech qachon commit qilmang.
