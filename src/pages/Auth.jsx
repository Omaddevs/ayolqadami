import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CaretDown, Check, Eye, EyeSlash, GlobeSimple, X } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import Icon3D from '../components/Icon3D'
import { useApp, findAccount } from '../context/AppContext'
import { CATEGORIES, CITIES } from '../data/mock'
import { AUTH_LANGS, AUTH_TEXT } from '../data/authText'
import { PHONE_PREFIX, checkUzPhone, formatUzPhone } from '../lib/phone'
import { googleEnabled, googleSignIn, preloadGoogle } from '../lib/google'

const STEPS = 4
const ROW = 46 // shahar g'ildiragidagi qator balandligi (px)
const MIN_PW = 6
const MAX_CATS = 3

// Aylanuvchi tanlagich (iOS picker uslubida): o'rtadagi qator tanlangan hisoblanadi
function Wheel({ items, value, onChange, label }) {
  const ref = useRef(null)
  const idx = Math.max(0, items.indexOf(value))
  const timer = useRef(0)

  useEffect(() => { ref.current.scrollTop = idx * ROW }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const i = Math.min(items.length - 1, Math.max(0, Math.round(ref.current.scrollTop / ROW)))
      if (items[i] !== value) onChange(items[i])
    }, 60)
  }
  const pick = (i) => { ref.current.scrollTo({ top: i * ROW, behavior: 'smooth' }); onChange(items[i]) }
  const onKey = (e) => {
    if (e.key === 'ArrowDown' && idx < items.length - 1) { e.preventDefault(); pick(idx + 1) }
    if (e.key === 'ArrowUp' && idx > 0) { e.preventDefault(); pick(idx - 1) }
  }

  return (
    <div className="aw-wheel">
      <div className="aw-wheel-lines" aria-hidden="true" />
      <div className="aw-wheel-list" ref={ref} onScroll={onScroll} tabIndex={0} onKeyDown={onKey}
        role="listbox" aria-label={label} aria-activedescendant={`aw-city-${idx}`}>
        {items.map((it, i) => {
          const d = Math.abs(i - idx)
          return (
            <button key={it} id={`aw-city-${i}`} type="button" role="option" aria-selected={d === 0} tabIndex={-1}
              className={`aw-wheel-item d${Math.min(d, 3)}`} onClick={() => pick(i)}>{it}</button>
          )
        })}
      </div>
    </div>
  )
}

function LangPicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const cur = AUTH_LANGS.find((l) => l.id === value) || AUTH_LANGS[0]

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey, true) }
  }, [open])

  return (
    <div className="aw-lang" ref={ref}>
      <button type="button" className="aw-lang-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        aria-label={`${label}: ${cur.label}`}>
        <GlobeSimple size={17} weight="bold" /> {cur.short} <CaretDown size={12} weight="bold" className="aw-lang-caret" />
      </button>
      {open && (
        <div className="aw-lang-menu" role="listbox" aria-label={label}>
          {AUTH_LANGS.map((l) => (
            <button key={l.id} type="button" role="option" aria-selected={l.id === cur.id} className={l.id === cur.id ? 'on' : ''}
              onClick={() => { onChange(l.id); setOpen(false) }}>
              <span className="aw-lang-code">{l.short}</span> {l.label}
              {l.id === cur.id && <Check size={16} weight="bold" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Head({ step, onBack, right, backLabel }) {
  return (
    <div className="aw-head">
      <button type="button" className="aw-back" onClick={onBack} aria-label={backLabel}><ArrowLeft size={18} weight="bold" /></button>
      {step ? (
        <>
          <div className="aw-progress"><i style={{ width: `${(step / STEPS) * 100}%` }} /></div>
          <span className="aw-count">{step}/{STEPS}</span>
        </>
      ) : <span className="grow" />}
      {right}
    </div>
  )
}

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
)

function PasswordField({ label, value, onChange, placeholder, autoComplete, t }) {
  const [show, setShow] = useState(false)
  return (
    <label className="aw-field"><span>{label}</span>
      <div className="aw-pw">
        <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? t.hidePw : t.showPw} aria-pressed={show}>
          {show ? <EyeSlash size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </label>
  )
}

function PhoneField({ label, value, onChange, t, autoFocus }) {
  const state = checkUzPhone(value)
  return (
    <label className="aw-field"><span>{label}</span>
      <input value={value} onChange={(e) => onChange(formatUzPhone(e.target.value))} inputMode="tel" autoComplete="tel"
        placeholder={`${PHONE_PREFIX}XX XXX XX XX`} autoFocus={autoFocus} aria-invalid={state === 'code'}
        onFocus={(e) => { const n = e.target.value.length; e.target.setSelectionRange(n, n) }} />
      {state === 'code' && <em className="aw-hint bad">{t.errCode}</em>}
    </label>
  )
}

export default function Auth() {
  const { signUp, signIn, signInGoogle, closeAuth, notify, prefs, setPrefs } = useApp()
  const navigate = useNavigate()
  const closeToHome = () => { closeAuth(); navigate('/') }
  const lang = AUTH_TEXT[prefs.lang] ? prefs.lang : 'uz'
  const t = AUTH_TEXT[lang]
  const [mode, setMode] = useState('welcome') // 'welcome' | 'login' | 'signup'
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ role: null, name: '', phone: PHONE_PREFIX, password: '', company: '', city: 'Toshkent', categories: [], otherCategory: '', email: '', photo: '', google: false })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k, v) => { setErr(''); setForm((f) => ({ ...f, [k]: v })) }
  const isEmp = form.role === 'employer'
  const phoneState = checkUzPhone(form.phone)
  const pwOk = form.password.length >= MIN_PW

  useEffect(() => {
    preloadGoogle().catch(() => {}) // popup bosish ichida ochilishi uchun skriptni oldindan yuklaymiz
    const onKey = (e) => { if (e.key === 'Escape') closeAuth() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [closeAuth])

  const langPicker = <LangPicker value={lang} onChange={(id) => setPrefs({ lang: id })} label={t.lang} />
  const go = (m) => { setErr(''); setMode(m); setStep(1) }
  const back = () => {
    setErr('')
    if (mode === 'signup' && step > 1) setStep(step - 1)
    else go('welcome')
  }

  const phoneError = () => (phoneState === 'code' ? t.errCode : phoneState !== 'ok' ? t.errPhone : '')

  const google = async () => {
    if (!googleEnabled) return notify(t.googleOff)
    setErr('')
    setBusy(true)
    try {
      const g = await googleSignIn()
      if (signInGoogle(g)) return notify(t.hello)
      // yangi foydalanuvchi: Google ma'lumotlari bilan ro'yxatdan o'tishni davom ettiramiz
      setForm((f) => ({ ...f, name: g.name || f.name, email: g.email, photo: g.photo, google: true, password: '' }))
      go('signup')
    } catch (e) {
      if (!/popup_closed|access_denied/.test(e.message)) notify(t.googleFail)
    } finally {
      setBusy(false)
    }
  }

  const infoOk = form.name.trim().length >= 3 && phoneState === 'ok' && (form.google || pwOk) && (!isEmp || form.company.trim())
  const canNext = [!!form.role, infoOk, !!form.city, form.categories.length > 0][step - 1]
  // birinchi tanlangan soha — asosiy, qolganlari qo'shimcha (jami MAX_CATS tagacha)
  const toggleCat = (id) => {
    const cur = form.categories
    if (cur.includes(id)) return set('categories', cur.filter((x) => x !== id))
    if (cur.length >= MAX_CATS) return setErr(t.catMax)
    set('categories', [...cur, id])
  }
  const next = (e) => {
    e.preventDefault()
    if (step === 2) {
      if (isEmp && !form.company.trim()) return setErr(t.errCompany)
      if (form.name.trim().length < 3) return setErr(t.errName)
      if (phoneError()) return setErr(phoneError())
      if (findAccount(form.phone)) return setErr(t.errExists)
      if (!form.google && !pwOk) return setErr(t.errPass)
    }
    if (!canNext) return
    if (step < STEPS) return setStep(step + 1)
    const { password, otherCategory, ...data } = form
    const other = data.categories.includes('other') ? otherCategory.trim() : ''
    signUp({
      ...data, name: data.name.trim(), company: data.company.trim(), color: isEmp ? '#6366F6' : '#5B57F0',
      category: data.categories[0], ...(isEmp && { industry: data.categories[0] }), ...(other && { otherCategory: other }),
    }, form.google ? null : password)
    notify(t.hello)
  }

  const login = (e) => {
    e.preventDefault()
    if (phoneError()) return setErr(phoneError())
    if (!form.password) return setErr(t.errBadPass)
    const r = signIn(form.phone, form.password)
    if (r === 'nouser') return setErr(t.errNoUser)
    if (r === 'badpass') return setErr(t.errBadPass)
    if (r === 'google') return setErr(t.errGoogleOnly)
    notify(t.hello)
  }

  // chap paneldagi sarlavha: oxirgi so'z ostiga chizilgan chiziq
  const sideWords = t.welcomeText[1].split(' ')
  const sideLast = sideWords.pop()
  const sideHead = sideWords.join(' ')
  // desktopda forma tepasida turadigan brend (mobilda yashirin)
  const dkBrand = <div className="aw-dk-brand" aria-hidden="true"><span><img src="/ayolqadami-mark.png" alt="" /></span> AyolQadami</div>

  const googleBtn = (
    <button type="button" className="aw-btn dark aw-google" onClick={google} disabled={busy}>
      <span className="aw-g"><GoogleLogo /></span> {t.google}
    </button>
  )

  return (
    <div className="aw" role="dialog" aria-modal="true" aria-label={t.signIn} lang={lang === 'uz-cyrl' ? 'uz-Cyrl' : lang}>
      <div className={`aw-card ${mode === 'welcome' ? 'is-welcome' : ''}`}>
        {/* Faqat desktopda ko'rinadigan brend paneli */}
        <aside className="aw-side" aria-hidden="true">
          <h2>{t.welcomeText[0]} {sideHead}{' '}
            <em>{sideLast}
              <svg viewBox="0 0 200 14" preserveAspectRatio="none"><path d="M3 10 C 50 3, 140 2, 197 8" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" /></svg>
            </em>
          </h2>
          <p>{t.sideFeats.join(' · ')}</p>
          <div className="aw-side-people">
            <picture>
              <source srcSet="/auth/people.webp" type="image/webp" />
              <img src="/auth/people.png" alt="" draggable="false" />
            </picture>
          </div>
        </aside>
        {mode === 'welcome' && (
          <div className="aw-welcome fade-in">
            <div className="aw-top">
              <button type="button" className="aw-close" onClick={closeToHome} aria-label={t.close}><X size={18} weight="bold" /></button>
              {langPicker}
            </div>
            <div className="aw-deco" aria-hidden="true" />
            <div className="aw-hero">
              <img className="aw-logo" src="/logo.png" alt="" />
              {dkBrand}
              <h1>{t.welcomeTitle[0]}<br />{t.welcomeTitle[1]}</h1>
              <p>{t.welcomeText[0]}<br />{t.welcomeText[1]}</p>
            </div>
            <div className="aw-actions">
              <button type="button" className="aw-btn" onClick={() => go('login')}>{t.signIn}</button>
              {googleBtn}
              <p className="aw-foot">{t.noAccount} <button type="button" onClick={() => go('signup')}>{t.signUp}</button></p>
              <button type="button" className="aw-guest" onClick={closeAuth}>{t.guest}</button>
            </div>
          </div>
        )}

        {mode === 'login' && (
          <form className="aw-step fade-in" onSubmit={login} key="login" noValidate>
            <Head onBack={back} right={langPicker} backLabel={t.back} />
            <div className="aw-body">
              {dkBrand}
              <h2>{t.loginTitle}</h2>
              <p className="aw-sub">{t.loginSub}</p>
              <div className="aw-fields">
                <PhoneField label={t.phone} value={form.phone} onChange={(v) => set('phone', v)} t={t} autoFocus />
                <PasswordField label={t.password} value={form.password} onChange={(v) => set('password', v)} placeholder={t.passwordPh} autoComplete="current-password" t={t} />
              </div>
              {err && <div className="aw-err" role="alert">{err}</div>}
            </div>
            <button className="aw-btn" type="submit" disabled={phoneState !== 'ok' || !form.password}>{t.signIn}</button>
            <div className="aw-or"><span>{t.or}</span></div>
            {googleBtn}
            <p className="aw-foot">{t.noAccount} <button type="button" onClick={() => go('signup')}>{t.signUp}</button></p>
          </form>
        )}

        {mode === 'signup' && (
          <form className="aw-step" onSubmit={next} noValidate>
            <Head step={step} onBack={back} right={langPicker} backLabel={t.back} />
            <div className="aw-body fade-in" key={step}>
              {dkBrand}
              {step === 1 && (
                <>
                  <h2>{t.roleTitle}</h2>
                  <p className="aw-sub">{t.roleSub}</p>
                  <div className="aw-roles">
                    {[
                      { id: 'seeker', img: '/roles/seeker.png', title: t.seeker, text: t.seekerText },
                      { id: 'employer', img: '/roles/employer.png', title: t.employer, text: t.employerText },
                    ].map((r) => (
                      <button key={r.id} type="button" className={`aw-role ${form.role === r.id ? 'on' : ''}`}
                        aria-pressed={form.role === r.id} onClick={() => set('role', r.id)}>
                        <span className="aw-role-art"><img src={r.img} alt="" width="52" height="52" draggable="false" /></span>
                        <span className="aw-role-text"><b>{r.title}</b><span>{r.text}</span></span>
                        <i className="aw-radio" />
                      </button>
                    ))}
                  </div>
                  {!form.google && (
                    <div className="aw-alt">
                      <div className="aw-or"><span>{t.or}</span></div>
                      {googleBtn}
                    </div>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <h2>{isEmp ? t.infoTitleEmp : t.infoTitle}</h2>
                  <p className="aw-sub">{isEmp ? t.infoSubEmp : t.infoSub}</p>
                  <div className="aw-fields">
                    {form.google && (
                      <div className="aw-gacc">
                        {form.photo ? <img src={form.photo} alt="" referrerPolicy="no-referrer" /> : <span className="aw-g"><GoogleLogo /></span>}
                        <div><small>{t.googleAs}</small><b>{form.email}</b></div>
                      </div>
                    )}
                    {isEmp && (
                      <label className="aw-field"><span>{t.company}</span>
                        <input value={form.company} onChange={(e) => set('company', e.target.value)} placeholder={t.companyPh} /></label>
                    )}
                    <label className="aw-field"><span>{isEmp ? t.contact : t.fullName}</span>
                      <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t.namePh} autoComplete="name" /></label>
                    <PhoneField label={t.phone} value={form.phone} onChange={(v) => set('phone', v)} t={t} />
                    {!form.google && (
                      <PasswordField label={t.newPassword} value={form.password} onChange={(v) => set('password', v)} placeholder={t.newPasswordPh} autoComplete="new-password" t={t} />
                    )}
                  </div>
                  {err && <div className="aw-err" role="alert">{err}</div>}
                </>
              )}

              {step === 3 && (
                <>
                  <h2>{t.cityTitle}</h2>
                  <p className="aw-sub">{isEmp ? t.citySubEmp : t.citySub}</p>
                  <Wheel items={CITIES} value={form.city} onChange={(v) => set('city', v)} label={t.cityTitle} />
                </>
              )}

              {step === 4 && (
                <>
                  <h2>{isEmp ? t.catTitleEmp : t.catTitle}</h2>
                  <p className="aw-sub">{isEmp ? t.catSubEmp : t.catSub}</p>
                  <p className="aw-cat-hint">{t.catHint} <b>{form.categories.length}/{MAX_CATS}</b></p>
                  <div className="aw-chips">
                    {CATEGORIES.map((c) => {
                      const idx = form.categories.indexOf(c.id)
                      const on = idx >= 0
                      return (
                        <button key={c.id} type="button" className={`aw-chip ${on ? 'on' : ''} ${idx === 0 ? 'is-main' : ''}`} aria-pressed={on} onClick={() => toggleCat(c.id)}>
                          <Icon3D name={c.icon} size={22} /> {c.short}
                          {idx === 0 && <em className="aw-chip-main">{t.catMain}</em>}
                        </button>
                      )
                    })}
                  </div>
                  {form.categories.includes('other') && (
                    <label className="aw-field aw-other fade-in"><span>{t.otherLabel}</span>
                      <input value={form.otherCategory} maxLength={60} onChange={(e) => set('otherCategory', e.target.value)} placeholder={t.otherPh} /></label>
                  )}
                  {err && <div className="aw-err" role="alert">{err}</div>}
                </>
              )}
            </div>
            <button className="aw-btn" type="submit" disabled={!canNext && step !== 2}>{step < STEPS ? t.next : t.create}</button>
            {step === 1 && <p className="aw-foot">{t.haveAccount} <button type="button" onClick={() => go('login')}>{t.signIn}</button></p>}
          </form>
        )}
      </div>
    </div>
  )
}
