import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'

// Atrofda suzib yuradigan xato kodi yorliqlari: joylashuv (%), burilish, rang, o'lcham.
// `wide` — faqat keng ekranda ko'rinadi (mobilda matn ustiga tushmasin)
const STICKERS = [
  { x: 2, y: 6, r: 32, tone: 'lilac', s: 1 },
  { x: 21, y: 2, r: -14, tone: 'outline', s: .85 },
  { x: 56, y: -4, r: -24, tone: 'pale', s: .9, wide: true },
  { x: 94, y: 2, r: 14, tone: 'rose', s: .8 },
  { x: 84, y: 40, r: -6, tone: 'primary', s: 1 },
  { x: -3, y: 70, r: 8, tone: 'primary', s: .95 },
  { x: 24, y: 80, r: -4, tone: 'lilac', s: .9, wide: true },
  { x: 64, y: 88, r: 10, tone: 'outline', s: .75, wide: true },
  { x: 84, y: 86, r: -6, tone: 'pale', s: .95 },
  { x: 6, y: 38, r: -18, tone: 'rose', s: .6, wide: true },
]

// Xato sahifalari uchun umumiy qobiq: to'q indigo fon, suzuvchi yorliqlar, markazdagi matn
function ErrorScreen({ code, children, className = '' }) {
  return (
    <main className={`nf ${className}`}>
      <div className="nf-stickers" aria-hidden="true">
        {STICKERS.map((t, i) => (
          <span key={i} className={`nf-sticker ${t.tone} ${t.wide ? 'wide' : ''}`}
            style={{ left: `${t.x}%`, top: `${t.y}%`, '--r': `${t.r}deg`, '--s': t.s, '--d': `${i * -0.9}s` }}>
            {code}
          </span>
        ))}
      </div>

      <Link to="/" className="nf-brand">
        <img src="/ayolqadami-mark.webp" alt="" width="30" height="30" />
        <span>AyolQadami</span>
      </Link>

      <div className="nf-center">{children}</div>
    </main>
  )
}

export default function NotFound() {
  const t = useT()
  return (
    <ErrorScreen code="404">
      <span className="nf-label">{t('Xato')} 404</span>
      <h1>{t('VOY !')}</h1>
      <p>{t('Siz qidirayotgan sahifa')}<br />{t("mavjud emasga o'xshaydi.")}</p>
      <Link to="/" className="nf-btn">{t('Bosh sahifaga')} <i /></Link>
    </ErrorScreen>
  )
}

// Qo'riqchi ruxsatsiz mehmonni "tepib chiqaryapti" — pictogram uslubidagi chizma
function GuardArt() {
  const bg = '#15133A'
  return (
    <svg className="ua-art" viewBox="0 0 400 270" role="img" aria-label="Qo'riqchi ruxsatsiz mehmonni chiqarib yubormoqda">
      <ellipse cx="200" cy="252" rx="160" ry="9" fill="rgba(0,0,0,.35)" />

      {/* mehmon: ko'zoynakli, hayron, oldinga uchib ketyapti */}
      <g className="ua-visitor" fill="none" stroke="#fff" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round">
        <path d="M120 96 L104 162" />
        <path d="M116 108 L84 136 L70 160" />
        <path d="M104 162 L82 200 L74 240" />
        <path d="M104 162 L136 194 L134 236" />
        <circle cx="122" cy="66" r="21" fill="#fff" stroke="none" />
        <circle cx="132" cy="62" r="6.5" stroke={bg} strokeWidth="3" />
        <circle cx="146" cy="60" r="6.5" stroke="#fff" strokeWidth="3" />
        <path d="M138.5 61 L139.5 61" stroke={bg} strokeWidth="3" />
        <path d="M120 76 q6 -5 12 0" stroke={bg} strokeWidth="3.5" />
      </g>
      <text x="150" y="38" className="ua-q">!?</text>

      {/* zarba nuqtasi va oyoq harakati izi */}
      <path className="ua-burst" d="M146 148 l8 10 l12 -6 l-2 13 l13 4 l-11 8 l7 11 l-13 -2 l-3 13 l-8 -10 l-10 7 l1 -13 l-13 -3 l11 -7 l-6 -12 l13 2 z"
        fill="none" stroke="#F9A8D4" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M190 196 Q 200 236 246 244" fill="none" stroke="#8B87FF" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 9" />

      {/* qo'riqchi: furajkali, jahldor, tepayapti */}
      <g fill="none" stroke="#fff" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round">
        <path d="M268 102 L278 166" />
        <path d="M266 112 L236 104 L224 76" />
        <path d="M270 114 L304 130 L322 112" />
        <path d="M278 166 L268 206 L282 242" />
        <g className="ua-kick"><path d="M278 166 L226 170 L172 160" /></g>
        <circle cx="264" cy="72" r="22" fill="#fff" stroke="none" />
        <path d="M252 76 L258 74 M266 74 L272 76" stroke={bg} strokeWidth="3.5" />
        <path d="M254 86 q8 -6 16 0" stroke={bg} strokeWidth="3.5" />
      </g>
      <path d="M238 56 Q 262 30 290 50 L 288 58 L 240 60 Z" fill="#5B57F0" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
      <path d="M232 60 L 292 58" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <circle cx="264" cy="46" r="4.5" fill="#FBBF24" />
    </svg>
  )
}

export function Unauthorized() {
  const { user, requireAuth } = useApp()
  const t = useT()
  const nav = useNavigate()
  return (
    <ErrorScreen code="401" className="ua">
      <span className="nf-label">{t('Xato')} 401</span>
      <h1>401</h1>
      <p>{t('Bu sahifaga kirish uchun')}<br />{t('avval tizimga kiring.')}</p>
      <GuardArt />
      <div className="ua-actions">
        {!user && <button type="button" className="nf-btn solid" onClick={() => requireAuth(() => nav('/profile'))}>{t('Kirish')} <i /></button>}
        <Link to="/" className="nf-btn">{t('Bosh sahifaga')} <i /></Link>
      </div>
    </ErrorScreen>
  )
}
