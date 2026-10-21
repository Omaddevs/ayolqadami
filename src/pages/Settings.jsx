import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowsLeftRight, Bell, CalendarBlank, Check, CircleHalf, EyeSlash, Info, PencilSimple, SignOut, SquaresFour, Translate, Trash, UserCircle, WarningCircle,
} from '@phosphor-icons/react'
import { Avatar, CompanyLogo, Empty, Sheet, THEME_OPTIONS, TopBar } from '../components/UI'
import { useApp } from '../context/AppContext'
import { inTelegram } from '../lib/telegram'
import { originOf } from '../lib/theme'
import { MoreList } from './Misc'

const LANGS = [
  { id: 'uz', label: "O'zbek", hint: 'Lotin yozuvi' },
  { id: 'uz-cyrl', label: 'Ўзбек', hint: 'Кирилл ёзуви', soon: true },
  { id: 'ru', label: 'Русский', hint: 'Rus tili', soon: true },
  { id: 'en', label: 'English', hint: 'Ingliz tili', soon: true },
]

export function Settings() {
  const { user, prefs, setPrefs, setTheme, logout, notify, requireAuth } = useApp()
  const nav = useNavigate()
  const isEmp = user?.role === 'employer'
  const [sheet, setSheet] = useState(null) // 'lang' | 'theme' | 'delete' | 'logout'
  const close = () => setSheet(null)
  const lang = LANGS.find((l) => l.id === prefs.lang) || LANGS[0]
  const theme = THEME_OPTIONS.find((t) => t.id === prefs.theme) || THEME_OPTIONS[2]
  const leave = (text) => { logout(); nav('/', { replace: true }); if (text) notify(text) }

  return (
    <div className="page more">
      <TopBar title="Sozlamalar" />
      <div className="page-body">
        <MoreList groups={[
          user ? [
            { label: 'Foydalanuvchi', icon: UserCircle, to: '/settings/account' },
            { label: 'Bildirishnomalar', icon: Bell, to: '/settings/notifications', rotate: 28 },
            { label: "Akkauntni o'chirish", icon: Trash, onClick: () => setSheet('delete') },
          ] : [
            { label: "Kirish / Ro'yxatdan o'tish", icon: UserCircle, onClick: () => requireAuth() },
            { label: 'Bildirishnomalar', icon: Bell, to: '/settings/notifications', rotate: 28 },
          ],
          ...(isEmp ? [] : [[{ label: 'Yashirin vakansiyalar va kompaniyalar', icon: EyeSlash, to: '/settings/hidden' }]]),
          [
            { label: 'Til', icon: Translate, value: lang.label, onClick: () => setSheet('lang') },
            { label: 'Mavzu', icon: CircleHalf, value: theme.label, onClick: () => setSheet('theme') },
            ...(user ? [{ label: 'Ilovadan chiqish', icon: SignOut, danger: true, onClick: () => setSheet('logout') }] : []),
          ],
        ]} />
      </div>

      <Sheet open={sheet === 'lang'} onClose={close} title="Ilova tili">
        <div className="pf-options">
          {LANGS.map((l) => (
            <button key={l.id} type="button" className={`pf-option ${l.id === lang.id ? 'on' : ''}`} disabled={l.soon}
              onClick={() => { setPrefs({ lang: l.id }); close() }}>
              <span className="pf-option-text"><b>{l.label}</b><span>{l.soon ? 'Tez orada' : l.hint}</span></span>
              {l.id === lang.id && <Check size={20} weight="bold" />}
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={sheet === 'theme'} onClose={close} title="Mavzu">
        <div className="th-opts" role="radiogroup" aria-label="Mavzu">
          {THEME_OPTIONS.map(({ id, label, hint, icon: Ic }) => {
            const on = id === theme.id
            return (
              <button key={id} type="button" role="radio" aria-checked={on} className={`th-opt ${on ? 'on' : ''}`}
                onClick={(e) => setTheme(id, originOf(e))}>
                <span className={`th-prev ${id}`} aria-hidden="true"><i /><i /><em /></span>
                <b><Ic size={16} weight={on ? 'fill' : 'regular'} /> {label}</b>
                <small>{hint}</small>
              </button>
            )
          })}
        </div>
        <p className="th-hint">
          <Info size={18} weight="fill" />
          {inTelegram()
            ? "«Tizim» tanlansa, ilova Telegram mavzusiga moslashadi."
            : "«Tizim» tanlansa, ilova qurilmangizdagi yorug' yoki qorong'i rejimga avtomatik moslashadi."}
        </p>
      </Sheet>

      <Sheet open={sheet === 'delete'} onClose={close} title="Akkauntni o'chirish">
        <div className="st-confirm">
          <span className="st-confirm-ico danger"><WarningCircle size={30} weight="fill" /></span>
          <p>
            {isEmp
              ? "Kompaniya profili, joylangan vakansiyalar va nomzodlarga yuborilgan takliflar butunlay o'chiriladi."
              : "Rezyume, arizalar, saqlangan vakansiyalar va QadamAI tavsiyalari butunlay o'chiriladi."}
            {' '}Bu amalni qaytarib bo'lmaydi.
          </p>
          <button type="button" className="btn btn-danger btn-lg btn-block" onClick={() => leave("Akkaunt o'chirildi")}>Ha, o'chirish</button>
          <button type="button" className="btn btn-ghost btn-lg btn-block" onClick={close}>Bekor qilish</button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'logout'} onClose={close} title="Ilovadan chiqish">
        <div className="st-confirm">
          <p>Haqiqatan ham akkauntdan chiqmoqchimisiz? Qayta kirish uchun telefon raqamingiz kerak bo'ladi.</p>
          <button type="button" className="btn btn-danger btn-lg btn-block" onClick={() => leave()}>Chiqish</button>
          <button type="button" className="btn btn-ghost btn-lg btn-block" onClick={close}>Bekor qilish</button>
        </div>
      </Sheet>
    </div>
  )
}

export function AccountSettings() {
  const { user, switchRole, notify } = useApp()
  const isEmp = user.role === 'employer'
  const title = isEmp ? user.company : user.name
  const rows = [
    ['Ism-familiya', user.name],
    ['Telefon', user.phone],
    ['Email', user.email],
    ['Telegram', user.telegram],
    ['Hisob turi', isEmp ? 'Ish beruvchi' : 'Ish izlovchi'],
  ]
  return (
    <div className="page more">
      <TopBar title="Foydalanuvchi" />
      <div className="page-body">
        <div className="st-user">
          <Avatar name={title} color={user.color} size={64} radius={22} photo={user.photo} silhouette={!isEmp} />
          <div className="grow"><b>{title}</b><span>{isEmp ? `${user.name} · ${user.position || 'HR'}` : user.headline || 'Ish izlovchi'}</span></div>
        </div>
        <div className="more-group st-kv">
          {rows.map(([k, v]) => (
            <div key={k}><span>{k}</span><b className={v ? '' : 'empty'}>{v || "Ko'rsatilmagan"}</b></div>
          ))}
        </div>
        <MoreList groups={[
          [
            { label: "Ma'lumotlarni tahrirlash", icon: PencilSimple, to: '/profile/edit' },
            { label: isEmp ? 'Mening vakansiyalarim' : 'Mening arizalarim', icon: SquaresFour, to: '/applications' },
            { label: 'Tadbirlar', icon: CalendarBlank, to: '/events' },
          ],
          [{
            label: 'Rolni almashtirish (demo)', icon: ArrowsLeftRight,
            onClick: () => { switchRole(); notify(isEmp ? 'Ish izlovchi rejimi' : 'Ish beruvchi rejimi') },
          }],
        ]} />
      </div>
    </div>
  )
}

function Switch({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)}>
      <i />
    </button>
  )
}

