# Web ilova (Vite) → statik fayllar → Caddy. Kontekst: loyiha ildizi (deploy/docker-compose.yml)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_BOT_API_URL
ARG WEB_DOMAIN
ARG VITE_SITE_URL
ARG VITE_GA_ID
RUN npm run build && node deploy/sitemap.mjs

FROM caddy:2.8-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
