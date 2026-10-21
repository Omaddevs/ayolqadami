'use client'
import { useEffect } from 'react'

export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="card" style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center', padding: 28 }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>Amalni bajarib bo&apos;lmadi</h2>
      <p style={{ color: 'var(--muted)', margin: '0 0 18px' }}>
        {/* production'da server xabari yashiriladi — faqat digest ko'rinadi */}
        {error.digest ? `Xatolik kodi: ${error.digest}` : error.message}
      </p>
      <button className="btn dark" onClick={reset}>Qayta urinish</button>
    </div>
  )
}
