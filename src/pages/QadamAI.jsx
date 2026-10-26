import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import QaIcon from '../components/QaIcon'
import Icon from '../components/Icons'
import { Avatar, CompanyLogo } from '../components/UI'
import { useApp } from '../context/AppContext'
import { EMPLOYER_PROMPTS, SEEKER_PROMPTS, matchCandidates, matchJobs } from '../data/qadam'
import { catName, salaryText } from '../data/mock'
import { jobPath } from '../lib/seo'
import { LANGS, tr, tx } from '../i18n'
import '../styles/qadam-ai.css'

// misol so'rovlar ikonasi (data/qadam.js dagi nom → QaIcon nomi)
const PROMPT_ICONS = {
  briefcase: 'briefcase-01', calculator: 'calculator', megaphone: 'megaphone-01', cap: 'mortarboard-01', stethoscope: 'stethoscope',
  scissors: 'scissor-01', palette: 'paint-board', headset: 'headset', house: 'home-01', code: 'source-code', sprout: 'plant-02', clock: 'clock-01',
  teacher: 'teacher',
}
const STEPS = ["So'rov tahlil qilinmoqda", 'Profillar solishtirilmoqda', 'Natijalar saralanmoqda']
const MODES = {
  hr: { label: 'Nomzod izlash', hint: "Ish beruvchilar uchun: talab bo'yicha mos kadrlar" },
  job: { label: 'Ish izlash', hint: "Ish izlovchilar uchun: rezyumega mos vakansiyalar" },
}
// Suhbatlar faqat so'rovlar ro'yxati sifatida saqlanadi — ochilganda natijalar joriy ma'lumotdan qayta hisoblanadi
const CHATS_KEY = 'qadam-ai-chats'
const DEEP_KEY = 'qadam-ai-deep'
const loadChats = () => { try { const v = JSON.parse(localStorage.getItem(CHATS_KEY)); return Array.isArray(v) ? v : [] } catch { return [] } }
const saveChats = (v) => { try { localStorage.setItem(CHATS_KEY, JSON.stringify(v.slice(0, 50))) } catch { /* */ } }
const uid = () => Math.random().toString(36).slice(2, 10)

// tarix guruhlari: bugun / kecha / 7 kun / avvalroq
function groupChats(chats) {
  const day = 864e5
  const today = new Date().setHours(0, 0, 0, 0)
  const groups = [['Bugun', []], ['Kecha', []], ['Oxirgi 7 kun', []], ['Avvalroq', []]]
  for (const c of chats) groups[c.ts >= today ? 0 : c.ts >= today - day ? 1 : c.ts >= today - 7 * day ? 2 : 3][1].push(c)
  return groups.filter(([, list]) => list.length)
}

function Orb({ size = 'lg' }) {
  return <span className={`qa-orb qa-orb--${size}`} aria-hidden="true"><i /></span>
}

function Score({ v }) {
  return (
    <div className="score" style={{ '--v': v }}>
      <svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5" /><circle cx="18" cy="18" r="15.5" className="arc" /></svg>
      <b>{v}%</b>
    </div>
  )
}

function Analysis({ a }) {
  const parts = [
    ...a.categories.map((c) => `${tr('Soha')}: ${catName(c)}`),
    ...a.skills,
    a.years != null && tr('{n}+ yil tajriba', { n: a.years }),
    a.city && tx(a.city),
    a.remote && tr('Masofaviy'),
    a.junior && 'Junior',
  ].filter(Boolean)
  if (!parts.length) return null
  return (
    <div className="qa-criteria">
      <span>{tr('Aniqlangan mezonlar:')}</span>
      {parts.map((p) => <em key={p}>{p}</em>)}
    </div>
  )
}

