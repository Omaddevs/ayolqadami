import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import { Empty, JobCard, TopBar } from '../components/UI'
import { useApp } from '../context/AppContext'
import { EVENTS, NOTIFICATIONS } from '../data/mock'

export function Applications() {
  const { user, allJobs, applications, saved, posted, removeJob, notify } = useApp()
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
    <div className="page">
      <TopBar title="Tadbirlar" />
      <div className="page-body">
        <div className="list-grid">
          {EVENTS.map((e) => (
            <div key={e.id} className="event-item">
              <div className="event-date"><Icon3D name="calendar" size={60} /></div>
              <div className="grow">
                <b>{e.title}</b>
                <span className="muted">{e.date} · {e.place}</span>
                <p>{e.desc}</p>
                <button className={`btn btn-sm ${joined.includes(e.id) ? 'btn-soft' : 'btn-primary'}`} disabled={joined.includes(e.id)}
                  onClick={() => { setJoined([...joined, e.id]); notify("Tadbirga ro'yxatdan o'tdingiz") }}>
                  {joined.includes(e.id) ? "Ro'yxatdan o'tilgan" : "Ro'yxatdan o'tish"}
                </button>
              </div>
            </div>
          ))}
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
