import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CaretRight, Car, IdentificationCard, LockSimple, PencilSimple, Plus, SignOut, WarningCircle,
} from '@phosphor-icons/react'
import { FaTelegramPlane } from 'react-icons/fa'
import { FaEnvelope, FaPhone } from 'react-icons/fa6'
import { Avatar, Select, Sheet } from './UI'
import { SocialSheet, SocialTiles } from './SocialContacts'
import { profileCompletion, useApp } from '../context/AppContext'
import { catName, formatSum } from '../data/mock'
import { EMPLOYMENT, LANG_LEVELS, SOCIAL, WORK_MODES } from '../data/resume'
import { fullName, placeText } from './ResumeView'
import { tr, tx } from '../i18n'


const EDIT = '/profile/edit'
const APPLY_GOAL = 10

const STATUS_OPTS = [
  { value: 'active', label: 'Faol ish qidiryapman' },
  { value: 'open', label: "Takliflarni ko'rib chiqaman" },
  { value: 'off', label: 'Ish qidirmayapman' },
]

const labels = (list, ids) => list.filter((o) => ids?.includes(o.id)).map((o) => tr(o.label)).join(', ')

// sarlavha + o'ng tomonda "+ Qo'shish"
function Sec({ title, add = true, onAdd, children }) {
  return (
    <section className="pd-sec">
      <div className="pd-sec-head">
        <h2>{title}</h2>
        {onAdd ? <button type="button" className="pd-add" onClick={onAdd}><Plus size={14} weight="bold" /> {tr("Qo'shish")}</button>
          : add && <Link to={EDIT} className="pd-add"><Plus size={14} weight="bold" /> {tr("Qo'shish")}</Link>}
      </div>
      {children}
    </section>
  )
}

// tahrirlash qalami bilan qator
function Row({ k, v }) {
  return (
    <Link to={EDIT} className="pd-row">
      <span><small>{tr(k)}</small><b>{tr(v)}</b></span>
      <PencilSimple size={18} className="pd-pen" />
    </Link>
  )
}

// bo'sh bo'lim: izoh + tugma
function Empty({ text, btn = "Qo'shish" }) {
  return (
    <div className="pd-card pd-empty">
      <p>{text}</p>
      <Link to={EDIT} className="pd-btn">{tr(btn)}</Link>
    </div>
  )
}