// So'rov oynasi: Enter — yuborish, Shift+Enter — yangi qator
function Composer({ value, onChange, onSend, busy, deep, setDeep, prompts, onPick, mode, big, inputRef, last, city, notify }) {
  const [tray, setTray] = useState(false)
  // so'rovga so'z qo'shish (shahar, ish formati) — takrorlanmaydi
  const addWord = (w) => {
    const v = value.trim()
    if (!v.toLowerCase().includes(w.toLowerCase())) onChange(v ? `${v}, ${w}` : w)
    inputRef.current?.focus()
  }
  // .txt fayl (masalan, vakansiya matni yoki talablar) so'rov oynasiga o'qiladi
  const onFile = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.size > 200 * 1024) return notify(tr('Fayl 200 KB dan oshmasin'))
    f.text().then((t) => { onChange(t.trim().slice(0, 2000)); inputRef.current?.focus() }).catch(() => notify(tr("Faylni o'qib bo'lmadi")))
  }
  const autosize = (el) => { if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 180)}px` } }
  useEffect(() => autosize(inputRef.current), [value, inputRef])
  const canSend = value.trim() && busy == null
  return (
    <form className={`qa-composer${big ? ' is-big' : ''}`} onSubmit={(e) => { e.preventDefault(); onSend(value) }}>
      <div className="qa-box">
        <textarea ref={inputRef} rows={big ? 2 : 1} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={mode === 'hr' ? tr("Talablarni yozing: kasb, tajriba, shahar, ko'nikmalar…") : tr("Qanday ish izlayapsiz? Kasb, shahar, ish formati…")}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); onSend(value) } }} />
        <div className="qa-box-row">
          <button type="button" className={`qa-pill${deep ? ' on' : ''}`} aria-pressed={deep} onClick={() => setDeep(!deep)}
            title={tr("Mezonlar va har bir natija sababi batafsil ko'rsatiladi")}>
            <QaIcon name="stars" size={16} strokeWidth={deep ? 1.8 : 1.5} /> {tr('Chuqur tahlil')}
          </button>
          <button type="button" className="qa-ibtn" aria-label={tr("Oxirgi so'rovni qaytarish")} title={tr("Oxirgi so'rovni qaytarish")} disabled={!last}
            onClick={() => { onChange(last); inputRef.current?.focus() }}>
            <QaIcon name="arrow-turn-backward" size={18} />
          </button>
          <button type="button" className={`qa-ibtn${tray ? ' on' : ''}`} aria-label={tr("Misol so'rovlar")} title={tr("Misol so'rovlar")} onClick={() => setTray((v) => !v)}>
            <QaIcon name="bulb" size={18} />
          </button>
          <span className="qa-grow" />
          <span className="qa-kbd">{tr('Enter — yuborish')}</span>
          <button type="button" className="qa-ibtn qa-ibtn--opt" aria-label={tr("Shahar qo'shish")} title={`${tr("Shahar qo'shish")}: ${tx(city)}`} onClick={() => addWord(city)}>
            <QaIcon name="location-01" size={18} />
          </button>
          <button type="button" className="qa-ibtn qa-ibtn--opt" aria-label={tr('Masofaviy ish')} title={tr('Masofaviy ish')} onClick={() => addWord(tr('masofaviy'))}>
            <QaIcon name="globe-02" size={18} />
          </button>
          <button type="submit" className="qa-send" disabled={!canSend} aria-label={tr('Yuborish')}><QaIcon name="arrow-up-02" size={19} strokeWidth={2} /></button>
        </div>
      </div>
      {big && (
        <div className="qa-tray">
          <button type="button" className="qa-tray-btn" aria-expanded={tray} onClick={() => setTray((v) => !v)}>
            <QaIcon name="stars" size={16} /> {tr("Tayyor so'rovlar")} <QaIcon name="arrow-down-01" size={13} strokeWidth={2} className={tray ? 'up' : ''} />
          </button>
          <span className="qa-tray-hint">{mode === 'hr' ? tr('Qanchalik aniq yozsangiz, shunchalik mos nomzodlar') : tr('Qanchalik aniq yozsangiz, shunchalik mos vakansiyalar')}</span>
          <label className="qa-attach" title={tr("Talablar yoki vakansiya matni (.txt)")}>
            <input type="file" accept=".txt,text/plain" onChange={onFile} />
            <QaIcon name="attachment-01" size={15} /> {tr('Fayl biriktirish')}
          </label>
        </div>
      )}
      {tray && (
        <div className="qa-prompts">
          {prompts.map((p) => {
            const ico = PROMPT_ICONS[p.icon] || 'stars'
            return (
              <button key={p.text} type="button" onClick={() => { setTray(false); onPick(p.text) }}>
                <QaIcon name={ico} size={17} /> <span>{tr(p.pre)}<b>{tr(p.hl)}</b>{tr(p.post)}</span>
              </button>
            )
          })}
        </div>
      )}
    </form>
  )
}

export default function QadamAI() {
  const { user, viewRole, setViewRole, allJobs, invites, invite, notify, requireAuth, logout, prefs, setPrefs } = useApp()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const [mode, setMode] = useState(() => (params.get('mode') === 'job' ? 'job' : params.get('mode') === 'hr' ? 'hr' : viewRole === 'employer' ? 'hr' : 'job'))
  const [chats, setChats] = useState(loadChats)
  const [chatId, setChatId] = useState(null)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(null)
  const [deep, setDeepState] = useState(() => { try { return localStorage.getItem(DEEP_KEY) !== '0' } catch { return true } })
  const [q, setQ] = useState('')
  const [side, setSide] = useState(false) // mobil: yon panel ochiq
  const [collapsed, setCollapsed] = useState(false) // desktop: yon panel yig'ilgan
  const [menu, setMenu] = useState(null) // 'mode' | 'more' | 'lang'
  const inputRef = useRef(null)
  const searchRef = useRef(null)
  const end = useRef(null)
  const timer = useRef(null)
  const started = useRef(false)
  const isHr = mode === 'hr'
  const prompts = isHr ? EMPLOYER_PROMPTS : SEEKER_PROMPTS

  const setDeep = (v) => { setDeepState(v); try { localStorage.setItem(DEEP_KEY, v ? '1' : '0') } catch { /* */ } }
  const run = useCallback((text, m) => (m === 'hr' ? matchCandidates(text) : matchJobs(text, user, allJobs)), [user, allJobs])
  const persist = (next) => { setChats(next); saveChats(next) }

  const ask = (text) => {
    const t = text.trim()
    if (!t || busy != null) return
    setInput('')
    setMsgs((m) => [...m, { me: true, text: t }])
    // suhbat tarixga yoziladi (birinchi so'rov — sarlavha)
    let id = chatId
    const now = Date.now()
    if (!id) {
      id = uid()
      setChatId(id)
      persist([{ id, title: t.slice(0, 80), ts: now, mode, qs: [t] }, ...chats])
    } else {
      const cur = chats.find((c) => c.id === id)
      persist([{ ...cur, ts: now, qs: [...(cur?.qs || []), t] }, ...chats.filter((c) => c.id !== id)])
    }
    setBusy(0)
    let i = 0
    clearInterval(timer.current)
    timer.current = setInterval(() => {
      i += 1
      if (i < STEPS.length) setBusy(i)
      else {
        clearInterval(timer.current)
        setMsgs((m) => [...m, { ai: true, mode, ...run(t, mode) }])
        setBusy(null)
      }
    }, 600)
  }

  const newChat = () => {
    clearInterval(timer.current)
    setBusy(null); setMsgs([]); setChatId(null); setInput(''); setSide(false); setMenu(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }
  const openChat = (c) => {
    clearInterval(timer.current)
    setBusy(null)
    setMode(c.mode)
    setChatId(c.id)
    setMsgs(c.qs.flatMap((t) => [{ me: true, text: t }, { ai: true, mode: c.mode, ...run(t, c.mode) }]))
    setSide(false)
  }
  const removeChat = (id) => {
    persist(chats.filter((c) => c.id !== id))
    if (id === chatId) newChat()
  }
  const switchMode = (m) => {
    setMenu(null)
    if (m === mode) return
    setMode(m)
    if (msgs.length) newChat()
  }
  // menyudan tanlansa — manzil (?mode=) va sarlavhadagi almashtirgich ham shu rejimga o'tadi
  const pickMode = (m) => {
    switchMode(m)
    setViewRole(m === 'hr' ? 'employer' : 'seeker')
    setParams((p) => { const n = new URLSearchParams(p); n.set('mode', m); return n }, { replace: true })
  }

  // suhbatni matn fayl sifatida yuklab olish
  const exportChat = () => {
    if (!msgs.length) return notify(tr("Hali suhbat yo'q"))
    const lines = [`QadamHR AI — ${new Date().toLocaleString()}`, '']
    for (const m of msgs) {
      if (m.me) lines.push(`${tr('Siz')}: ${m.text}`, '')
      else {
        lines.push(`QadamHR AI: ${m.results.length ? tr('{n} ta natija', { n: m.results.length }) : tr('Mos natija topilmadi')}`)
        m.results.forEach(({ item, score }, i) => lines.push(`  ${i + 1}. ${m.mode === 'hr' ? `${item.name} — ${item.headline}` : `${item.title} — ${item.company}`} (${score}%)`))
        lines.push('')
      }
    }
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `qadamhr-ai-${new Date().toISOString().slice(0, 10)}.txt` })
    a.click()
    URL.revokeObjectURL(url)
  }
  const copyLink = async () => {
    const first = msgs.find((m) => m.me)?.text
    const url = `${location.origin}/qadam-ai?mode=${mode}${first ? `&q=${encodeURIComponent(first)}` : ''}`
    try { await navigator.clipboard.writeText(url); notify(tr('Havola nusxalandi')) } catch { notify(url) }
  }

  useEffect(() => {
    const qq = params.get('q')
    if (qq && !started.current) { started.current = true; ask(qq) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // sarlavhadagi «Ish izlovchi / Ish beruvchi» almashtirgichi ?mode= ni o'zgartiradi — rejim manzilga ergashadi
  const urlMode = params.get('mode')
  useEffect(() => {
    if (urlMode === 'hr' || urlMode === 'job') switchMode(urlMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlMode])
  useEffect(() => () => clearInterval(timer.current), [])
  useEffect(() => { if (msgs.length) end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs, busy])
  // Ctrl/⌘+K — tarixdan qidirish
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSide(true); setCollapsed(false); setTimeout(() => searchRef.current?.focus(), 0) }
      if (e.key === 'Escape') { setMenu(null); setSide(false) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    if (!menu) return
    const onDown = (e) => { if (!e.target.closest('.qa-menu-root')) setMenu(null) }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [menu])

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase()
    return groupChats(s ? chats.filter((c) => c.title.toLowerCase().includes(s)) : chats)
  }, [chats, q])

  const first = (user?.name || '').split(' ')[0]
  const links = isHr
    ? [{ to: '/candidates', icon: 'user-group', label: 'Nomzodlar' }, { to: '/post-job', icon: 'add-square', label: 'Vakansiya joylash', role: 'employer' },
      { to: '/companies', icon: 'building-03', label: 'Kompaniyalar' }, { to: '/', icon: 'home-01', label: 'Bosh sahifa' }]
    : [{ to: '/jobs', icon: 'briefcase-01', label: 'Vakansiyalar' }, { to: '/applications', icon: 'task-done-01', label: 'Arizalarim', auth: true },
      { to: '/profile/edit', icon: 'user-account', label: 'Rezyume', auth: true }, { to: '/', icon: 'home-01', label: 'Bosh sahifa' }]
  // Yopiq sahifalar: mehmonga shu yerning o'zida kirish oynasi ochiladi, kirgach sahifaga o'tiladi;
  // boshqa rol bilan ish beruvchi sahifasiga kirilsa, Gate jimgina bosh sahifaga otib yubormasligi uchun ogohlantiriladi
  const go = (e, { to, auth, role }) => {
    setSide(false)
    if (!auth && !role) return
    e.preventDefault()
    requireAuth((u) => {
      if (role && u?.role !== role) notify(tr("Bu bo'lim faqat ish beruvchilar uchun"))
      else nav(to)
    })
  }
  const composer = (big) => (
    <Composer value={input} onChange={setInput} onSend={ask} busy={busy} deep={deep} setDeep={setDeep}
      prompts={prompts} onPick={ask} mode={mode} big={big} inputRef={inputRef} notify={notify}
      last={msgs.filter((m) => m.me).at(-1)?.text || chats[0]?.qs.at(-1) || ''} city={user?.city || 'Toshkent'} />
  )

  return (
    <div className="qa">
      <div className={`qa-frame${collapsed ? ' is-collapsed' : ''}`}>
        {side && <div className="qa-scrim" onClick={() => setSide(false)} />}
        <aside className={`qa-side${side ? ' open' : ''}`} aria-label={tr('Suhbatlar')}>
          <div className="qa-brand">
            <span className="qa-logo"><QaIcon name="ai-magic" size={17} /></span>
            <b>QadamHR <span>AI</span></b>
            <button type="button" className="qa-ibtn" aria-label={tr('Panelni yopish')} onClick={() => { setSide(false); setCollapsed(true) }}>
              <QaIcon name="sidebar-left" size={19} />
            </button>
          </div>
          <button type="button" className="qa-new" onClick={newChat}><QaIcon name="add-01" size={17} strokeWidth={2} /> {tr('Yangi suhbat')}</button>
          <label className="qa-search">
            <QaIcon name="search-01" size={16} />
            <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr('Suhbatlardan qidirish')} />
            <kbd>Ctrl K</kbd>
          </label>
          <nav className="qa-nav">
            {links.map((l) => <Link key={l.to} to={l.to} onClick={(e) => go(e, l)}><QaIcon name={l.icon} size={18} /> {tr(l.label)}</Link>)}
          </nav>
          <div className="qa-history">
            {groups.length === 0 ? (
              <p className="qa-empty">{q ? tr('Hech narsa topilmadi') : tr("Suhbatlaringiz shu yerda saqlanadi")}</p>
            ) : groups.map(([g, list]) => (
              <div key={g} className="qa-hgroup">
                <small>{tr(g)}</small>
                {list.map((c) => (
                  <div key={c.id} className={`qa-hitem${c.id === chatId ? ' on' : ''}`}>
                    <button type="button" onClick={() => openChat(c)} title={c.title}>{c.title}</button>
                    <button type="button" className="qa-hdel" aria-label={tr("O'chirish")} onClick={() => removeChat(c.id)}><QaIcon name="cancel-01" size={14} strokeWidth={2} /></button>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {user ? (
            <div className="qa-user">
              <Link to="/profile" className="qa-user-main">
                <Avatar name={user.name || ''} photo={user.photo} size={36} silhouette />
                <span><b>{user.name || tr('Profil')}</b><small>{user.phone || user.email || tr(isHr ? 'Ish beruvchi' : 'Ish izlovchi')}</small></span>
              </Link>
              <button type="button" className="qa-ibtn" aria-label={tr('Chiqish')} title={tr('Chiqish')} onClick={logout}><QaIcon name="logout-03" size={18} /></button>
            </div>
          ) : (
            <button type="button" className="qa-user qa-user--guest" onClick={() => requireAuth()}>
              <span className="qa-logo qa-logo--soft"><QaIcon name="login-03" size={17} /></span>
              <span><b>{tr('Kirish')}</b><small>{tr("Natijalarni saqlash va taklif yuborish uchun")}</small></span>
            </button>
          )}
        </aside>

        <section className="qa-main">
          <header className="qa-top">
            <button type="button" className="qa-ibtn qa-open" aria-label={tr('Suhbatlar')} onClick={() => { setSide(true); setCollapsed(false) }}>
              <QaIcon name={collapsed ? 'sidebar-left' : 'menu-01'} size={19} />
            </button>
            <div className="qa-menu-root">
              <button type="button" className="qa-model" aria-expanded={menu === 'mode'} onClick={() => setMenu(menu === 'mode' ? null : 'mode')}>
                <span className="qa-logo qa-logo--sm"><QaIcon name="ai-magic" size={12} /></span>
                QadamHR AI <span className="qa-model-mode">· {tr(MODES[mode].label)}</span> <QaIcon name="arrow-down-01" size={13} strokeWidth={2} />
              </button>
              {menu === 'mode' && (
                <div className="qa-pop qa-pop--left">
                  {Object.entries(MODES).map(([id, m]) => (
                    <button key={id} type="button" className={id === mode ? 'on' : ''} onClick={() => pickMode(id)}>
                      <QaIcon name={id === 'hr' ? 'user-search-01' : 'job-search'} size={19} />
                      <span><b>{tr(m.label)}</b><small>{tr(m.hint)}</small></span>
                      {id === mode && <QaIcon name="tick-02" size={16} strokeWidth={2} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="qa-grow" />
            <div className="qa-menu-root">
              <button type="button" className="qa-ibtn" aria-label={tr("Ko'proq")} aria-expanded={menu === 'more'} onClick={() => setMenu(menu === 'more' ? null : 'more')}><QaIcon name="more-horizontal" size={21} strokeWidth={2} /></button>
              {menu === 'more' && (
                <div className="qa-pop">
                  <button type="button" onClick={newChat}><QaIcon name="add-01" size={18} /> <span><b>{tr('Yangi suhbat')}</b></span></button>
                  <button type="button" disabled={!chatId} onClick={() => { removeChat(chatId); setMenu(null) }}><QaIcon name="delete-02" size={18} /> <span><b>{tr("Suhbatni o'chirish")}</b></span></button>
                  <button type="button" disabled={!chats.length} onClick={() => { persist([]); newChat() }}><QaIcon name="delete-02" size={18} /> <span><b>{tr('Tarixni tozalash')}</b></span></button>
                </div>
              )}
            </div>
            <button type="button" className="qa-ibtn qa-ibtn--box qa-hide-sm" aria-label={tr('Havolani nusxalash')} title={tr('Havolani nusxalash')} onClick={copyLink}><QaIcon name="link-04" size={18} /></button>
            <button type="button" className="qa-btn qa-hide-sm" onClick={exportChat}><QaIcon name="download-04" size={17} /> {tr('Suhbatni eksport')}</button>
            <Link to={isHr ? '/post-job' : '/profile/edit'} className="qa-btn qa-btn--dark" onClick={(e) => go(e, isHr ? links[1] : links[2])}>{isHr ? tr('Vakansiya joylash') : tr('Rezyume yaratish')}</Link>
          </header>

          <div className={`qa-scroll${msgs.length ? '' : ' is-welcome'}`}>
            {msgs.length === 0 ? (
              <div className="qa-welcome">
                <Orb />
                <p className="qa-hello">{first ? tr('Salom, {name}', { name: first }) : tr('Salom!')}</p>
                <h1>{isHr ? tr('Bugun qanday kadr topishga yordam beray?') : tr('Bugun qanday ish topishga yordam beray?')}</h1>
                {composer(true)}
              </div>
            ) : (
              <div className="qa-thread">
                {msgs.map((m, i) => m.me ? (
                  <div key={i} className="qa-msg qa-msg--me">{tx(m.text)}</div>
                ) : (
                  <div key={i} className="qa-msg qa-msg--ai">
                    <Orb size="sm" />
                    <div className="qa-ai-body">
                      <b className="qa-ai-name">QadamHR AI</b>
                      {deep && <Analysis a={m.analysis} />}
                      {m.results.length === 0 ? (
                        <p>{tr("Afsuski, aniq mos natija topilmadi. So'rovni boshqacha yozib ko'ring: soha, ko'nikma va shaharni ko'rsating.")}</p>
                      ) : (
                        <>
                          <p>{m.mode === 'hr' ? tr('{n} ta mos nomzod topdim:', { n: m.results.length }) : tr('{n} ta mos vakansiya topdim:', { n: m.results.length })}</p>
                          <div className="qa-results">
                            {m.results.map(({ item, score, reasons }) => (
                              <div key={item.id} className="qa-res">
                                {m.mode === 'hr' ? (
                                  <Link to={`/candidates/${item.id}`} className="qa-res-main">
                                    <Avatar name={item.name} color={item.color} size={42} />
                                    <span><b>{item.name}</b><small>{tx(item.headline)} · {tx(item.city)}</small></span>
                                    <Score v={score} />
                                  </Link>
                                ) : (
                                  <Link to={jobPath(item)} className="qa-res-main">
                                    <CompanyLogo name={item.company} color={item.color} size={42} />
                                    <span><b>{tx(item.title)}</b><small>{item.company} · {salaryText(item)}</small></span>
                                    <Score v={score} />
                                  </Link>
                                )}
                                {deep && reasons.length > 0 && (
                                  <div className="reasons">{reasons.map((r) => <span key={r}><Icon name="check" size={13} /> {tr(r)}</span>)}</div>
                                )}
                                {m.mode === 'hr' && (
                                  <button type="button" className={`qa-btn qa-btn--sm${invites.includes(item.id) ? '' : ' qa-btn--dark'}`} disabled={invites.includes(item.id)}
                                    onClick={() => requireAuth(() => { invite(item.id); notify(tr('{a}ga taklif yuborildi', { a: item.name.split(' ')[0] })) })}>
                                    {invites.includes(item.id) ? tr('Taklif yuborilgan') : tr('Suhbatga taklif qilish')}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {busy != null && (
                  <div className="qa-msg qa-msg--ai">
                    <Orb size="sm" />
                    <div className="qa-ai-body">
                      <b className="qa-ai-name">QadamHR AI</b>
                      {STEPS.map((s, i) => (
                        <div key={s} className={`qa-step${i < busy ? ' done' : i === busy ? ' now' : ''}`}>
                          <span>{i < busy && <QaIcon name="tick-02" size={11} strokeWidth={2} />}</span>{tr(s)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={end} />
              </div>
            )}
          </div>

          {msgs.length > 0 && <div className="qa-dock">{composer(false)}</div>}

          <footer className="qa-foot">
            {tr("Ko'proq vakansiya va maslahatlar uchun hamjamiyatimizga qo'shiling")}{' '}
            <a href="https://t.me/addlist/URvgf3qbEus5ZDcy" target="_blank" rel="noopener noreferrer">{tr("Telegram'ga qo'shilish")}</a>
          </footer>
          <div className="qa-corner">
            <div className="qa-menu-root">
              <button type="button" className="qa-round" aria-label={tr('Til')} title={tr('Til')} onClick={() => setMenu(menu === 'lang' ? null : 'lang')}><QaIcon name="translate" size={17} /></button>
              {menu === 'lang' && (
                <div className="qa-pop qa-pop--up">
                  {LANGS.map((l) => (
                    <button key={l.id} type="button" className={l.id === prefs.lang ? 'on' : ''} onClick={() => { setPrefs({ lang: l.id }); setMenu(null) }}>
                      <b className="qa-lang">{l.short}</b> <span><b>{l.label}</b></span> {l.id === prefs.lang && <QaIcon name="tick-02" size={16} strokeWidth={2} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link to="/support" className="qa-round" aria-label={tr('Yordam')} title={tr('Yordam')}><QaIcon name="help-circle" size={17} /></Link>
          </div>
        </section>
      </div>
    </div>
  )
}
