import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import { useApp } from '../context/AppContext'
import { CATEGORIES, CITIES } from '../data/mock'

const DEMO_SEEKER = {
  role: 'seeker', name: 'Anora Ismoilova', phone: '+998 90 123 45 67', city: 'Toshkent', color: '#EC4899',
  headline: 'Frontend dasturchi', category: 'it', about: "React bilan 2 yillik tajriba. Gibrid formatda ishlashni xohlayman.",
  skills: ['React', 'JavaScript', 'CSS', 'Git'], experience: [{ role: 'Frontend dasturchi', company: 'Web Studio', period: '2023 – hozir' }],
  education: 'TATU, Kompyuter injiniringi', languages: ["O'zbek", 'Rus', 'Ingliz (B1)'], salary: 9000000,
}
const DEMO_EMPLOYER = {
  role: 'employer', name: 'Laylo Usmonova', company: 'NurTech', phone: '+998 71 200 00 00', city: 'Toshkent', color: '#6366F6',
  position: 'HR menejer', industry: 'it', about: "Ayollar uchun qulay ish sharoitlarini yaratuvchi IT kompaniya.",
}

export default function Auth() {
  const { register } = useApp()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '+998 ', city: 'Toshkent', company: '', category: 'it' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    if (form.name.trim().length < 3) return setErr("Ism-familiyangizni to'liq kiriting")
    if (form.phone.replace(/\D/g, '').length < 12) return setErr("Telefon raqamni to'liq kiriting")
    if (role === 'employer' && !form.company.trim()) return setErr('Kompaniya nomini kiriting')
    register({ role, ...form, name: form.name.trim(), color: role === 'employer' ? '#6366F6' : '#EC4899' })
    nav('/', { replace: true })
  }

  const demo = (u) => { register(u); nav('/', { replace: true }) }

  return (
    <div className="auth">
      <div className="auth-card">
        {step === 0 && (
          <div className="welcome fade-in">
            <div className="welcome-art">
              <div className="orb" />
              <img src="/logo.png" alt="AyolQadami" className="welcome-logo" />
              <Icon3D name="briefcase" size={74} className="float f1" />
              <Icon3D name="cap" size={70} className="float f2" />
              <Icon3D name="sparkle" size={60} className="float f3" />
              <Icon3D name="resume" size={66} className="float f4" />
            </div>
            <h1>Ayol<span>Qadami</span></h1>
            <p className="lead">Ayollar uchun ish, rezyume, o'quv kurslari va QadamAI yordamchisi — barchasi bitta joyda.</p>
            <button className="btn btn-primary btn-lg btn-block" onClick={() => setStep(1)}>Boshlash</button>
            <div className="demo-row">
              <span className="muted">Demo bilan kirish:</span>
              <button className="link" onClick={() => demo(DEMO_SEEKER)}>Ish izlovchi</button>
              <button className="link" onClick={() => demo(DEMO_EMPLOYER)}>Ish beruvchi</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="fade-in">
            <button className="icon-btn" onClick={() => setStep(0)} aria-label="Orqaga"><Icon name="left" /></button>
            <h2 className="auth-title">Siz kimsiz?</h2>
            <p className="muted">Platformadan qanday foydalanishingizni tanlang</p>
            <div className="role-list">
              <button className={`role-card ${role === 'seeker' ? 'on' : ''}`} onClick={() => setRole('seeker')}>
                <Icon3D name="woman" size={88} />
                <div>
                  <b>Ish izlovchi</b>
                  <span>Rezyume yarating, vakansiyalarga ariza bering va kurslarda o'qing</span>
                </div>
                <i className="radio" />
              </button>
              <button className={`role-card ${role === 'employer' ? 'on' : ''}`} onClick={() => setRole('employer')}>
                <Icon3D name="building" size={88} />
                <div>
                  <b>Ish beruvchi</b>
                  <span>Vakansiya joylang va QadamAI bilan mos kadrni toping</span>
                </div>
                <i className="radio" />
              </button>
            </div>
            <button className="btn btn-primary btn-lg btn-block" disabled={!role} onClick={() => setStep(2)}>Davom etish</button>
          </div>
        )}

        {step === 2 && (
          <form className="fade-in" onSubmit={submit}>
            <button type="button" className="icon-btn" onClick={() => setStep(1)} aria-label="Orqaga"><Icon name="left" /></button>
            <h2 className="auth-title">{role === 'employer' ? "Kompaniya ma'lumotlari" : "Ro'yxatdan o'tish"}</h2>
            <p className="muted">Bir daqiqada hisob yarating</p>
            <div className="form">
              {role === 'employer' && (
                <label className="field"><span>Kompaniya nomi</span>
                  <input value={form.company} onChange={set('company')} placeholder="Masalan: NurTech" /></label>
              )}
              <label className="field"><span>{role === 'employer' ? "Mas'ul shaxs" : 'Ism-familiya'}</span>
                <input value={form.name} onChange={set('name')} placeholder="Ism Familiya" autoComplete="name" /></label>
              <label className="field"><span>Telefon raqam</span>
                <input value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" /></label>
              <label className="field"><span>Shahar</span>
                <select value={form.city} onChange={set('city')}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label className="field"><span>{role === 'employer' ? 'Faoliyat sohasi' : 'Qiziqish sohasi'}</span>
                <select value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              {err && <div className="form-error">{err}</div>}
            </div>
            <button className="btn btn-primary btn-lg btn-block" type="submit">Hisob yaratish</button>
            <p className="muted small center">Davom etish orqali foydalanish shartlariga rozilik bildirasiz</p>
          </form>
        )}
      </div>
    </div>
  )
}
