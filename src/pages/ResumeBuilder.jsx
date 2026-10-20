import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, CalendarBlank, Camera, ChartBar, CheckCircle, GraduationCap, Info, MagnifyingGlass, Pause, PencilSimple,
  Plus, Star, Trash, TrendUp, X, Certificate,
} from '@phosphor-icons/react'
import { Sheet, Select, TopBar } from '../components/UI'
import { Check2, Chips, Field, Stepper } from '../components/Wizard'
import { useApp } from '../context/AppContext'
import { CATEGORIES, formatSum } from '../data/mock'
import {
  DRIVING, EDU_LEVELS, EMPLOYMENT, EXP_LEVELS, LANGUAGES, LANG_LEVELS, MONTHS, REGIONS, SEARCH_OPTIONS, SKILL_LEVELS, SKILL_SUGGEST,
  SOCIAL, WORK_MODES, WORK_TIME, duration, findRegion, monthText, regionByCity,
} from '../data/resume'
import { PHONE_PREFIX, checkUzPhone, formatUzPhone } from '../lib/phone'
import { readPhoto } from '../lib/photo'

const STEPS = ["Shaxsiy ma'lumotlar", 'Lavozim va mutaxassislik', 'Ish tajribasi', "Ta'lim", "Ko'nikmalar"]
const EXP_ICONS = { none: Briefcase, lt1: CalendarBlank, '1-3': ChartBar, '3-5': TrendUp, '5+': Star }
const SEARCH_ICONS = { active: MagnifyingGlass, open: Briefcase, off: Pause }
const CAT_OPTS = CATEGORIES.map((c) => ({ value: c.id, label: c.name }))
const REGION_OPTS = REGIONS.map((r) => ({ value: r.id, label: r.name }))
const YEARS = Array.from({ length: 60 }, (_, i) => String(new Date().getFullYear() - i))
const MONTH_OPTS = MONTHS.map((m, i) => ({ value: String(i + 1).padStart(2, '0'), label: m }))
const LIST = { exp: 'experience', edu: 'educations', cert: 'certificates' }
const BLANK = {
  exp: { role: '', company: '', from: '', to: '', current: false, desc: '' },
  edu: { level: '', school: '', faculty: '', from: '', to: '', current: false },
  cert: { name: '', org: '', year: '' },
}
const MAX_SKILLS = 20

const digits = (s) => String(s || '').replace(/\D/g, '')
const isYm = (v) => /^\d{4}-\d{2}$/.test(v || '')
const langShort = (l) => l.replace(/ tili$/, '')

function age(date) {
  const b = new Date(date), n = new Date()
  let a = n.getFullYear() - b.getFullYear()
  if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--
  return a
}

// Profildagi ma'lumotlardan qoralama (eski formatdagi maydonlar ham qo'llab-quvvatlanadi)
function initDraft(u) {
  const [first = '', ...rest] = (u.name || '').trim().split(/\s+/)
  return {
    photo: u.photo || '',
    lastName: u.lastName ?? rest.join(' '),
    firstName: u.firstName ?? first,
    middleName: u.middleName || '',
    birthDate: u.birthDate || '',
    phone: u.phone ? formatUzPhone(u.phone) : PHONE_PREFIX,
    email: u.email || '',
    telegram: u.telegram || '',
    region: u.region || regionByCity(u.city)?.id || '',
    district: u.district || '',
    mahalla: u.mahalla || '',
    about: u.about || '',
    relocate: !!u.relocate,
    category: u.category || '',
    headline: u.headline || '',
    expLevel: u.expLevel || '',
    salary: u.salary ? formatSum(u.salary) : '',
    employment: u.employment || [],
    workMode: u.workMode || [],
    workTime: u.workTime || [],
    experience: (u.experience || []).map((e) => ({ ...BLANK.exp, ...e })),
    hasBreak: !!u.careerBreak,
    careerBreak: u.careerBreak || '',
    educations: u.educations || (u.education ? [{ ...BLANK.edu, school: u.education }] : []),
    certificates: u.certificates || [],
    skills: u.skillsDetail || (u.skills || []).map((name) => ({ name, level: SKILL_LEVELS[1] })),
    langs: u.langs || [{ lang: "O'zbek tili", level: 'native' }],
    hasDriving: !!u.driving?.length,
    driving: u.driving || [],
    social: u.social || [],
    searchStatus: u.searchStatus || 'active',
  }
}

