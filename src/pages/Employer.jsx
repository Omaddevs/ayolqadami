import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Icon3D from '../components/Icon3D'
import { Avatar, Empty, Select, Sheet, TopBar } from '../components/UI'
import CandidateCard from '../components/CandidateCard'
import { Check2, Chips, Field } from '../components/Wizard'
import {
  Baby, Briefcase, Broom, Cake, CaretRight, Check, Coins, CookingPot, DotsThreeCircle, Factory, Flower, ForkKnife, Globe, GraduationCap,
  HandHeart, Heart, House, Laptop, MagnifyingGlass, MapPin, Megaphone, PaperPlaneTilt, Scales, ShoppingBag, SlidersHorizontal, Sparkle,
  SquaresFour, Star, Stethoscope, Suitcase, Truck, Wrench,
} from '@phosphor-icons/react'
import ResumeView, { age, expText, fullName, placeText, statusOf } from '../components/ResumeView'
import { useApp } from '../context/AppContext'
import { CANDIDATES, CATEGORIES, catName } from '../data/mock'

// Kategoriya pill'lari uchun chiziqli ikonkalar (namunadagidek)
const CAT_ICONS = {
  office: Briefcase, edu: GraduationCap, med: Stethoscope, nanny: Baby, housekeeper: House, cleaning: Broom, cook: CookingPot,
  caregiver: HandHeart, sales: ShoppingBag, beauty: Flower, it: Laptop, home: Wrench, remote: Globe, production: Factory,
  food: ForkKnife, marketing: Megaphone, finance: Coins, law: Scales, logistics: Truck, other: DotsThreeCircle,
}
const EXP_MIN = [{ id: 0, label: 'Farqi yo\'q' }, { id: 1, label: '1+ yil' }, { id: 3, label: '3+ yil' }, { id: 5, label: '5+ yil' }]
const CITY_OPTS = [...new Set(CANDIDATES.map((c) => c.city))].sort((a, b) => a.localeCompare(b))
const NO_FILTER = { city: '', exp: 0, active: false }

