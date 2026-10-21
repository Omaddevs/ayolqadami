import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './admin.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'AyolQadami Admin', template: '%s · AyolQadami Admin' },
  description: 'AyolQadami platformasini boshqarish paneli',
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.png' },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#e9edf5' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
