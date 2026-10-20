import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/Icons'
import { Avatar, Empty, TopBar, Select } from '../components/UI'
import { useApp } from '../context/AppContext'
import { CATEGORIES, CITIES, catName, formatSum } from '../data/mock'
import { ADS, AD_KINDS, adKindLabel } from '../data/ads'

const CAT_OPTS = CATEGORIES.map((c) => ({ value: c.id, label: c.name }))

const priceText = (ad) => (ad.price ? `${formatSum(ad.price)} so'm${ad.kind === 'seek' ? ' dan' : ''}` : 'Kelishiladi')

function AdCard({ ad, actions }) {
  return (
    <div className="own-job">
      <Link to={`/ads/${ad.id}`} className="cand-card">
        <div className="cand-top">
          <Avatar name={ad.author} color={ad.color} size={48} silhouette={!ad.author} />
          <div className="grow">
            <b>{ad.title}</b>
            <span className="muted">{ad.author} · {ad.posted}</span>
          </div>
        </div>
        <div className="chips">
          <span className={`chip ${ad.kind === 'service' ? 'chip-primary' : 'chip-green'}`}>{adKindLabel(ad.kind)}</span>
          <span className="chip">{catName(ad.category)}</span>
        </div>
        <div className="cand-meta muted">
          <span><Icon name="pin" size={14} /> {ad.city}</span>
          <span><Icon name="wallet" size={14} /> {priceText(ad)}</span>
        </div>
      </Link>
      {actions}
    </div>
  )
}

export function Ads() {
  const { ads, removeAd, notify } = useApp()
  const [tab, setTab] = useState('all')
  const [kind, setKind] = useState('')
  const all = useMemo(() => [...ads, ...ADS], [ads])
  const list = tab === 'mine' ? ads : all.filter((a) => !kind || a.kind === kind)

  return (
    <div className="page">
      <TopBar title="E'lonlar" right={<Link to="/ads/new" className="icon-btn ai" aria-label="E'lon qo'shish"><Icon name="plus" /></Link>} />
      <div className="page-body">
        <div className="segmented">
          <button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>Barchasi ({all.length})</button>
          <button className={tab === 'mine' ? 'on' : ''} onClick={() => setTab('mine')}>Mening e'lonlarim ({ads.length})</button>
        </div>
        {tab === 'all' && (
          <div className="pill-row">
            <button className={`pill ${!kind ? 'on' : ''}`} onClick={() => setKind('')}>Barchasi</button>
            {AD_KINDS.map((k) => <button key={k.id} className={`pill ${kind === k.id ? 'on' : ''}`} onClick={() => setKind(k.id)}>{k.label}</button>)}
          </div>
        )}
        {list.length ? (
          <div className="list-grid">
            {list.map((ad) => (
              <AdCard key={ad.id} ad={ad} actions={ad.own && (
                <div className="own-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => { removeAd(ad.id); notify("E'lon o'chirildi") }}>
                    <Icon name="trash" size={16} /> O'chirish
                  </button>
                </div>
              )} />
            ))}
          </div>
        ) : (
          <Empty icon="folder" title="Hali e'lon joylamadingiz" text="Xizmatingizni taklif qiling yoki ish qidirayotganingizni e'lon qiling"
            action={<Link to="/ads/new" className="btn btn-primary">E'lon qo'shish</Link>} />
        )}
      </div>
    </div>
  )
}

