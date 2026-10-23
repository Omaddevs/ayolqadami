'use client'
import { useRef, useState } from 'react'
import type { Partner } from '@prisma/client'
import { ActionForm } from './action-form'
import { ImageCropper } from './image-cropper'
import { fetchPartnerImage, savePartner } from '@/app/admin/(panel)/partners/actions'

// saytdagi lentada logotip balandligi bir xil (eni nisbatga qarab) — qirqim shu balandlikda, retina uchun 4x
const OUT_H = 240
const MAX_BYTES = 3 * 1024 * 1024
const RATIOS = [
  { v: 1, label: 'Kvadrat 1:1' },
  { v: 2, label: 'Keng 2:1' },
  { v: 3, label: 'Juda keng 3:1' },
  { v: 4, label: 'Lenta 4:1' },
]

// Hamkor shakli: logotip (yuklash yoki havola, ikkalasini ham qirqish mumkin), nomi, bosilganda qayerga olib borishi
export function PartnerForm({ p, site }: { p?: Partner | null; site: string }) {
  const resolve = (u: string) => (u.startsWith('/') && !u.startsWith('/media/') ? site + u : u)
  const [preview, setPreview] = useState(p ? resolve(p.imageUrl) : '')
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const urlRef = useRef<HTMLInputElement>(null)
  const [ratio, setRatio] = useState(2)
  // qirqiladigan asl rasm (fayl yoki havoladan olingan) — qayta qirqish ham shundan
  const [orig, setOrig] = useState<{ src: string; name: string } | null>(null)
  const [cropping, setCropping] = useState(false)
  const [cropped, setCropped] = useState(false)
  const [loading, setLoading] = useState(false)

  const openCrop = (src: string, name: string) => {
    if (orig?.src.startsWith('blob:')) URL.revokeObjectURL(orig.src)
    setOrig({ src, name })
    setCropped(false)
    setCropping(true)
  }
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    setErr('')
    if (!f) return
    if (f.size > 20 * 1024 * 1024) {
      setErr(`Rasm hajmi ${(f.size / 1024 / 1024).toFixed(1)} MB — 20 MB dan oshmasin`)
      e.target.value = ''
      return
    }
    openCrop(URL.createObjectURL(f), f.name)
  }
  // havoladagi rasm server orqali olinadi va qirqiladi — natija fayl sifatida yuklanadi
  const cropUrl = async () => {
    const url = urlRef.current?.value.trim() || ''
    setErr('')
    if (!/^https:\/\//i.test(url)) return setErr('Qirqish uchun https:// bilan boshlanadigan rasm havolasini kiriting')
    setLoading(true)
    const r = await fetchPartnerImage(url).catch(() => ({ error: 'Rasmni yuklab bo\'lmadi', data: undefined }))
    setLoading(false)
    if (!r.data) return setErr(r.error || 'Rasmni yuklab bo\'lmadi')
    openCrop(r.data, url.split('/').pop()?.split('?')[0] || 'logo')
  }
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
    if (!cropped && fileRef.current) {
      fileRef.current.value = ''
      setOrig(null)
    }
  }
  return (
    <ActionForm action={savePartner} cancelHref="/admin/partners">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="form-grid">
        <div className="field full">
          <label>Logotip *</label>
          <div className="partner-preview">{preview ? <img src={preview} alt="" /> : <span>Rasm tanlanmagan</span>}</div>
          <div className="banner-file">
            <select className="input partner-ratio" value={ratio} onChange={(e) => setRatio(Number(e.target.value))} aria-label="Qirqim nisbati">
              {RATIOS.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}
            </select>
            <input ref={fileRef} className="input" type="file" name="image" accept="image/png,image/jpeg,image/webp" onChange={onFile} />
            {orig && <button type="button" className="btn" onClick={() => setCropping(true)}>Qirqimni o&apos;zgartirish</button>}
          </div>
          <small>PNG (shaffof fon saqlanadi), JPEG yoki WebP. Avval nisbatni tanlang — keyin rasmni qirqasiz. Saytda hamma logotiplar bir xil balandlikda chiqadi.</small>
          {cropping && orig && (
            <ImageCropper key={`${orig.src.slice(0, 64)}-${ratio}`} src={orig.src} name={orig.name} ratio={ratio} out={OUT_H * ratio} maxBytes={MAX_BYTES}
              title="Logotipni qirqish" transparent onDone={onCropped} onCancel={onCancelCrop} />
          )}
        </div>
        <div className="field full">
          <label htmlFor="imageUrl">yoki rasm havolasi</label>
          <div className="banner-file">
            <input ref={urlRef} id="imageUrl" className="input" name="imageUrl" defaultValue={p?.imageUrl || ''} placeholder="https://… yoki /partners/logo.png"
              onChange={(e) => e.target.value && !cropped && setPreview(resolve(e.target.value))} />
            <button type="button" className="btn" onClick={cropUrl} disabled={loading}>{loading ? 'Yuklanmoqda…' : 'Qirqish'}</button>
          </div>
          <small>Havoladagi rasmni ham qirqish mumkin — qirqilgan nusxa serverga saqlanadi. Fayl yuklansa (yoki qirqilsa) — havola e&apos;tiborga olinmaydi</small>
        </div>
        {err && <div className="field full"><div className="error-box" role="alert">{err}</div></div>}
        <div className="field full"><label htmlFor="name">Nomi *</label><input id="name" className="input" name="name" defaultValue={p?.name} required minLength={2} maxLength={80} placeholder="Uzum Market" /></div>
        <div className="field full">
          <label htmlFor="linkUrl">Bosilganda qayerga olib boradi</label>
          <input id="linkUrl" className="input" name="linkUrl" defaultValue={p?.linkUrl ?? ''} placeholder="/companies/uzum-market yoki https://uzum.uz" />
          <small>Bo&apos;sh qoldirilsa — logotip bosilmaydi. Tashqi sayt yangi oynada ochiladi</small>
        </div>
        <div className="field"><label htmlFor="sort">Tartib raqami</label><input id="sort" className="input" type="number" min={0} name="sort" defaultValue={p?.sort ?? 0} /><small>Kichigi oldinda</small></div>
        <label className="check" style={{ alignSelf: 'end' }}><input type="checkbox" name="active" defaultChecked={p?.active ?? true} /> Saytda ko&apos;rsatish</label>
      </div>
    </ActionForm>
  )
}
