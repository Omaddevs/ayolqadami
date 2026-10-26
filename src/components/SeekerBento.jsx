import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import GlassIcon from './GlassIcon'
import { canUseAI, useApp } from '../context/AppContext'
import { postedAt } from '../lib/time'
import { useT } from '../i18n'

// Bosh sahifa (ish izlovchi): tezkor tugmalar qatori, sarlavha va 3 ustunli bento —
// [baland: vakansiyalar] [QadamAI / rezyume] [baland, brend rangida: qulay ish formati, rasmlar]
// raqam 0 dan qiymatigacha sanab chiqadi (karta ekranga kirganda, ~0.9 s); qiymat o'zgarsa — yangisiga
function useCountUp(target, ref) {
  const [v, setV] = useState(0)
  const seen = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let raf
    const run = () => {
      if (reduce) return setV(target)
      const t0 = performance.now()
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 900)
        setV(Math.round(target * (1 - (1 - k) ** 3)))
        if (k < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }
    if (seen.current) { run(); return () => cancelAnimationFrame(raf) }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { seen.current = true; io.disconnect(); run() } }, { threshold: 0.3 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [target, ref])
  return v
}

const QUICK = [
  { icon: 'resume', label: ['Rezyume', 'yaratish'], to: '/profile/edit' },
  { icon: 'plane', label: ['Telegram bot', '@ayolqadam_bot'], href: 'https://t.me/ayolqadam_bot' },
  { icon: 'pin', label: ['Xaritada', 'ish qidirish'], to: '/map' },
  { icon: 'folder', label: ['Ish kanallari', 'Telegram papka'], href: 'https://t.me/addlist/URvgf3qbEus5ZDcy' },
]

function Quick({ q, t }) {
  const inner = (
    <>
      <span className="sb-q-ico"><GlassIcon name={q.icon} tone="brand" size={36} /></span>
      <span>{t(q.label[0])}<br />{t(q.label[1])}</span>
    </>
  )
  return q.href
    ? <a className="sb-q" href={q.href} target="_blank" rel="noopener noreferrer">{inner}</a>
    : <Link className="sb-q" to={q.to}>{inner}</Link>
}

// Tezkor tugmalar (rezyume, Telegram bot, xarita...). Mobilda bosh sahifadagi yopishqoq qidiruv paneli ichida,
// desktopda — bento ustida (fixes.css: .home .sb > .sb-quick)
export function SeekerQuick() {
  const t = useT()
  return <div className="sb-quick">{QUICK.map((q) => <Quick key={q.label[0]} q={q} t={t} />)}</div>
}

export default function SeekerBento() {
  const { allJobs, user } = useApp()
  const t = useT()
  const remote = useMemo(() => allJobs.filter((j) => j.type === 'Masofaviy').length, [allJobs])
  // statistika saytdagi e'lonlardan: jami, e'loni bor sohalar, oxirgi 24 soatda qo'shilganlar
  const stats = useMemo(() => {
    const day = Date.now() - 864e5
    return {
      jobs: allJobs.length,
      fields: new Set(allJobs.map((j) => j.category).filter(Boolean)).size,
      fresh: allJobs.filter((j) => (postedAt(j)?.getTime() || 0) >= day).length,
    }
  }, [allJobs])
  const statRef = useRef(null)
  const nJobs = useCountUp(stats.jobs, statRef)
  const nFields = useCountUp(stats.fields, statRef)
  // profil to'liqligi: ism, telefon, shahar, soha, rezyume — mehmon uchun namunaviy 80%
  const fill = user ? Math.round(([user.name, user.phone, user.city, user.category || user.categories?.length, user.resume || user.skills?.length].filter(Boolean).length / 5) * 100) : 80

  return (
    <section className="sb" aria-labelledby="sb-h">
      <SeekerQuick />

      <h2 id="sb-h">{t('Ish topish endi oson')}</h2>

      <div className="sb-grid">
        <Link to="/jobs" className="sb-card sb-card--jobs">
          <b ref={statRef} aria-label={t("{n} ta vakansiya va {c} ta ish yo'nalishi", { n: stats.jobs, c: stats.fields })}>
            <span className="sb-num">{nJobs.toLocaleString('ru-RU')}</span> {t('ta vakansiya va')} <span className="sb-num">{nFields}</span> {t("ta ish yo'nalishi")}
          </b>
          <small className="sb-fresh">
            {stats.fresh > 0
              ? <><i />{t("Oxirgi 24 soatda {n} ta yangi e'lon", { n: stats.fresh })}</>
              : t("Har kuni yangi e'lonlar qo'shiladi")}
          </small>
          <div className="sb-art" aria-hidden="true">
            <img className="sb-art-main" src="/yangi-ishlar.webp" alt="" loading="lazy" />
            <span className="sb-mini">
              <GlassIcon name="briefcase" tone="brand" size={34} />
              <span><b>{t('Operator')}</b><small>{t("4,5–6 mln so'm")}</small></span>
            </span>
            <span className="sb-progress">
              <GlassIcon name="resume" tone="brand" size={34} />
              <span><small>{t('Profil')} · {fill}%</small><em style={{ '--w': `${fill}%` }} /></span>
            </span>
          </div>
        </Link>

        {canUseAI(user) && (
          <Link to="/qadam-ai?mode=job" className="sb-card sb-card--ai">
            <b>{t('Qadam AI HR sizga mos ishni topadi')}</b>
            <img className="sb-obj" src="/qadam-ai.webp" alt="" loading="lazy" />
          </Link>
        )}

        {/* QadamAI kartasi bo'lmasa — rezyume kartasi ikki qator egallaydi (gridda bo'sh katak qolmasin) */}
        <Link to="/profile/edit" className={`sb-card sb-card--cv${canUseAI(user) ? '' : ' sb-card--tall'}`}>
          <b>{t('Rezyumeni 10 daqiqada')}<br />{t('tuzing')}</b>
          <img className="sb-obj" src="/rezyume.webp" alt="" loading="lazy" />
        </Link>

        <Link to="/jobs?type=Masofaviy" className="sb-card sb-card--flex">
          <b>{t("Uydan, yarim kun yoki smenali — o'zingizga qulay ish")}</b>
          <div className="sb-photos" aria-hidden="true">
            <img className="sb-ph sb-ph--1" src="/hero-bg.webp" alt="" loading="lazy" />
            <img className="sb-ph sb-ph--2" src="/media/home-care.webp" alt="" loading="lazy" />
            <span className="sb-chip">{t('Masofaviy')} · {remote}</span>
            {/* cheksizlik «arqoni» — ish vaqti sizga moslashadi */}
            <svg className="sb-loop" viewBox="0 0 240 120">
              <defs>
                <linearGradient id="sb-rope" x1="0" x2="1">
                  <stop offset="0" stopColor="#C6F36B" /><stop offset=".5" stopColor="#FFB4E6" /><stop offset="1" stopColor="#C6F36B" />
                </linearGradient>
              </defs>
              <path d="M120 60C96 22 34 18 30 60s66 38 90 0 86-42 90 0-66 38-90 0Z" />
            </svg>
          </div>
        </Link>
      </div>
    </section>
  )
}
