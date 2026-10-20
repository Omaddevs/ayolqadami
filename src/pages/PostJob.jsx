import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, CalendarBlank, ChartBar, CheckCircle, Plus, Star, Trash, TrendUp, UsersThree, X } from '@phosphor-icons/react'
import { Avatar, Combo, CompanyLogo, Select, TopBar } from '../components/UI'
import { Check2, Chips, Field, Stepper } from '../components/Wizard'
import { useApp } from '../context/AppContext'
import { CATEGORIES, catShort, formatSum, salaryText } from '../data/mock'
import {
  DRIVING, EMPLOYMENT, EXP_LEVELS, LANGUAGES, LANG_LEVELS, REGIONS, SKILL_SUGGEST, WORK_MODES, WORK_TIME, findRegion, regionByCity,
} from '../data/resume'
import { CONTACT_WAYS, DURATIONS, EDU_REQ, PERKS } from '../data/vacancy'
import { matchForVacancy } from '../data/qadam'
import { PHONE_PREFIX, checkUzPhone, formatUzPhone } from '../lib/phone'

const STEPS = ['Lavozim va joylashuv', 'Ish sharoitlari', 'Nomzodga talablar', 'Tavsif va qulayliklar', "Aloqa va e'lon"]
const EXP_ICONS = { none: Briefcase, lt1: CalendarBlank, '1-3': ChartBar, '3-5': TrendUp, '5+': Star }
const EXP_REQ = [{ id: 'none', label: 'Tajriba shart emas' }, ...EXP_LEVELS.slice(1)]
const CAT_OPTS = CATEGORIES.map((c) => ({ value: c.id, label: c.name }))
const REGION_OPTS = REGIONS.map((r) => ({ value: r.id, label: r.name }))
const LEVEL_REQ = LANG_LEVELS.map((l) => (l.value === 'native' ? { ...l, label: 'Erkin (ona tili darajasida)' } : l))
const MAX_SKILLS = 15

const digits = (s) => String(s || '').replace(/\D/g, '')
const num = (s) => Number(digits(s)) || 0
const money = (s) => (digits(s) ? formatSum(Number(digits(s).slice(0, 11))) : '')
const lines = (s) => s.split('\n').map((x) => x.replace(/^[-•*\s]+/, '').trim()).filter(Boolean)
const shortOf = (list, ids) => list.filter((o) => ids.includes(o.id)).map((o) => o.short || o.label)

function initDraft(u) {
  return {
    title: '', category: u.industry || u.category || '', count: '1',
    region: u.region || regionByCity(u.city)?.id || '', district: '', address: '',
    employment: 'full', workMode: [], workTime: [], hours: '09:00 – 18:00',
    salaryFrom: '', salaryTo: '', negotiable: false,
    expLevel: 'none', education: 'Ahamiyatsiz', langs: [], skills: [], hasDriving: false, driving: [], requirements: '',
    description: '', duties: '', conditions: '', perks: [],
    contactName: u.name || '', contactPhone: u.phone ? formatUzPhone(u.phone) : PHONE_PREFIX, telegram: u.telegram || '',
    ways: ['app'], days: 30,
  }
}

// Qoralama → vakansiya obyekti (ro'yxatlar, filtrlar va QadamAI kutgan maydonlar bilan)
function toJob(d, u) {
  const region = findRegion(d.region)
  const mode = d.workMode
  const type = mode.length === 1 && mode[0] === 'remote' ? 'Masofaviy'
    : mode.includes('hybrid') ? 'Gibrid'
    : EMPLOYMENT.find((o) => o.id === d.employment)?.short || "To'liq stavka"
  const langs = d.langs.filter((l) => l.lang)
  return {
    title: d.title.trim(), category: d.category, count: Math.max(1, num(d.count)),
    city: region?.city || u.city || 'Toshkent', region: d.region, district: d.district, address: d.address.trim(),
    company: u.company || u.name, color: u.color || '#6366F6',
    type, employment: d.employment, workMode: mode, workTime: d.workTime, hours: d.hours.trim(),
    salaryFrom: d.negotiable ? 0 : num(d.salaryFrom), salaryTo: d.negotiable ? 0 : num(d.salaryTo),
    experience: EXP_LEVELS.find((x) => x.id === d.expLevel)?.years || 0, expLevel: d.expLevel,
    education: d.education === EDU_REQ[0] ? '' : d.education,
    langs, driving: d.hasDriving ? d.driving : [], skills: d.skills,
    requirements: lines(d.requirements), duties: lines(d.duties), conditions: lines(d.conditions),
    description: d.description.trim(), tags: d.perks,
    contact: { name: d.contactName.trim(), phone: d.contactPhone, telegram: d.telegram.trim(), ways: d.ways },
    expires: new Date(Date.now() + d.days * 864e5).toISOString(),
  }
}