// Qoralama → profil maydonlari. Eski maydonlar (name, city, skills, languages, education, format) ham to'ldiriladi,
// shunda profil sahifasi, nomzodlar ro'yxati va QadamAI avvalgidek ishlaydi
function toUser(d, u) {
  const region = findRegion(d.region)
  const edu = d.educations[0]
  const langs = d.langs.filter((l) => l.lang)
  return {
    photo: d.photo,
    lastName: d.lastName.trim(), firstName: d.firstName.trim(), middleName: d.middleName.trim(),
    name: [d.firstName.trim(), d.lastName.trim()].filter(Boolean).join(' ') || u.name,
    birthDate: d.birthDate, phone: d.phone, email: d.email.trim(), telegram: d.telegram.trim(),
    region: d.region, district: d.district, mahalla: d.mahalla.trim(), city: region?.city || u.city,
    about: d.about.trim(), relocate: d.relocate,
    category: d.category, industry: d.category, headline: d.headline.trim(), expLevel: d.expLevel,
    years: EXP_LEVELS.find((x) => x.id === d.expLevel)?.years ?? u.years,
    salary: Number(digits(d.salary)) || '',
    employment: d.employment, workMode: d.workMode, workTime: d.workTime,
    format: [...EMPLOYMENT, ...WORK_MODES].filter((o) => d.employment.includes(o.id) || d.workMode.includes(o.id)).map((o) => o.short),
    experience: d.experience.map((e) => ({
      ...e, period: e.from ? `${monthText(e.from)} – ${e.current ? 'hozir' : monthText(e.to)}` : e.period || '',
    })),
    careerBreak: d.hasBreak ? d.careerBreak.trim() || "Ishda tanaffus bo'lgan" : '',
    educations: d.educations,
    education: edu ? [edu.school, edu.faculty].filter(Boolean).join(', ') : '',
    certificates: d.certificates,
    skillsDetail: d.skills, skills: d.skills.map((s) => s.name),
    langs, languages: langs.map((l) => (l.level && l.level !== 'native' ? `${langShort(l.lang)} (${l.level})` : langShort(l.lang))),
    driving: d.hasDriving ? d.driving : [],
    social: d.social,
    searchStatus: d.searchStatus,
  }
}

function validate(step, d) {
  const e = {}
  if (step === 0) {
    if (!d.lastName.trim()) e.lastName = 'Familiyani kiriting'
    if (!d.firstName.trim()) e.firstName = 'Ismni kiriting'
    if (!d.birthDate) e.birthDate = "Tug'ilgan sanani kiriting"
    else if (age(d.birthDate) < 14 || age(d.birthDate) > 80) e.birthDate = "Sanani to'g'ri kiriting"
    const ph = checkUzPhone(d.phone)
    if (ph !== 'ok') e.phone = ph === 'code' ? "Operator kodi noto'g'ri" : "Raqamni to'liq kiriting"
    if (d.email.trim() && !/^\S+@\S+\.\S+$/.test(d.email.trim())) e.email = "Email manzil noto'g'ri"
    if (!d.region) e.region = 'Hududni tanlang'
    if (!d.district) e.district = 'Tumanni tanlang'
  }
  if (step === 1) {
    if (!d.category) e.category = 'Sohani tanlang'
    if (!d.headline.trim()) e.headline = 'Lavozimni kiriting'
  }
  if (step === 4) {
    if (d.langs.some((l) => l.lang && !l.level)) e.langs = 'Til darajasini tanlang'
    if (!d.searchStatus) e.searchStatus = 'Holatni tanlang'
  }
  return e
}

