import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CaretRight, Car, IdentificationCard, LockSimple, PencilSimple, Plus, SignOut, Sparkle, WarningCircle,
} from '@phosphor-icons/react'
import { FaTelegramPlane } from 'react-icons/fa'
import { FaEnvelope, FaPhone } from 'react-icons/fa6'
import { Avatar, Select, Sheet } from './UI'
import { SocialSheet, SocialTiles } from './SocialContacts'
import { profileCompletion, useApp } from '../context/AppContext'
import { catName, formatSum } from '../data/mock'
import { EMPLOYMENT, LANG_LEVELS, SOCIAL, WORK_MODES } from '../data/resume'
import { fullName, placeText } from './ResumeView'

const EDIT = '/profile/edit'
const APPLY_GOAL = 10

const STATUS_OPTS = [
  { value: 'active', label: 'Faol ish qidiryapman' },
  { value: 'open', label: "Takliflarni ko'rib chiqaman" },
  { value: 'off', label: 'Ish qidirmayapman' },
]

const labels = (list, ids) => list.filter((o) => ids?.includes(o.id)).map((o) => o.label).join(', ')

// sarlavha + o'ng tomonda "+ Qo'shish"
function Sec({ title, add = true, onAdd, children }) {
  return (
    <section className="pd-sec">
      <div className="pd-sec-head">
        <h2>{title}</h2>
        {onAdd ? <button type="button" className="pd-add" onClick={onAdd}><Plus size={14} weight="bold" /> Qo'shish</button>
          : add && <Link to={EDIT} className="pd-add"><Plus size={14} weight="bold" /> Qo'shish</Link>}
      </div>
      {children}
    </section>
  )
}

// tahrirlash qalami bilan qator
function Row({ k, v }) {
  return (
    <Link to={EDIT} className="pd-row">
      <span><small>{k}</small><b>{v}</b></span>
      <PencilSimple size={18} className="pd-pen" />
    </Link>
  )
}

// bo'sh bo'lim: izoh + tugma
function Empty({ text, btn = "Qo'shish" }) {
  return (
    <div className="pd-card pd-empty">
      <p>{text}</p>
      <Link to={EDIT} className="pd-btn">{btn}</Link>
    </div>
  )
}

// Profil — desktop/laptop ko'rinishi (≥1024px): chapda rasm va yordamchi kartalar, o'ngda rezyume bo'limlari
export default function ProfileDesktop() {
  const { user, updateUser, applications, logout } = useApp()
  const nav = useNavigate()
  const [confirmOut, setConfirmOut] = useState(false)
  const [photoTip, setPhotoTip] = useState(!user.photo)
  const [social, setSocial] = useState({ open: false, id: null })
  const pct = profileCompletion(user)
  const name = fullName(user) || 'Ism kiritilmagan'
  const place = placeText(user) || user.city
  const edus = user.educations?.length ? user.educations : user.education ? [{ school: user.education }] : []
  const langs = user.langs || (user.languages || []).map((l) => ({ lang: l }))
  const certs = user.certificates || []
  const interest = user.categories?.length
    ? user.categories.map((id) => (id === 'other' && user.otherCategory) || catName(id)).join(', ')
    : user.category ? catName(user.category) : ''
  const sent = Math.min(applications.length, APPLY_GOAL)

  const contacts = [
    { key: 'phone', icon: FaPhone, label: 'Telefon', value: user.phone, href: user.phone && `tel:${user.phone.replace(/\s/g, '')}` },
    { key: 'email', icon: FaEnvelope, label: 'Email', value: user.email, href: user.email && `mailto:${user.email}` },
    { key: 'tg', icon: FaTelegramPlane, label: 'Telegram', value: user.telegram, href: user.telegram && `https://t.me/${user.telegram.replace(/^@/, '')}` },
  ]

  return (
    <div className="pd">
      <aside className="pd-side">
        <div className="pd-photo">
          <Link to={EDIT} className="pd-photo-img" aria-label="Rasmni o'zgartirish">
            {user.photo ? <img src={user.photo} alt="" /> : <img src="/avatar-default.svg" alt="" className="sil" />}
          </Link>
          {photoTip && (
            <div className="pd-photo-tip">
              <span>Rasm qo'shilganmi? Rasmli rezyumelar ko'proq e'tibor tortadi</span>
              <Link to={EDIT} className="pd-btn sm" onClick={() => setPhotoTip(false)}>Qo'shish</Link>
            </div>
          )}
        </div>

        <div className="pd-card pd-status">
          <Select value={user.searchStatus || 'active'} options={STATUS_OPTS} onChange={(v) => updateUser({ searchStatus: v })} />
        </div>

        <Link to="/jobs" className="pd-card pd-goal">
          <div className="pd-goal-head">
            <b><em>{APPLY_GOAL} marta</em> ariza qoldiring</b>
            <CaretRight size={16} />
          </div>
          <span>~{APPLY_GOAL} ta ariza — statistikaga ko'ra, taklif olish uchun shuncha kerak</span>
          <div className="pd-bar"><i style={{ width: `${(sent / APPLY_GOAL) * 100}%` }} /></div>
          <small>{sent} / {APPLY_GOAL}</small>
        </Link>

        <Link to="/qadam-ai" className="pd-promo">
          <Sparkle size={30} weight="fill" />
          <b>QadamAI sizga mos ishlarni topadi</b>
          <span>Rezyumengiz asosida shaxsiy tavsiyalar oling</span>
          <em>Sinab ko'rish <CaretRight size={14} weight="bold" /></em>
        </Link>
      </aside>

      <div className="pd-main">
        <header className="pd-head">
          <div>
            <h1>{name}</h1>
            {place && <span className="pd-city">{place}</span>}
          </div>
          <div className="pd-head-actions">
            <button type="button" className="pd-ico-btn danger" onClick={() => setConfirmOut(true)} aria-label="Akkauntdan chiqish" title="Akkauntdan chiqish"><SignOut size={18} /></button>
            <Link to={EDIT} className="pd-ico-btn" aria-label="Tahrirlash"><PencilSimple size={18} /></Link>
          </div>
        </header>
        <Sheet open={confirmOut} onClose={() => setConfirmOut(false)} title="Akkauntdan chiqish">
          <div className="st-confirm">
            <p>Haqiqatan ham akkauntdan chiqmoqchimisiz? Qayta kirish uchun telefon raqamingiz kerak bo'ladi.</p>
            <button type="button" className="btn btn-danger btn-lg btn-block" onClick={() => { logout(); nav('/', { replace: true }) }}>Chiqish</button>
            <button type="button" className="btn btn-ghost btn-lg btn-block" onClick={() => setConfirmOut(false)}>Bekor qilish</button>
          </div>
        </Sheet>

        <section className="pd-sec">
          <div className="pd-sec-head">
            <h2>Mening rezyumeyim</h2>
            <Link to={EDIT} className="pd-add">{user.headline ? 'Rezyumeni tahrirlash' : 'Rezyume yaratish'}</Link>
          </div>
          <div className="pd-card pd-resume">
            <div className="pd-resume-top">
              <div>
                <b className={user.headline ? '' : 'muted'}>{user.headline || "Kasb ko'rsatilmagan"}</b>
                <small>{user.salary ? `${formatSum(user.salary)} so'mdan` : 'Maosh kelishiladi'}</small>
              </div>
              <Avatar name={name} color={user.color} size={44} radius={14} photo={user.photo} silhouette />
            </div>
            {pct < 100 ? (
              <div className="pd-alert">
                <WarningCircle size={18} weight="fill" />
                <div><b>Rezyume {pct}% to'ldirilgan</b><span>To'liq rezyume ish beruvchilarga ko'rinadi va 3 barobar ko'p taklif oladi</span></div>
              </div>
            ) : (
              <div className="pd-alert ok">
                <LockSimple size={18} weight="fill" />
                <div><b>Rezyume faol</b><span>Ish beruvchilar sizni QadamAI orqali topishadi</span></div>
              </div>
            )}
            <div className="pd-resume-foot">
              <Link to={EDIT} className="pd-btn">{pct < 100 ? "To'ldirish" : 'Tahrirlash'}</Link>
              <Link to="/applications" className="pd-muted-link">{applications.length} ta ariza</Link>
            </div>
          </div>
        </section>

        <Sec title="Qidiruv sozlamalari" add={false}>
          <div className="pd-card pd-rows">
            <Row k="Qayerda yashaysiz" v={place || "Ko'rsatilmagan"} />
            <Row k="Sizni nima qiziqtiryapti" v={interest || "Ko'rsatilmagan"} />
            <Row k="Ish formati" v={labels(WORK_MODES, user.workMode) || labels(EMPLOYMENT, user.employment) || user.format?.join(', ') || "Ko'rsatilmagan"} />
          </div>
        </Sec>

        <Sec title="Kontaktlar" add={false}>
          <div className="pd-contacts">
            {contacts.map((c) => {
              const Ic = c.icon
              const body = <><span className={`pd-contact-ico ${c.key}`}><Ic size={16} /></span><span><b>{c.label}</b><small>{c.value || "Qo'shish"}</small></span></>
              return c.href
                ? <a key={c.key} href={c.href} className="pd-contact" {...(c.key === 'tg' ? { target: '_blank', rel: 'noreferrer' } : {})}>{body}</a>
                : <Link key={c.key} to={EDIT} className="pd-contact is-empty">{body}</Link>
            })}
          </div>
        </Sec>

        <Sec title="Boshqa aloqa usullari" onAdd={() => setSocial({ open: true, id: null })}>
          <SocialTiles onEdit={(id) => setSocial({ open: true, id })} />
        </Sec>
        <SocialSheet open={social.open} editId={social.id} onClose={() => setSocial((x) => ({ ...x, open: false }))} />

        <Sec title="Ish tajribasi">
          {user.experience?.length ? (
            <div className="pd-card pd-rows">
              {user.experience.map((e, i) => (
                <Row key={i} v={e.role}
                  k={[e.company, e.period || (e.from && `${e.from} – ${e.current ? 'hozirgacha' : e.to || ''}`)].filter(Boolean).join(' · ') || 'Ish joyi'} />
              ))}
            </div>
          ) : <Empty text="Tajriba va yutuqlaringizni qo'shing — ish beruvchilar nimalarni uddalashingizni ko'radi" />}
        </Sec>

        <Sec title="Ta'lim">
          {edus.length ? (
            <div className="pd-card pd-rows">
              {edus.map((e, i) => (
                <Row key={i} v={[e.school, e.faculty].filter(Boolean).join(', ')}
                  k={[e.level, e.to || (e.current && "o'qimoqda")].filter(Boolean).join(' · ') || "Ta'lim muassasasi"} />
              ))}
            </div>
          ) : <Empty text="Qayerda o'qiganingizni ko'rsating" />}
        </Sec>

        <Sec title="Malaka oshirish, kurslar">
          {certs.length > 0 && (
            <div className="pd-card pd-rows">
              {certs.map((c, i) => <Row key={i} k={[c.org, c.year].filter(Boolean).join(' · ') || 'Sertifikat'} v={c.name} />)}
            </div>
          )}
        </Sec>

        <Sec title="Ko'nikmalar">
          {user.skills?.length ? (
            <div className="pd-card"><div className="pd-chips">{user.skills.map((s) => <span key={s}>{s}</span>)}</div></div>
          ) : <Empty text="Ko'nikmalaringiz bo'yicha QadamAI sizga mos ishlarni topadi" />}
        </Sec>

        <Sec title="O'zim haqimda" add={!user.about}>
          {user.about
            ? <Link to={EDIT} className="pd-card pd-about"><p>{user.about}</p><PencilSimple size={18} className="pd-pen" /></Link>
            : <Empty text="Bir-ikki jumlada o'zingizni tanishtiring" btn="Yozish" />}
        </Sec>

        <Sec title="Hujjatlar" add={false}>
          <div className="pd-card pd-rows">
            <Row k="Ijtimoiy toifa" v={labels(SOCIAL, user.social) || "Ko'rsatilmagan"} />
            <Link to={EDIT} className="pd-row">
              <span><small><Car size={13} /> Haydovchilik guvohnomasi</small><b>{user.driving?.length ? `${user.driving.join(', ')} toifa` : "Ko'rsatilmagan"}</b></span>
              <PencilSimple size={18} className="pd-pen" />
            </Link>
          </div>
        </Sec>

        <Sec title="Tillar">
          {langs.length ? (
            <div className="pd-card pd-rows">
              {langs.map((l) => <Row key={l.lang} v={l.lang} k={LANG_LEVELS.find((x) => x.value === l.level)?.label || l.level || "Daraja ko'rsatilmagan"} />)}
            </div>
          ) : <Empty text="Qaysi tillarni bilishingizni ko'rsating" />}
        </Sec>

        <p className="pd-foot"><IdentificationCard size={16} /> Barcha ma'lumotlarni <Link to={EDIT}>rezyume ustasi</Link> orqali tahrirlashingiz mumkin</p>
      </div>
    </div>
  )
}
