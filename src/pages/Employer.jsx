import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import { Avatar, Empty, TopBar } from '../components/UI'
import { ResumeView } from './Profile'
import { useApp } from '../context/AppContext'
import { CANDIDATES, CATEGORIES, CITIES, JOB_TYPES, catName, formatSum } from '../data/mock'

export function Candidates() {
  const [params] = useSearchParams()
  const [cat, setCat] = useState(params.get('cat') || '')
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const nq = q.toLowerCase()
    return CANDIDATES.filter((c) => (!cat || c.category === cat) &&
      (!nq || `${c.name} ${c.headline} ${c.skills.join(' ')} ${c.city}`.toLowerCase().includes(nq)))
  }, [cat, q])

  return (
    <div className="page">
      <TopBar title="Nomzodlar" back={false} right={<Link to="/qadam-ai" className="icon-btn ai" aria-label="QadamAI"><Icon name="sparkle" /></Link>} />
      <div className="page-body">
        <Link to="/qadam-ai" className="ai-cta">
          <Icon3D name="sparkle" size={64} />
          <div className="grow"><b>QadamAI bilan izlang</b><span>Talablarni yozing — mos nomzodlarni foiz bilan ko'rsatamiz</span></div>
          <Icon name="right" />
        </Link>
        <div className="search search-solid">
          <Icon name="search" size={22} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ism, kasb yoki ko'nikma" />
        </div>
        <div className="pill-row">
          <button className={`pill ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>Barchasi</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={`pill ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}><Icon3D name={c.icon} size={22} /> {c.short}</button>
          ))}
        </div>
        {list.length ? (
          <div className="list-grid">
            {list.map((c) => (
              <Link key={c.id} to={`/candidates/${c.id}`} className="cand-card">
                <div className="cand-top">
                  <Avatar name={c.name} color={c.color} size={52} />
                  <div className="grow"><b>{c.name}</b><span className="muted">{c.headline}</span></div>
                </div>
                <div className="cand-meta muted">
                  <span><Icon name="pin" size={14} /> {c.city}</span>
                  <span><Icon name="briefcase" size={14} /> {c.years} yil</span>
                  <span><Icon name="wallet" size={14} /> {formatSum(c.salary)}</span>
                </div>
                <div className="chips">{c.skills.slice(0, 3).map((s) => <span key={s} className="chip">{s}</span>)}</div>
              </Link>
            ))}
          </div>
        ) : <Empty icon="users" title="Nomzod topilmadi" />}
      </div>
    </div>
  )
}

export function CandidateDetail() {
  const { id } = useParams()
  const { user, invites, invite, notify } = useApp()
  const c = CANDIDATES.find((x) => x.id === id)
  if (!c) return <div className="page"><TopBar title="Nomzod" /><Empty title="Topilmadi" /></div>
  const invited = invites.includes(c.id)

  return (
    <div className="page detail">
      <TopBar title="Rezyume" />
      <div className="page-body">
        <div className="detail-hero">
          <Avatar name={c.name} color={c.color} size={84} radius={28} />
          <h1>{c.name}</h1>
          <span className="muted">{c.headline}</span>
          <div className="chips center">
            <span className="chip chip-primary">{catName(c.category)}</span>
            <span className="chip"><Icon name="pin" size={14} /> {c.city}</span>
            <span className="chip">{c.years} yil tajriba</span>
          </div>
        </div>
        <div className="info-grid">
          <div><Icon name="wallet" size={18} /><span>{formatSum(c.salary)} so'm</span></div>
          <div><Icon name="briefcase" size={18} /><span>{c.format.join(', ')}</span></div>
        </div>
        <ResumeView p={c} />
      </div>
      {user.role === 'employer' && (
        <div className="action-bar">
          <a className="btn btn-soft" href="tel:+998000000000"><Icon name="phone" size={18} /></a>
          <button className="btn btn-primary grow" disabled={invited} onClick={() => { invite(c.id); notify('Taklif yuborildi') }}>
            {invited ? <><Icon name="check" size={18} /> Taklif yuborilgan</> : 'Suhbatga taklif qilish'}
          </button>
        </div>
      )}
    </div>
  )
}