export function AdDetail() {
  const { id } = useParams()
  const { ads, user, requireAuth } = useApp()
  const ad = [...ads, ...ADS].find((x) => x.id === id)
  if (!ad) return <div className="page"><TopBar title="E'lon" /><Empty title="Topilmadi" /></div>
  // mehmon qo'ng'iroq qilmoqchi bo'lsa — avval ro'yxatdan o'tadi, so'ng qo'ng'iroq ochiladi
  const callGuard = (e) => {
    if (user) return
    e.preventDefault()
    const href = e.currentTarget.href
    requireAuth(() => { window.location.href = href })
  }

  return (
    <div className="page detail">
      <TopBar title="E'lon" />
      <div className="page-body">
        <div className="detail-hero">
          <Avatar name={ad.author} color={ad.color} size={84} radius={28} />
          <h1>{ad.title}</h1>
          <span className="muted">{ad.author} · {ad.posted}</span>
          <div className="chips center">
            <span className={`chip ${ad.kind === 'service' ? 'chip-primary' : 'chip-green'}`}>{adKindLabel(ad.kind)}</span>
            <span className="chip">{catName(ad.category)}</span>
            <span className="chip"><Icon name="pin" size={14} /> {ad.city}</span>
          </div>
        </div>
        <div className="info-grid">
          <div><Icon name="wallet" size={18} /><span>{priceText(ad)}</span></div>
          <div><Icon name="phone" size={18} /><span>{ad.phone || '—'}</span></div>
        </div>
        <fieldset className="card-set">
          <legend>Tavsif</legend>
          <p style={{ whiteSpace: 'pre-line' }}>{ad.description}</p>
        </fieldset>
      </div>
      {!ad.own && ad.phone && (
        <div className="action-bar">
          <a className="btn btn-primary grow" href={`tel:${ad.phone.replace(/\s/g, '')}`} onClick={callGuard}><Icon name="phone" size={18} /> Qo'ng'iroq qilish</a>
        </div>
      )}
    </div>
  )
}

export function AdNew() {
  const { user, addAd, notify } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({
    kind: 'service', title: '', category: user.category || 'home', city: user.city || 'Toshkent',
    price: '', description: '', phone: user.phone || '',
  })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const pick = (k) => (v) => setF({ ...f, [k]: v })

  const submit = (e) => {
    e.preventDefault()
    if (f.title.trim().length < 3) return setErr("E'lon sarlavhasini kiriting")
    if (f.description.trim().length < 20) return setErr("Tavsif kamida 20 belgidan iborat bo'lsin")
    if (f.phone.replace(/\D/g, '').length < 9) return setErr("Bog'lanish uchun telefon raqamini kiriting")
    addAd({
      ...f, title: f.title.trim(), description: f.description.trim(), phone: f.phone.trim(),
      price: Number(String(f.price).replace(/\D/g, '')) || 0, author: user.name, color: user.color || '#6366F6',
    })
    notify("E'lon joylandi!")
    nav('/ads')
  }

  return (
    <div className="page">
      <TopBar title="E'lon qo'shish" right={<Link to="/ads" className="icon-btn" aria-label="E'lonlar"><Icon name="grid" /></Link>} />
      <form className="page-body form" onSubmit={submit}>
        <div className="edit-banner">
          <img src="/plus-3d.png" alt="" width="84" height="84" className="edit-banner-img" />
          <div><b>Yangi e'lon</b><span className="muted">Xizmatingizni taklif qiling yoki ish qidirayotganingizni bildiring</span></div>
        </div>
        <div className="segmented">
          {AD_KINDS.map((k) => (
            <button type="button" key={k.id} className={f.kind === k.id ? 'on' : ''} onClick={() => setF({ ...f, kind: k.id })}>{k.label}</button>
          ))}
        </div>
        <fieldset className="card-set">
          <legend>Asosiy</legend>
          <label className="field"><span>Sarlavha</span>
            <input value={f.title} onChange={set('title')} placeholder={f.kind === 'service' ? "Masalan: Ko'ylak tikaman" : 'Masalan: Buxgalter sifatida ish qidiryapman'} />
          </label>
          <div className="field-row">
            <label className="field"><span>Soha</span><Select value={f.category} options={CAT_OPTS} onChange={pick('category')} /></label>
            <label className="field"><span>Shahar</span><Select value={f.city} options={CITIES} onChange={pick('city')} /></label>
          </div>
          <div className="field-row">
            <label className="field"><span>{f.kind === 'service' ? "Narx (so'm)" : "Kutilayotgan maosh (so'm)"}</span>
              <input value={f.price} onChange={set('price')} inputMode="numeric" placeholder="Kelishiladi" />
            </label>
            <label className="field"><span>Telefon</span><input value={f.phone} onChange={set('phone')} inputMode="tel" placeholder="+998 90 000 00 00" /></label>
          </div>
        </fieldset>
        <fieldset className="card-set">
          <legend>Tavsif</legend>
          <label className="field"><span>Batafsil</span>
            <textarea rows={5} value={f.description} onChange={set('description')} placeholder="Tajribangiz, ish vaqti, shartlar..." />
          </label>
        </fieldset>
        {err && <div className="form-error">{err}</div>}
        <button className="btn btn-primary btn-lg btn-block" type="submit">E'lonni joylash</button>
      </form>
    </div>
  )
}