function validate(step, d) {
  const e = {}
  if (step === 0) {
    if (d.title.trim().length < 3) e.title = 'Lavozim nomini kiriting'
    if (!d.category) e.category = 'Sohani tanlang'
    const n = num(d.count)
    if (n < 1 || n > 500) e.count = '1 dan 500 gacha'
    if (!d.region) e.region = 'Hududni tanlang'
    if (!d.district) e.district = 'Tumanni tanlang'
  }
  if (step === 1) {
    if (!d.employment) e.employment = 'Bandlik turini tanlang'
    if (!d.negotiable) {
      if (!num(d.salaryFrom)) e.salaryFrom = 'Maoshni kiriting yoki «Kelishiladi»ni belgilang'
      else if (num(d.salaryTo) && num(d.salaryTo) < num(d.salaryFrom)) e.salaryTo = "«dan» qiymatidan kam bo'lmasin"
    }
  }
  if (step === 2 && d.langs.some((l) => l.lang && !l.level)) e.langs = 'Til darajasini tanlang'
  if (step === 3 && d.description.trim().length < 50) e.description = `Kamida 50 belgi (hozir ${d.description.trim().length})`
  if (step === 4) {
    if (!d.contactName.trim()) e.contactName = "Mas'ul shaxsni kiriting"
    const ph = checkUzPhone(d.contactPhone)
    if (ph !== 'ok') e.contactPhone = ph === 'code' ? "Operator kodi noto'g'ri" : "Raqamni to'liq kiriting"
    if (!d.ways.length) e.ways = 'Kamida bitta usulni tanlang'
    if (d.ways.includes('telegram') && !d.telegram.trim()) e.telegram = 'Telegram manzilini kiriting'
  }
  return e
}

