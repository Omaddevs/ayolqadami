import {
  Briefcase, CalendarBlank, Car, Certificate, Clock, Copy, EnvelopeSimple, FileText, GraduationCap, Info, MapPin, Phone, PhoneCall,
  Sliders, Star, TelegramLogo, Translate, UserCircle, Wallet, ArrowsLeftRight,
} from '@phosphor-icons/react'
import { formatSum } from '../data/mock'
import { EMPLOYMENT, EXP_LEVELS, LANG_LEVELS, SEARCH_OPTIONS, WORK_MODES, WORK_TIME, duration, findRegion, monthText } from '../data/resume'
import { useApp } from '../context/AppContext'

const labels = (list, ids) => list.filter((o) => ids?.includes(o.id)).map((o) => o.label).join(', ')

export function age(date) {
  if (!date) return null
  const b = new Date(date), n = new Date()
  let a = n.getFullYear() - b.getFullYear()
  if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--
  return a
}

export const fullName = (p) => [p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ') || p.name
export const placeText = (p) => [findRegion(p.region)?.name || p.city, p.district].filter(Boolean).join(', ')
export const statusOf = (p) => SEARCH_OPTIONS.find((s) => s.id === p.searchStatus)
export const expText = (p) => EXP_LEVELS.find((x) => x.id === p.expLevel)?.label || (p.years ? `${p.years} yil tajriba` : '')

const dateText = (iso) => {
  const [y, m, d] = String(iso).split('-')
  return d ? `${d}.${m}.${y}` : iso
}
// "Oliy — bakalavr" → "Oliy", "O'rta maxsus (kollej, texnikum)" → "O'rta maxsus"
const eduShort = (level) => level?.replace(/\s*[—(].*$/, '')

function Sec({ icon: Ic, title, children }) {
  return (
    <section className="cv-sec">
      <h2><span className="cv-sec-ico"><Ic size={17} weight="fill" /></span>{title}</h2>
      {children}
    </section>
  )
}

/* Rezyumening to'liq ko'rinishi (ish beruvchi nomzodni ko'rganda).
   Eski, qisqa formatdagi profillar ham buzilmaydi — bo'sh maydonlar shunchaki chiqmaydi. */
export default function ResumeView({ p, contacts }) {
  const { notify } = useApp()
  const copy = (text, what) => {
    navigator.clipboard?.writeText(text).then(() => notify(`${what} nusxalandi`), () => notify('Nusxalab bo\'lmadi'))
  }

  const facts = [
    [Wallet, 'Kutilayotgan maosh', p.salary ? `${formatSum(p.salary)} so'mdan` : 'Kelishiladi'],
    [Briefcase, 'Tajriba', expText(p)],
    [CalendarBlank, 'Bandlik turi', labels(EMPLOYMENT, p.employment) || p.format?.join(', ')],
    [MapPin, 'Ish usuli', labels(WORK_MODES, p.workMode)],
    [Clock, 'Qulay ish vaqti', labels(WORK_TIME, p.workTime)],
    [ArrowsLeftRight, "Ko'chish", p.relocate ? "Boshqa shaharga ko'chishga tayyor" : ''],
  ].filter(([, , v]) => v)
  const certs = p.certificates || []
  const edus = p.educations?.length ? p.educations : p.education ? [{ school: p.education }] : []
  const skills = p.skillsDetail || (p.skills || []).map((name) => ({ name }))
  const langs = p.langs || (p.languages || []).map((l) => ({ lang: l }))
  const years = age(p.birthDate)
  const info = [
    p.birthDate && [CalendarBlank, "Tug'ilgan sanasi", dateText(p.birthDate), years != null && `${years} yosh`],
    edus[0] && [GraduationCap, "Ta'lim", eduShort(edus[0].level) || edus[0].school],
    placeText(p) && [MapPin, 'Yashash manzili', placeText(p)],
  ].filter(Boolean)

  const contactRows = contacts ? [
    p.phone && { icon: Phone, value: p.phone, label: 'Telefon raqami', href: `tel:${p.phone.replace(/\s/g, '')}`,
      action: <a className="cv-act" href={`tel:${p.phone.replace(/\s/g, '')}`} aria-label="Qo'ng'iroq qilish"><PhoneCall size={18} /></a> },
    p.email && { icon: EnvelopeSimple, value: p.email, label: 'Email manzil', href: `mailto:${p.email}`,
      action: <button type="button" className="cv-act" onClick={() => copy(p.email, 'Email')} aria-label="Emailni nusxalash"><Copy size={18} /></button> },
    p.telegram && { icon: TelegramLogo, value: p.telegram, label: 'Telegram', tg: true, href: `https://t.me/${p.telegram.replace(/^@/, '')}`,
      action: <button type="button" className="cv-act" onClick={() => copy(p.telegram, 'Telegram')} aria-label="Telegramni nusxalash"><Copy size={18} /></button> },
  ].filter(Boolean) : []

  return (
    <div className="cv">
      {contactRows.length > 0 && (
        <Sec icon={Phone} title="Aloqa">
          <div className="cv-rows">
            {contactRows.map((c) => (
              <div key={c.label} className="cv-row">
                <a className="cv-row-main" href={c.href} {...(c.tg ? { target: '_blank', rel: 'noreferrer' } : {})}>
                  <span className={`cv-row-ico ${c.tg ? 'tg' : ''}`}><c.icon size={20} weight="fill" /></span>
                  <span className="cv-row-txt"><b>{c.value}</b><small>{c.label}</small></span>
                </a>
                {c.action}
              </div>
            ))}
          </div>
        </Sec>
      )}

      {info.length > 0 && (
        <Sec icon={FileText} title="Ma'lumotlar">
          <div className="cv-tiles">
            {info.map(([Ic, k, v, sub]) => (
              <div key={k} className="cv-tile">
                <Ic size={20} weight="duotone" />
                <span>{k}</span>
                <b>{v}</b>
                {sub && <small>({sub})</small>}
              </div>
            ))}
          </div>
        </Sec>
      )}

      {facts.length > 0 && (
        <Sec icon={Sliders} title="Istaklar">
          <dl className="cv-facts">
            {facts.map(([Ic, k, v]) => <div key={k}><span className="cv-fact-ico"><Ic size={18} /></span><span><dt>{k}</dt><dd>{v}</dd></span></div>)}
          </dl>
        </Sec>
      )}

      {p.about && <Sec icon={UserCircle} title="O'zim haqimda"><p className="cv-text">{p.about}</p></Sec>}

      {p.experience?.length > 0 && (
        <Sec icon={Briefcase} title="Tajriba">
          <div className="cv-cards">
            {p.experience.map((e, i) => {
              const dur = e.from && duration(e.from, e.current ? '' : e.to)
              return (
                <article key={i} className="cv-card">
                  <div className="cv-card-head">
                    <span className="cv-card-ico"><Briefcase size={22} weight="duotone" /></span>
                    <div>
                      <b>{e.role}</b>
                      {e.company && <span className="cv-org">{e.company}</span>}
                      <small className="cv-date">
                        <CalendarBlank size={14} />
                        {e.from ? `${monthText(e.from)} – ${e.current ? 'hozirgacha' : monthText(e.to)}` : e.period}{dur && ` (${dur})`}
                      </small>
                    </div>
                    {e.current && <span className="cv-badge">Hozir</span>}
                  </div>
                  {e.desc && <p>{e.desc}</p>}
                </article>
              )
            })}
          </div>
          {p.careerBreak && <div className="cv-note"><Info size={18} /> {p.careerBreak}</div>}
        </Sec>
      )}

      {edus.length > 0 && (
        <Sec icon={GraduationCap} title="Ta'lim">
          <div className="cv-cards">
            {edus.map((e, i) => (
              <article key={i} className="cv-card">
                <div className="cv-card-head">
                  <span className="cv-card-ico"><GraduationCap size={22} weight="duotone" /></span>
                  <div>
                    <b>{e.school}</b>
                    {e.faculty && <span className="cv-org">{e.faculty}</span>}
                    {e.from && <small className="cv-date"><CalendarBlank size={14} />{e.from} – {e.current ? 'hozir' : e.to || ''}</small>}
                  </div>
                  {e.level && <span className="cv-badge">{eduShort(e.level)}</span>}
                </div>
              </article>
            ))}
          </div>
        </Sec>
      )}

      {certs.length > 0 && (
        <Sec icon={Certificate} title="Sertifikat va kurslar">
          <div className="cv-cards">
            {certs.map((c, i) => (
              <article key={i} className="cv-card">
                <div className="cv-card-head">
                  <span className="cv-card-ico gold"><Certificate size={22} weight="duotone" /></span>
                  <div><b>{c.name}</b>{c.org && <span className="cv-org">{c.org}</span>}</div>
                  {c.year && <span className="cv-badge">{c.year}</span>}
                </div>
              </article>
            ))}
          </div>
        </Sec>
      )}

      {skills.length > 0 && (
        <Sec icon={Star} title="Ko'nikmalar">
          <div className="cv-skills">
            {skills.map((s) => <span key={s.name}>{s.name}{s.level && <em>{s.level}</em>}</span>)}
          </div>
        </Sec>
      )}

      {(langs.length > 0 || p.driving?.length > 0) && (
        <Sec icon={Translate} title={`Tillar${p.driving?.length > 0 ? ' va guvohnoma' : ''}`}>
          <div className="cv-rows">
            {langs.map((l) => (
              <div key={l.lang} className="cv-row static">
                <span className="cv-row-main">
                  <span className="cv-row-ico"><Translate size={20} /></span>
                  <span className="cv-row-txt"><b>{l.lang}</b>{l.level && <small>{LANG_LEVELS.find((x) => x.value === l.level)?.label || l.level}</small>}</span>
                </span>
              </div>
            ))}
            {p.driving?.length > 0 && (
              <div className="cv-row static">
                <span className="cv-row-main">
                  <span className="cv-row-ico"><Car size={20} /></span>
                  <span className="cv-row-txt"><b>Haydovchilik guvohnomasi</b><small>{p.driving.join(', ')} toifa</small></span>
                </span>
              </div>
            )}
          </div>
        </Sec>
      )}
    </div>
  )
}