// Profil — desktop/laptop ko'rinishi (≥1024px): chapda rasm va yordamchi kartalar, o'ngda rezyume bo'limlari
export default function ProfileDesktop() {
  const { user, updateUser, applications, logout } = useApp()
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
    { key: 'phone', icon: FaPhone, label: tr('Telefon'), value: user.phone, href: user.phone && `tel:${user.phone.replace(/\s/g, '')}` },
    { key: 'email', icon: FaEnvelope, label: tr('Email'), value: user.email, href: user.email && `mailto:${user.email}` },
    { key: 'tg', icon: FaTelegramPlane, label: tr('Telegram'), value: user.telegram, href: user.telegram && `https://t.me/${user.telegram.replace(/^@/, '')}` },
  ]

  return (
    <div className="pd">
      <aside className="pd-side">
        <div className="pd-photo">
          <Link to={EDIT} className="pd-photo-img" aria-label={tr("Rasmni o'zgartirish")}>
            {user.photo ? <img src={user.photo} alt="" /> : <img src="/avatar-default.svg" alt="" className="sil" />}
          </Link>
          {photoTip && (
            <div className="pd-photo-tip">
              <span>{tr("Rasm qo'shilganmi? Rasmli rezyumelar ko'proq e'tibor tortadi")}</span>
              <Link to={EDIT} className="pd-btn sm" onClick={() => setPhotoTip(false)}>{tr("Qo'shish")}</Link>
            </div>
          )}
        </div>

        <div className="pd-card pd-status">
          <Select value={user.searchStatus || 'active'} options={STATUS_OPTS} onChange={(v) => updateUser({ searchStatus: v })} />
        </div>

        <Link to="/jobs" className="pd-card pd-goal">
          <div className="pd-goal-head">
            <b><em>{tr('{n} marta', { n: APPLY_GOAL })}</em> {tr('ariza qoldiring')}</b>
            <CaretRight size={16} />
          </div>
          <span>{tr("~{n} ta ariza — statistikaga ko'ra, taklif olish uchun shuncha kerak", { n: APPLY_GOAL })}</span>
          <div className="pd-bar"><i style={{ width: `${(sent / APPLY_GOAL) * 100}%` }} /></div>
          <small>{sent} / {APPLY_GOAL}</small>
        </Link>

      </aside>

      <div className="pd-main">
        <header className="pd-head">
          <div>
            <h1>{name}</h1>
            {place && <span className="pd-city">{place}</span>}
          </div>
          <div className="pd-head-actions">
            <button type="button" className="pd-ico-btn danger" onClick={() => setConfirmOut(true)} aria-label={tr("Akkauntdan chiqish")} title={tr("Akkauntdan chiqish")}><SignOut size={18} /></button>
            <Link to={EDIT} className="pd-ico-btn" aria-label={tr("Tahrirlash")}><PencilSimple size={18} /></Link>
          </div>
        </header>
        <Sheet open={confirmOut} onClose={() => setConfirmOut(false)} title={tr("Akkauntdan chiqish")}>
          <div className="st-confirm">
            <p>{tr("Haqiqatan ham akkauntdan chiqmoqchimisiz? Qayta kirish uchun telefon raqamingiz kerak bo'ladi.")}</p>
            <button type="button" className="btn btn-danger btn-lg btn-block" onClick={logout}>{tr("Chiqish")}</button>
            <button type="button" className="btn btn-ghost btn-lg btn-block" onClick={() => setConfirmOut(false)}>{tr("Bekor qilish")}</button>
          </div>
        </Sheet>

        <section className="pd-sec">
          <div className="pd-sec-head">
            <h2>{tr("Mening rezyumeyim")}</h2>
            <Link to={EDIT} className="pd-add">{user.headline ? tr('Rezyumeni tahrirlash') : tr('Rezyume yaratish')}</Link>
          </div>
          <div className="pd-card pd-resume">
            <div className="pd-resume-top">
              <div>
                <b className={user.headline ? '' : 'muted'}>{user.headline || tr("Kasb ko'rsatilmagan")}</b>
                <small>{user.salary ? tr("{a} so'mdan", { a: formatSum(user.salary) }) : tr('Maosh kelishiladi')}</small>
              </div>
              <Avatar name={name} color={user.color} size={44} radius={14} photo={user.photo} silhouette />
            </div>
            {pct < 100 ? (
              <div className="pd-alert">
                <WarningCircle size={18} weight="fill" />
                <div><b>{tr("Rezyume {n}% to'ldirilgan", { n: pct })}</b><span>{tr("To'liq rezyume ish beruvchilarga ko'rinadi va 3 barobar ko'p taklif oladi")}</span></div>
              </div>
            ) : (
              <div className="pd-alert ok">
                <LockSimple size={18} weight="fill" />
                <div><b>{tr("Rezyume faol")}</b><span>{tr("Ish beruvchilar sizni QadamAI orqali topishadi")}</span></div>
              </div>
            )}
            <div className="pd-resume-foot">
              <Link to={EDIT} className="pd-btn">{pct < 100 ? tr("To'ldirish") : tr('Tahrirlash')}</Link>
              <Link to="/applications" className="pd-muted-link">{tr('{n} ta ariza', { n: applications.length })}</Link>
            </div>
          </div>
        </section>

        <Sec title={tr("Qidiruv sozlamalari")} add={false}>
          <div className="pd-card pd-rows">
            <Row k="Qayerda yashaysiz" v={place || "Ko'rsatilmagan"} />
            <Row k="Sizni nima qiziqtiryapti" v={interest || "Ko'rsatilmagan"} />
            <Row k="Ish formati" v={labels(WORK_MODES, user.workMode) || labels(EMPLOYMENT, user.employment) || user.format?.join(', ') || "Ko'rsatilmagan"} />
          </div>
        </Sec>

        <Sec title={tr("Kontaktlar")} add={false}>
          <div className="pd-contacts">
            {contacts.map((c) => {
              const Ic = c.icon
              const body = <><span className={`pd-contact-ico ${c.key}`}><Ic size={16} /></span><span><b>{tr(c.label)}</b><small>{c.value || tr("Qo'shish")}</small></span></>
              return c.href
                ? <a key={c.key} href={c.href} className="pd-contact" {...(c.key === 'tg' ? { target: '_blank', rel: 'noreferrer' } : {})}>{body}</a>
                : <Link key={c.key} to={EDIT} className="pd-contact is-empty">{body}</Link>
            })}
          </div>
        </Sec>

        <Sec title={tr("Boshqa aloqa usullari")} onAdd={() => setSocial({ open: true, id: null })}>
          <SocialTiles onEdit={(id) => setSocial({ open: true, id })} />
        </Sec>
        <SocialSheet open={social.open} editId={social.id} onClose={() => setSocial((x) => ({ ...x, open: false }))} />

        <Sec title={tr("Ish tajribasi")}>
          {user.experience?.length ? (
            <div className="pd-card pd-rows">
              {user.experience.map((e, i) => (
                <Row key={i} v={e.role}
                  k={[e.company, e.period || (e.from && `${e.from} – ${e.current ? 'hozirgacha' : e.to || ''}`)].filter(Boolean).join(' · ') || 'Ish joyi'} />
              ))}
            </div>
          ) : <Empty text={tr("Tajriba va yutuqlaringizni qo'shing — ish beruvchilar nimalarni uddalashingizni ko'radi")} />}
        </Sec>

        <Sec title={tr("Ta'lim")}>
          {edus.length ? (
            <div className="pd-card pd-rows">
              {edus.map((e, i) => (
                <Row key={i} v={[e.school, e.faculty].filter(Boolean).join(', ')}
                  k={[e.level, e.to || (e.current && "o'qimoqda")].filter(Boolean).join(' · ') || "Ta'lim muassasasi"} />
              ))}
            </div>
          ) : <Empty text={tr("Qayerda o'qiganingizni ko'rsating")} />}
        </Sec>

        <Sec title={tr("Malaka oshirish, kurslar")}>
          {certs.length > 0 && (
            <div className="pd-card pd-rows">
              {certs.map((c, i) => <Row key={i} k={[c.org, c.year].filter(Boolean).join(' · ') || 'Sertifikat'} v={c.name} />)}
            </div>
          )}
        </Sec>

        <Sec title={tr("Ko'nikmalar")}>
          {user.skills?.length ? (
            <div className="pd-card"><div className="pd-chips">{user.skills.map((s) => <span key={s}>{s}</span>)}</div></div>
          ) : <Empty text={tr("Ko'nikmalaringiz bo'yicha QadamAI sizga mos ishlarni topadi")} />}
        </Sec>

        <Sec title={tr("O'zim haqimda")} add={!user.about}>
          {user.about
            ? <Link to={EDIT} className="pd-card pd-about"><p>{tx(user.about)}</p><PencilSimple size={18} className="pd-pen" /></Link>
            : <Empty text={tr("Bir-ikki jumlada o'zingizni tanishtiring")} btn="Yozish" />}
        </Sec>

        <Sec title={tr("Hujjatlar")} add={false}>
          <div className="pd-card pd-rows">
            <Row k="Ijtimoiy toifa" v={labels(SOCIAL, user.social) || "Ko'rsatilmagan"} />
            <Link to={EDIT} className="pd-row">
              <span><small><Car size={13} /> {tr("Haydovchilik guvohnomasi")}</small><b>{user.driving?.length ? tr('{list} toifa', { list: user.driving.join(', ') }) : tr("Ko'rsatilmagan")}</b></span>
              <PencilSimple size={18} className="pd-pen" />
            </Link>
          </div>
        </Sec>

        <Sec title={tr("Tillar")}>
          {langs.length ? (
            <div className="pd-card pd-rows">
              {langs.map((l) => <Row key={l.lang} v={l.lang} k={LANG_LEVELS.find((x) => x.value === l.level)?.label || l.level || "Daraja ko'rsatilmagan"} />)}
            </div>
          ) : <Empty text={tr("Qaysi tillarni bilishingizni ko'rsating")} />}
        </Sec>

        <p className="pd-foot"><IdentificationCard size={16} /> {tr("Barcha ma'lumotlarni")} <Link to={EDIT}>{tr('rezyume ustasi')}</Link> {tr('orqali tahrirlashingiz mumkin')}</p>
      </div>
    </div>
  )
}
