import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon3D from '../components/Icon3D'
import { Avatar, Sheet, TopBar, Select } from '../components/UI'
import LocationSheet from '../components/LocationSheet'
import ResumeBuilder from './ResumeBuilder'
import ProfileDesktop from '../components/ProfileDesktop'
import { readPhoto } from '../lib/photo'
import {
  CaretDown, CaretRight, Check, CheckCircle, EnvelopeSimple, MagnifyingGlass, PencilSimple, Phone, Plus, TelegramLogo, WarningCircle,
} from '@phosphor-icons/react'
import { profileCompletion, useApp } from '../context/AppContext'
import { CATEGORIES, CITIES, catName, formatSum } from '../data/mock'

const CAT_OPTS = CATEGORIES.map((c) => ({ value: c.id, label: c.name }))

const SEARCH_STATUS = [
  { id: 'active', label: 'Faol ish qidiryapman', hint: "Ish beruvchilar sizni birinchi ko'radi", tone: 'green' },
  { id: 'open', label: "Takliflarni ko'rib chiqaman", hint: 'Ishlayapman, lekin yangi takliflarga ochiqman', tone: 'amber' },
  { id: 'off', label: 'Ish qidirmayapman', hint: "Rezyumengiz qidiruvda ko'rinmaydi", tone: 'gray' },
]

// Profil bo'limi: sarlavha + karta
function PfSection({ title, action, children }) {
  return (
    <section className="pf-sec">
      <div className="pf-sec-head"><h2>{title}</h2>{action}</div>
      <div className="pf-card">{children}</div>
    </section>
  )
}

// bo'lim bo'sh bo'lsa: izoh + to'ldirishga chaqiruv
function PfEmpty({ text, to = '/profile/edit', label = "Qo'shish" }) {
  return (
    <>
      <p className="pf-empty">{text}</p>
      <Link to={to} className="btn btn-primary btn-block">{label}</Link>
    </>
  )
}

const PfEdit = ({ to = '/profile/edit' }) => <Link to={to} className="btn pf-btn-gray btn-block">Tahrirlash</Link>

const DESKTOP = '(min-width: 1024px)'
function useDesktop() {
  const [on, setOn] = useState(() => window.matchMedia(DESKTOP).matches)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP)
    const fn = () => setOn(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return on
}

// desktopda ish izlovchi uchun alohida maket; mobil va ish beruvchi — avvalgidek
export function Profile() {
  const { user } = useApp()
  const desktop = useDesktop()
  return desktop && user.role !== 'employer' ? <ProfileDesktop /> : <ProfileMobile />
}

