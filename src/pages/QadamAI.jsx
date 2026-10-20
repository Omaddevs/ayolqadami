import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Briefcase, Calculator, CaretRight, ChalkboardTeacher, Clock, Code, GraduationCap, Headset, House,
  Lightbulb, Megaphone, Palette, PaperPlaneTilt, Plant, Scissors, Sparkle, Stethoscope, X,
} from '@phosphor-icons/react'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import { Avatar, CompanyLogo, TopBar } from '../components/UI'
import { useApp } from '../context/AppContext'
import { EMPLOYER_PROMPTS, SEEKER_PROMPTS, matchCandidates, matchJobs } from '../data/qadam'
import { catName, salaryText } from '../data/mock'

const PROMPT_ICONS = {
  briefcase: Briefcase, calculator: Calculator, megaphone: Megaphone, cap: GraduationCap, stethoscope: Stethoscope,
  scissors: Scissors, palette: Palette, headset: Headset, house: House, code: Code, sprout: Plant, clock: Clock,
  teacher: ChalkboardTeacher,
}
const TIP_KEY = 'qadam-ai-tip-hidden'

/* Kirish illyustratsiyasi: markazda 3D yulduzcha, yonida chat va nomzod kartochkasi */
function AiHero() {
  return (
    <div className="ai-hero" aria-hidden="true">
      <span className="ai-hero-glow" />
      <svg className="ai-hero-bubble" viewBox="0 0 120 100">
        <defs>
          <linearGradient id="aihb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B9BBFF" /><stop offset="1" stopColor="#7A78F2" /></linearGradient>
        </defs>
        <path d="M22 12h76a14 14 0 0 1 14 14v34a14 14 0 0 1-14 14H58L40 90l2-16H22A14 14 0 0 1 8 60V26a14 14 0 0 1 14-14z" fill="url(#aihb)" />
        <path d="M22 14h76a12 12 0 0 1 12 12v6H10v-6a12 12 0 0 1 12-12z" fill="#fff" opacity=".22" />
        <path d="M30 34h56M30 46h46M30 58h32" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity=".92" />
      </svg>
      <svg className="ai-hero-card" viewBox="0 0 150 100">
        <defs>
          <linearGradient id="aihc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#DCDDFB" /></linearGradient>
          <linearGradient id="aihp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8F92FA" /><stop offset="1" stopColor="#4B44E6" /></linearGradient>
        </defs>
        <rect x="6" y="8" width="138" height="84" rx="16" fill="url(#aihc)" stroke="#fff" strokeWidth="3" />
        <circle cx="42" cy="40" r="12" fill="url(#aihp)" />
        <path d="M22 72c0-12 9-19 20-19s20 7 20 19z" fill="url(#aihp)" />
        <rect x="74" y="36" width="54" height="9" rx="4.5" fill="#A5A8F7" />
        <rect x="74" y="52" width="40" height="9" rx="4.5" fill="#C9CBFA" />
      </svg>
      <div className="ai-hero-star"><Icon3D name="sparkle" size={150} /></div>
      <Sparkle className="ai-hero-tw t1" size={18} weight="fill" />
      <Sparkle className="ai-hero-tw t2" size={22} weight="fill" />
      <Sparkle className="ai-hero-tw t3" size={14} weight="fill" />
      <span className="ai-hero-dot" />
    </div>
  )
}

function PromptRow({ p, onPick }) {
  const Ico = PROMPT_ICONS[p.icon] || Sparkle
  return (
    <button className="ai-ex" onClick={() => onPick(p.text)}>
      <span className={`ai-ex-ico tone-${p.tone}`}><Ico size={24} weight="duotone" /></span>
      <span className="ai-ex-text">{p.pre}<b>{p.hl}</b>{p.post}</span>
      <span className="ai-ex-go"><CaretRight size={16} weight="bold" /></span>
    </button>
  )
}

const STEPS = ["So'rov tahlil qilinmoqda", 'Profillar solishtirilmoqda', 'Natijalar saralanmoqda']

function Analysis({ a }) {
  const parts = [
    ...a.categories.map((c) => `Soha: ${catName(c)}`),
    ...a.skills.map((s) => s),
    a.years != null && `${a.years}+ yil tajriba`,
    a.city,
    a.remote && 'Masofaviy',
    a.junior && 'Junior',
  ].filter(Boolean)
  if (!parts.length) return null
  return (
    <div className="ai-analysis">
      <span className="muted small">Aniqlangan mezonlar:</span>
      <div className="chips">{parts.map((p) => <span key={p} className="chip chip-primary">{p}</span>)}</div>
    </div>
  )
}

function Score({ v }) {
  return (
    <div className="score" style={{ '--v': v }}>
      <svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5" /><circle cx="18" cy="18" r="15.5" className="arc" /></svg>
      <b>{v}%</b>
    </div>
  )
}

