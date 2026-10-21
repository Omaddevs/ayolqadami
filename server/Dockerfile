# --- deps ---
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# --- build ---
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npx next build

# --- run ---
FROM node:22-alpine AS run
WORKDIR /app
# Prisma CLI global o'rnatiladi: standalone build'da uning bog'liqliklari yo'q, migratsiya uchun kerak
RUN apk add --no-cache openssl && addgroup -S app && adduser -S app -G app \
  && npm install -g prisma@6.19.3 && npm cache clean --force
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
USER app
EXPOSE 3000
# Migratsiyalar har ishga tushganda qo'llanadi (idempotent)
CMD ["sh", "-c", "prisma migrate deploy && node server.js"]
