'use client'
import { useState } from 'react'
import type { Banner } from '@prisma/client'
import { ActionForm } from './action-form'
import { saveBanner } from '@/app/admin/(panel)/banners/actions'

const day = (d?: Date | null) => (d ? new Date(d.getTime() + 5 * 3600_000).toISOString().slice(0, 10) : '') // Toshkent vaqti

// Banner shakli: rasm yuklash (yoki havola), qayerga olib borishi, ko'rsatish davri
export function BannerForm({ b, site }: { b?: Banner | null; site: string }) {
  const resolve = (u: string) => (u.startsWith('/') && !u.startsWith('/media/') ? site + u : u)
  const [preview, setPreview] = useState(b ? resolve(b.imageUrl) : '')
  const [fileErr, setFileErr] = useState('')
  // 3 MB dan katta fayl serverga yuborilmaydi (server so'rov chegarasi — 4 MB)
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    setFileErr('')
    if (!f) return
    if (f.size > 3 * 1024 * 1024) {
      setFileErr(`Rasm hajmi ${(f.size / 1024 / 1024).toFixed(1)} MB — 3 MB dan oshmasin. Rasmni siqib (masalan, squoosh.app) qayta yuklang`)
      e.target.value = ''
      return
    }
    setPreview(URL.createObjectURL(f))
  }
  return (
    <ActionForm action={saveBanner} cancelHref="/admin/banners">
      {b && <input type="hidden" name="id" value={b.id} />}
      <div className="form-grid">
        <div className="field full">
          <label>Rasm *</label>
          <div className="banner-preview">{preview ? <img src={preview} alt="" /> : <span>Rasm tanlanmagan</span>}</div>
          <input className="input" type="file" name="image" accept="image/png,image/jpeg,image/webp" onChange={onFile} />
          {fileErr && <div className="error-box" role="alert" style={{ marginTop: 8 }}>{fileErr}</div>}
          <small>PNG, JPEG yoki WebP, 3 MB gacha. Tavsiya: 1200×400 (3:1), asosiy matn markazda.</small>
        </div>
        <div className="field full">
          <label htmlFor="imageUrl">yoki rasm havolasi</label>
          <input id="imageUrl" className="input" name="imageUrl" defaultValue={b?.imageUrl || ''} placeholder="https://… yoki /banners/rasm.jpg"
            onChange={(e) => e.target.value && setPreview(resolve(e.target.value))} />
          <small>Fayl yuklansa — havola e&apos;tiborga olinmaydi</small>
        </div>
        <div className="field full"><label htmlFor="title">Nomi (rasm tavsifi) *</label><input id="title" className="input" name="title" defaultValue={b?.title} required minLength={2} maxLength={120} placeholder="Haydovchilik kursi" /></div>
        <div className="field full">
          <label htmlFor="linkUrl">Bosilganda qayerga olib boradi</label>
          <input id="linkUrl" className="input" name="linkUrl" defaultValue={b?.linkUrl ?? ''} placeholder="/courses yoki https://hamkor.uz" />
          <small>Sayt ichidagi sahifa: /jobs, /courses, /articles/a1 · tashqi sayt: https://… (yangi oynada ochiladi) · bo&apos;sh — hech qayerga</small>
        </div>
        <div className="field"><label htmlFor="startsAt">Ko&apos;rsatish boshlanishi</label><input id="startsAt" className="input" type="date" name="startsAt" defaultValue={day(b?.startsAt)} /></div>
        <div className="field"><label htmlFor="endsAt">Ko&apos;rsatish tugashi</label><input id="endsAt" className="input" type="date" name="endsAt" defaultValue={day(b?.endsAt)} /></div>
        <div className="field"><label htmlFor="sort">Tartib raqami</label><input id="sort" className="input" type="number" min={0} name="sort" defaultValue={b?.sort ?? 0} /><small>Kichigi oldinda</small></div>
        <label className="check" style={{ alignSelf: 'end' }}><input type="checkbox" name="active" defaultChecked={b?.active ?? true} /> Saytda ko&apos;rsatish</label>
      </div>
    </ActionForm>
  )
}
