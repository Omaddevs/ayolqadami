// Build paytida dist/robots.txt yaratadi (WEB_DOMAIN kerak).
// Sitemap dinamik: sayt domenidagi /sitemap.xml Caddy orqali serverga yo'naltiriladi (faol vakansiyalar, maqolalar...).
import { readFileSync, writeFileSync } from 'node:fs'

const domain = process.env.WEB_DOMAIN
const PRIVATE = ['/profile', '/applications', '/settings', '/notifications', '/post-job', '/candidates', '/401']
const lines = ['User-agent: *', 'Allow: /', ...PRIVATE.map((p) => `Disallow: ${p}`), 'Disallow: /*?auth=']
if (domain) lines.push('', `Sitemap: https://${domain}/sitemap.xml`)
writeFileSync('dist/robots.txt', lines.join('\n') + '\n')

// Telegram/Facebook havola kartochkasi JavaScript bajarmaydi — og:image to'liq manzil bo'lishi kerak
if (domain) {
  const html = readFileSync('dist/index.html', 'utf8').replace('content="/logo.png"', `content="https://${domain}/logo.png"`)
  writeFileSync('dist/index.html', html)
}
console.log(`[robots] dist/robots.txt${domain ? ` (sitemap: https://${domain}/sitemap.xml)` : ''}`)
