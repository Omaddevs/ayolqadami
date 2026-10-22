'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

// Rasmni berilgan nisbatda qirqish oynasi: sudrab joylashtiriladi, slayder yoki g'ildirak bilan kattalashtiriladi.
// Natija out × (out / ratio) o'lchamli WebP (bo'lmasa JPEG) fayl sifatida qaytadi.
type Props = { src: string; name: string; ratio: number; out: number; maxBytes: number; onDone: (f: File) => void; onCancel: () => void }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export function ImageCropper({ src, name, ratio, out, maxBytes, onDone, onCancel }: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [w, setW] = useState(0)
  const [zoom, setZoom] = useState(1)
  // ko'rinadigan qism markazi — rasm o'lchamiga nisbatan (0..1), oyna o'lchami o'zgarsa ham saqlanadi
  const [c, setC] = useState({ x: 0.5, y: 0.5 })
  const [busy, setBusy] = useState(false)
  const drag = useRef<{ px: number; py: number } | null>(null)

  useEffect(() => {
    const i = new Image()
    i.onload = () => setImg(i)
    i.src = src
  }, [src])

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const h = w / ratio
  const nw = img?.naturalWidth || 1
  const nh = img?.naturalHeight || 1
  const k = Math.max(w / nw, h / nh) * zoom // ekrandagi 1 piksel rasm = k
  // markaz chegarada qoladi — qirqim hech qachon rasmdan tashqariga chiqmaydi
  const fit = useCallback((p: { x: number; y: number }) => {
    const hx = w / (2 * nw * k), hy = h / (2 * nh * k)
    return { x: clamp(p.x, hx, 1 - hx), y: clamp(p.y, hy, 1 - hy) }
  }, [w, h, nw, nh, k])
  const cc = fit(c)

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY }
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.px, dy = e.clientY - drag.current.py
    drag.current = { px: e.clientX, py: e.clientY }
    setC((p) => fit({ x: fit(p).x - dx / (nw * k), y: fit(p).y - dy / (nh * k) }))
  }
  const onUp = () => { drag.current = null }
  const onWheel = (e: React.WheelEvent) => setZoom((z) => clamp(z * (e.deltaY < 0 ? 1.08 : 1 / 1.08), 1, 4))

  const save = () => {
    if (!img || !w) return
    setBusy(true)
    const oh = Math.round(out / ratio)
    const canvas = document.createElement('canvas')
    canvas.width = out
    canvas.height = oh
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff' // shaffof PNG — oq fon (JPEG'da qora bo'lib qolmasin)
    ctx.fillRect(0, 0, out, oh)
    ctx.imageSmoothingQuality = 'high'
    const sw = w / k, sh = h / k
    ctx.drawImage(img, cc.x * nw - sw / 2, cc.y * nh - sh / 2, sw, sh, 0, 0, out, oh)
    // WebP (JPEG'dan 2-3 baravar yengil); brauzer WebP yarata olmasa (eski Safari PNG qaytaradi) — JPEG.
    // Sayt tez ochilishi uchun ~350 KB dan oshsa sifat pasaytiriladi
    const target = Math.min(maxBytes, 350 * 1024)
    const encode = (type: 'image/webp' | 'image/jpeg', q: number) => canvas.toBlob((b) => {
      if (b && type === 'image/webp' && b.type !== 'image/webp') return encode('image/jpeg', 0.85)
      if (b && b.size > target && q > 0.55) return encode(type, q - 0.1)
      setBusy(false)
      if (b) onDone(new File([b], name.replace(/\.[^.]+$/, '') + (type === 'image/webp' ? '.webp' : '.jpg'), { type }))
    }, type, q)
    encode('image/webp', 0.85)
  }

  return (
    <div className="crop-backdrop" onClick={onCancel}>
      <div className="crop-modal" role="dialog" aria-modal="true" aria-label="Rasmni qirqish" onClick={(e) => e.stopPropagation()}>
        <div className="crop-head">
          <b>Bannerni qirqish</b>
          <small>Rasmni sudrab joylashtiring, kattalashtirish uchun slayderdan foydalaning</small>
        </div>
        <div ref={frameRef} className="crop-frame" style={{ aspectRatio: String(ratio) }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}>
          {img && w > 0 && (
            <img src={src} alt="" draggable={false} style={{
              width: nw * k, height: nh * k, left: w / 2 - cc.x * nw * k, top: h / 2 - cc.y * nh * k,
            }} />
          )}
        </div>
        <label className="crop-zoom">
          <span>Kattalik</span>
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
        </label>
        <div className="crop-actions">
          <button type="button" className="btn" onClick={onCancel}>Bekor qilish</button>
          <button type="button" className="btn dark" onClick={save} disabled={!img || busy}>{busy ? 'Tayyorlanmoqda…' : 'Qirqish'}</button>
        </div>
      </div>
    </div>
  )
}