export default function PostJob() {
  const { user, postJob, notify, jobsAll } = useApp()
  const nav = useNavigate()
  const [d, setD] = useState(() => initDraft(user))
  const [step, setStep] = useState(0)
  const [reached, setReached] = useState(0)
  const [showErr, setShowErr] = useState(false)
  const [skillText, setSkillText] = useState('')
  const [done, setDone] = useState(null) // e'lon qilingan vakansiya

  const set = (k, v) => setD((p) => ({ ...p, [k]: v }))
  const bind = (k) => ({ value: d[k], onChange: (e) => set(k, e.target.value) })
  const toggleIn = (k, id) => setD((p) => ({ ...p, [k]: p[k].includes(id) ? p[k].filter((x) => x !== id) : [...p[k], id] }))
  const errors = validate(step, d)
  const err = (k) => (showErr ? errors[k] : undefined)
  const region = findRegion(d.region)
  const job = toJob(d, user)
  // har qadamda mos nomzodlar soni yangilanadi — ish beruvchi talablar bozorga qanchalik mosligini ko'radi
  // mavjud lavozimlar (takrorsiz) — tanlangan soha lavozimlari birinchi
  const titleOpts = useMemo(() => {
    const seen = new Map()
    jobsAll.forEach((j) => { if (j.title && !seen.has(j.title)) seen.set(j.title, j.category) })
    return [...seen]
      .map(([value, category]) => ({ value, category, hint: catShort(category) }))
      .sort((a, b) => (b.category === d.category) - (a.category === d.category) || a.value.localeCompare(b.value))
  }, [jobsAll, d.category])
  const matches = useMemo(() => matchForVacancy(job), [job.category, job.city, job.type, job.experience, job.salaryTo, job.skills.join()]) // eslint-disable-line react-hooks/exhaustive-deps

  const go = (i) => { setStep(i); setShowErr(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const failed = () => {
    setShowErr(true)
    requestAnimationFrame(() => document.querySelector('.rb-field.has-err, .rb-err')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }
  const next = () => {
    if (Object.keys(errors).length) return failed()
    if (step < STEPS.length - 1) {
      setReached((r) => Math.max(r, step + 1))
      return go(step + 1)
    }
    const posted = { ...job, id: 'p' + Date.now() }
    postJob(posted)
    notify("Vakansiya e'lon qilindi!")
    setDone(posted)
    window.scrollTo({ top: 0 })
  }
  const goStep = (i) => {
    if (i === step) return
    if (i > step && Object.keys(errors).length) return failed()
    go(i)
  }

  const addSkill = (raw) => {
    const name = raw.trim().replace(/\s+/g, ' ')
    if (name.length < 2) return
    if (d.skills.some((s) => s.toLowerCase() === name.toLowerCase())) return setSkillText('')
    if (d.skills.length >= MAX_SKILLS) return notify(`Ko'pi bilan ${MAX_SKILLS} ta ko'nikma`)
    set('skills', [...d.skills, name])
    setSkillText('')
  }
  const suggestions = (SKILL_SUGGEST[d.category] || SKILL_SUGGEST.other).filter((n) => !d.skills.some((s) => s.toLowerCase() === n.toLowerCase()))
  const setLang = (i, k, v) => set('langs', d.langs.map((l, j) => (j === i ? { ...l, [k]: v } : l)))
  const langOpts = (i) => LANGUAGES.filter((l) => l === d.langs[i].lang || !d.langs.some((x) => x.lang === l))

  if (done) return <Published job={done} matches={matchForVacancy(done)} />

  return (
    <div className="page rb">
      <TopBar title="Vakansiya joylash" />
      <div className="page-body rb-body">
        <Stepper steps={STEPS} step={step} reached={reached} onGo={goStep} label="Vakansiya qadamlari" />

        <section className="rb-card">
          <div className="rb-head rb-head-row">
            <div>
              <span>{step + 1}-qadam · {STEPS.length} tadan</span>
              <h2>{STEPS[step]}</h2>
            </div>
            {step > 0 && d.category && (
              <span className={`rb-match ${matches.length ? '' : 'none'}`} title="Talablaringizga mos nomzodlar">
                <UsersThree size={18} weight="fill" /> {matches.length ? `${matches.length} ta mos nomzod` : "Mos nomzod yo'q"}
              </span>
            )}
          </div>

          {step === 0 && (
            <div className="rb-grid">
              <Field label="Lavozim nomi" req error={err('title')} hint="Aniq nom yozing: «Hamshira», «1C buxgalter», «Enaga (2 yoshli bola)»">
                <Combo value={d.title} options={titleOpts} maxLength={80} placeholder="Kim kerak?"
                  onChange={(v) => set('title', v)}
                  onPick={(o) => { if (!d.category && o.category) set('category', o.category) }} />
              </Field>
              <Field as="div" label="Soha" req error={err('category')}>
                <Select value={d.category} options={CAT_OPTS} placeholder="Sohani tanlang" onChange={(v) => set('category', v)} />
              </Field>
              <Field label="Nechta xodim kerak?" req error={err('count')}>
                <input value={d.count} inputMode="numeric" maxLength={3} onChange={(e) => set('count', digits(e.target.value))} />
              </Field>
              <Field as="div" label="Viloyat / shahar" req error={err('region')}>
                <Select value={d.region} options={REGION_OPTS} placeholder="Viloyatni tanlang"
                  onChange={(v) => setD((p) => ({ ...p, region: v, district: v === p.region ? p.district : '' }))} />
              </Field>
              <Field as="div" label="Tuman / shahar" req error={err('district')}>
                {region
                  ? <Select value={d.district} options={region.districts} placeholder="Tumanni tanlang" onChange={(v) => set('district', v)} />
                  : <button type="button" className="sel-btn" disabled><span className="sel-val sel-ph">Avval viloyatni tanlang</span></button>}
              </Field>
              <Field label="Ish joyi manzili" hint="Ko'cha, uy yoki mo'ljal — nomzod yo'lni oldindan biladi">
                <input {...bind('address')} maxLength={120} placeholder="Masalan: Amir Temur ko'chasi 15, «Next» yonida" />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="rb-stack">
              <Field as="div" label="Bandlik turi" req error={err('employment')}>
                <Chips options={EMPLOYMENT} isOn={(id) => d.employment === id} onPick={(id) => set('employment', id)} />
              </Field>
              <Field as="div" label="Ish usuli (rejimi)" hint="Bir nechtasini tanlash mumkin">
                <Chips options={WORK_MODES} isOn={(id) => d.workMode.includes(id)} onPick={(id) => toggleIn('workMode', id)} />
              </Field>
              <Field as="div" label="Ish vaqti" hint="Onalar uchun qulay grafik ko'proq ariza oladi">
                <Chips options={WORK_TIME} isOn={(id) => d.workTime.includes(id)} onPick={(id) => toggleIn('workTime', id)} />
              </Field>
              <Field label="Ish soatlari"><input className="rb-salary" {...bind('hours')} maxLength={40} placeholder="09:00 – 18:00, dushanba – juma" /></Field>
              <div>
                <div className="rb-grid two rb-salary-row">
                  <Field label="Maosh, dan (so'm)" req={!d.negotiable} error={err('salaryFrom')}>
                    <input value={d.negotiable ? '' : d.salaryFrom} disabled={d.negotiable} inputMode="numeric" placeholder="3 000 000"
                      onChange={(e) => set('salaryFrom', money(e.target.value))} />
                  </Field>
                  <Field label="gacha (so'm)" error={err('salaryTo')}>
                    <input value={d.negotiable ? '' : d.salaryTo} disabled={d.negotiable} inputMode="numeric" placeholder="5 000 000"
                      onChange={(e) => set('salaryTo', money(e.target.value))} />
                  </Field>
                </div>
                <div className="rb-after"><Check2 checked={d.negotiable} onChange={(v) => set('negotiable', v)}>Maosh suhbatda kelishiladi</Check2></div>
                <p className="rb-hint rb-sub-hint">Maosh ko'rsatilgan vakansiyalar o'rtacha 2 barobar ko'p ariza oladi.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="rb-stack">
              <Field as="div" label="Ish tajribasi">
                <Chips options={EXP_REQ} icons={EXP_ICONS} isOn={(id) => d.expLevel === id} onPick={(id) => set('expLevel', id)} />
              </Field>
              <Field as="div" label="Ta'lim darajasi">
                <div className="rb-salary"><Select value={d.education} options={EDU_REQ} onChange={(v) => set('education', v)} /></div>
              </Field>

              <Field as="div" label="Kerakli ko'nikmalar" hint="QadamAI nomzodlarni aynan shu ko'nikmalar bo'yicha tanlaydi">
                <div className="rb-skill-input">
                  <input value={skillText} maxLength={60} placeholder="Ko'nikma yozing va Enter bosing"
                    onChange={(e) => setSkillText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillText) } }} />
                  <span className="rb-count">{d.skills.length} / {MAX_SKILLS}</span>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => addSkill(skillText)} disabled={skillText.trim().length < 2}>Qo'shish</button>
                </div>
              </Field>
              {d.skills.length > 0 && (
                <div className="rb-skills">
                  {d.skills.map((s) => (
                    <span key={s} className="rb-skill">{s}
                      <button type="button" className="rb-skill-x" onClick={() => set('skills', d.skills.filter((x) => x !== s))} aria-label={`${s} — o'chirish`}><X size={14} weight="bold" /></button>
                    </span>
                  ))}
                </div>
              )}
              {suggestions.length > 0 && (
                <div className="rb-suggest">
                  <span>Tavsiya:</span>
                  {suggestions.slice(0, 8).map((n) => <button key={n} type="button" onClick={() => addSkill(n)}><Plus size={13} weight="bold" /> {n}</button>)}
                </div>
              )}

              <div className="rb-box">
                <h3 className="rb-sub">Tillarni bilishi</h3>
                {!d.langs.length && <p className="rb-hint">Til talab qilinmasa, bo'sh qoldiring</p>}
                {d.langs.map((l, i) => (
                  <div key={i} className="rb-lang">
                    <Select value={l.lang} options={langOpts(i)} placeholder="Til" onChange={(v) => setLang(i, 'lang', v)} />
                    <Select value={l.level} options={LEVEL_REQ} placeholder="Kamida qaysi daraja" onChange={(v) => setLang(i, 'level', v)} />
                    <button type="button" className="icon-btn sm" onClick={() => set('langs', d.langs.filter((_, j) => j !== i))} aria-label="Tilni o'chirish"><Trash size={17} /></button>
                  </div>
                ))}
                {err('langs') && <small className="rb-err">{err('langs')}</small>}
                <button type="button" className="rb-link" onClick={() => set('langs', [...d.langs, { lang: '', level: '' }])}><Plus size={14} weight="bold" /> Til qo'shish</button>
              </div>

              <div className={`rb-box ${d.hasDriving ? '' : 'collapsed'}`}>
                {d.hasDriving ? (
                  <>
                    <div className="rb-box-head">
                      <h3 className="rb-sub">Haydovchilik guvohnomasi</h3>
                      <button type="button" className="rb-link danger" onClick={() => setD((p) => ({ ...p, hasDriving: false, driving: [] }))}>Olib tashlash</button>
                    </div>
                    <Chips options={DRIVING.map((c) => ({ id: c, label: c }))} isOn={(c) => d.driving.includes(c)} onPick={(c) => toggleIn('driving', c)} />
                  </>
                ) : (
                  <button type="button" className="rb-box-add" onClick={() => set('hasDriving', true)}><Plus size={18} weight="bold" /> Haydovchilik guvohnomasi talab qilinadi</button>
                )}
              </div>

              <Field label="Qo'shimcha talablar" hint="Har birini yangi qatordan yozing">
                <textarea rows={3} maxLength={800} {...bind('requirements')} placeholder={"Mas'uliyatli va xushmuomala\nTibbiy ko'rikdan o'tgan"} />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="rb-stack">
              <Field label="Vakansiya haqida" req error={err('description')} hint={`${d.description.trim().length} / 2000 · Kompaniya, jamoa va ish mohiyatini qisqa yozing`}>
                <textarea rows={5} maxLength={2000} {...bind('description')}
                  placeholder="Masalan: Xususiy klinikamizning terapiya bo'limiga mehribon va mas'uliyatli hamshira kerak. Tungi navbatchilik yo'q." />
              </Field>
              <Field label="Vazifalar" hint="Har birini yangi qatordan yozing">
                <textarea rows={3} maxLength={800} {...bind('duties')} placeholder={"Bemorlarni qabul qilish\nTibbiy hujjatlarni yuritish"} />
              </Field>
              <Field label="Sharoitlar" hint="Har birini yangi qatordan yozing">
                <textarea rows={3} maxLength={800} {...bind('conditions')} placeholder={"Tushlik va transport kompensatsiyasi\nYillik bonus"} />
              </Field>
              <Field as="div" label="Ayollar uchun qulayliklar" hint="Bu belgilar vakansiya kartasida ko'rinadi va QadamAI tavsiyalarida yuqoriga chiqaradi">
                <Chips options={PERKS.map((p) => ({ id: p, label: p }))} isOn={(p) => d.perks.includes(p)} onPick={(p) => toggleIn('perks', p)} />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="rb-stack">
              <div className="rb-grid">
                <Field label="Mas'ul shaxs" req error={err('contactName')}><input {...bind('contactName')} autoComplete="name" placeholder="Ism-familiya" /></Field>
                <Field label="Telefon raqami" req error={err('contactPhone')}>
                  <input value={d.contactPhone} inputMode="tel" autoComplete="tel" onChange={(e) => set('contactPhone', formatUzPhone(e.target.value))} />
                </Field>
                <Field label="Telegram" error={err('telegram')}><input {...bind('telegram')} placeholder="@hr_kompaniya" /></Field>
              </div>
              <Field as="div" label="Nomzodlar qanday bog'lansin?" req error={err('ways')}>
                <Chips options={CONTACT_WAYS} isOn={(id) => d.ways.includes(id)} onPick={(id) => toggleIn('ways', id)} />
              </Field>
              <Field as="div" label="E'lon muddati">
                <Chips options={DURATIONS} isOn={(id) => d.days === id} onPick={(id) => set('days', id)} />
              </Field>

              <div className="rb-sep" />
              <h3 className="rb-sub">Ish izlovchilar shunday ko'radi</h3>
              <div className="vj-preview">
                <div className="vj-preview-top">
                  <div>
                    <b>{job.title || 'Lavozim nomi'}</b>
                    <span className="vj-salary">{salaryText(job)}</span>
                  </div>
                  <CompanyLogo name={job.company || 'K'} color={job.color} size={48} />
                </div>
                <span className="vj-meta">{job.company} · {[job.city, d.district].filter(Boolean).join(', ')}</span>
                <div className="vj-chips">
                  <span>{job.type}</span>
                  <span>{EXP_REQ.find((x) => x.id === d.expLevel)?.label}</span>
                  {job.count > 1 && <span>{job.count} ta o'rin</span>}
                  {shortOf(WORK_TIME, d.workTime).map((t) => <span key={t}>{t}</span>)}
                </div>
                {job.tags.length > 0 && <div className="vj-chips perks">{job.tags.map((t) => <span key={t}>{t}</span>)}</div>}
              </div>
            </div>
          )}

          <div className="rb-foot">
            {step > 0 ? <button type="button" className="btn btn-ghost" onClick={() => go(step - 1)}>Orqaga</button> : <span />}
            <button type="button" className="btn btn-primary rb-next" onClick={next}>{step === STEPS.length - 1 ? "E'lon qilish" : 'Davom etish'}</button>
          </div>
        </section>
      </div>
    </div>
  )
}

// E'londan keyingi ekran: darhol mos nomzodlarni ko'rsatamiz
function Published({ job, matches }) {
  const { invites, invite, notify } = useApp()
  return (
    <div className="page rb">
      <TopBar title="Vakansiya joylandi" />
      <div className="page-body rb-body">
        <section className="rb-card vj-done">
          <span className="vj-done-ico"><CheckCircle size={44} weight="fill" /></span>
          <h2>«{job.title}» e'lon qilindi</h2>
          <p>Vakansiya ish izlovchilar ro'yxatida va QadamAI tavsiyalarida ko'rinadi. Arizalar «Vakansiyalarim» bo'limiga tushadi.</p>
          <div className="vj-done-btns">
            <Link to={`/jobs/${job.id}`} className="btn btn-ghost">Vakansiyani ko'rish</Link>
            <Link to="/applications" className="btn btn-soft">Vakansiyalarim</Link>
          </div>
        </section>

        <section className="rb-card">
          <div className="rb-head rb-head-row">
            <div><span>QadamAI tanlovi</span><h2>Sizga mos nomzodlar</h2></div>
            <Link to={`/candidates?cat=${job.category}`} className="rb-link">Barchasi</Link>
          </div>
          {matches.length ? (
            <div className="vj-cands">
              {matches.slice(0, 4).map(({ item: c, score, reasons }) => {
                const invited = invites.includes(c.id)
                return (
                  <div key={c.id} className="vj-cand">
                    <Link to={`/candidates/${c.id}`} className="vj-cand-main">
                      <Avatar name={c.name} color={c.color} size={48} />
                      <div><b>{c.name}</b><span>{c.headline} · {c.city}</span><small>{reasons.slice(0, 2).join(' · ')}</small></div>
                      <em>{score}%</em>
                    </Link>
                    <button type="button" className="btn btn-primary btn-sm" disabled={invited} onClick={() => { invite(c.id); notify('Taklif yuborildi') }}>
                      {invited ? 'Taklif yuborilgan' : 'Suhbatga taklif'}
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="rb-hint">Hozircha mos nomzod topilmadi. Yangi rezyumelar paydo bo'lishi bilan QadamAI sizga xabar beradi.</p>
          )}
        </section>
      </div>
    </div>
  )
}
