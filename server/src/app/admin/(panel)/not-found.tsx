import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="card" style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center', padding: 28 }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>Sahifa topilmadi</h2>
      <p style={{ color: 'var(--muted)', margin: '0 0 18px' }}>Yozuv o&apos;chirilgan yoki manzil noto&apos;g&apos;ri.</p>
      <Link className="btn dark" href="/admin">Bosh sahifaga</Link>
    </div>
  )
}
