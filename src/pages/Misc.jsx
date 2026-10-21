import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bell, BookOpen, CalendarBlank, CaretRight, MapPin, Gear, Lifebuoy, WarningCircle, Buildings } from '@phosphor-icons/react'
import Icon from '../components/Icons'
import Icon3D from '../components/Icon3D'
import { Empty, JobCard, TopBar } from '../components/UI'
import { useApp, useContent } from '../context/AppContext'
import { LANGS, getLang, tx, useT } from '../i18n'

const dateLocale = () => ({ uz: 'uz-UZ', 'uz-cyrl': 'uz-Cyrl-UZ', ru: 'ru-RU', en: 'en-GB' })[getLang()] || LANGS[0].html

export function Applications() {
  const { user, jobsAll: allJobs, applications, saved, posted, removeJob, notify } = useApp()
  const t = useT()
  const [params] = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') || 'apps')
  // sarlavhadagi "Saqlanganlar" tugmasi shu sahifa ochiq turganda bosilsa ham tab almashadi
  const urlTab = params.get('tab')
  useEffect(() => { if (urlTab) setTab(urlTab) }, [urlTab])

  if (user.role === 'employer') {
    return (
      <div className="page">
        <TopBar title={t('Mening vakansiyalarim')} right={<Link to="/post-job" className="icon-btn ai" aria-label={t("Qo'shish")}><Icon name="plus" /></Link>} />
        <div className="page-body">
          {posted.length ? (
            <div className="list-grid">
              {posted.map((j) => (
                <div key={j.id} className="own-job">
                  <JobCard job={j} compact />
                  <div className="own-actions">
                    <Link to={`/qadam-ai?q=${encodeURIComponent(j.title + ' ' + (j.skills || []).join(' ') + ' ' + j.city)}`} className="btn btn-soft btn-sm grow">
                      <Icon name="sparkle" size={16} /> {t('Mos nomzodlar')}
                    </Link>
                    <button className="btn btn-ghost btn-sm" onClick={() => { removeJob(j.id); notify(t("Vakansiya o'chirildi")) }} aria-label={t("O'chirish")}><Icon name="trash" size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty icon="folder" title={t('Hali vakansiya joylamadingiz')} text={t("Birinchi e'loningizni joylang — QadamAI darhol mos nomzodlarni tavsiya qiladi")}
              action={<Link to="/post-job" className="btn btn-primary">{t('Vakansiya joylash')}</Link>} />
          )}
        </div>
      </div>
    )
  }

  const savedJobs = allJobs.filter((j) => saved.includes(j.id))
  return (
    <div className="page">
      <TopBar title={t('Arizalarim')} />
      <div className="page-body">
        <div className="segmented">
          <button className={tab === 'apps' ? 'on' : ''} onClick={() => setTab('apps')}>{t('Arizalar')} ({applications.length})</button>
          <button className={tab === 'saved' ? 'on' : ''} onClick={() => setTab('saved')}>{t('Saqlangan')} ({saved.length})</button>
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
                      <span className="status"><i /> {t(a.status)}</span>
                      <span className="muted small">{new Date(a.date).toLocaleDateString(dateLocale())}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <Empty icon="folder" title={t("Arizalar yo'q")} text={t('Sizga mos vakansiyalarni toping va bir bosishda ariza yuboring')}
              action={<Link to="/jobs" className="btn btn-primary">{t("Vakansiyalarni ko'rish")}</Link>} />
          )
        ) : savedJobs.length ? (
          <div className="list-grid">{savedJobs.map((j) => <JobCard key={j.id} job={j} />)}</div>
        ) : (
          <Empty icon="briefcase" title={t("Saqlanganlar yo'q")} text={t('Yoqqan vakansiyalarni yurakcha orqali saqlang')} />
        )}
      </div>
    </div>
  )
}