function entryErrors(kind, x) {
  const e = {}
  if (kind === 'exp') {
    if (!x.role.trim()) e.role = 'Lavozimni kiriting'
    if (!x.company.trim()) e.company = 'Tashkilot nomini kiriting'
    if (!isYm(x.from)) e.from = 'Boshlangan oyni tanlang'
    if (!x.current && !isYm(x.to)) e.to = 'Tugagan oyni tanlang'
    else if (!x.current && isYm(x.from) && x.to < x.from) e.to = 'Boshlanishidan oldin bo\'lishi mumkin emas'
  }
  if (kind === 'edu') {
    if (!x.level) e.level = "Ta'lim darajasini tanlang"
    if (!x.school.trim()) e.school = "O'quv muassasasini kiriting"
    if (!x.current && x.from && x.to && x.to < x.from) e.to = "Yillarni to'g'ri tanlang"
  }
  if (kind === 'cert' && !x.name.trim()) e.name = 'Sertifikat nomini kiriting'
  return e
}

function MonthYear({ value, onChange, disabled }) {
  const [y = '', m = ''] = (value || '').split('-')
  if (disabled) return <div className="rb-my"><div className="rb-my-off">Hozirgacha</div></div>
  return (
    <div className="rb-my">
      <Select value={m} options={MONTH_OPTS} onChange={(v) => onChange(`${y}-${v}`)} placeholder="Oy" />
      <Select value={y} options={YEARS} onChange={(v) => onChange(`${v}-${m}`)} placeholder="Yil" />
    </div>
  )
}

/* ---------- Asosiy sahifa ---------- */

