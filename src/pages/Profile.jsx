import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import { Avatar, TopBar } from '../components/UI'
import { profileCompletion, useApp } from '../context/AppContext'
import { CATEGORIES, CITIES, JOB_TYPES, catName, formatSum } from '../data/mock'

export function ResumeView({ p }) {
  return (
    <>
      {p.about && <div className="block"><h2>O'zim haqimda</h2><p>{p.about}</p></div>}
      {p.skills?.length > 0 && (
        <div className="block"><h2>Ko'nikmalar</h2>
          <div className="chips">{p.skills.map((s) => <span key={s} className="chip chip-primary">{s}</span>)}</div></div>
      )}
      {p.experience?.length > 0 && (
        <div className="block"><h2>Ish tajribasi</h2>
          <div className="timeline">
            {p.experience.map((e, i) => (
              <div key={i} className="tl-item">
                <span className="tl-dot" />
                <div><b>{e.role}</b><span>{e.company}</span><span className="muted small">{e.period}</span></div>
              </div>
            ))}
          </div></div>
      )}
      {p.education && <div className="block"><h2>Ta'lim</h2><div className="row-item"><Icon3D name="cap" size={40} /><span>{p.education}</span></div></div>}
      {p.languages?.length > 0 && (
        <div className="block"><h2>Tillar</h2>
          <div className="chips">{p.languages.map((s) => <span key={s} className="chip"><Icon name="globe" size={14} /> {s}</span>)}</div></div>
      )}
    </>
  )
}

export function Profile() {
  const { user, logout, switchRole, applications, saved, courses, posted, invites } = useApp()
  const nav = useNavigate()
  const isEmp = user.role === 'employer'
  const pct = profileCompletion(user)

  const stats = isEmp
    ? [['Vakansiyalar', posted.length, '/applications'], ['Takliflar', invites.length, '/candidates'], ['Kurslar', courses.length, '/courses']]
    : [['Arizalar', applications.length, '/applications'], ['Saqlangan', saved.length, '/applications?tab=saved'], ['Kurslar', courses.length, '/courses']]

  return (
    <div className="page">
      <div className="profile-hero">
        <div className="profile-top">
          <span />
          <Link to="/profile/edit" className="hero-btn" aria-label="Tahrirlash"><Icon name="edit" size={20} /></Link>
        </div>
        <Avatar name={isEmp ? user.company : user.name} color={user.color} size={88} radius={30} />
        <h1>{isEmp ? user.company : user.name}</h1>
        <span>{isEmp ? `${user.name} · ${user.position || 'HR'}` : user.headline || 'Kasbingizni kiriting'}</span>
        <span className="hero-city"><Icon name="pin" size={14} /> {user.city}</span>
      </div>

      <div className="page-body sheet-up">
        <div className="stats">
          {stats.map(([l, v, to]) => (
            <Link key={l} to={to}><b>{v}</b><span>{l}</span></Link>
          ))}
        </div>

        {!isEmp && (
          <Link to="/profile/edit" className="complete-card">
            <div className="ring" style={{ '--v': pct }}><b>{pct}%</b></div>
            <div className="grow">
              <b>{pct < 100 ? "Rezyumeni to'ldiring" : 'Rezyume tayyor!'}</b>
              <span className="muted">{pct < 100 ? "To'liq profil 3 barobar ko'p taklif oladi" : "Ish beruvchilar sizni QadamAI orqali topishadi"}</span>
            </div>
            <Icon name="right" />
          </Link>
        )}

        {isEmp ? (
          <>
            {user.about && <div className="block"><h2>Kompaniya haqida</h2><p>{user.about}</p></div>}
            <div className="block"><h2>Ma'lumotlar</h2>
              <div className="kv"><span>Soha</span><b>{catName(user.industry || user.category)}</b></div>
              <div className="kv"><span>Telefon</span><b>{user.phone}</b></div>
              <div className="kv"><span>Shahar</span><b>{user.city}</b></div>
            </div>
          </>
        ) : (
          <>
            <ResumeView p={user} />
            {user.salary ? <div className="block"><h2>Kutilayotgan maosh</h2><p className="salary">{formatSum(user.salary)} so'mdan</p></div> : null}
          </>
        )}

        <div className="menu">
          <Link to="/applications" className="menu-item"><Icon name="grid" /> {isEmp ? 'Mening vakansiyalarim' : 'Mening arizalarim'} <Icon name="right" size={18} /></Link>
          <Link to="/notifications" className="menu-item"><Icon name="bell" /> Bildirishnomalar <Icon name="right" size={18} /></Link>
          <Link to="/events" className="menu-item"><Icon name="calendar" /> Tadbirlar <Icon name="right" size={18} /></Link>
          <button className="menu-item" onClick={switchRole}><Icon name="swap" /> Rolni almashtirish (demo) <Icon name="right" size={18} /></button>
          <button className="menu-item danger" onClick={() => { logout(); nav('/welcome', { replace: true }) }}><Icon name="logout" /> Chiqish</button>
        </div>
      </div>
    </div>
  )
}

const splitList = (s) => s.split(',').map((x) => x.trim()).filter(Boolean)

export function ProfileEdit() {
  const { user, updateUser, notify } = useApp()
  const nav = useNavigate()
  const isEmp = user.role === 'employer'
  const [f, setF] = useState({
    name: user.name || '', phone: user.phone || '', city: user.city || 'Toshkent', headline: user.headline || '',
    category: user.category || 'it', about: user.about || '', skills: (user.skills || []).join(', '),
    languages: (user.languages || []).join(', '), education: user.education || '', salary: user.salary || '',
    format: user.format || [], company: user.company || '', position: user.position || '',
  })
  const [exp, setExp] = useState(user.experience?.length ? user.experience : [])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const toggleFormat = (t) => setF({ ...f, format: f.format.includes(t) ? f.format.filter((x) => x !== t) : [...f.format, t] })
  const setExpField = (i, k, v) => setExp(exp.map((e, j) => (j === i ? { ...e, [k]: v } : e)))

  const save = (e) => {
    e.preventDefault()
    updateUser({
      ...f, salary: Number(String(f.salary).replace(/\D/g, '')) || '',
      skills: splitList(f.skills), languages: splitList(f.languages),
      experience: exp.filter((x) => x.role.trim()),
      industry: f.category,
    })
    notify(isEmp ? "Ma'lumotlar saqlandi" : 'Rezyume saqlandi')
    nav('/profile')
  }

  return (
    <div className="page">
      <TopBar title={isEmp ? 'Kompaniya profili' : 'Rezyume'} />
      <form className="page-body form" onSubmit={save}>
        <div className="edit-banner">
          <Icon3D name={isEmp ? 'building' : 'resume'} size={84} />
          <div><b>{isEmp ? "Kompaniyangizni tanishtiring" : "Rezyumengizni yarating"}</b>
            <span className="muted">{isEmp ? "Nomzodlar ishonchli ish beruvchilarni tanlaydi" : "QadamAI sizni ish beruvchilarga shu ma'lumotlar asosida tavsiya qiladi"}</span></div>
        </div>

        <fieldset className="card-set">
          <legend>Asosiy</legend>
          {isEmp && <label className="field"><span>Kompaniya nomi</span><input value={f.company} onChange={set('company')} /></label>}
          <label className="field"><span>{isEmp ? "Mas'ul shaxs" : 'Ism-familiya'}</span><input value={f.name} onChange={set('name')} required /></label>
          {isEmp
            ? <label className="field"><span>Lavozim</span><input value={f.position} onChange={set('position')} placeholder="HR menejer" /></label>
            : <label className="field"><span>Kasb / lavozim</span><input value={f.headline} onChange={set('headline')} placeholder="Masalan: Buxgalter" /></label>}
          <div className="field-row">
            <label className="field"><span>Telefon</span><input value={f.phone} onChange={set('phone')} inputMode="tel" /></label>
            <label className="field"><span>Shahar</span><select value={f.city} onChange={set('city')}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          </div>
          <label className="field"><span>Soha</span>
            <select value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="field"><span>{isEmp ? 'Kompaniya haqida' : "O'zim haqimda"}</span><textarea rows={4} value={f.about} onChange={set('about')} /></label>
        </fieldset>

        {!isEmp && (
          <>
            <fieldset className="card-set">
              <legend>Ko'nikmalar va tillar</legend>
              <label className="field"><span>Ko'nikmalar (vergul bilan)</span><input value={f.skills} onChange={set('skills')} placeholder="Excel, 1C, Muloqot" /></label>
              <label className="field"><span>Tillar (vergul bilan)</span><input value={f.languages} onChange={set('languages')} /></label>
            </fieldset>

            <fieldset className="card-set">
              <legend>Ish tajribasi</legend>
              {exp.map((e, i) => (
                <div key={i} className="exp-edit">
                  <input placeholder="Lavozim" value={e.role} onChange={(ev) => setExpField(i, 'role', ev.target.value)} />
                  <input placeholder="Kompaniya" value={e.company} onChange={(ev) => setExpField(i, 'company', ev.target.value)} />
                  <input placeholder="2021 – hozir" value={e.period} onChange={(ev) => setExpField(i, 'period', ev.target.value)} />
                  <button type="button" className="icon-btn sm" onClick={() => setExp(exp.filter((_, j) => j !== i))} aria-label="O'chirish"><Icon name="trash" size={18} /></button>
                </div>
              ))}
              <button type="button" className="btn btn-soft btn-block" onClick={() => setExp([...exp, { role: '', company: '', period: '' }])}>
                <Icon name="plus" size={18} /> Tajriba qo'shish
              </button>
            </fieldset>

            <fieldset className="card-set">
              <legend>Ta'lim va istaklar</legend>
              <label className="field"><span>Ta'lim</span><input value={f.education} onChange={set('education')} placeholder="OTM, yo'nalish" /></label>
              <label className="field"><span>Kutilayotgan maosh (so'm)</span><input value={f.salary} onChange={set('salary')} inputMode="numeric" /></label>
              <span className="field-label">Ish formati</span>
              <div className="pill-row wrap">
                {JOB_TYPES.map((t) => (
                  <button type="button" key={t} className={`pill pill-sm ${f.format.includes(t) ? 'on' : ''}`} onClick={() => toggleFormat(t)}>{t}</button>
                ))}
              </div>
            </fieldset>
          </>
        )}

        <button className="btn btn-primary btn-lg btn-block" type="submit">Saqlash</button>
      </form>
    </div>
  )
}
