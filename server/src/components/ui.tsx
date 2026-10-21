// Admin panelning umumiy (server) komponentlari
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import type { ReactNode } from 'react'

const PALETTE = ['#2f6bff', '#e8457a', '#1f9d48', '#7c5cfa', '#f2a32b', '#14b8a6', '#ef6c35', '#0ea5e9']
export const colorFor = (s: string) => PALETTE[[...s].reduce((n, c) => n + c.charCodeAt(0), 0) % PALETTE.length]
export const initials = (s: string) =>
  s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'

export function Avatar({ name, src, size = 34 }: { name: string; src?: string | null; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (src && /^(https:|data:image\/)/.test(src)) return <img className="avatar" src={src} alt="" width={size} height={size} style={{ width: size, height: size }} />
  return <span className="avatar" style={{ background: colorFor(name), width: size, height: size }}>{initials(name)}</span>
}

export function Logo({ name, color }: { name: string; color?: string | null }) {
  return <span className="logo" style={{ background: color || colorFor(name) }}>{initials(name)}</span>
}

type Tone = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple' | 'pink'
export const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => <span className={`badge ${tone}`}>{children}</span>

export function Card({ title, icon, tone = 'blue', href, action, children, className = '' }: {
  title?: string; icon?: ReactNode; tone?: 'blue' | 'pink' | 'green' | 'yellow' | 'purple'; href?: string; action?: ReactNode; children: ReactNode; className?: string
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="card-h">
          <div className="card-t">{icon && <span className={`ic ${tone}`}>{icon}</span>}{title}</div>
          {action ?? (href && <Link className="card-more" href={href} aria-label={`${title} — batafsil`}><ChevronRight size={16} /></Link>)}
        </div>
      )}
      {children}
    </section>
  )
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="page-h">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {children && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div>}
    </div>
  )
}

// GET forma: qidiruv + qo'shimcha filtrlar. Joriy filtrlar yashirin maydonlar sifatida saqlanadi
export function SearchBox({ q, placeholder = 'Qidirish…', keep = {}, children }: { q?: string; placeholder?: string; keep?: Record<string, string | undefined>; children?: ReactNode }) {
  return (
    <form className="toolbar" role="search">
      {Object.entries(keep).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <div className="search">
        <Search size={15} />
        <input className="input" name="q" defaultValue={q} placeholder={placeholder} aria-label="Qidirish" />
      </div>
      {children}
      <button className="btn" type="submit">Qidirish</button>
    </form>
  )
}

export function Tabs({ items, active }: { items: { key: string; label: string; href: string; n?: number }[]; active: string }) {
  return (
    <nav className="tabs" aria-label="Filtr">
      {items.map((t) => (
        <Link key={t.key} href={t.href} className={t.key === active ? 'active' : ''} aria-current={t.key === active ? 'page' : undefined}>
          {t.label}{t.n !== undefined && <span className="n">{t.n}</span>}
        </Link>
      ))}
    </nav>
  )
}

export function Pager({ page, limit, total, href }: { page: number; limit: number; total: number; href: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / limit))
  const from = total ? (page - 1) * limit + 1 : 0
  return (
    <div className="pager">
      <span>{from}–{Math.min(total, page * limit)} / {total}</span>
      <div>
        {page > 1 ? <Link className="btn sm icon" href={href(page - 1)} aria-label="Oldingi"><ChevronLeft size={15} /></Link> : <span className="btn sm icon" aria-disabled><ChevronLeft size={15} /></span>}
        <span className="btn sm" aria-current="page">{page} / {pages}</span>
        {page < pages ? <Link className="btn sm icon" href={href(page + 1)} aria-label="Keyingi"><ChevronRight size={15} /></Link> : <span className="btn sm icon" aria-disabled><ChevronRight size={15} /></span>}
      </div>
    </div>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty"><b>{title}</b>{children}</div>
}

// URL query'ni yig'ish: bo'sh qiymatlar tashlab yuboriladi
export function qs(params: Record<string, string | number | undefined | null>) {
  const s = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') s.set(k, String(v))
  const str = s.toString()
  return str ? `?${str}` : ''
}

export type SearchParams = Promise<Record<string, string | string[] | undefined>>
export const sp = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || ''
export const pageOf = (v: string | string[] | undefined) => Math.max(1, Number(sp(v)) || 1)
