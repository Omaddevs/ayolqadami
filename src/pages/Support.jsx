import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Checks, DotsThree, Lifebuoy, PaperPlaneRight, Plus, Robot, Trash } from '@phosphor-icons/react'
import { Sheet } from '../components/UI'
import { canUseAI, useApp } from '../context/AppContext'
import { api as server, apiEnabled } from '../lib/api'
import { tr, tx } from '../i18n'


const BOT = 'Yordamchi-bot Qadamjon'
const GREETING = "Assalomu alaykum! Savollaringizga javob berishga tayyorman. Savolni bir-ikki qisqa jumlada yozing — shunda sizni tezroq tushunaman."

const TOPICS = ['Rezyume qanday yarataman?', 'Arizam holati', 'Vakansiya joylash', 'QadamAI nima?', 'Operator bilan bog\'lanish']

// kalit so'zlar → javob (birinchi mos kelgani olinadi)
const FAQ = [
  { k: ['operator', 'odam', 'mutaxassis', "bog'lan", 'qo\'ng\'iroq'],
    text: "Operatorlarimiz har kuni 9:00 dan 20:00 gacha ishlaydi. Murojaatingizni shu yerga batafsil yozib qoldiring — 15 daqiqa ichida javob beramiz." },
  { k: ['rezyume', 'cv', 'tarjimai'],
    text: "Rezyume yaratish uchun Profil → «Rezyume yaratish» bo'limiga o'ting. To'liq to'ldirilgan rezyume 3 barobar ko'p taklif oladi.",
    link: { to: '/profile/edit', label: 'Rezyumeni ochish' } },
  { k: ['ariza', 'javob', 'holat', 'otklik'],
    text: "Yuborgan arizalaringiz va ularning holati «Arizalarim» bo'limida. Ish beruvchi arizani ko'rganda bildirishnoma keladi.",
    link: { to: '/applications', label: 'Arizalarim' } },
  { k: ['joyla', "e'lon", 'vakansiya qo', 'xodim'],
    text: "Vakansiya joylash uchun ish beruvchi hisobiga o'ting va pastki menyudagi «+» tugmasini bosing. QadamAI darhol mos nomzodlarni tavsiya qiladi.",
    link: { to: '/post-job', label: 'Vakansiya joylash' } },
  { k: ['qadamai', 'ai', 'sun\'iy', 'tavsiya'],
    text: "QadamAI — rezyumengiz va istaklaringizni tahlil qilib, sizga eng mos vakansiya va kurslarni topadigan yordamchi. Unga oddiy so'zlar bilan yozing: «Uydan ishlash, buxgalteriya».",
    link: { to: '/qadam-ai', label: 'QadamAI ni ochish' } },
  { k: ['yashir', 'ko\'rmaslik', 'kompaniya'],
    text: "Vakansiya sahifasining pastida «Vakansiyani yashirish» yoki «Kompaniyani yashirish» tugmalari bor. Yashirilganlarni Sozlamalardan qaytarish mumkin.",
    link: { to: '/settings/hidden', label: 'Yashirinlar' } },
  { k: ['kurs', "o'qish", 'sertifikat'],
    text: "Bepul va pullik kurslar «Kurslar» bo'limida. Kursni tugatgach sertifikat rezyumengizga qo'shiladi.",
    link: { to: '/courses', label: 'Kurslar' } },
  { k: ['akkaunt', "o'chir", 'parol', 'kirish', 'telefon'],
    text: "Akkaunt ma'lumotlarini Sozlamalar → «Foydalanuvchi» bo'limida o'zgartirasiz. Akkauntni o'chirish ham shu yerda.",
    link: { to: '/settings', label: 'Sozlamalar' } },
  { k: ['salom', 'assalom', 'hayrli'], text: 'Va alaykum assalom! Qanday yordam bera olaman?' },
  { k: ['rahmat', 'tashakkur'], text: "Arzimaydi! Yana savollar bo'lsa, yozavering." },
]

