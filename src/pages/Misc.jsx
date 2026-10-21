import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bell, BookOpen, CalendarBlank, CaretRight, MapPin, Gear, Lifebuoy, WarningCircle, Buildings } from '@phosphor-icons/react'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import { Empty, JobCard, TopBar } from '../components/UI'
import { useApp } from '../context/AppContext'
import { EVENTS, NOTIFICATIONS } from '../data/mock'

export function Applications() {
  const { user, jobsAll: allJobs, applications, saved, posted, removeJob, notify } = useApp()
  const [params] = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') || 'apps')

  if (user.role === 'employer') {
    return (
      <div className="page">
        <TopBar title="Mening vakansiyalarim" right={<Link to="/post-job" className="icon-btn ai" aria-label="Qo'shish"><Icon name="plus" /></Link>} />
        <div className="page-body">
          {posted.length ? (
            <div className="list-grid">
              {posted.map((j) => (
                <div key={j.id} className="own-job">
                  <JobCard job={j} compact />
                  <div className="own-actions">
                    <Link to={`/qadam-ai?q=${encodeURIComponent(j.title + ' ' + j.skills.join(' ') + ' ' + j.city)}`} className="btn btn-soft btn-sm grow">
                      <Icon name="sparkle" size={16} /> Mos nomzodlar
                    </Link>
                    <button className="btn btn-ghost btn-sm" onClick={() => { removeJob(j.id); notify("Vakansiya o'chirildi") }}><Icon name="trash" size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty icon="folder" title="Hali vakansiya joylamadingiz" text="Birinchi e'loningizni joylang — QadamAI darhol mos nomzodlarni tavsiya qiladi"
              action={<Link to="/post-job" className="btn btn-primary">Vakansiya joylash</Link>} />
          )}
        </div>
      </div>
    )
  }

  const savedJobs = allJobs.filter((j) => saved.includes(j.id))
  return (
    <div className="page">
      <TopBar title="Arizalarim" />
      <div className="page-body">
        <div className="segmented">
          <button className={tab === 'apps' ? 'on' : ''} onClick={() => setTab('apps')}>Arizalar ({applications.length})</button>
          <button className={tab === 'saved' ? 'on' : ''} onClick={() => setTab('saved')}>Saqlangan ({saved.length})</button>
        </div>
        {tab === 'apps' ? (
          applications.length ? (
            <div className="list-grid">
              {applications.map((a) => {
                const j = allJobs.find((x) => x.id === a.jobId)
                if (!j) return null
                return (
                  <div key={a.jobId} className="app-item">
                    <JobCard job={j} compact />
                    <div className="app-status">
                      <span className="status"><i /> {a.status}</span>
                      <span className="muted small">{new Date(a.date).toLocaleDateString('uz-UZ')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <Empty icon="folder" title="Arizalar yo'q" text="Sizga mos vakansiyalarni toping va bir bosishda ariza yuboring"
              action={<Link to="/jobs" className="btn btn-primary">Vakansiyalarni ko'rish</Link>} />
          )
        ) : savedJobs.length ? (
          <div className="list-grid">{savedJobs.map((j) => <JobCard key={j.id} job={j} />)}</div>
        ) : (
          <Empty icon="briefcase" title="Saqlanganlar yo'q" text="Yoqqan vakansiyalarni yurakcha orqali saqlang" />
        )}
      </div>
    </div>
  )
}

export function Events() {
  const { notify } = useApp()
  const [joined, setJoined] = useState([])
  return (
    <div className="page more">
      <TopBar title="Tadbirlar" />
      <div className="page-body">
        <div className="ar-list">
          {EVENTS.map((e) => {
            const on = joined.includes(e.id)
            return (
              <div key={e.id} className="ar-card ev-card">
                <div className={`ar-cover ev-cover ${e.img ? 'has-img' : ''}`} style={{ '--c1': e.cover[0], '--c2': e.cover[1] }}>
                  {e.img ? <img src={e.img} alt="" draggable="false" /> : <Icon3D name="calendar" size={110} />}
                  {e.tag && <span className="ar-tag">{e.tag}</span>}
                  <span className="ev-date"><CalendarBlank size={15} weight="bold" /> {e.date}</span>
                </div>
                <div className="ar-card-body">
                  <h2>{e.title}</h2>
                  <span className="ar-meta"><MapPin size={15} /> {e.place}</span>
                  <p>{e.desc}</p>
                  <button className={`btn ${on ? 'btn-soft' : 'btn-primary'} ev-btn`} disabled={on}
                    onClick={() => { setJoined([...joined, e.id]); notify("Tadbirga ro'yxatdan o'tdingiz") }}>
                    {on ? "Ro'yxatdan o'tilgan" : "Ro'yxatdan o'tish"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function Notifications() {
  return (
    <div className="page">
      <TopBar title="Bildirishnomalar" />
      <div className="page-body">
        <div className="list-grid">
          {NOTIFICATIONS.map((n) => (
            <div key={n.id} className="notif">
              <div className="notif-ico"><Icon3D name={n.icon} size={44} /></div>
              <div className="grow"><b>{n.title}</b><span>{n.text}</span><span className="muted small">{n.time}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Guruhlangan ro'yxat (iOS uslubi): har guruh — yumaloq karta.
// item: { label, icon, to | onClick, value? (o'ngdagi kulrang qiymat), danger?, rotate? }
export function MoreList({ groups }) {
  return (
    <div className="more-groups">
      {groups.map((g, i) => (
        <div key={i} className="more-group">
          {g.map(({ label, icon: Ico, to, onClick, danger, rotate, value }) => {
            const inner = (
              <>
                <Ico size={26} weight="regular" className="more-ico" style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined} />
                <span className="grow more-label">{label}</span>
                {value && <span className="more-value">{value}</span>}
                <CaretRight size={20} weight="bold" className="more-caret" />
              </>
            )
            const cls = `more-item ${danger ? 'danger' : ''}`
            return to
              ? <Link key={label} to={to} className={cls}>{inner}</Link>
              : <button key={label} type="button" className={cls} onClick={onClick}>{inner}</button>
          })}
        </div>
      ))}
    </div>
  )
}

// Desktop: har bo'lim — sarlavhali ustun, har band — tavsifli karta
function MoreDesktop({ sections }) {
  return (
    <div className="more-dk">
      <header className="more-dk-head">
        <h1>Qo'shimcha</h1>
        <p>Hisob sozlamalari, foydali bo'limlar va yordam — barchasi bir joyda</p>
      </header>
      <div className="more-dk-grid">
        {sections.map((s) => (
          <section key={s.title} className="more-dk-sec">
            <h2>{s.title}</h2>
            {s.items.map(({ label, desc, icon: Ico, to, onClick, rotate, tone }) => {
              const inner = (
                <>
                  <span className="more-dk-ico"><Ico size={24} weight="bold" style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined} /></span>
                  <span className="more-dk-go"><CaretRight size={16} weight="bold" /></span>
                  <b>{label}</b>
                  <span className="more-dk-desc">{desc}</span>
                </>
              )
              const props = { key: label, className: 'more-dk-card', style: { '--tone': tone } }
              return to
                ? <Link to={to} {...props}>{inner}</Link>
                : <button type="button" onClick={onClick} {...props}>{inner}</button>
            })}
          </section>
        ))}
      </div>
      <p className="more-dk-foot">AyolQadami · 1.0 versiya</p>
    </div>
  )
}

export function More() {
  const { notify } = useApp()
  const sections = [
    { title: 'Hisob', items: [
      { label: 'Sozlamalar', desc: "Profil, til, mavzu va maxfiylik sozlamalari", icon: Gear, to: '/settings', tone: '#5B57F0' },
      { label: 'Bildirishnomalar', desc: "Arizalar, takliflar va yangi vakansiyalar haqida xabarlar", icon: Bell, to: '/notifications', rotate: 28, tone: '#F59E0B' },
    ] },
    { title: "Kashf eting", items: [
      { label: 'Kompaniyalar', desc: "Ish beruvchilar, ularning vakansiyalari va sharhlari", icon: Buildings, to: '/companies', tone: '#0EA5E9' },
      { label: 'Maqolalar', desc: "Karyera, rezyume va suhbat bo'yicha foydali maslahatlar", icon: BookOpen, to: '/articles', tone: '#10B981' },
    ] },
    { title: 'Yordam', items: [
      { label: 'Ilova haqida', desc: "AyolQadami nima, qanday ishlaydi va versiya ma'lumoti", icon: WarningCircle, onClick: () => notify('Tez orada'), tone: '#8B5CF6' },
      { label: 'Texnik yordam', desc: "Savol yoki muammo bo'lsa, biz bilan chatda bog'laning", icon: Lifebuoy, to: '/support', tone: '#F43F5E' },
    ] },
  ]
  return (
    <div className="page more more-home">
      <TopBar title="Qo'shimcha" />
      <div className="page-body">
        <div className="more-mobile"><MoreList groups={sections.map((s) => s.items)} /></div>
        <MoreDesktop sections={sections} />
      </div>
    </div>
  )
}