export default function QadamAI() {
  const { user, allJobs, invites, invite, notify } = useApp()
  const isEmp = user?.role === 'employer'
  const [params] = useSearchParams()
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState([])
  const [busy, setBusy] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [tip, setTip] = useState(() => { try { return !localStorage.getItem(TIP_KEY) } catch { return true } })
  const end = useRef(null)
  const started = useRef(false)

  const ask = (text) => {
    const t = text.trim()
    if (!t || busy != null) return
    setInput('')
    setMsgs((m) => [...m, { me: true, text: t }])
    setBusy(0)
    let i = 0
    const timer = setInterval(() => {
      i += 1
      if (i < STEPS.length) setBusy(i)
      else {
        clearInterval(timer)
        const res = isEmp ? matchCandidates(t) : matchJobs(t, user, allJobs)
        setMsgs((m) => [...m, { ai: true, ...res }])
        setBusy(null)
      }
    }, 650)
  }

  useEffect(() => {
    const q = params.get('q')
    if (q && !started.current) { started.current = true; ask(q) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs, busy])

  const prompts = isEmp ? EMPLOYER_PROMPTS : SEEKER_PROMPTS

  return (
    <div className="page ai-page">
      <TopBar title="QadamAI" right={<span className="ai-badge">Beta</span>} />
      <div className="page-body ai-body">
        {msgs.length === 0 && (
          <div className="ai-intro fade-in">
            <AiHero />
            <h2>
              {isEmp ? <>Qanday <span className="ai-hl">mutaxassis</span> kerak?</> : <>Qanday <span className="ai-hl">ish</span> izlayapsiz?</>}
            </h2>
            <p className="ai-lead">
              {isEmp
                ? "Talablarni oddiy so'zlar bilan yozing — QadamAI nomzodlar bazasidan eng moslarini topib, moslik foizini ko'rsatadi."
                : "Istagingizni yozing — QadamAI rezyumengiz va so'rovingiz asosida eng mos vakansiyalarni topadi."}
            </p>

            <section className="ai-examples">
              <div className="ai-examples-head">
                <h3>Misol so'rovlar</h3>
                {prompts.length > 4 && (
                  <button className="ai-more" onClick={() => setShowAll((v) => !v)}>
                    {showAll ? "Yig'ish" : "Barchasini ko'rish"} <CaretRight size={14} weight="bold" className={showAll ? 'up' : ''} />
                  </button>
                )}
              </div>
              {(showAll ? prompts : prompts.slice(0, 4)).map((p) => <PromptRow key={p.text} p={p} onPick={ask} />)}
            </section>

            {tip && (
              <div className="ai-tip">
                <span className="ai-tip-ico"><Lightbulb size={24} weight="duotone" /></span>
                <div className="grow">
                  <b>Maslahat</b>
                  <span>Qanchalik aniq yozsangiz, shunchalik mos {isEmp ? 'nomzodlarni' : 'vakansiyalarni'} topamiz.</span>
                </div>
                <button className="ai-tip-x" aria-label="Yopish"
                  onClick={() => { setTip(false); try { localStorage.setItem(TIP_KEY, '1') } catch { /* */ } }}>
                  <X size={18} weight="bold" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="chat">
          {msgs.map((m, i) =>
            m.me ? (
              <div key={i} className="bubble me">{m.text}</div>
            ) : (
              <div key={i} className="bubble ai">
                <div className="ai-head"><Icon3D name="sparkle" size={28} /> <b>QadamAI</b></div>
                <Analysis a={m.analysis} />
                {m.results.length === 0 ? (
                  <p>Afsuski, aniq mos natija topilmadi. So'rovni boshqacha yozib ko'ring: soha, ko'nikma va shaharni ko'rsating.</p>
                ) : (
                  <>
                    <p>{m.results.length} ta mos {isEmp ? 'nomzod' : 'vakansiya'} topdim:</p>
                    <div className="match-list">
                      {m.results.map(({ item, score, reasons }) =>
                        isEmp ? (
                          <div key={item.id} className="match">
                            <Link to={`/candidates/${item.id}`} className="match-main">
                              <Avatar name={item.name} color={item.color} size={44} />
                              <div className="grow">
                                <b>{item.name}</b>
                                <span className="muted">{item.headline} · {item.city}</span>
                              </div>
                              <Score v={score} />
                            </Link>
                            <div className="reasons">{reasons.map((r) => <span key={r}><Icon name="check" size={13} /> {r}</span>)}</div>
                            <button className={`btn btn-sm ${invites.includes(item.id) ? 'btn-soft' : 'btn-primary'}`}
                              disabled={invites.includes(item.id)}
                              onClick={() => { invite(item.id); notify(`${item.name.split(' ')[0]}ga taklif yuborildi`) }}>
                              {invites.includes(item.id) ? 'Taklif yuborilgan' : 'Suhbatga taklif qilish'}
                            </button>
                          </div>
                        ) : (
                          <div key={item.id} className="match">
                            <Link to={`/jobs/${item.id}`} className="match-main">
                              <CompanyLogo name={item.company} color={item.color} size={44} />
                              <div className="grow">
                                <b>{item.title}</b>
                                <span className="muted">{item.company} · {salaryText(item)}</span>
                              </div>
                              <Score v={score} />
                            </Link>
                            <div className="reasons">{reasons.map((r) => <span key={r}><Icon name="check" size={13} /> {r}</span>)}</div>
                          </div>
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          )}
          {busy != null && (
            <div className="bubble ai thinking">
              <div className="ai-head"><Icon3D name="sparkle" size={28} className="spin" /> <b>QadamAI</b></div>
              {STEPS.map((s, i) => (
                <div key={s} className={`step ${i < busy ? 'done' : i === busy ? 'now' : ''}`}>
                  <span className="step-dot">{i < busy ? <Icon name="check" size={12} stroke={3} /> : null}</span>{s}
                </div>
              ))}
            </div>
          )}
          <div ref={end} />
        </div>
      </div>

      <form className="composer ai-composer" onSubmit={(e) => { e.preventDefault(); ask(input) }}>
        <span className="ai-composer-ico"><Sparkle size={22} weight="fill" /></span>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={isEmp ? 'Masalan: 3 yillik tajribali buxgalter…' : 'Masalan: uydan ishlash, SMM…'} />
        <button className="send" disabled={!input.trim() || busy != null} aria-label="Yuborish"><PaperPlaneTilt size={22} weight="fill" /></button>
      </form>
    </div>
  )
}
