'use client'
// Admin panelning interaktiv (client) komponentlari
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import type { ReactNode } from 'react'

export function NavLink({ href, exact, className, children, title }: { href: string; exact?: boolean; className: string; children: ReactNode; title?: string }) {
  const path = usePathname()
  const active = exact ? path === href : path === href || path.startsWith(href + '/')
  return (
    <Link href={href} className={`${className}${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} aria-label={title}>
      {children}
    </Link>
  )
}

// Server action yuborilayotganda tugma bloklanadi (ikki marta bosilishdan himoya)
export function Submit({ children, className = 'btn dark', confirm, name, value, title }: {
  children: ReactNode; className?: string; confirm?: string; name?: string; value?: string; title?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      name={name}
      value={value}
      title={title}
      aria-label={title}
      onClick={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault() }}
    >
      {children}
    </button>
  )
}

// Select o'zgarishi bilan forma darhol yuboriladi (masalan, ariza holati)
export function AutoSelect({ name, defaultValue, options, label }: { name: string; defaultValue: string; options: { value: string; label: string }[]; label: string }) {
  return (
    <select className="select" name={name} defaultValue={defaultValue} aria-label={label} style={{ height: 30, padding: '0 8px', fontSize: 12.5, width: 'auto' }}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
