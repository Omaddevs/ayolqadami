import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import { Avatar, CompanyLogo, TopBar } from '../components/UI'
import { useApp } from '../context/AppContext'
import { EMPLOYER_PROMPTS, SEEKER_PROMPTS, matchCandidates, matchJobs } from '../data/qadam'
import { catName, salaryText } from '../data/mock'

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
  const isEmp = user.role === 'employer'
  const [params] = useSearchParams()
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState([])
  const [busy, setBusy] = useState(null)
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
            <div className="ai-orb"><Icon3D name="sparkle" size={120} /></div>
            <h2>{isEmp ? 'Qanday mutaxassis kerak?' : 'Qanday ish izlayapsiz?'}</h2>
            <p className="muted">
              {isEmp
                ? "Talablarni oddiy so'zlar bilan yozing — QadamAI nomzodlar bazasidan eng moslarini topib, moslik foizini ko'rsatadi."
                : "Istagingizni yozing — QadamAI rezyumengiz va so'rovingiz asosida eng mos vakansiyalarni topadi."}
            </p>
            <div className="prompt-list">
              {prompts.map((p) => (
                <button key={p} className="prompt" onClick={() => ask(p)}><Icon name="sparkle" size={16} /> {p}</button>
              ))}
            </div>
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

      <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(input) }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={isEmp ? 'Masalan: 3 yillik tajribali buxgalter…' : 'Masalan: uydan ishlash, SMM…'} />
        <button className="send" disabled={!input.trim() || busy != null} aria-label="Yuborish"><Icon name="send" size={20} /></button>
      </form>
    </div>
  )
}
