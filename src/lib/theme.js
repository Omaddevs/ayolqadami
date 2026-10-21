// Mavzu (yorug' / qorong'i / tizim). Tanlov prefs.theme da saqlanadi, bu yerda faqat DOM ga qo'llanadi.
// Birinchi bo'yashdan oldingi qo'llash index.html dagi kichik skriptda — sahifa "oq chaqnash"siz ochiladi.
import { useLayoutEffect } from 'react'

export const THEME_MODES = ['light', 'dark', 'system']

// Brauzer paneli (meta theme-color) va Telegram sarlavhasi uchun ranglar — global.css tokenlari bilan bir xil
const CHROME = {
  light: { meta: '#6366F6', surface: '#FFFFFF', bg: '#EEF0F6' },
  dark: { meta: '#161722', surface: '#161722', bg: '#0E0F16' },
}

const media = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null)
const telegram = () => {
  const app = typeof window !== 'undefined' ? window.Telegram?.WebApp : null
  return app && app.initData ? app : null
}

export const normalizeMode = (mode) => (THEME_MODES.includes(mode) ? mode : 'system')

// 'system' — Telegram ichida Telegram mavzusiga, aks holda qurilma sozlamasiga ergashadi
export function resolveTheme(mode) {
  const m = normalizeMode(mode)
  if (m !== 'system') return m
  const tg = telegram()
  if (tg?.colorScheme) return tg.colorScheme === 'dark' ? 'dark' : 'light'
  return media()?.matches ? 'dark' : 'light'
}

export function applyTheme(resolved) {
  const root = document.documentElement
  const c = CHROME[resolved] || CHROME.light
  root.dataset.theme = resolved
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c.meta)
  const tg = telegram()
  if (tg?.isVersionAtLeast?.('6.1')) {
    try {
      tg.setHeaderColor(c.surface)
      tg.setBackgroundColor(c.bg)
      if (tg.isVersionAtLeast('7.10')) tg.setBottomBarColor?.(c.surface)
    } catch { /* eski Telegram versiyasi */ }
  }
}

/* Mavzuni silliq almashtirish. update() — holatni sinxron yangilaydigan funksiya (flushSync bilan).
   origin — bosilgan nuqta {x, y}: yangi mavzu shu yerdan aylana bo'lib yoyiladi (View Transitions API).
   API bo'lmasa yoki "harakatni kamaytirish" yoqilgan bo'lsa — darhol, transition'larsiz almashadi. */
export function switchTheme(update, origin) {
  const root = document.documentElement
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const before = root.dataset.theme

  const run = () => {
    root.classList.add('theme-switching')
    update()
    // keyingi kadrda transition'lar qaytariladi
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')))
  }

  if (!document.startViewTransition || reduce) return run()

  const vt = document.startViewTransition(run)
  vt.ready.then(() => {
    if (root.dataset.theme === before) return // mavzu amalda o'zgarmadi (masalan, tizim bilan bir xil)
    const x = origin?.x ?? window.innerWidth / 2
    const y = origin?.y ?? 0
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 520, easing: 'cubic-bezier(.22, 1, .36, 1)', pseudoElement: '::view-transition-new(root)' },
    )
  }).catch(() => { /* transition bekor qilindi — mavzu baribir qo'llangan */ })
}

// Tugma bosilgan joy markazi (klaviatura bilan bosilganda ham ishlaydi)
export function originOf(e) {
  const el = e?.currentTarget
  if (!el?.getBoundingClientRect) return undefined
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

// Tanlangan rejimni qo'llaydi; 'system' da qurilma/Telegram mavzusi o'zgarishini kuzatadi
export function useThemeEffect(mode) {
  useLayoutEffect(() => {
    applyTheme(resolveTheme(mode))
    if (normalizeMode(mode) !== 'system') return
    const onChange = () => switchTheme(() => applyTheme(resolveTheme('system')))
    const mq = media()
    mq?.addEventListener?.('change', onChange)
    const tg = telegram()
    tg?.onEvent?.('themeChanged', onChange)
    return () => {
      mq?.removeEventListener?.('change', onChange)
      tg?.offEvent?.('themeChanged', onChange)
    }
  }, [mode])
}
