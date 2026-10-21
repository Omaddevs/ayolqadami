import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdmin } from '@/lib/auth'
import LoginForm from './form'

export const metadata: Metadata = { title: 'Kirish' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getAdmin()) redirect('/admin')
  const { next } = await searchParams
  return (
    <main className="login">
      <div className="login-card">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <span className="brand-mark"><img src="/logo.png" alt="" /></span>
          <div>AyolQadami<small>Boshqaruv paneli</small></div>
        </div>
        <h1>Xush kelibsiz</h1>
        <p>Administrator yoki moderator hisobi bilan kiring.</p>
        <LoginForm next={next} />
      </div>
    </main>
  )
}
