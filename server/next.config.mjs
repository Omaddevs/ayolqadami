import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
]

const nextConfig = {
  output: 'standalone',
  // loyiha ildizida web ilovaning lockfile'i ham bor — server shu papkadan kuzatilsin
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  poweredByHeader: false,
  reactStrictMode: true,
  // admin paneldan banner rasmi yuklash (3 MB gacha)
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // admin panel qidiruv tizimlarida ko'rinmasin
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ]
  },
  async redirects() {
    return [{ source: '/', destination: '/admin', permanent: false }]
  },
}

export default nextConfig