export function Candidates() {
  const [params] = useSearchParams()
  const [cat, setCat] = useState(params.get('cat') || '')
  const [q, setQ] = useState(params.get('q') || '')
  // sarlavhadagi qidiruv va kategoriyalar menyusi sahifa ochiq turganda ham ishlaydi
  const urlQ = params.get('q'), urlCat = params.get('cat')
  useEffect(() => { if (urlQ !== null) setQ(urlQ) }, [urlQ])
  useEffect(() => { if (urlCat !== null) setCat(urlCat) }, [urlCat])
  const [f, setF] = useState(NO_FILTER)
  const [draft, setDraft] = useState(NO_FILTER) // filtr oynasidagi qoralama — "Ko'rsatish" bosilganda qo'llanadi
  const [sheet, setSheet] = useState(false)
  const fCount = (f.city ? 1 : 0) + (f.exp ? 1 : 0) + (f.active ? 1 : 0)
  const list = useMemo(() => {
    const nq = q.toLowerCase().trim()
    return CANDIDATES.filter((c) => (!cat || c.category === cat) &&
      (!f.city || c.city === f.city) && c.years >= f.exp && (!f.active || c.searchStatus === 'active') &&
      (!nq || `${c.name} ${c.headline} ${c.skills.join(' ')} ${c.city}`.toLowerCase().includes(nq)))
  }, [cat, q, f])

  return (
    <div className="page cands-page">
      <header className="cands-head">
        <div className="grow">
          <h1>Nomzodlar</h1>
          <span>Sizning jamoangiz uchun eng yaxshi nomzodlar</span>
        </div>
        <Link to="/qadam-ai" className="cands-ai-btn" aria-label="QadamAI"><Sparkle size={22} /></Link>
      </header>
      <div className="page-body">
        <Link to="/qadam-ai" className="ai-cta cands-cta">
          <Icon3D name="sparkle" size={64} />
          <div className="grow"><b>QadamAI bilan izlang</b><span>Talablarni yozing — mos nomzodlarni foiz bilan ko'rsatamiz</span></div>
          <CaretRight size={20} weight="bold" />
        </Link>
        <div className="cands-search">
          <label className="search">
            <MagnifyingGlass size={20} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ism, kasb yoki ko'nikma" />
          </label>
          <button type="button" className="cands-filter" aria-label="Filtr" onClick={() => { setDraft(f); setSheet(true) }}>
            <SlidersHorizontal size={22} />
            {fCount > 0 && <i>{fCount}</i>}
          </button>
        </div>
        <div className="pill-row cands-pills">
          <button className={`pill ${!cat ? 'on' : ''}`} onClick={() => setCat('')}><SquaresFour size={18} /> Barchasi</button>
          {CATEGORIES.map((c) => {
            const Ic = CAT_ICONS[c.id] || Briefcase
            return <button key={c.id} className={`pill ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}><Ic size={18} /> {c.short}</button>
          })}
        </div>
        {list.length ? (
          <div className="list-grid cands-list">{list.map((c) => <CandidateCard key={c.id} c={c} list />)}</div>
        ) : <Empty icon="users" title="Nomzod topilmadi" />}
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Filtr">
        <div className="cands-sheet">
          <Field as="div" label="Shahar">
            <Select value={draft.city} options={[{ value: '', label: 'Barcha shaharlar' }, ...CITY_OPTS]} placeholder="Barcha shaharlar"
              onChange={(v) => setDraft((d) => ({ ...d, city: v }))} />
          </Field>
          <Field as="div" label="Tajriba">
            <Chips options={EXP_MIN} isOn={(id) => draft.exp === id} onPick={(id) => setDraft((d) => ({ ...d, exp: id }))} />
          </Field>
          <Check2 checked={draft.active} onChange={(v) => setDraft((d) => ({ ...d, active: v }))}>Faqat faol ish qidirayotganlar</Check2>
          <div className="cands-sheet-btns">
            <button type="button" className="btn btn-ghost" onClick={() => { setDraft(NO_FILTER); setF(NO_FILTER); setSheet(false) }}>Tozalash</button>
            <button type="button" className="btn btn-primary grow" onClick={() => { setF(draft); setSheet(false) }}>Ko'rsatish</button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}

export function CandidateDetail() {
  const { id } = useParams()
  const { user, invites, invite, notify, savedCands, toggleSaveCand } = useApp()
  const c = CANDIDATES.find((x) => x.id === id)
  if (!c) return <div className="page"><TopBar title="Nomzod" /><Empty title="Topilmadi" /></div>
  const invited = invites.includes(c.id)
  const saved = savedCands.includes(c.id)
  const status = statusOf(c)
  const years = age(c.birthDate)
  const exp = expText(c)
  const employer = user?.role === 'employer'

  return (
    <div className="page detail cv-page">
      <TopBar title="Rezyume" />
      <div className="page-body">
        <div className="cv-hero">
          <img className="cv-hero-art" src="/ayolqadami-mark.png" alt="" aria-hidden="true" />
          <span className="cv-ava">
            <Avatar name={c.name} color={c.color} size={88} radius={28} />
            {status?.id === 'active' && <i className="cv-online" aria-label="Faol" />}
          </span>
          <h1>{fullName(c)}</h1>
          <span className="cv-headline">{c.headline}</span>
          <span className="cv-pill"><Star size={14} weight="fill" /> {catName(c.category)}</span>
          <div className="cv-meta-row">
            {years != null && <span><Cake size={16} /> {years} yosh</span>}
            {placeText(c) && <span><MapPin size={16} /> {placeText(c)}</span>}
            {exp && <span><Suitcase size={16} /> {exp}</span>}
          </div>
          {(status || employer) && (
            <div className="cv-hero-foot">
              {status && (
                <div className={`cv-state s-${status.id}`}>
                  <b><i />{status.id === 'active' ? 'Hozirda faol' : status.label}</b>
                  <small>{status.id === 'active' ? 'Ish qidiryapti' : status.hint}</small>
                </div>
              )}
              {employer && (
                <div className="cv-hero-acts">
                  <button type="button" className={`cv-like ${saved ? 'on' : ''}`} aria-pressed={saved}
                    aria-label={saved ? 'Saqlanganlardan olib tashlash' : 'Saqlash'}
                    onClick={() => { toggleSaveCand(c.id); notify(saved ? 'Saqlanganlardan olib tashlandi' : 'Nomzod saqlandi') }}>
                    <Heart size={20} weight={saved ? 'fill' : 'regular'} />
                  </button>
                  <button type="button" className="btn btn-primary cv-invite" disabled={invited}
                    onClick={() => { invite(c.id); notify('Taklif yuborildi') }}>
                    {invited ? <><Check size={18} weight="bold" /> Yuborilgan</> : <><PaperPlaneTilt size={18} weight="fill" /> Taklif yuborish</>}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <ResumeView p={c} contacts={employer} />
      </div>
    </div>
  )
}
