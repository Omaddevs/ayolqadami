'use client'
import { startTransition, useActionState, type FormEvent } from 'react'
import { login, type LoginState } from './actions'

// React 19 `<form action>` amal tugagach formani tozalaydi — parol xato bo'lsa telefon raqami o'chib ketmasligi uchun
// forma onSubmit orqali yuboriladi (ActionForm'dagi kabi)
export default function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {})
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (pending) return
    const data = new FormData(e.currentTarget)
    startTransition(() => action(data))
  }
  return (
    <form onSubmit={onSubmit}>
      {next && <input type="hidden" name="next" value={next} />}
      <div className="field">
        <label htmlFor="phone">Telefon raqam</label>
        <input id="phone" className="input" name="phone" type="tel" inputMode="tel" autoComplete="username" placeholder="+998 90 000 00 00" required />
      </div>
      <div className="field">
        <label htmlFor="password">Parol</label>
        <input id="password" className="input" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && <div className="error-box" role="alert">{state.error}</div>}
      <button className="btn dark block" style={{ height: 42 }} disabled={pending}>{pending ? 'Tekshirilmoqda…' : 'Kirish'}</button>
    </form>
  )
}
