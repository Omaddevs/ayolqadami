import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import { CourseCard, Empty, Sheet, TopBar } from '../components/UI'
import { useApp } from '../context/AppContext'
import { COURSES, formatSum } from '../data/mock'

export function Courses() {
  const { courses } = useApp()
  const [tab, setTab] = useState('all')
  const list = COURSES.filter((c) =>
    tab === 'all' ? true : tab === 'free' ? !c.price : tab === 'paid' ? c.price > 0 : courses.includes(c.id))

  return (
    <div className="page">
      <TopBar title="O'quv kurslar" back={false} />
      <div className="page-body">
        <div className="banner">
          <div>
            <b>Yangi kasb — yangi imkoniyat</b>
            <span>Bepul va pullik kurslar, sertifikat va hamkor kompaniyalarda stajirovka</span>
          </div>
          <Icon3D name="cap" size={96} className="banner-art" />
        </div>

        <div className="segmented">
          {[['all', 'Barchasi'], ['free', 'Bepul'], ['paid', 'Pullik'], ['my', `Mening (${courses.length})`]].map(([k, l]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {list.length ? (
          <div className="course-grid">{list.map((c) => <CourseCard key={c.id} c={c} />)}</div>
        ) : (
          <Empty icon="books" title="Hali kursga yozilmagansiz" text="Bepul kurslardan boshlang — sertifikat ham beriladi" />
        )}
      </div>
    </div>
  )
}

export function CourseDetail() {
  const { id } = useParams()
  const { courses, enroll, notify, requireAuth } = useApp()
  const [pay, setPay] = useState(false)
  const c = COURSES.find((x) => x.id === id)
  if (!c) return <div className="page"><TopBar title="Kurs" /><Empty title="Kurs topilmadi" /></div>
  const enrolled = courses.includes(c.id)

  const join = () => requireAuth(() => {
    enroll(c.id)
    setPay(false)
    notify(c.price ? "To'lov qabul qilindi, kursga yozildingiz!" : 'Kursga yozildingiz!')
  })

  return (
    <div className="page detail">
      <TopBar title="" />
      <div className="page-body">
        <div className="course-hero">
          <Icon3D name={c.icon} size={150} />
          <span className={`price-tag static ${c.price ? '' : 'free'}`}>{c.price ? `${formatSum(c.price)} so'm` : 'Bepul'}</span>
        </div>
        <h1 className="title-lg">{c.title}</h1>
        <span className="muted">{c.provider}</span>

        <div className="stat-row">
          <div><b>{c.rating}</b><span>Reyting</span></div>
          <div><b>{c.lessons}</b><span>Dars</span></div>
          <div><b>{c.duration}</b><span>Davomiylik</span></div>
          <div><b>{c.students}</b><span>O'quvchi</span></div>
        </div>

        <div className="chips">
          <span className="chip chip-primary">{c.format}</span>
          <span className="chip">{c.level}</span>
          {c.certificate && <span className="chip"><Icon name="award" size={14} /> Sertifikat</span>}
        </div>

        <div className="block"><h2>Kurs haqida</h2><p>{c.description}</p></div>
        <div className="block">
          <h2>Dastur</h2>
          <ol className="modules">
            {c.modules.map((m, i) => (
              <li key={m}>
                <span className="mod-num">{i + 1}</span>
                <span className="grow">{m}</span>
                <Icon name={enrolled || i === 0 ? 'play' : 'eye'} size={16} />
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="action-bar">
        <div className="price-col">
          <span className="muted small">Narxi</span>
          <b>{c.price ? `${formatSum(c.price)} so'm` : 'Bepul'}</b>
        </div>
        <button className="btn btn-primary grow" disabled={enrolled} onClick={() => (c.price ? setPay(true) : join())}>
          {enrolled ? <><Icon name="check" size={18} /> Yozilgansiz</> : c.price ? 'Sotib olish' : 'Bepul yozilish'}
        </button>
      </div>

      <Sheet open={pay} onClose={() => setPay(false)} title="To'lov">
        <div className="pay-sum"><span className="muted">Jami:</span><b>{formatSum(c.price)} so'm</b></div>
        <div className="pay-methods">
          {['Click', 'Payme', 'Uzum'].map((m, i) => (
            <label key={m} className="pay-method">
              <input type="radio" name="pm" defaultChecked={i === 0} /> <Icon name="wallet" size={20} /> {m}
            </label>
          ))}
        </div>
        <p className="muted small">MVP rejimi: to'lov simulyatsiya qilinadi.</p>
        <button className="btn btn-primary btn-lg btn-block" onClick={join}>To'lash</button>
      </Sheet>
    </div>
  )
}
