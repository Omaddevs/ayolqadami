import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import { CourseCard, Empty, Sheet, TopBar } from '../components/UI'
import { useApp, useContent } from '../context/AppContext'
import { formatSum } from '../data/mock'
import { tr, tx } from '../i18n'


export function Courses() {
  const { courses } = useApp()
  const { courses: COURSES } = useContent()
  const [tab, setTab] = useState('all')
  const list = COURSES.filter((c) =>
    tab === 'all' ? true : tab === 'free' ? !c.price : tab === 'paid' ? c.price > 0 : courses.includes(c.id))

  return (
    <div className="page">
      <TopBar title={tr("O'quv kurslar")} back={false} />
      <div className="page-body">
        <div className="banner">
          <div>
            <b>{tr("Yangi kasb — yangi imkoniyat")}</b>
            <span>{tr("Bepul va pullik kurslar, sertifikat va hamkor kompaniyalarda stajirovka")}</span>
          </div>
          <Icon3D name="cap" size={96} className="banner-art" />
        </div>

        <div className="segmented">
          {[['all', tr('Barchasi')], ['free', tr('Bepul')], ['paid', tr('Pullik')], ['my', tr("Mening ({a})", { a: courses.length })]].map(([k, l]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {list.length ? (
          <div className="course-grid">{list.map((c) => <CourseCard key={c.id} c={c} />)}</div>
        ) : (
          <Empty icon="books" title={tr("Hali kursga yozilmagansiz")} text={tr("Bepul kurslardan boshlang — sertifikat ham beriladi")} />
        )}
      </div>
    </div>
  )
}

export function CourseDetail() {
  const { id } = useParams()
  const { courses, enroll, notify, requireAuth } = useApp()
  const { courses: COURSES } = useContent()
  const [pay, setPay] = useState(false)
  const c = COURSES.find((x) => x.id === id)
  if (!c) return <div className="page"><TopBar title={tr("Kurs")} /><Empty title={tr("Kurs topilmadi")} /></div>
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
          <span className={`price-tag static ${c.price ? '' : 'free'}`}>{c.price ? tr("{a} so'm", { a: formatSum(c.price) }) : tr('Bepul')}</span>
        </div>
        <h1 className="title-lg">{tx(c.title)}</h1>
        <span className="muted">{tx(c.provider)}</span>

        <div className="stat-row">
          <div><b>{c.rating}</b><span>{tr("Reyting")}</span></div>
          <div><b>{c.lessons}</b><span>{tr("Dars")}</span></div>
          <div><b>{tx(c.duration)}</b><span>{tr("Davomiylik")}</span></div>
          <div><b>{c.students}</b><span>{tr("O'quvchi")}</span></div>
        </div>

        <div className="chips">
          <span className="chip chip-primary">{tx(c.format)}</span>
          <span className="chip">{tx(c.level)}</span>
          {c.certificate && <span className="chip"><Icon name="award" size={14} /> {tr("Sertifikat")}</span>}
        </div>

        <div className="block"><h2>{tr("Kurs haqida")}</h2><p>{tx(c.description)}</p></div>
        <div className="block">
          <h2>{tr("Dastur")}</h2>
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
          <span className="muted small">{tr("Narxi")}</span>
          <b>{c.price ? tr("{a} so'm", { a: formatSum(c.price) }) : tr('Bepul')}</b>
        </div>
        <button className="btn btn-primary grow" disabled={enrolled} onClick={() => (c.price ? setPay(true) : join())}>
          {enrolled ? <><Icon name="check" size={18} /> {tr("Yozilgansiz")}</> : c.price ? tr('Sotib olish') : tr('Bepul yozilish')}
        </button>
      </div>

      <Sheet open={pay} onClose={() => setPay(false)} title={tr("To'lov")}>
        <div className="pay-sum"><span className="muted">{tr("Jami:")}</span><b>{formatSum(c.price)} {tr("so'm")}</b></div>
        <div className="pay-methods">
          {[tr('Click'), tr('Payme'), tr('Uzum')].map((m, i) => (
            <label key={m} className="pay-method">
              <input type="radio" name="pm" defaultChecked={i === 0} /> <Icon name="wallet" size={20} /> {m}
            </label>
          ))}
        </div>
        <p className="muted small">{tr("MVP rejimi: to'lov simulyatsiya qilinadi.")}</p>
        <button className="btn btn-primary btn-lg btn-block" onClick={join}>{tr("To'lash")}</button>
      </Sheet>
    </div>
  )
}