export default function ResumeBuilder() {
  const { user, updateUser, notify } = useApp()
  const nav = useNavigate()
  const [d, setD] = useState(() => initDraft(user))
  const [step, setStep] = useState(0)
  const [reached, setReached] = useState(() => (user.headline ? STEPS.length - 1 : 0))
  const [showErr, setShowErr] = useState(false)
  const [entry, setEntry] = useState(null) // { kind, index, data, tried }
  const [skillText, setSkillText] = useState('')

  const set = (k, v) => setD((p) => ({ ...p, [k]: v }))
  const bind = (k) => ({ value: d[k], onChange: (e) => set(k, e.target.value) })
  const toggleIn = (k, id) => setD((p) => ({ ...p, [k]: p[k].includes(id) ? p[k].filter((x) => x !== id) : [...p[k], id] }))
  const errors = validate(step, d)
  const err = (k) => (showErr ? errors[k] : undefined)
  const region = findRegion(d.region)
  const registeredPhone = user.phone && digits(user.phone) === digits(d.phone)

  const go = (i) => {
    setStep(i)
    setShowErr(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const failed = () => {
    setShowErr(true)
    requestAnimationFrame(() => document.querySelector('.rb-field.has-err, .rb-err')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }
  const next = () => {
    if (Object.keys(errors).length) return failed()
    updateUser(toUser(d, user)) // har qadamda saqlanadi — yarim yo'lda chiqib ketsa ham ma'lumot yo'qolmaydi
    if (step === STEPS.length - 1) {
      notify('Rezyume saqlandi')
      nav('/profile')
      return
    }
    setReached((r) => Math.max(r, step + 1))
    go(step + 1)
  }
  const goStep = (i) => {
    if (i === step) return
    if (i > step && Object.keys(errors).length) return failed()
    if (i > step) updateUser(toUser(d, user))
    go(i)
  }

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return notify('Rasm 5 MB dan oshmasin')
    try { set('photo', await readPhoto(file)) } catch { notify("Rasmni o'qib bo'lmadi") }
  }

  /* ro'yxat yozuvlari (tajriba, ta'lim, sertifikat) */
  const openEntry = (kind, index = -1) =>
    setEntry({ kind, index, tried: false, data: index >= 0 ? { ...BLANK[kind], ...d[LIST[kind]][index] } : { ...BLANK[kind] } })
  const setEntryField = (k, v) => setEntry((p) => ({ ...p, data: { ...p.data, [k]: v } }))
  const saveEntry = () => {
    if (Object.keys(entryErrors(entry.kind, entry.data)).length) return setEntry({ ...entry, tried: true })
    const k = LIST[entry.kind]
    const data = entry.data.current ? { ...entry.data, to: '' } : entry.data
    setD((p) => {
      const list = entry.index >= 0 ? p[k].map((x, i) => (i === entry.index ? data : x)) : [...p[k], data]
      // eng so'nggi ish/o'qish yuqorida
      if (entry.kind !== 'cert') list.sort((a, b) => (b.current - a.current) || String(b.from).localeCompare(String(a.from)))
      return { ...p, [k]: list }
    })
    setEntry(null)
  }
  const removeEntry = (kind, index) => setD((p) => ({ ...p, [LIST[kind]]: p[LIST[kind]].filter((_, i) => i !== index) }))

  /* ko'nikmalar */
  const addSkill = (raw) => {
    const name = raw.trim().replace(/\s+/g, ' ')
    if (name.length < 2) return
    if (d.skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) return setSkillText('')
    if (d.skills.length >= MAX_SKILLS) return notify(`Ko'pi bilan ${MAX_SKILLS} ta ko'nikma`)
    set('skills', [...d.skills, { name, level: SKILL_LEVELS[1] }])
    setSkillText('')
  }
  const cycleSkill = (i) => set('skills', d.skills.map((s, j) =>
    j === i ? { ...s, level: SKILL_LEVELS[(SKILL_LEVELS.indexOf(s.level) + 1) % SKILL_LEVELS.length] } : s))
  const suggestions = (SKILL_SUGGEST[d.category] || SKILL_SUGGEST.other)
    .filter((n) => !d.skills.some((s) => s.name.toLowerCase() === n.toLowerCase()))

  /* tillar */
  const setLang = (i, k, v) => set('langs', d.langs.map((l, j) => (j === i ? { ...l, [k]: v } : l)))
  const langOpts = (i) => LANGUAGES.filter((l) => l === d.langs[i].lang || !d.langs.some((x) => x.lang === l))

  const e = entry && entry.tried ? entryErrors(entry.kind, entry.data) : {}
  const x = entry?.data

  return (
    <div className="page rb">
      <TopBar title={user.headline ? 'Rezyumeni tahrirlash' : 'Rezyume yaratish'} />
      <div className="page-body rb-body">
        <Stepper steps={STEPS} step={step} reached={reached} onGo={goStep} label="Rezyume qadamlari" />

        <section className="rb-card">
          <div className="rb-head">
            <span>{step + 1}-qadam · {STEPS.length} tadan</span>
            <h2>{STEPS[step]}</h2>
          </div>

          {step === 0 && (
            <>
              <div className="rb-photo">
                <label className="rb-photo-box">
                  <input type="file" accept="image/jpeg,image/png" onChange={pickPhoto} />
                  {d.photo ? <img src={d.photo} alt="Rezyume rasmi" /> : <><Camera size={28} /><span>Rasm</span></>}
                </label>
                <div>
                  <b>Fotosurat</b>
                  <p>Rasmli rezyume ko'proq ko'riladi. Yuzingiz aniq ko'rinadigan, ish uslubidagi surat tanlang.</p>
                  <div className="rb-photo-actions">
                    <span className="rb-tag">JPG yoki PNG · 5 MB gacha</span>
                    {d.photo && <button type="button" className="rb-link danger" onClick={() => set('photo', '')}>O'chirish</button>}
                  </div>
                </div>
              </div>

              <div className="rb-grid">
                <Field label="Familiya" req error={err('lastName')}><input {...bind('lastName')} autoComplete="family-name" placeholder="Rahimova" /></Field>
                <Field label="Ism" req error={err('firstName')}><input {...bind('firstName')} autoComplete="given-name" placeholder="Malika" /></Field>
                <Field label="Otasining ismi"><input {...bind('middleName')} placeholder="Akmal qizi" /></Field>
                <Field label="Tug'ilgan sana" req error={err('birthDate')}>
                  <input type="date" {...bind('birthDate')} max={new Date().toISOString().slice(0, 10)} min="1940-01-01" />
                </Field>
                <Field label="Telefon raqami" req error={err('phone')}>
                  <input value={d.phone} inputMode="tel" autoComplete="tel" onChange={(ev) => set('phone', formatUzPhone(ev.target.value))} />
                  {!err('phone') && registeredPhone && <small className="rb-ok"><CheckCircle size={16} weight="fill" /> Ro'yxatdan o'tgan raqam</small>}
                </Field>
                <Field label="Email" error={err('email')}><input type="email" {...bind('email')} autoComplete="email" placeholder="ism@mail.uz" /></Field>
                <Field as="div" label="Viloyat / shahar" req error={err('region')}>
                  <Select value={d.region} options={REGION_OPTS} placeholder="Viloyatni tanlang"
                    onChange={(v) => setD((p) => ({ ...p, region: v, district: v === p.region ? p.district : '' }))} />
                </Field>
                <Field as="div" label="Tuman / shahar" req error={err('district')}>
                  {region
                    ? <Select value={d.district} options={region.districts} placeholder="Tumanni tanlang" onChange={(v) => set('district', v)} />
                    : <button type="button" className="sel-btn" disabled><span className="sel-val sel-ph">Avval viloyatni tanlang</span></button>}
                </Field>
                <Field label="Mahalla (MFY)"><input {...bind('mahalla')} placeholder="Mahalla nomi" /></Field>
                <Field label="Telegram"><input {...bind('telegram')} placeholder="@username" /></Field>
                <Field label="O'zim haqimda" wide hint={`${d.about.length} / 1000 · 120 belgidan ko'p bo'lsa, rezyume raqobatda ajralib turadi`}>
                  <textarea rows={4} maxLength={1000} {...bind('about')}
                    placeholder="Tajribangiz, kuchli tomonlaringiz va qanday ish izlayotganingizni qisqa yozing" />
                </Field>
              </div>
              <Check2 checked={d.relocate} onChange={(v) => set('relocate', v)}>Boshqa shaharga ko'chishga tayyorman</Check2>
            </>
          )}

          {step === 1 && (
            <div className="rb-stack">
              <div className="rb-grid two">
                <Field as="div" label="Soha" req error={err('category')}>
                  <Select value={d.category} options={CAT_OPTS} placeholder="Sohani tanlang" onChange={(v) => set('category', v)} />
                </Field>
                <Field label="Kim bo'lib ishlamoqchisiz?" req error={err('headline')}>
                  <input {...bind('headline')} placeholder="Masalan: Buxgalter, enaga, SMM menejer" maxLength={80} />
                </Field>
              </div>
              <Field as="div" label="Tajribangiz qancha?">
                <Chips options={EXP_LEVELS} icons={EXP_ICONS} isOn={(id) => d.expLevel === id} onPick={(id) => set('expLevel', id)} />
              </Field>
              <Field label="Kutilayotgan oylik maosh (so'm)" hint="Bo'sh qoldirsangiz — «Kelishiladi»">
                <input className="rb-salary" value={d.salary} inputMode="numeric" placeholder="Masalan: 5 000 000"
                  onChange={(ev) => set('salary', digits(ev.target.value) ? formatSum(Number(digits(ev.target.value).slice(0, 10))) : '')} />
              </Field>
              <Field as="div" label="Bandlik turi" hint="Bir nechtasini tanlash mumkin">
                <Chips options={EMPLOYMENT} isOn={(id) => d.employment.includes(id)} onPick={(id) => toggleIn('employment', id)} />
              </Field>
              <Field as="div" label="Ish usuli (rejimi)">
                <Chips options={WORK_MODES} isOn={(id) => d.workMode.includes(id)} onPick={(id) => toggleIn('workMode', id)} />
              </Field>
              <Field as="div" label="Qulay ish vaqti" hint="Farzandlaringiz bo'lsa, ish beruvchi grafikni oldindan biladi">
                <Chips options={WORK_TIME} isOn={(id) => d.workTime.includes(id)} onPick={(id) => toggleIn('workTime', id)} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="rb-stack">
              {d.experience.length ? (
                <ul className="rb-timeline">
                  {d.experience.map((it, i) => (
                    <li key={i}>
                      <span className="rb-tl-meta">
                        {it.from ? `${monthText(it.from)} – ${it.current ? 'hozirgacha' : monthText(it.to)}` : it.period}
                        {it.from && duration(it.from, it.current ? '' : it.to) && ` (${duration(it.from, it.current ? '' : it.to)})`}
                      </span>
                      <b className="rb-tl-org">{it.company}</b>
                      <span className="rb-tl-role">{it.role}</span>
                      {it.desc && <p>{it.desc}</p>}
                      <div className="rb-item-actions">
                        <button type="button" className="icon-btn sm" onClick={() => openEntry('exp', i)} aria-label="Tahrirlash"><PencilSimple size={17} /></button>
                        <button type="button" className="icon-btn sm" onClick={() => removeEntry('exp', i)} aria-label="O'chirish"><Trash size={17} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rb-note"><Info size={20} />
                  <span>Rasmiy ish joyi bo'lmasa ham — kasanachilik, oilaviy biznes, ko'ngillilik yoki amaliyotni qo'shishingiz mumkin. Tajriba yo'q bo'lsa, bu qadamni o'tkazib yuboring.</span>
                </div>
              )}
              <button type="button" className="btn btn-soft rb-add" onClick={() => openEntry('exp')}><Plus size={18} weight="bold" /> Ish tajribasini qo'shish</button>

              <div className="rb-sep" />
              <Check2 checked={d.hasBreak} onChange={(v) => set('hasBreak', v)}>Ishda tanaffus bo'lgan (masalan, bola parvarishi ta'tili)</Check2>
              {d.hasBreak && (
                <Field label="Izoh" hint="Ish beruvchi tanaffus sababini tushunadi — bu sizning afzalligingiz">
                  <input {...bind('careerBreak')} maxLength={150} placeholder="Masalan: 2021–2023 — bola parvarishi ta'tili" />
                </Field>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="rb-stack">
              {d.educations.map((it, i) => (
                <div key={i} className="rb-item">
                  <span className="rb-item-ico"><GraduationCap size={22} /></span>
                  <div className="rb-item-text">
                    <span className="rb-tl-meta">{[it.from && `${it.from} – ${it.current ? 'h.v.' : it.to || ''}`, it.level].filter(Boolean).join(' · ')}</span>
                    <b>{it.school}</b>
                    {it.faculty && <span>{it.faculty}</span>}
                  </div>
                  <div className="rb-item-actions">
                    <button type="button" className="icon-btn sm" onClick={() => openEntry('edu', i)} aria-label="Tahrirlash"><PencilSimple size={17} /></button>
                    <button type="button" className="icon-btn sm" onClick={() => removeEntry('edu', i)} aria-label="O'chirish"><Trash size={17} /></button>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-soft rb-add" onClick={() => openEntry('edu')}><Plus size={18} weight="bold" /> O'quv muassasasi qo'shish</button>

              <div className="rb-sep" />
              <h3 className="rb-sub">Sertifikat va kurslar</h3>
              {d.certificates.map((it, i) => (
                <div key={i} className="rb-item">
                  <span className="rb-item-ico"><Certificate size={22} /></span>
                  <div className="rb-item-text">
                    <b>{it.name}</b>
                    {(it.org || it.year) && <span>{[it.org, it.year].filter(Boolean).join(' · ')}</span>}
                  </div>
                  <div className="rb-item-actions">
                    <button type="button" className="icon-btn sm" onClick={() => openEntry('cert', i)} aria-label="Tahrirlash"><PencilSimple size={17} /></button>
                    <button type="button" className="icon-btn sm" onClick={() => removeEntry('cert', i)} aria-label="O'chirish"><Trash size={17} /></button>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-soft rb-add" onClick={() => openEntry('cert')}><Plus size={18} weight="bold" /> Sertifikat qo'shish</button>
            </div>
          )}

          {step === 4 && (
            <div className="rb-stack">
              <Field as="div" label="Kasbiy bilim va ko'nikmalar" hint="Darajani o'zgartirish uchun ustiga bosing">
                <div className="rb-skill-input">
                  <input value={skillText} maxLength={60} placeholder="Ko'nikma yozing va Enter bosing"
                    onChange={(ev) => setSkillText(ev.target.value)}
                    onKeyDown={(ev) => { if (ev.key === 'Enter') { ev.preventDefault(); addSkill(skillText) } }} />
                  <span className="rb-count">{d.skills.length} / {MAX_SKILLS}</span>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => addSkill(skillText)} disabled={skillText.trim().length < 2}>Qo'shish</button>
                </div>
              </Field>
              {d.skills.length > 0 && (
                <div className="rb-skills">
                  {d.skills.map((s, i) => (
                    <span key={s.name} className="rb-skill">
                      {s.name}
                      <button type="button" className="rb-skill-lvl" onClick={() => cycleSkill(i)} title="Darajani o'zgartirish">{s.level}</button>
                      <button type="button" className="rb-skill-x" onClick={() => set('skills', d.skills.filter((_, j) => j !== i))} aria-label={`${s.name} — o'chirish`}><X size={14} weight="bold" /></button>
                    </span>
                  ))}
                </div>
              )}
              {suggestions.length > 0 && (
                <div className="rb-suggest">
                  <span>Tavsiya:</span>
                  {suggestions.slice(0, 8).map((n) => (
                    <button key={n} type="button" onClick={() => addSkill(n)}><Plus size={13} weight="bold" /> {n}</button>
                  ))}
                </div>
              )}

              <div className="rb-box">
                <h3 className="rb-sub">Tillarni bilish</h3>
                {d.langs.map((l, i) => (
                  <div key={i} className="rb-lang">
                    <Select value={l.lang} options={langOpts(i)} placeholder="Til" onChange={(v) => setLang(i, 'lang', v)} />
                    <Select value={l.level} options={LANG_LEVELS} placeholder="Daraja" onChange={(v) => setLang(i, 'level', v)} />
                    <button type="button" className="icon-btn sm" onClick={() => set('langs', d.langs.filter((_, j) => j !== i))} aria-label="Tilni o'chirish"><Trash size={17} /></button>
                  </div>
                ))}
                {err('langs') && <small className="rb-err">{err('langs')}</small>}
                {d.langs.length < LANGUAGES.length && (
                  <button type="button" className="rb-link" onClick={() => set('langs', [...d.langs, { lang: '', level: '' }])}><Plus size={14} weight="bold" /> Til qo'shish</button>
                )}
              </div>

              <div className={`rb-box ${d.hasDriving ? '' : 'collapsed'}`}>
                {d.hasDriving ? (
                  <>
                    <div className="rb-box-head">
                      <h3 className="rb-sub">Haydovchilik guvohnomasi</h3>
                      <button type="button" className="rb-link danger" onClick={() => setD((p) => ({ ...p, hasDriving: false, driving: [] }))}>Olib tashlash</button>
                    </div>
                    <Chips options={DRIVING.map((c) => ({ id: c, label: c }))} isOn={(c) => d.driving.includes(c)} onPick={(c) => toggleIn('driving', c)} />
                  </>
                ) : (
                  <button type="button" className="rb-box-add" onClick={() => set('hasDriving', true)}><Plus size={18} weight="bold" /> Haydovchilik guvohnomasi</button>
                )}
              </div>

              <div>
                <h3 className="rb-sub">Ijtimoiy toifalar</h3>
                <p className="rb-hint rb-sub-hint">Ixtiyoriy. Faqat imtiyozli ish o'rinlari va davlat dasturlariga mos vakansiyalarni topish uchun.</p>
                <div className="rb-checks">
                  {SOCIAL.map((s) => <Check2 key={s.id} checked={d.social.includes(s.id)} onChange={() => toggleIn('social', s.id)}>{s.label}</Check2>)}
                </div>
              </div>

              <div className="rb-sep" />
              <div>
                <h3 className="rb-sub"><i className="rb-req">*</i>Ish qidiruvchi holati</h3>
                <p className="rb-hint rb-sub-hint">Hozirgi vaziyatingizga mosini tanlang</p>
                <div className="rb-status" role="radiogroup">
                  {SEARCH_OPTIONS.map((o) => {
                    const Ic = SEARCH_ICONS[o.id]
                    const on = d.searchStatus === o.id
                    return (
                      <button key={o.id} type="button" role="radio" aria-checked={on} className={`rb-status-opt ${on ? 'on' : ''}`} onClick={() => set('searchStatus', o.id)}>
                        <span className="rb-status-ico"><Ic size={20} weight={on ? 'bold' : 'regular'} /></span>
                        <span className="rb-status-text"><b>{o.label}</b><small>{o.hint}</small></span>
                        <i className="rb-radio" />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="rb-foot">
            {step > 0 ? <button type="button" className="btn btn-ghost" onClick={() => go(step - 1)}>Orqaga</button> : <span />}
            <button type="button" className="btn btn-primary rb-next" onClick={next}>
              {step === STEPS.length - 1 ? 'Saqlash' : (step === 2 && !d.experience.length) || (step === 3 && !d.educations.length) ? "O'tkazib yuborish" : 'Davom etish'}
            </button>
          </div>
        </section>
      </div>

      <Sheet open={!!entry} onClose={() => setEntry(null)}
        title={entry && `${entry.kind === 'exp' ? 'Ish tajribasi' : entry.kind === 'edu' ? "Ta'lim" : 'Sertifikat'}${entry.index >= 0 ? '' : ' qo\'shish'}`}>
        {entry && (
          <div className="rb-sheet">
            {entry.kind === 'exp' && (
              <>
                <Field label="Lavozim" req error={e.role}><input value={x.role} onChange={(ev) => setEntryField('role', ev.target.value)} placeholder="Masalan: Buxgalter" /></Field>
                <Field label="Tashkilot" req error={e.company}><input value={x.company} onChange={(ev) => setEntryField('company', ev.target.value)} placeholder="Kompaniya yoki tashkilot nomi" /></Field>
                <Field as="div" label="Boshlangan" req error={e.from}><MonthYear value={x.from} onChange={(v) => setEntryField('from', v)} /></Field>
                <Field as="div" label="Tugagan" req={!x.current} error={e.to}><MonthYear value={x.to} disabled={x.current} onChange={(v) => setEntryField('to', v)} /></Field>
                <Check2 checked={x.current} onChange={(v) => setEntryField('current', v)}>Hozir shu yerda ishlayman</Check2>
                <Field label="Vazifalar va yutuqlar"><textarea rows={3} maxLength={600} value={x.desc} onChange={(ev) => setEntryField('desc', ev.target.value)}
                  placeholder="Nimalar bilan shug'ullandingiz, qanday natijaga erishdingiz" /></Field>
              </>
            )}
            {entry.kind === 'edu' && (
              <>
                <Field as="div" label="Ta'lim darajasi" req error={e.level}><Select value={x.level} options={EDU_LEVELS} placeholder="Tanlang" onChange={(v) => setEntryField('level', v)} /></Field>
                <Field label="O'quv muassasasi" req error={e.school}><input value={x.school} onChange={(ev) => setEntryField('school', ev.target.value)} placeholder="Universitet, kollej yoki o'quv markazi" /></Field>
                <Field label="Fakultet / mutaxassislik"><input value={x.faculty} onChange={(ev) => setEntryField('faculty', ev.target.value)} placeholder="Masalan: Buxgalteriya hisobi" /></Field>
                <div className="rb-grid two tight">
                  <Field as="div" label="Boshlangan yil"><Select value={x.from} options={YEARS} placeholder="Yil" onChange={(v) => setEntryField('from', v)} /></Field>
                  <Field as="div" label="Tamomlagan yil" error={e.to}>
                    {x.current ? <div className="rb-my-off">Hozirgacha</div>
                      : <Select value={x.to} options={YEARS} placeholder="Yil" onChange={(v) => setEntryField('to', v)} />}
                  </Field>
                </div>
                <Check2 checked={x.current} onChange={(v) => setEntryField('current', v)}>Hozir o'qiyapman</Check2>
              </>
            )}
            {entry.kind === 'cert' && (
              <>
                <Field label="Sertifikat yoki kurs nomi" req error={e.name}><input value={x.name} onChange={(ev) => setEntryField('name', ev.target.value)} placeholder="Masalan: IELTS 6.5, 1C: Buxgalteriya" /></Field>
                <Field label="Bergan tashkilot"><input value={x.org} onChange={(ev) => setEntryField('org', ev.target.value)} placeholder="O'quv markazi yoki tashkilot" /></Field>
                <Field as="div" label="Olingan yil"><Select value={x.year} options={YEARS} placeholder="Yil" onChange={(v) => setEntryField('year', v)} /></Field>
              </>
            )}
            <button type="button" className="btn btn-primary btn-block" onClick={saveEntry}>Saqlash</button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