export function PostJob() {
  const { user, postJob, notify } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({
    title: '', category: user.industry || user.category || 'it', city: user.city || 'Toshkent', type: "To'liq stavka",
    salaryFrom: '', salaryTo: '', experience: 0, description: '', requirements: '', skills: '', tags: [],
  })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const PERKS = ['Onalar uchun qulay', 'Moslashuvchan grafik', 'Faqat kunduzgi smena', "Tajribasiz qabul", "O'qitib olamiz", '100% masofaviy']
  const togglePerk = (t) => setF({ ...f, tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t] })
  const num = (v) => Number(String(v).replace(/\D/g, '')) || 0

  const submit = (e) => {
    e.preventDefault()
    if (f.title.trim().length < 3) return setErr('Lavozim nomini kiriting')
    if (f.description.trim().length < 20) return setErr("Tavsif kamida 20 belgidan iborat bo'lsin")
    postJob({
      ...f, title: f.title.trim(), company: user.company || user.name, color: user.color || '#6366F6',
      salaryFrom: num(f.salaryFrom), salaryTo: num(f.salaryTo), experience: Number(f.experience),
      requirements: f.requirements.split('\n').map((x) => x.trim()).filter(Boolean),
      skills: f.skills.split(',').map((x) => x.trim()).filter(Boolean), conditions: [],
    })
    notify("Vakansiya e'lon qilindi!")
    nav('/applications')
  }

  return (
    <div className="page">
      <TopBar title="Vakansiya joylash" />
      <form className="page-body form" onSubmit={submit}>
        <div className="edit-banner">
          <Icon3D name="plus" size={84} />
          <div><b>Yangi vakansiya</b><span className="muted">E'lon darhol ish izlovchilarga va QadamAI tavsiyalariga chiqadi</span></div>
        </div>
        <fieldset className="card-set">
          <legend>Asosiy</legend>
          <label className="field"><span>Lavozim</span><input value={f.title} onChange={set('title')} placeholder="Masalan: Buxgalter" /></label>
          <div className="field-row">
            <label className="field"><span>Soha</span><select value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="field"><span>Shahar</span><select value={f.city} onChange={set('city')}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          </div>
          <div className="field-row">
            <label className="field"><span>Format</span><select value={f.type} onChange={set('type')}>{JOB_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="field"><span>Tajriba (yil)</span><input type="number" min="0" max="20" value={f.experience} onChange={set('experience')} /></label>
          </div>
          <div className="field-row">
            <label className="field"><span>Maosh, dan</span><input value={f.salaryFrom} onChange={set('salaryFrom')} inputMode="numeric" placeholder="5 000 000" /></label>
            <label className="field"><span>gacha</span><input value={f.salaryTo} onChange={set('salaryTo')} inputMode="numeric" placeholder="8 000 000" /></label>
          </div>
        </fieldset>
        <fieldset className="card-set">
          <legend>Tavsif</legend>
          <label className="field"><span>Vakansiya haqida</span><textarea rows={4} value={f.description} onChange={set('description')} /></label>
          <label className="field"><span>Talablar (har biri yangi qatorda)</span><textarea rows={3} value={f.requirements} onChange={set('requirements')} /></label>
          <label className="field"><span>Ko'nikmalar (vergul bilan)</span><input value={f.skills} onChange={set('skills')} placeholder="Excel, 1C" /></label>
        </fieldset>
        <fieldset className="card-set">
          <legend>Ayollar uchun qulayliklar</legend>
          <div className="pill-row wrap">
            {PERKS.map((t) => <button type="button" key={t} className={`pill pill-sm ${f.tags.includes(t) ? 'on' : ''}`} onClick={() => togglePerk(t)}>{t}</button>)}
          </div>
        </fieldset>
        {err && <div className="form-error">{err}</div>}
        <button className="btn btn-primary btn-lg btn-block" type="submit">E'lon qilish</button>
      </form>
    </div>
  )
}