export function NotificationSettings() {
  const { user, prefs, setNotif } = useApp()
  const isEmp = user?.role === 'employer'
  const groups = [
    {
      title: 'Ilovada',
      items: isEmp
        ? [
            { key: 'apps', label: 'Yangi arizalar', hint: 'Vakansiyangizga nomzod ariza yuborganda' },
            { key: 'ai', label: 'QadamAI tavsiyalari', hint: 'Vakansiyangizga mos yangi nomzodlar' },
            { key: 'events', label: 'Tadbirlar', hint: 'Yarmarkalar va HR uchrashuvlar' },
          ]
        : [
            { key: 'jobs', label: 'Yangi vakansiyalar', hint: 'Qidiruv sozlamalaringizga mos e\'lonlar' },
            { key: 'ai', label: 'QadamAI tavsiyalari', hint: 'Rezyumengizga yuqori moslikdagi ishlar' },
            { key: 'apps', label: 'Ariza holati', hint: "Ish beruvchi arizangizni ko'rganda yoki javob berganda" },
            { key: 'courses', label: 'Kurslar', hint: 'Yozilgan kurslaringiz boshlanishi' },
            { key: 'events', label: 'Tadbirlar', hint: 'Karyera forumlari va uchrashuvlar' },
          ],
    },
    { title: 'Email', items: [{ key: 'email', label: 'Haftalik dayjest', hint: user?.email || "Profilda email ko'rsatilmagan" }] },
  ]
  return (
    <div className="page more">
      <TopBar title="Bildirishnomalar" />
      <div className="page-body st-notif">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="st-cap">{g.title}</h2>
            <div className="more-group">
              {g.items.map((it) => (
                <label key={it.key} className="st-toggle">
                  <span className="grow"><b>{it.label}</b><span>{it.hint}</span></span>
                  <Switch on={!!prefs.notif[it.key]} onChange={(v) => setNotif(it.key, v)} label={it.label} />
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export function HiddenItems() {
  const { jobsAll, hiddenJobs, hiddenCompanies, unhideJob, unhideCompany, notify } = useApp()
  const [tab, setTab] = useState('jobs')
  const jobs = jobsAll.filter((j) => hiddenJobs.includes(j.id))
  const companyColor = (name) => jobsAll.find((j) => j.company === name)?.color || '#5B57F0'
  const companyCount = (name) => jobsAll.filter((j) => j.company === name).length

  return (
    <div className="page more">
      <TopBar title="Yashirinlar" />
      <div className="page-body">
        <div className="segmented">
          <button className={tab === 'jobs' ? 'on' : ''} onClick={() => setTab('jobs')}>Vakansiyalar ({jobs.length})</button>
          <button className={tab === 'co' ? 'on' : ''} onClick={() => setTab('co')}>Kompaniyalar ({hiddenCompanies.length})</button>
        </div>
        {tab === 'jobs' ? (
          jobs.length ? (
            <div className="more-group st-hidden">
              {jobs.map((j) => (
                <div key={j.id} className="st-hidden-item">
                  <CompanyLogo name={j.company} color={j.color} size={44} />
                  <Link to={`/jobs/${j.id}`} className="grow"><b>{j.title}</b><span>{j.company} · {j.city}</span></Link>
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => { unhideJob(j.id); notify('Vakansiya qaytarildi') }}>Qaytarish</button>
                </div>
              ))}
            </div>
          ) : <Empty icon="briefcase" title="Yashirin vakansiyalar yo'q" text="Mos kelmagan vakansiyani uning sahifasidagi «Vakansiyani yashirish» tugmasi bilan yashiring" />
        ) : hiddenCompanies.length ? (
          <div className="more-group st-hidden">
            {hiddenCompanies.map((c) => (
              <div key={c} className="st-hidden-item">
                <CompanyLogo name={c} color={companyColor(c)} size={44} />
                <div className="grow"><b>{c}</b><span>{companyCount(c)} ta vakansiya yashirilgan</span></div>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => { unhideCompany(c); notify('Kompaniya qaytarildi') }}>Qaytarish</button>
              </div>
            ))}
          </div>
        ) : <Empty icon="building" title="Yashirin kompaniyalar yo'q" text="Kompaniyaning barcha e'lonlarini ko'rmaslik uchun vakansiya sahifasida «Kompaniyani yashirish»ni bosing" />}
      </div>
    </div>
  )
}