export function Events() {
  const { notify } = useApp()
  const { events: EVENTS } = useContent()
  const t = useT()
  const [joined, setJoined] = useState([])
  return (
    <div className="page more">
      <TopBar title={t('Tadbirlar')} />
      <div className="page-body">
        {EVENTS.length === 0 && <Empty icon="calendar" title={t("Hozircha tadbirlar yo'q")} text={t("Yangi tadbirlar e'lon qilinishi bilan shu yerda ko'rinadi")} />}
        <div className="ar-list">
          {EVENTS.map((e) => {
            const on = joined.includes(e.id)
            return (
              <div key={e.id} className="ar-card ev-card">
                <div className={`ar-cover ev-cover ${e.img ? 'has-img' : ''}`} style={{ '--c1': e.cover[0], '--c2': e.cover[1] }}>
                  {e.img ? <img src={e.img} alt="" draggable="false" /> : <Icon3D name="calendar" size={110} />}
                  {e.tag && <span className="ar-tag">{t(e.tag)}</span>}
                  <span className="ev-date"><CalendarBlank size={15} weight="bold" /> {t(e.date)}</span>
                </div>
                <div className="ar-card-body">
                  <h2>{t(e.title)}</h2>
                  <span className="ar-meta"><MapPin size={15} /> {t(e.place)}</span>
                  <p>{t(e.desc)}</p>
                  <button className={`btn ${on ? 'btn-soft' : 'btn-primary'} ev-btn`} disabled={on}
                    onClick={() => { setJoined([...joined, e.id]); notify(t("Tadbirga ro'yxatdan o'tdingiz")) }}>
                    {on ? t("Ro'yxatdan o'tilgan") : t("Ro'yxatdan o'tish")}
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
  const t = useT()
  return (
    <div className="page">
      <TopBar title={t('Bildirishnomalar')} />
      <div className="page-body">
        <Empty icon="bell" title={t("Bildirishnomalar yo'q")} text={t("Arizalaringiz holati va yangi takliflar shu yerda ko'rinadi")} />
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
  const t = useT()
  return (
    <div className="more-dk">
      <header className="more-dk-head">
        <h1>{t("Qo'shimcha")}</h1>
        <p>{t("Hisob sozlamalari, foydali bo'limlar va yordam — barchasi bir joyda")}</p>
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
              const props = { className: 'more-dk-card', style: { '--tone': tone } }
              return to
                ? <Link key={label} to={to} {...props}>{inner}</Link>
                : <button key={label} type="button" onClick={onClick} {...props}>{inner}</button>
            })}
          </section>
        ))}
      </div>
      <p className="more-dk-foot">AyolQadami · {t('1.0 versiya')}</p>
    </div>
  )
}

export function More() {
  const { notify } = useApp()
  const t = useT()
  const sections = [
    { title: t('Hisob'), items: [
      { label: t('Sozlamalar'), desc: t('Profil, til, mavzu va maxfiylik sozlamalari'), icon: Gear, to: '/settings', tone: '#5B57F0' },
      { label: t('Bildirishnomalar'), desc: t('Arizalar, takliflar va yangi vakansiyalar haqida xabarlar'), icon: Bell, to: '/notifications', rotate: 28, tone: '#F59E0B' },
    ] },
    { title: t('Kashf eting'), items: [
      { label: t('Kompaniyalar'), desc: t('Ish beruvchilar, ularning vakansiyalari va sharhlari'), icon: Buildings, to: '/companies', tone: '#0EA5E9' },
      { label: t('Maqolalar'), desc: t("Karyera, rezyume va suhbat bo'yicha foydali maslahatlar"), icon: BookOpen, to: '/articles', tone: '#10B981' },
    ] },
    { title: t('Yordam'), items: [
      { label: t('Ilova haqida'), desc: t("AyolQadami nima, qanday ishlaydi va versiya ma'lumoti"), icon: WarningCircle, onClick: () => notify(t('Tez orada')), tone: '#8B5CF6' },
      { label: t('Texnik yordam'), desc: t("Savol yoki muammo bo'lsa, biz bilan chatda bog'laning"), icon: Lifebuoy, to: '/support', tone: '#F43F5E' },
    ] },
  ]
  return (
    <div className="page more more-home">
      <TopBar title={t("Qo'shimcha")} />
      <div className="page-body">
        <div className="more-mobile"><MoreList groups={sections.map((s) => s.items)} /></div>
        <MoreDesktop sections={sections} />
      </div>
    </div>
  )
}