const norm = (s) => s.toLowerCase().replace(/[‘’ʼ`ʻ]/g, "'")
const answer = (q) => FAQ.find((f) => f.k.some((k) => norm(q).includes(k))) ||
  { text: tr("Savolingizni to'liq tushunmadim. Iltimos, qisqaroq yozing yoki quyidagi mavzulardan birini tanlang. Operator kerak bo'lsa, «operator» deb yozing.") }

const hhmm = (iso) => new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })

export default function Support() {
  const { user, support, addSupport, mergeSupport, clearSupport, requireAuth } = useApp()
  const nav = useNavigate()
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [topics, setTopics] = useState(support.length === 0)
  const [menu, setMenu] = useState(false)
  const [now] = useState(() => new Date().toISOString())
  const endRef = useRef(null)
  const timer = useRef(0)

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }) }, [support.length, typing])
  useEffect(() => () => clearTimeout(timer.current), [])
  // Operator javoblari (admin panel → Murojaatlar) chatga qo'shiladi
  useEffect(() => {
    if (!apiEnabled || !user) return
    const pull = () => server.support().then((d) => { if (Array.isArray(d?.messages)) mergeSupport?.(d.messages) }).catch(() => {})
    pull()
    const iv = setInterval(pull, 20000)
    return () => clearInterval(iv)
  }, [user, mergeSupport])

  const send = (q) => {
    q = q.trim()
    if (!q || typing) return
    if (!user) return requireAuth()
    addSupport({ from: 'me', text: q })
    setText('')
    setTopics(false)
    setTyping(true)
    timer.current = setTimeout(() => {
      const a = answer(q)
      // ish izlovchi hisobida QadamAI yo'q — unga havola berilmaydi
      addSupport({ from: 'bot', text: a.text, link: a.link?.to === '/qadam-ai' && !canUseAI(user) ? undefined : a.link })
      setTyping(false)
    }, 900 + Math.min(q.length * 15, 900))
  }

  // salomlashuv doim birinchi xabar sifatida ko'rsatiladi
  const msgs = [{ id: 'hello', from: 'bot', text: GREETING, time: support[0]?.time || now }, ...support]

  return (
    <div className="page sp">
      <header className="sp-top">
        <button className="sp-back" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/more'))} aria-label={tr("Orqaga")}>
          <ArrowLeft size={22} weight="bold" />
        </button>
        <span className="sp-ava"><Lifebuoy size={26} weight="duotone" /></span>
        <div className="grow sp-title"><b>{tr("Texnik yordam")}</b><span>{typing ? tr('yozmoqda…') : tr('Doim yoningizda')}</span></div>
        <button className="sp-back" onClick={() => setMenu(true)} aria-label={tr("Menyu")}><DotsThree size={26} weight="bold" /></button>
      </header>

      <div className="sp-feed" aria-live="polite">
        <span className="sp-day">{tr("Bugun")}</span>
        {msgs.map((m) => (
          <div key={m.id} className={`sp-row ${m.from}`}>
            {m.from === 'bot' && <span className="sp-bot-ava"><Robot size={24} weight="duotone" /></span>}
            <div className="sp-bubble">
              {m.from === 'bot' && <b className="sp-name">{m.operator ? tr('Operator') : BOT}</b>}
              <p>{tx(m.text)}</p>
              {m.link && <Link to={m.link.to} className="sp-link">{tr(m.link.label)}</Link>}
              <span className="sp-time">{hhmm(m.time)}{m.from === 'me' && <Checks size={15} weight="bold" />}</span>
            </div>
          </div>
        ))}
        {typing && (
          <div className="sp-row bot">
            <span className="sp-bot-ava"><Robot size={24} weight="duotone" /></span>
            <div className="sp-bubble sp-typing" aria-label={tr("Yozmoqda")}><i /><i /><i /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sp-dock">
        {topics && (
          <div className="sp-topics">
            {TOPICS.filter((t) => canUseAI(user) || t !== 'QadamAI nima?').map((t) => <button key={t} type="button" onClick={() => send(t)}>{t}</button>)}
          </div>
        )}
        <form className="sp-composer" onSubmit={(e) => { e.preventDefault(); send(text) }}>
          <button type="button" className={`sp-plus ${topics ? 'on' : ''}`} onClick={() => setTopics((v) => !v)} aria-label={tr("Mavzular")} aria-expanded={topics}>
            <Plus size={22} weight="bold" />
          </button>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={tr("Xabar")} aria-label={tr("Xabar")} />
          {text.trim() && <button className="sp-send" aria-label={tr("Yuborish")}><PaperPlaneRight size={20} weight="fill" /></button>}
        </form>
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} title={tr("Yozishma")}>
        <div className="pf-options">
          <button type="button" className="pf-option" disabled={!support.length}
            onClick={() => { clearTimeout(timer.current); setTyping(false); clearSupport(); setTopics(true); setMenu(false) }}>
            <Trash size={22} />
            <span className="pf-option-text"><b>{tr("Yozishmani tozalash")}</b><span>{tr("Barcha xabarlar o'chiriladi")}</span></span>
          </button>
        </div>
      </Sheet>
    </div>
  )
}
