import Link from 'next/link'
import { Tabs } from '@/components/ui'
import type { TelegramPostStatus } from '@prisma/client'

export function TgTabs({ active }: { active: 'overview' | 'post' | 'buttons' | 'settings' }) {
  return (
    <Tabs
      active={active}
      items={[
        { key: 'overview', label: 'Kanallar va postlar', href: '/admin/telegram' },
        { key: 'post', label: 'Post yuborish', href: '/admin/telegram/post' },
        { key: 'buttons', label: 'Kanal tugmalari', href: '/admin/telegram/buttons' },
        { key: 'settings', label: 'Bot sozlamalari', href: '/admin/telegram/settings' },
      ]}
    />
  )
}

export const POST_STATUS: Record<TelegramPostStatus, { label: string; tone: 'green' | 'red' | 'gray' }> = {
  SENT: { label: 'Yuborilgan', tone: 'green' },
  FAILED: { label: 'Xato', tone: 'red' },
  DELETED: { label: "O'chirilgan", tone: 'gray' },
}

// Kanal posti havolasi: ommaviy kanalda t.me/username/123, yopiqda t.me/c/<id>/123
export function postLink(chatId: string, username: string | null, messageId: number | null) {
  if (!messageId) return null
  if (username) return `https://t.me/${username}/${messageId}`
  const id = chatId.replace(/^-100/, '')
  return /^\d+$/.test(id) ? `https://t.me/c/${id}/${messageId}` : null
}

// HTML teglarsiz qisqa ko'rinish (jadval uchun)
export const plain = (html: string, n = 90) => {
  const s = html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

export function NotConnected() {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 28 }}>
      <b style={{ fontSize: 15 }}>Bot ulanmagan</b>
      <p style={{ color: 'var(--muted)', margin: '6px 0 14px' }}>@BotFather&apos;dan bot yarating va tokenini kiriting.</p>
      <Link className="btn dark" href="/admin/telegram/settings">Botni ulash</Link>
    </div>
  )
}
