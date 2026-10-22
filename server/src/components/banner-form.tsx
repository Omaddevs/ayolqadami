'use client'
import { useRef, useState } from 'react'
import type { Banner } from '@prisma/client'
import { ActionForm } from './action-form'
import { ImageCropper } from './image-cropper'
import { saveBanner } from '@/app/admin/(panel)/banners/actions'

// sayt bosh sahifasidagi banner nisbati (.hb-slide aspect-ratio: 864 / 252) — qirqim aynan shu o'lchamda
const RATIO = 864 / 252
const OUT_W = 1728
const MAX_BYTES = 3 * 1024 * 1024

const day = (d?: Date | null) => (d ? new Date(d.getTime() + 5 * 3600_000).toISOString().slice(0, 10) : '') // Toshkent vaqti

// Banner shakli: rasm yuklash (yoki havola), qayerga olib borishi, ko'rsatish davri
export function BannerForm({ b, site }: { b?: Banner | null; site: string }) {
  const resolve = (u: string) => (u.startsWith('/') && !u.startsWith('/media/') ? site + u : u)
  const [preview, setPreview] = useState(b ? resolve(b.imageUrl) : '')
  const [fileErr, setFileErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  // tanlangan asl rasm — qirqim oynasi uchun (qayta qirqish ham shundan)
  const [orig, setOrig] = useState<{ src: string; name: string } | null>(null)
  const [cropping, setCropping] = useState(false)
  const [cropped, setCropped] = useState(false) // inputda qirqilgan fayl turibdimi
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    setFileErr('')
    if (!f) return
    // asl rasm katta bo'lishi mumkin — qirqilgach siqiladi (server chegarasi — 3 MB)
    if (f.size > 20 * 1024 * 1024) {
      setFileErr(`Rasm hajmi ${(f.size / 1024 / 1024).toFixed(1)} MB — 20 MB dan oshmasin`)
      e.target.value = ''
      return
    }
    if (orig) URL.revokeObjectURL(orig.src)
    setOrig({ src: URL.createObjectURL(f), name: f.name })
    setCropped(false)
    setCropping(true)
  }
  // qirqilgan fayl inputga qo'yiladi — forma uni odatdagidek yuboradi
  const onCropped = (f: File) => {
    const dt = new DataTransfer()
    dt.items.add(f)
    if (fileRef.current) fileRef.current.files = dt.files
    setPreview(URL.createObjectURL(f))
    setCropped(true)
    setCropping(false)
  }
  const onCancelCrop = () => {
    setCropping(false)
    // hali qirqilmagan bo'lsa — tanlov bekor qilinadi (qirqilmagan asl rasm yuborilmasin)
    if (!cropped && fileRef.current) {
      fileRef.current.value = ''
      setOrig(null)
    }
  }
  return (
    <ActionForm action={saveBanner} cancelHref="/admin/banners">
      {b && <input type="hidden" name="id" value={b.id} />}
      <div className="form-grid">
        <div className="field full">
          <label>Rasm *</label>
          <div className="banner-preview">{preview ? <img src={preview} alt="" /> : <span>Rasm tanlanmagan</span>}</div>
          <div className="banner-file">
            <input ref={fileRef} className="input" type="file" name="image" accept="image/png,image/jpeg,image/webp" onChange={onFile} />
            {orig && <button type="button" className="btn" onClick={() => setCropping(true)}>Qirqimni o&apos;zgartirish</button>}
          </div>
          {fileErr && <div className="error-box" role="alert" style={{ marginTop: 8 }}>{fileErr}</div>}
          <small>PNG, JPEG yoki WebP. Tanlangandan keyin saytdagi banner o&apos;lchamida ({OUT_W}×{Math.round(OUT_W / RATIO)}) qirqasiz.</small>
          {cropping && orig && <ImageCropper src={orig.src} name={orig.name} ratio={RATIO} out={OUT_W} maxBytes={MAX_BYTES} onDone={onCropped} onCancel={onCancelCrop} />}
        </div>
        <div className="field full">
          <label htmlFor="imageUrl">yoki rasm havolasi</label>
          <input id="imageUrl" className="input" name="imageUrl" defaultValue={b?.imageUrl || ''} placeholder="https://… yoki /banners/rasm.jpg"
            onChange={(e) => e.target.value && setPreview(resolve(e.target.value))} />
          <small>Fayl yuklansa — havola e&apos;tiborga olinmaydi</small>
        </div>
        <div className="field full"><label htmlFor="title">Nomi (rasm tavsifi) *</label><input id="title" className="input" name="title" defaultValue={b?.title} required minLength={2} maxLength={120} placeholder="Haydovchilik kursi" /></div>
        <div className="field full">
          <label htmlFor="linkUrl">Bosilganda qayerga olib boradi *</label>
          <input id="linkUrl" className="input" name="linkUrl" defaultValue={b?.linkUrl ?? ''} required placeholder="/courses yoki https://hamkor.uz" />
          <small>Sayt ichidagi sahifa: /jobs, /courses, /articles/a1 · tashqi sayt: https://… (yangi oynada ochiladi)</small>
        </div>
        <div className="field"><label htmlFor="startsAt">Ko&apos;rsatish boshlanishi</label><input id="startsAt" className="input" type="date" name="startsAt" defaultValue={day(b?.startsAt)} /></div>
        <div className="field"><label htmlFor="endsAt">Ko&apos;rsatish tugashi</label><input id="endsAt" className="input" type="date" name="endsAt" defaultValue={day(b?.endsAt)} /></div>
        <div className="field"><label htmlFor="sort">Tartib raqami</label><input id="sort" className="input" type="number" min={0} name="sort" defaultValue={b?.sort ?? 0} /><small>Kichigi oldinda</small></div>
        <label className="check" style={{ alignSelf: 'end' }}><input type="checkbox" name="active" defaultChecked={b?.active ?? true} /> Saytda ko&apos;rsatish</label>
      </div>
    </ActionForm>
  )
}
