import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowsLeftRight, Bell, CalendarBlank, Check, CircleHalf, EyeSlash, FileText, Info, PencilSimple, ShieldCheck, SignOut, SquaresFour, Translate, Trash, UserCircle, WarningCircle,
} from '@phosphor-icons/react'
import { Avatar, CompanyLogo, Empty, Sheet, THEME_OPTIONS, TopBar } from '../components/UI'
import { useApp } from '../context/AppContext'
import { inTelegram } from '../lib/telegram'
import { api as server, apiEnabled } from '../lib/api'
import { originOf } from '../lib/theme'
import { MoreList } from './Misc'
import { LANGS, tx, useT } from '../i18n'

export function Settings() {
  const { user, prefs, setPrefs, setTheme, logout, notify, requireAuth } = useApp()
  const t = useT()
  const nav = useNavigate()
  const isEmp = user?.role === 'employer'
  const [sheet, setSheet] = useState(null) // 'lang' | 'theme' | 'delete' | 'logout'
  const close = () => setSheet(null)
  const lang = LANGS.find((l) => l.id === prefs.lang) || LANGS[0]
  const theme = THEME_OPTIONS.find((t) => t.id === prefs.theme) || THEME_OPTIONS[2]
  const leave = (text) => { logout(); nav('/', { replace: true }); if (text) notify(text) }

  return (
    <div className="page more">
      <TopBar title={t('Sozlamalar')} />
      <div className="page-body">
        <MoreList groups={[
          user ? [
            { label: t('Foydalanuvchi'), icon: UserCircle, to: '/settings/account' },
            { label: t('Bildirishnomalar'), icon: Bell, to: '/settings/notifications', rotate: 28 },
            { label: t("Akkauntni o'chirish"), icon: Trash, onClick: () => setSheet('delete') },
          ] : [
            { label: t("Kirish / Ro'yxatdan o'tish"), icon: UserCircle, onClick: () => requireAuth() },
            { label: t('Bildirishnomalar'), icon: Bell, to: '/settings/notifications', rotate: 28 },
          ],
          ...(isEmp ? [] : [[{ label: t('Yashirin vakansiyalar va kompaniyalar'), icon: EyeSlash, to: '/settings/hidden' }]]),
          [
            { label: t('Til'), icon: Translate, value: lang.label, onClick: () => setSheet('lang') },
            { label: t('Mavzu'), icon: CircleHalf, value: t(theme.label), onClick: () => setSheet('theme') },
            ...(user ? [{ label: t('Ilovadan chiqish'), icon: SignOut, danger: true, onClick: () => setSheet('logout') }] : []),
          ],
        ]} />
      </div>

      <Sheet open={sheet === 'lang'} onClose={close} title={t('Ilova tili')}>
        <div className="pf-options">
          {LANGS.map((l) => (
            <button key={l.id} type="button" className={`pf-option ${l.id === lang.id ? 'on' : ''}`} lang={l.html}
              onClick={() => { setPrefs({ lang: l.id }); close() }}>
              <span className="pf-option-text"><b>{l.label}</b><span>{l.hint}</span></span>
              {l.id === lang.id && <Check size={20} weight="bold" />}
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={sheet === 'theme'} onClose={close} title={t('Mavzu')}>
        <div className="th-opts" role="radiogroup" aria-label={t('Mavzu')}>
          {THEME_OPTIONS.map(({ id, label, hint, icon: Ic }) => {
            const on = id === theme.id
            return (
              <button key={id} type="button" role="radio" aria-checked={on} className={`th-opt ${on ? 'on' : ''}`}
                onClick={(e) => setTheme(id, originOf(e))}>
                <span className={`th-prev ${id}`} aria-hidden="true"><i /><i /><em /></span>
                <b><Ic size={16} weight={on ? 'fill' : 'regular'} /> {t(label)}</b>
                <small>{t(hint)}</small>
              </button>
            )
          })}
        </div>
        <p className="th-hint">
          <Info size={18} weight="fill" />
          {inTelegram()
            ? t('«Tizim» tanlansa, ilova Telegram mavzusiga moslashadi.')
            : t("«Tizim» tanlansa, ilova qurilmangizdagi yorug' yoki qorong'i rejimga avtomatik moslashadi.")}
        </p>
      </Sheet>

      <Sheet open={sheet === 'delete'} onClose={close} title={t("Akkauntni o'chirish")}>
        <div className="st-confirm">
          <span className="st-confirm-ico danger"><WarningCircle size={30} weight="fill" /></span>
          <p>
            {isEmp
              ? t("Kompaniya profili, joylangan vakansiyalar va nomzodlarga yuborilgan takliflar butunlay o'chiriladi.")
              : t("Rezyume, arizalar, saqlangan vakansiyalar va QadamAI tavsiyalari butunlay o'chiriladi.")}
            {' '}{t("Bu amalni qaytarib bo'lmaydi.")}
          </p>
          <button type="button" className="btn btn-danger btn-lg btn-block" onClick={() => leave(t("Akkaunt o'chirildi"))}>{t("Ha, o'chirish")}</button>
          <button type="button" className="btn btn-ghost btn-lg btn-block" onClick={close}>{t('Bekor qilish')}</button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'logout'} onClose={close} title={t('Ilovadan chiqish')}>
        <div className="st-confirm">
          <p>{t("Haqiqatan ham akkauntdan chiqmoqchimisiz? Qayta kirish uchun telefon raqamingiz kerak bo'ladi.")}</p>
          <button type="button" className="btn btn-danger btn-lg btn-block" onClick={() => leave()}>{t('Chiqish')}</button>
          <button type="button" className="btn btn-ghost btn-lg btn-block" onClick={close}>{t('Bekor qilish')}</button>
        </div>
      </Sheet>
    </div>
  )
}

export function AccountSettings() {
  const { user, switchRole, notify, logout } = useApp()
  const t = useT()
  const nav = useNavigate()
  // Shaxsiy ma'lumotlar qonuni: foydalanuvchi hisobini va ma'lumotlarini o'zi o'chira oladi
  const removeAccount = async () => {
    if (!window.confirm(t("Hisobingiz va barcha ma'lumotlaringiz (rezyume, arizalar) butunlay o'chiriladi. Davom etasizmi?"))) return
    if (apiEnabled) {
      try { await server.deleteMe() } catch { return notify(t("Hisobni o'chirib bo'lmadi. Qayta urinib ko'ring")) }
    }
    logout()
    notify(t("Hisob o'chirildi"))
    nav('/')
  }
  const isEmp = user.role === 'employer'
  const title = isEmp ? user.company : user.name
  const rows = [
    [t('Ism-familiya'), user.name],
    [t('Telefon'), user.phone],
    ['Email', user.email],
    ['Telegram', user.telegram],
    [t('Hisob turi'), isEmp ? t('Ish beruvchi') : t('Ish izlovchi')],
  ]
  return (
    <div className="page more">
      <TopBar title={t('Foydalanuvchi')} />
      <div className="page-body">
        <div className="st-user">
          <Avatar name={title} color={user.color} size={64} radius={22} photo={user.photo} silhouette={!isEmp} />
          <div className="grow"><b>{title}</b><span>{isEmp ? `${user.name} · ${user.position || 'HR'}` : tx(user.headline) || t('Ish izlovchi')}</span></div>
        </div>
        <div className="more-group st-kv">
          {rows.map(([k, v]) => (
            <div key={k}><span>{k}</span><b className={v ? '' : 'empty'}>{v || t("Ko'rsatilmagan")}</b></div>
          ))}
        </div>
        <MoreList groups={[
          [
            { label: t("Ma'lumotlarni tahrirlash"), icon: PencilSimple, to: '/profile/edit' },
            { label: isEmp ? t('Mening vakansiyalarim') : t('Mening arizalarim'), icon: SquaresFour, to: '/applications' },
            { label: t('Tadbirlar'), icon: CalendarBlank, to: '/events' },
          ],
          // demo rejimdagina: serverda rol ro'yxatdan o'tishda belgilanadi
          ...(apiEnabled ? [] : [[{
            label: t('Rolni almashtirish (demo)'), icon: ArrowsLeftRight,
            onClick: () => { switchRole(); notify(isEmp ? t('Ish izlovchi rejimi') : t('Ish beruvchi rejimi')) },
          }]]),
          [
            { label: t('Maxfiylik siyosati'), icon: ShieldCheck, to: '/privacy' },
            { label: t('Foydalanish shartlari'), icon: FileText, to: '/terms' },
            { label: t("Hisobni o'chirish"), icon: Trash, danger: true, onClick: removeAccount },
          ],
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
  const t = useT()
  const isEmp = user?.role === 'employer'
  const groups = [
    {
      title: t('Ilovada'),
      items: isEmp
        ? [
            { key: 'apps', label: t('Yangi arizalar'), hint: t('Vakansiyangizga nomzod ariza yuborganda') },
            { key: 'ai', label: t('QadamAI tavsiyalari'), hint: t('Vakansiyangizga mos yangi nomzodlar') },
            { key: 'events', label: t('Tadbirlar'), hint: t('Yarmarkalar va HR uchrashuvlar') },
          ]
        : [
            { key: 'jobs', label: t('Yangi vakansiyalar'), hint: t("Qidiruv sozlamalaringizga mos e'lonlar") },
            { key: 'ai', label: t('QadamAI tavsiyalari'), hint: t('Rezyumengizga yuqori moslikdagi ishlar') },
            { key: 'apps', label: t('Ariza holati'), hint: t("Ish beruvchi arizangizni ko'rganda yoki javob berganda") },
            { key: 'courses', label: t('Kurslar'), hint: t('Yozilgan kurslaringiz boshlanishi') },
            { key: 'events', label: t('Tadbirlar'), hint: t('Karyera forumlari va uchrashuvlar') },
          ],
    },
    { title: 'Email', items: [{ key: 'email', label: t('Haftalik dayjest'), hint: user?.email || t("Profilda email ko'rsatilmagan") }] },
  ]
  return (
    <div className="page more">
      <TopBar title={t('Bildirishnomalar')} />
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
  const t = useT()
  const [tab, setTab] = useState('jobs')
  const jobs = jobsAll.filter((j) => hiddenJobs.includes(j.id))
  const companyColor = (name) => jobsAll.find((j) => j.company === name)?.color || '#5B57F0'
  const companyCount = (name) => jobsAll.filter((j) => j.company === name).length

  return (
    <div className="page more">
      <TopBar title={t('Yashirinlar')} />
      <div className="page-body">
        <div className="segmented">
          <button className={tab === 'jobs' ? 'on' : ''} onClick={() => setTab('jobs')}>{t('Vakansiyalar')} ({jobs.length})</button>
          <button className={tab === 'co' ? 'on' : ''} onClick={() => setTab('co')}>{t('Kompaniyalar')} ({hiddenCompanies.length})</button>
        </div>
        {tab === 'jobs' ? (
          jobs.length ? (
            <div className="more-group st-hidden">
              {jobs.map((j) => (
                <div key={j.id} className="st-hidden-item">
                  <CompanyLogo name={j.company} color={j.color} size={44} />
                  <Link to={`/jobs/${j.id}`} className="grow"><b>{tx(j.title)}</b><span>{j.company} · {tx(j.city)}</span></Link>
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => { unhideJob(j.id); notify(t('Vakansiya qaytarildi')) }}>{t('Qaytarish')}</button>
                </div>
              ))}
            </div>
          ) : <Empty icon="briefcase" title={t("Yashirin vakansiyalar yo'q")} text={t('Mos kelmagan vakansiyani uning sahifasidagi «Vakansiyani yashirish» tugmasi bilan yashiring')} />
        ) : hiddenCompanies.length ? (
          <div className="more-group st-hidden">
            {hiddenCompanies.map((c) => (
              <div key={c} className="st-hidden-item">
                <CompanyLogo name={c} color={companyColor(c)} size={44} />
                <div className="grow"><b>{c}</b><span>{t('{n} ta vakansiya yashirilgan', { n: companyCount(c) })}</span></div>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => { unhideCompany(c); notify(t('Kompaniya qaytarildi')) }}>{t('Qaytarish')}</button>
              </div>
            ))}
          </div>
        ) : <Empty icon="building" title={t("Yashirin kompaniyalar yo'q")} text={t("Kompaniyaning barcha e'lonlarini ko'rmaslik uchun vakansiya sahifasida «Kompaniyani yashirish»ni bosing")} />}
      </div>
    </div>
  )
}
