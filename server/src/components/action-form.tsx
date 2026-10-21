'use client'
import { startTransition, useActionState, type FormEvent, type ReactNode } from 'react'
import type { FormState } from '@/app/admin/(panel)/actions'

// Saqlash formalari: xato yoki muvaffaqiyat xabari forma ichida ko'rinadi.
// React 19 `<form action>` amal tugagach formani tozalaydi — xato chiqqanda kiritilgan qiymatlar yo'qolmasligi uchun
// forma onSubmit orqali yuboriladi (tozalanmaydi).
export function ActionForm({ action, children, submit = 'Saqlash', cancelHref }: {
  action: (s: FormState, f: FormData) => Promise<FormState>
  children: ReactNode
  submit?: string
  cancelHref?: string
}) {
  const [state, formAction, pending] = useActionState(action, {})
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (pending) return
    const data = new FormData(e.currentTarget)
    startTransition(() => formAction(data))
  }
  return (
    <form onSubmit={onSubmit}>
      {state.ok && <div className="ok-box" role="status">{state.ok}</div>}
      {children}
      {state.error && <div className="error-box" role="alert" style={{ marginTop: 14 }}>{state.error}</div>}
      <div className="form-actions">
        {cancelHref && <a className="btn" href={cancelHref}>Bekor qilish</a>}
        <button className="btn dark" type="submit" disabled={pending}>{pending ? 'Saqlanmoqda…' : submit}</button>
      </div>
    </form>
  )
}
