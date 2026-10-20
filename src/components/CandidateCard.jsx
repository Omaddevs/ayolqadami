import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Briefcase, CaretRight, DotsThree, DotsThreeVertical, Heart, LinkSimple, MapPin, PaperPlaneTilt, UserCircle, Wallet,
} from '@phosphor-icons/react'
import { Avatar, Sheet } from './UI'
import { useApp } from '../context/AppContext'
import { catShort, formatSum } from '../data/mock'

const MAX_TAGS = 2 // soha + 2 ko'nikma, qolgani "+N"

/* Nomzod kartasi (ish beruvchi uchun): profil, saqlash va qo'shimcha amallar.
   list — "Nomzodlar" sahifasidagi ko'rinish */
export default function CandidateCard({ c, list }) {
  const { savedCands, toggleSaveCand, invites, invite, notify } = useApp()
  const nav = useNavigate()
  const [menu, setMenu] = useState(false)
  const saved = savedCands.includes(c.id)
  const invited = invites.includes(c.id)
  const to = `/candidates/${c.id}`
  const skills = c.skills || []
  const rest = skills.length - MAX_TAGS

  const act = (fn) => () => { setMenu(false); fn() }
  const copyLink = () => {
    navigator.clipboard?.writeText(`${location.origin}${to}`).then(() => notify('Havola nusxalandi'), () => notify("Nusxalab bo'lmadi"))
  }

  const saveBtn = (
    <button type="button" className={`cc-btn ${saved ? 'on' : ''}`} aria-pressed={saved} aria-label={saved ? 'Saqlanganlardan olib tashlash' : 'Saqlash'}
      onClick={() => { toggleSaveCand(c.id); notify(saved ? 'Saqlanganlardan olib tashlandi' : 'Nomzod saqlandi') }}>
      <Heart size={20} weight={saved ? 'fill' : 'regular'} />
    </button>
  )
  const sheet = (
    <Sheet open={menu} onClose={() => setMenu(false)} title={c.name}>
      <div className="menu cc-menu">
        <button type="button" className="menu-item" onClick={act(() => nav(to))}><UserCircle size={22} /> Profilni ko'rish</button>
        <button type="button" className="menu-item" disabled={invited}
          onClick={act(() => { invite(c.id); notify('Taklif yuborildi') })}>
          <PaperPlaneTilt size={22} /> {invited ? 'Taklif yuborilgan' : 'Suhbatga taklif qilish'}
        </button>
        <button type="button" className="menu-item" onClick={act(copyLink)}><LinkSimple size={22} /> Havolani nusxalash</button>
      </div>
    </Sheet>
  )
  const ava = (
    <Link to={to} className="cc-ava" aria-label={c.name}>
      <Avatar name={c.name} color={c.color} size={list ? 64 : 60} radius={list ? 18 : 20} />
      {c.searchStatus === 'active' && <i className="cc-online" title="Faol ish qidiryapti" />}
    </Link>
  )

  // Nomzodlar sahifasi uchun: maosh bilan, amallar yuqori o'ngda, "Profilni ko'rish" pastda
  if (list) {
    const tags = skills.slice(0, 3)
    return (
      <article className="cc cc-list">
        {ava}
        <div className="cc-info">
          <Link to={to} className="cc-name">{c.name}</Link>
          <span className="cc-role">{c.headline}</span>
          <div className="cc-meta">
            {c.city && <span><MapPin size={14} /> {c.city}</span>}
            {c.years > 0 && <span><Briefcase size={14} /> {c.years} yil</span>}
            {c.salary > 0 && <span><Wallet size={14} /> {formatSum(c.salary)} so'm</span>}
          </div>
        </div>
        <div className="cc-acts">
          {saveBtn}
          <button type="button" className="cc-btn" aria-label="Boshqa amallar" onClick={() => setMenu(true)}>
            <DotsThreeVertical size={22} weight="bold" />
          </button>
        </div>
        <div className="cc-foot">
          <div className="cc-tags">
            {tags.map((s) => <span key={s}>{s}</span>)}
            {skills.length > tags.length && <span className="t-more">+{skills.length - tags.length}</span>}
          </div>
          <Link to={to} className="cc-view">Profilni ko'rish <ArrowRight size={14} weight="bold" /></Link>
        </div>
        {sheet}
      </article>
    )
  }

  return (
    <article className="cc">
      {ava}

      <div className="cc-info">
        <Link to={to} className="cc-name">{c.name}</Link>
        <span className="cc-role">{c.headline}</span>
        <div className="cc-meta">
          {c.years > 0 && <span><Briefcase size={15} /> {c.years} yil tajriba</span>}
          {c.city && <span><MapPin size={15} /> {c.city}</span>}
        </div>
      </div>

      <div className="cc-acts">
        <Link to={to} className="cc-view">Profilni ko'rish <CaretRight size={14} weight="bold" /></Link>
        {saveBtn}
        <button type="button" className="cc-btn" aria-label="Boshqa amallar" onClick={() => setMenu(true)}>
          <DotsThree size={22} weight="bold" />
        </button>
      </div>

      <div className="cc-tags">
        <span className="t-cat">{catShort(c.category)}</span>
        {skills.slice(0, MAX_TAGS).map((s) => <span key={s}>{s}</span>)}
        {rest > 0 && <span className="t-more">+{rest}</span>}
      </div>

      {sheet}
    </article>
  )
}
