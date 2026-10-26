// Telegram Mini App integratsiyasi. Oddiy brauzerda (Telegram tashqarisida) hech narsa qilmaydi.
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const tg = () => {
  const app = typeof window !== 'undefined' ? window.Telegram?.WebApp : null
  return app && app.initData ? app : null // initData bo'sh — demak Telegram ichida emasmiz
}

export const inTelegram = () => Boolean(tg())

export function initTelegram() {
  const app = tg()
  if (!app) return
  try {
    app.ready()
    app.expand() // mini app to'liq ekranda ochilsin
    // iOS'da pastga surilganda ilova yopilib ketmasin (Bot API 7.7+)
    if (app.isVersionAtLeast?.('7.7')) app.disableVerticalSwipes?.()
  } catch { /* eski Telegram versiyasi */ }
}

// Ichki sahifalarda Telegram'ning "Orqaga" tugmasi ilova ichida orqaga qaytaradi
export function useTelegramBackButton() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const app = tg()
    if (!app?.BackButton || !app.isVersionAtLeast?.('6.1')) return
    const back = () => navigate(-1)
    if (pathname === '/' || pathname === '/dashboard') app.BackButton.hide() // ikkalasi ham bosh sahifa (mehmon / kirgan)
    else app.BackButton.show()
    app.BackButton.onClick(back)
    return () => app.BackButton.offClick(back)
  }, [pathname, navigate])
}
