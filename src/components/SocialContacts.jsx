import { useEffect, useState } from 'react'
import { CaretLeft, CaretRight, PencilSimple, X } from '@phosphor-icons/react'
import { FaFacebookF, FaGlobe, FaInstagram, FaLinkedinIn, FaOdnoklassniki, FaViber, FaWhatsapp, FaYoutube } from 'react-icons/fa6'
import { Sheet } from './UI'
import { useApp } from '../context/AppContext'

const digits = (v) => v.replace(/\D/g, '')
const handle = (v) => v.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?[^/]+\//i, '').replace(/\/+$/, '')
const url = (base) => (v) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : `${base}${handle(v)}`)

// O'zbekistonda ochiq ishlaydigan platformalar (TikTok kabi cheklanganlari kiritilmagan)
// kind: phone — raqam, link — havola yoki foydalanuvchi nomi
export const SOCIALS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, color: '#25D366', kind: 'phone', placeholder: '+998 90 123 45 67',
    href: (v) => `https://wa.me/${digits(v)}` },
  { id: 'viber', label: 'Viber', icon: FaViber, color: '#7360F2', kind: 'phone', placeholder: '+998 90 123 45 67',
    href: (v) => `viber://chat?number=%2B${digits(v)}` },
  { id: 'instagram', label: 'Instagram', icon: FaInstagram, color: '#E1306C', kind: 'link', placeholder: '@username yoki instagram.com/username',
    href: url('https://instagram.com/') },
  { id: 'facebook', label: 'Facebook', icon: FaFacebookF, color: '#1877F2', kind: 'link', placeholder: 'facebook.com/username',
    href: url('https://facebook.com/') },
  { id: 'linkedin', label: 'LinkedIn', icon: FaLinkedinIn, color: '#0A66C2', kind: 'link', placeholder: 'linkedin.com/in/username',
    href: url('https://linkedin.com/in/') },
  { id: 'youtube', label: 'YouTube', icon: FaYoutube, color: '#FF0000', kind: 'link', placeholder: '@kanal yoki youtube.com/@kanal',
    href: (v) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : `https://youtube.com/@${handle(v)}`) },
  { id: 'ok', label: 'Odnoklassniki', icon: FaOdnoklassniki, color: '#EE8208', kind: 'link', placeholder: 'ok.ru/profile/...',
    href: url('https://ok.ru/') },
  { id: 'site', label: 'Sayt yoki portfolio', icon: FaGlobe, color: '#5B57F0', kind: 'link', placeholder: 'https://mening-saytim.uz',
    href: (v) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : `https://${v.trim()}`) },
]
export const socialById = (id) => SOCIALS.find((s) => s.id === id)

function valid(s, v) {
  if (s.kind === 'phone') return digits(v).length >= 9
  return v.trim().length >= 2 && !/\s/.test(v.trim())
}

// "Boshqa aloqa usullari" qo'shish/tahrirlash oynasi: 1) platforma tanlash 2) raqam yoki havola kiritish
export function SocialSheet({ open, onClose, editId }) {
  const { user, updateUser, notify } = useApp()
  const [pick, setPick] = useState(null)
  const [value, setValue] = useState('')
  const [touched, setTouched] = useState(false)
  const list = user.socials || []

  useEffect(() => {
    if (!open) return
    const cur = editId && list.find((x) => x.type === editId)
    setPick(editId ? socialById(editId) : null)
    setValue(cur?.value || '')
    setTouched(false)
  }, [open, editId])

  const choose = (s) => {
    setPick(s)
    setValue(list.find((x) => x.type === s.id)?.value || (s.kind === 'phone' ? '+998 ' : ''))
    setTouched(false)
  }

  const save = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!valid(pick, value)) return
    const next = [...list.filter((x) => x.type !== pick.id), { type: pick.id, value: value.trim() }]
    updateUser({ socials: next })
    notify?.(`${pick.label} saqlandi`)
    onClose()
  }

  const PickIco = pick?.icon
  return (
    <Sheet open={open} onClose={onClose} title={pick ? pick.label : "Aloqa usulini qo'shish"}>
      {!pick ? (
        <div className="sc-grid">
          {SOCIALS.map((s) => {
            const Ic = s.icon
            const has = list.some((x) => x.type === s.id)
            return (
              <button key={s.id} type="button" className="sc-pick" onClick={() => choose(s)}>
                <span className="sc-ico" style={{ background: s.color }}><Ic size={18} /></span>
                <span className="sc-pick-txt"><b>{s.label}</b><small>{has ? "Qo'shilgan" : s.kind === 'phone' ? 'Telefon raqam' : 'Havola'}</small></span>
                <CaretRight size={16} />
              </button>
            )
          })}
        </div>
      ) : (
        <form onSubmit={save} className="sc-form">
          {!editId && <button type="button" className="loc-back" onClick={() => setPick(null)}><CaretLeft size={16} weight="bold" /> Orqaga</button>}
          <div className="sc-form-head">
            <span className="sc-ico lg" style={{ background: pick.color }}><PickIco size={22} /></span>
            <p>{pick.kind === 'phone' ? `${pick.label} ulangan telefon raqamingizni kiriting` : `${pick.label} sahifangiz havolasi yoki foydalanuvchi nomini kiriting`}</p>
          </div>
          <label className="field">
            <span>{pick.kind === 'phone' ? 'Telefon raqam' : 'Havola'}</span>
            <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} onBlur={() => setTouched(true)}
              placeholder={pick.placeholder} inputMode={pick.kind === 'phone' ? 'tel' : 'url'} />
          </label>
          {touched && !valid(pick, value) && (
            <p className="sc-err">{pick.kind === 'phone' ? "Raqamni to'liq kiriting" : "Havola yoki foydalanuvchi nomini to'g'ri kiriting"}</p>
          )}
          <button type="submit" className="btn btn-primary btn-block">Saqlash</button>
        </form>
      )}
    </Sheet>
  )
}

// qo'shilgan aloqa usullari: bosilsa ochiladi, qalam — tahrirlash, × — o'chirish
export function SocialTiles({ onEdit }) {
  const { user, updateUser, notify } = useApp()
  const list = (user.socials || []).filter((x) => socialById(x.type))
  if (!list.length) return null
  const remove = (s) => { updateUser({ socials: user.socials.filter((x) => x.type !== s.id) }); notify?.(`${s.label} o'chirildi`) }
  return (
    <div className="pd-contacts">
      {list.map((x) => {
        const s = socialById(x.type)
        const Ic = s.icon
        return (
          <div key={x.type} className="pd-contact sc-tile">
            <a href={s.href(x.value)} target="_blank" rel="noreferrer" className="sc-tile-main">
              <span className="pd-contact-ico" style={{ background: s.color }}><Ic size={16} /></span>
              <span><b>{s.label}</b><small>{x.value}</small></span>
            </a>
            <span className="sc-tile-acts">
              <button type="button" onClick={() => onEdit(s.id)} aria-label={`${s.label}ni tahrirlash`}><PencilSimple size={15} /></button>
              <button type="button" onClick={() => remove(s)} aria-label={`${s.label}ni o'chirish`}><X size={15} /></button>
            </span>
          </div>
        )
      })}
    </div>
  )
}