function ProfileMobile() {
  const { user, updateUser, applications, saved, posted, invites } = useApp()
  const isEmp = user.role === 'employer'
  const pct = profileCompletion(user)
  const [statusOpen, setStatusOpen] = useState(false)
  const [locOpen, setLocOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const nameRef = useRef(null)
  const status = SEARCH_STATUS.find((s) => s.id === user.searchStatus) || SEARCH_STATUS[0]
  const title = isEmp ? user.company : user.name

  // ism ekrandan chiqqanda tepada ixcham sarlavha paydo bo'ladi
  useEffect(() => {
    const el = nameRef.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting), { rootMargin: '-60px 0px 0px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const contacts = [
    { key: 'phone', icon: Phone, label: 'Telefon', value: user.phone, href: user.phone && `tel:${user.phone.replace(/\s/g, '')}` },
    { key: 'email', icon: EnvelopeSimple, label: 'Email', value: user.email, href: user.email && `mailto:${user.email}` },
    { key: 'tg', icon: TelegramLogo, label: 'Telegram', value: user.telegram, href: user.telegram && `https://t.me/${user.telegram.replace(/^@/, '')}` },
  ]

  return (
    <div className="page pf">
      <header className={`pf-bar ${compact ? 'show' : ''}`}>
        <span />
        <div className="pf-bar-title"><b>Profil</b><span>{title}</span></div>
        <span />
      </header>
      <Link to="/more" className="pf-menu-btn" aria-label="Menyu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16" /><path className="mid" d="M10 12h10" /><path d="M4 17h16" />
        </svg>
      </Link>

      <div className="pf-hero">
        <Link to="/profile/edit" className="pf-avatar" aria-label="Profilni tahrirlash">
          <Avatar name={title} color={user.color} size={112} radius={34} photo={user.photo} silhouette={!isEmp} />
          <span className="pf-avatar-edit"><PencilSimple size={16} weight="fill" /></span>
        </Link>
        <h1 ref={nameRef}>{title}</h1>
        {isEmp ? (
          <Link to="/profile/edit" className="pf-city">{`${user.name} · ${user.position || 'HR'}`} <CaretRight size={16} /></Link>
        ) : (
          <button type="button" className="pf-city" onClick={() => setLocOpen(true)}>
            {[user.city, user.address].filter(Boolean).join(', ') || "Shahar ko'rsatilmagan"} <CaretRight size={16} />
          </button>
        )}
      </div>

      <div className="pf-body">
        {!isEmp && (
          <button type="button" className={`pf-status tone-${status.tone}`} onClick={() => setStatusOpen(true)}>
            <span className="pf-status-ico"><MagnifyingGlass size={26} weight="bold" /></span>
            <span className="pf-status-text"><b>{status.label}</b><small>{status.hint}</small></span>
            <span className="pf-status-caret"><CaretDown size={16} weight="bold" /></span>
          </button>
        )}

        {isEmp ? (
          <>
            <div className="pf-stats">
              <Link to="/applications"><b>{posted.length}</b><span>Vakansiyalar</span></Link>
              <Link to="/candidates"><b>{invites.length}</b><span>Takliflar</span></Link>
            </div>
            <PfSection title="Kompaniya haqida">
              {user.about ? <><p className="pf-text">{user.about}</p><PfEdit /></>
                : <PfEmpty text="Nomzodlar ishonchli ish beruvchilarni tanlaydi — kompaniyangizni tanishtiring" label="Yozish" />}
            </PfSection>
            <PfSection title="Ma'lumotlar">
              <dl className="pf-kv">
                <div><dt>Soha</dt><dd>{user.industry || user.category ? catName(user.industry || user.category) : "Ko'rsatilmagan"}</dd></div>
                <div><dt>Shahar</dt><dd>{user.city || "Ko'rsatilmagan"}</dd></div>
              </dl>
              <PfEdit />
            </PfSection>
          </>
        ) : (
          <>
            <section className="pf-sec">
              <div className="pf-sec-head">
                <h2>Mening rezyumeyim</h2>
                <Link to="/profile/edit" className="pf-link">
                  {user.headline ? <><PencilSimple size={16} weight="bold" /> Tahrirlash</> : <><Plus size={16} weight="bold" /> Rezyume yaratish</>}
                </Link>
              </div>
              <div className="pf-card">
                <div className="pf-resume-top">
                  <div>
                    <b>{user.headline || "Kasb ko'rsatilmagan"}</b>
                    <span>{user.salary ? `${formatSum(user.salary)} so'mdan` : 'Maosh kelishiladi'}</span>
                  </div>
                  <Avatar name={title} color={user.color} size={56} radius={18} photo={user.photo} silhouette={!isEmp} />
                </div>
                {pct < 100 ? (
                  <div className="pf-alert amber">
                    <div>
                      <b>Rezyume {pct}% to'ldirilgan</b>
                      <span>To'liq rezyume 3 barobar ko'p taklif oladi</span>
                      <div className="pf-progress" style={{ '--p': `${pct}%` }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                        <i />
                        <em>{pct}%</em>
                      </div>
                    </div>
                    <WarningCircle size={26} />
                  </div>
                ) : (
                  <div className="pf-alert green">
                    <div><b>Rezyume faol</b><span>Ish beruvchilar sizni QadamAI orqali topishadi</span></div>
                    <CheckCircle size={26} />
                  </div>
                )}
                <div className="pf-resume-stats">
                  <Link to="/applications"><b>{applications.length}</b> ariza</Link>
                  <Link to="/applications?tab=saved"><b>{saved.length}</b> saqlangan</Link>
                </div>
                <Link to="/profile/edit" className="btn btn-primary btn-block">{pct < 100 ? "Rezyumeni to'ldirish" : 'Rezyumeni tahrirlash'}</Link>
              </div>
            </section>

            <PfSection title="Qidiruv sozlamalari">
              <dl className="pf-kv">
                <div><dt>Sizni hozir nima qiziqtiryapti</dt><dd>{user.categories?.length ? user.categories.map((id) => (id === 'other' && user.otherCategory) || catName(id)).join(', ') : user.category ? catName(user.category) : "Ko'rsatilmagan"}</dd></div>
                <div><dt>Qayerda yashaysiz</dt><dd>{user.city || "Ko'rsatilmagan"}</dd></div>
                <div><dt>Kutilayotgan maosh</dt><dd>{user.salary ? `${formatSum(user.salary)} so'mdan` : "Ko'rsatilmagan"}</dd></div>
                <div><dt>Ish formati</dt><dd>{user.format?.length ? user.format.join(', ') : "Ko'rsatilmagan"}</dd></div>
              </dl>
              <PfEdit />
            </PfSection>
          </>
        )}

        <section className="pf-sec">
          <div className="pf-sec-head"><h2>Kontaktlar</h2></div>
          <div className="pf-contacts">
            {contacts.map((c) => {
              const Ic = c.icon
              const body = (
                <>
                  <span className={`pf-contact-ico ${c.key}`}><Ic size={26} weight="fill" /></span>
                  <span className="pf-contact-text"><b>{c.label}</b><span>{c.value || "Qo'shish"}</span></span>
                </>
              )
              return c.href
                ? <a key={c.key} href={c.href} className="pf-contact" target={c.key === 'tg' ? '_blank' : undefined} rel="noreferrer">{body}</a>
                : <Link key={c.key} to="/profile/edit" className="pf-contact is-empty">{body}</Link>
            })}
          </div>
          <Link to="/profile/edit" className="pf-row">
            <div><b>Boshqa aloqa usullari</b><span>Ijtimoiy tarmoqlar va blog</span></div>
            <CaretRight size={20} />
          </Link>
        </section>

        {!isEmp && (
          <>
            <PfSection title="Ish tajribasi">
              {user.experience?.length ? (
                <>
                  <div className="pf-list">
                    {user.experience.map((e, i) => (
                      <div key={i} className="pf-list-item"><b>{e.role}</b><span>{[e.company, e.period].filter(Boolean).join(' · ')}</span></div>
                    ))}
                  </div>
                  <PfEdit />
                </>
              ) : <PfEmpty text="Tajriba va yutuqlaringizni qo'shing — ish beruvchilar nimalarni uddalashingizni ko'radi" />}
            </PfSection>

            <PfSection title="Ta'lim">
              {user.educations?.length ? (
                <>
                  <div className="pf-list">
                    {user.educations.map((e, i) => (
                      <div key={i} className="pf-list-item"><b>{e.school}</b><span>{[e.faculty, e.level, e.to || (e.current && "o'qimoqda")].filter(Boolean).join(' · ')}</span></div>
                    ))}
                  </div>
                  <PfEdit />
                </>
              ) : user.education ? <><div className="pf-list-item"><b>{user.education}</b></div><PfEdit /></>
                : <PfEmpty text="Qayerda o'qiganingizni ko'rsating" />}
            </PfSection>

            <PfSection title="Ko'nikmalar">
              {user.skills?.length ? (
                <><div className="pf-chips">{user.skills.map((s) => <span key={s}>{s}</span>)}</div><PfEdit /></>
              ) : <PfEmpty text="Ko'nikmalaringiz bo'yicha QadamAI sizga mos ishlarni topadi" />}
            </PfSection>

            <PfSection title="O'zim haqimda">
              {user.about ? <><p className="pf-text">{user.about}</p><PfEdit /></>
                : <PfEmpty text="Bir-ikki jumlada o'zingizni tanishtiring" label="Yozish" />}
            </PfSection>

            <PfSection title="Tillar">
              <div className="pf-chips">
                {user.languages?.length
                  ? user.languages.map((s) => <span key={s}>{s}</span>)
                  : <span className="muted-chip">Tillar ko'rsatilmagan</span>}
              </div>
              <PfEdit />
            </PfSection>
          </>
        )}
      </div>

      <Sheet open={statusOpen} onClose={() => setStatusOpen(false)} title="Qidiruv holati">
        <div className="pf-options">
          {SEARCH_STATUS.map((s) => (
            <button key={s.id} type="button" className={`pf-option tone-${s.tone} ${s.id === status.id ? 'on' : ''}`}
              onClick={() => { updateUser({ searchStatus: s.id }); setStatusOpen(false) }}>
              <i />
              <span className="pf-option-text"><b>{s.label}</b><span>{s.hint}</span></span>
              {s.id === status.id && <Check size={20} weight="bold" />}
            </button>
          ))}
        </div>
      </Sheet>
      {!isEmp && <LocationSheet open={locOpen} onClose={() => setLocOpen(false)} />}

    </div>
  )
}

// Ish izlovchi — 5 qadamli rezyume ustasi, ish beruvchi — kompaniya profili
export function ProfileEdit() {
  const { user } = useApp()
  return user.role === 'employer' ? <CompanyEdit /> : <ResumeBuilder />
}

function CompanyEdit() {
  const { user, updateUser, notify } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({
    name: user.name || '', phone: user.phone || '', city: user.city || 'Toshkent',
    category: user.industry || user.category || 'it', about: user.about || '', company: user.company || '', position: user.position || '',
    email: user.email || '', telegram: user.telegram || '', photo: user.photo || '',
  })
  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try { const photo = await readPhoto(file); setF((p) => ({ ...p, photo })) } catch { notify("Rasmni o'qib bo'lmadi") }
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const pick = (k) => (v) => setF({ ...f, [k]: v })

  const save = (e) => {
    e.preventDefault()
    updateUser({ ...f, industry: f.category })
    notify("Ma'lumotlar saqlandi")
    nav('/profile')
  }

  return (
    <div className="page">
      <TopBar title="Kompaniya profili" />
      <form className="page-body form" onSubmit={save}>
        <div className="edit-banner">
          <Icon3D name="building" size={84} />
          <div><b>Kompaniyangizni tanishtiring</b>
            <span className="muted">Nomzodlar ishonchli ish beruvchilarni tanlaydi</span></div>
        </div>

        <fieldset className="card-set">
          <legend>Asosiy</legend>
          <div className="avatar-picker">
            <Avatar name={f.company || 'A'} color={user.color} size={72} radius={24} photo={f.photo} />
            <div>
              <label className="btn btn-ghost btn-sm">
                <input type="file" accept="image/*" onChange={pickPhoto} />
                {f.photo ? "Rasmni o'zgartirish" : 'Rasm yuklash'}
              </label>
              {f.photo && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setF({ ...f, photo: '' })}>O'chirish</button>}
            </div>
          </div>
          <label className="field"><span>Kompaniya nomi</span><input value={f.company} onChange={set('company')} /></label>
          <label className="field"><span>Mas'ul shaxs</span><input value={f.name} onChange={set('name')} required /></label>
          <label className="field"><span>Lavozim</span><input value={f.position} onChange={set('position')} placeholder="HR menejer" /></label>
          <div className="field-row">
            <label className="field"><span>Telefon</span><input value={f.phone} onChange={set('phone')} inputMode="tel" /></label>
            <label className="field"><span>Shahar</span><Select value={f.city} options={CITIES} onChange={pick('city')} /></label>
          </div>
          <div className="field-row">
            <label className="field"><span>Email</span><input type="email" value={f.email} onChange={set('email')} placeholder="ism@mail.uz" /></label>
            <label className="field"><span>Telegram</span><input value={f.telegram} onChange={set('telegram')} placeholder="@username" /></label>
          </div>
          <label className="field"><span>Soha</span>
            <Select value={f.category} options={CAT_OPTS} onChange={pick('category')} /></label>
          <label className="field"><span>Kompaniya haqida</span><textarea rows={4} value={f.about} onChange={set('about')} /></label>
        </fieldset>

        <button className="btn btn-primary btn-lg btn-block" type="submit">Saqlash</button>
      </form>
    </div>
  )
}
