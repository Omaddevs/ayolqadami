import { useEffect, useRef, useState } from 'react'

// Demo rasmlar (Unsplash). Haqiqiy loyihada o'z rasmlaringiz bilan almashtiring.
const ph = (id, w = 200, h = w) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&crop=faces&q=80`
const P = {
  a: '1494790108377-be9c29b29330',
  b: '1438761681033-6461ffad8d80',
  c: '1544005313-94ddf0286df2',
  d: '1534528741775-53994a69daeb',
  e: '1507003211169-0a1dd7228f2d',
  f: '1500648767791-00dcc994a43e',
  g: '1517841905240-472988babdf9',
  h: '1529626455594-4ff0802cfb7e',
  i: '1531123897727-8f129e1688ce',
  j: '1580489944761-15a19d654956',
  k: '1573496359142-b8d87734a5a2',
  l: '1573497019940-1c28c88b4f3e',
  m: '1567532939604-b6b5b0db2604',
  n: '1554151228-14d9def656e4',
  o: '1508214751196-bcfd4ca60f91',
  p: '1487412720507-e7ab37603c6f',
  q: '1499952127939-9bbf5af6c51c',
  r: '1546961329-78bef0414d7c',
}

// Kompozitsiyalar 320 birlik kenglikdagi koordinatalarda chizilgan
const u = (v) => `calc(${v} * 100cqw / 320)`
const at = (x, y, w, h = w) => ({ left: u(x), top: u(y), width: u(w), height: u(h) })

const Spark = ({ x, y, s, c = '#fff', r = 0 }) => (
  <svg className="obx-spark" style={{ ...at(x, y, s), transform: `translate(-50%,-50%) rotate(${r}deg)` }} viewBox="0 0 24 24">
    <path d="M12 0c.9 7.2 4.8 11.1 12 12-7.2.9-11.1 4.8-12 12-.9-7.2-4.8-11.1-12-12C7.2 11.1 11.1 7.2 12 0Z" fill={c} />
  </svg>
)

const ChipIcon = ({ type }) => {
  if (type === 'cal') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="m12 12.4.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 14.5l2-.3.9-1.8Z" fill="#fff" stroke="none" />
    </svg>
  )
  if (type === 'chat') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12a8 8 0 1 1-3.2-6.4" /><path d="M4 20l1.3-3.6" />
      <path d="M16.5 2.5c.3 2 1 2.7 3 3-2 .3-2.7 1-3 3-.3-2-1-2.7-3-3 2-.3 2.7-1 3-3Z" fill="#fff" stroke="none" />
      <circle cx="9" cy="12.5" r=".6" fill="#fff" /><circle cx="12.5" cy="12.5" r=".6" fill="#fff" />
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="4" rx="1" /><path d="M5 11l1.2 8h11.6L19 11M9.5 14v3M14.5 14v3" />
      <path d="M8 7l2-3M16 7l-2-3" />
    </svg>
  )
}
const Chip = ({ x, y, type, s = 30, glow }) => (
  <span className={`obx-chip ${glow ? 'glow' : ''}`} style={at(x, y, s, s * 0.88)}><ChipIcon type={type} /></span>
)
const Ava = ({ x, y, s, id, ring = true }) => (
  <img className={`obx-ava ${ring ? 'ring' : ''}`} style={at(x, y, s)} src={ph(id, Math.round(s * 3))} alt="" draggable="false" />
)

function ArtOne() {
  return (
    <div className="obx-art" style={{ aspectRatio: '320 / 310' }}>
      <svg className="obx-orbits" viewBox="0 0 320 310" fill="none">
        {[[300, 190], [250, 140], [200, 96]].map(([w, h], k) => (
          <rect key={k} x={165 - w / 2} y={195 - h / 2} width={w} height={h} rx={h / 2} stroke="#fff" strokeOpacity={0.55 - k * 0.1} strokeWidth="1.2" />
        ))}
        <path d="M150 238c18 30 60 40 96 22" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
        <path d="M157 218l3 22 6-8 9 1-18-15Z" fill="rgba(255,255,255,.35)" stroke="#E9A47E" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <Spark x={33} y={60} s={22} />
      <Spark x={223} y={50} s={38} />
      <Spark x={240} y={228} s={12} />
      <Spark x={92} y={276} s={12} />
      <Ava x={95} y={90} s={80} id={P.f} />
      <Ava x={193} y={137} s={52} id={P.c} />
      <Ava x={287} y={103} s={48} id={P.h} />
      <Ava x={42} y={273} s={50} id={P.l} />
      <Ava x={112} y={252} s={46} id={P.k} />
      <Ava x={279} y={262} s={62} id={P.o} />
      <Chip x={25} y={168} type="cal" />
      <Chip x={307} y={178} type="chat" />
      <Chip x={175} y={282} type="bag" />
      <div className="obx-pill" style={{ left: u(165), top: u(176) }}>
        <i><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 12.5 4 4 8-9" /></svg></i>
        Karyera, oson
      </div>
    </div>
  )
}

function ArtTwo() {
  return (
    <div className="obx-art" style={{ aspectRatio: '320 / 350' }}>
      <div className="obx-phone" style={{ left: u(46), top: u(22), width: u(240), height: u(240) }}>
        <div className="obx-phone-bar"><span>9:41</span><span className="obx-sig"><i /><i /><i /><b /></span></div>
      </div>
      <div className="obx-task t1" style={{ left: u(18), top: u(68), width: u(296) }}>
        <img src={ph(P.k, 80)} alt="" />
        <div><b>Suhbat: NurTech</b><span>10:00 · Toshkent</span></div>
        <em className="peach">Bugun</em>
      </div>
      <div className="obx-task t2" style={{ left: u(34), top: u(130), width: u(264) }}>
        <img src={ph(P.f, 80)} alt="" />
        <div><b>UX dizayn kursi</b><span>14:30 · Onlayn</span></div>
        <em className="sage">Ertaga</em>
      </div>
      <div className="obx-task t3" style={{ left: u(93), top: u(186), width: u(170) }}>
        <i className="obx-check" /><span>Rezyumeni yangilash</span>
      </div>
      <Spark x={36} y={243} s={24} c="#F2B48F" />
      <Spark x={204} y={238} s={34} c="#9DBDB2" r={-12} />
      <Spark x={120} y={258} s={11} c="#C9CDD3" />
      <Spark x={271} y={252} s={14} c="#F2B48F" />
      <Ava x={166} y={302} s={68} id={P.a} />
      <Ava x={44} y={312} s={38} id={P.o} />
      <Ava x={90} y={276} s={30} id={P.e} />
      <Ava x={101} y={326} s={32} id={P.f} />
      <Ava x={236} y={276} s={38} id={P.l} />
      <Ava x={290} y={300} s={34} id={P.k} />
      <Ava x={240} y={328} s={30} id={P.h} />
    </div>
  )
}

function ArtThree() {
  const caps = [
    { x: 47, y: 12, h: 160, id: P.c }, { x: 47, y: 196, h: 136, id: P.o },
    { x: 134, y: -12, h: 122, id: P.e, flat: true }, { x: 134, y: 137, h: 168, id: P.k },
    { x: 222, y: 28, h: 168, id: P.l }, { x: 222, y: 212, h: 124, id: P.p },
  ]
  return (
    <div className="obx-art" style={{ aspectRatio: '320 / 340' }}>
      {caps.map((c, k) => (
        <div key={k} className={`obx-cap ${c.flat ? 'flat' : ''}`} style={at(c.x, c.y, 68, c.h)}>
          <img src={ph(c.id, 210, Math.round(c.h * 3))} alt="" draggable="false" />
        </div>
      ))}
      <div className="obx-fade" />
      <Chip x={81} y={188} type="cal" s={36} glow />
      <Chip x={168} y={130} type="bag" s={36} glow />
      <Chip x={256} y={202} type="chat" s={36} glow />
      <Spark x={22} y={88} s={24} c="#F2B48F" />
      <Spark x={308} y={226} s={28} c="#9DBDB2" />
      <Spark x={128} y={316} s={12} c="#F2B48F" />
      <Spark x={214} y={26} s={12} c="#D3D6DB" />
    </div>
  )
}

const SLIDES = [
  { Art: ArtOne, warm: true, title: 'Karyerangizni oson boshqaring', text: "Vakansiyalar, arizalar, kurslar va rezyume — barchasi bitta qulay joyda." },
  { Art: ArtTwo, title: 'QadamAI ishlaringizni tartiblaydi', text: "Suhbatlarni rejalaydi, arizalarni eslatadi va sizga mos ishlarni tavsiya qiladi." },
  { Art: ArtThree, title: 'Birgalikda oldinga qadam', text: "Mentorlar, hamkasblar va minglab ayollar hamjamiyati bilan doim bog'lanib turing." },
]

export default function Onboarding({ onDone }) {
  const [i, setI] = useState(0)
  const touch = useRef(null)
  const s = SLIDES[i]
  const last = i === SLIDES.length - 1

  // Keyingi slaydlardagi rasmlar kechikmasdan chiqishi uchun oldindan yuklab qo'yamiz
  useEffect(() => {
    Object.values(P).forEach((id) => { new Image().src = ph(id, 150) })
  }, [])

  const next = () => (last ? onDone() : setI(i + 1))
  const prev = () => i > 0 && setI(i - 1)
  const onTouchStart = (e) => { touch.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touch.current == null) return
    const dx = e.changedTouches[0].clientX - touch.current
    if (dx < -50) next()
    else if (dx > 50) prev()
    touch.current = null
  }

  return (
    <div className={`obx ${s.warm ? 'warm' : ''}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="obx-head">
        {i > 0 && (
          <button className="obx-back" onClick={prev} aria-label="Orqaga">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m14.5 6-6 6 6 6" /></svg>
          </button>
        )}
        <div className="obx-bars">
          {SLIDES.map((_, k) => <button key={k} className={k <= i ? 'on' : ''} onClick={() => setI(k)} aria-label={`${k + 1}-qadam`} />)}
        </div>
      </div>

      <div className="obx-stage" key={i}>
        <s.Art />
        <div className="obx-text">
          <h1>{s.title}</h1>
          <p>{s.text}</p>
        </div>
      </div>

      <button className="obx-btn" onClick={next}>
        {last ? 'Boshlash' : 'Keyingisi'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
    </div>
  )
}
