import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus } from '@phosphor-icons/react'
import { FaTelegramPlane } from 'react-icons/fa'
import { FaInstagram, FaRobot } from 'react-icons/fa6'
import Icon3D from './Icon3D'
import { useApp, useContent } from '../context/AppContext'
import { useT } from '../i18n'
import '../styles/home-footer.css'

// Ko'p beriladigan savollar: ikki ustun, oxirgi katakda "Bog'lanish" tugmasi
const FAQ = [
  ["AyolQadami qaysi sohalarni qamrab oladi?", "Tibbiyot, ta'lim, savdo, IT, go'zallik, maishiy xizmat, masofaviy ish va boshqa 15 dan ortiq soha. Barcha vakansiyalar ayollar uchun qulay sharoitlar bo'yicha tekshiriladi."],
  ["Xizmatdan foydalanish pullikmi?", "Yo'q. Ish izlovchilar uchun vakansiyalarni ko'rish, rezyume joylash va ariza yuborish butunlay bepul."],
  ["AyolQadami qanday ishlaydi?", "Profilingizni to'ldirasiz, QadamAI sizga mos vakansiyalarni tanlab beradi, siz esa bir bosishda ariza yuborasiz. Ish beruvchi javobini shu yerning o'zida ko'rasiz."],
  ["Ma'lumotlarim xavfsizmi?", "Telefon raqamingiz va kontaktlaringiz faqat siz ariza yuborgan ish beruvchiga ko'rinadi. Sozlamalarda istalgan vaqtda maxfiylikni o'zgartirishingiz mumkin."],
  ["Rezyumem yo'q bo'lsa nima qilaman?", "Rezyume yaratish bo'limida bir necha daqiqada tayyor shablon asosida rezyume tuzasiz — tajriba bo'lmasa ham ko'nikmalaringizni ko'rsatish mumkin."],
  ["Ish beruvchi qanday vakansiya joylaydi?", "Ish beruvchi sifatida ro'yxatdan o'ting va «Vakansiya joylash» tugmasini bosing. E'lon tekshiruvdan so'ng saytda va Telegram botda paydo bo'ladi."],
  ["Uydan ishlash imkoniyatlari bormi?", "Ha, «Masofaviy» sohasida va «Uydan ishlash» filtri orqali faqat masofaviy vakansiyalarni ko'rishingiz mumkin."],
]

const LINKS = [
  { title: 'Navigatsiya', items: [['Vakansiyalar', '/jobs'], ['Kategoriyalar', '/categories'], ['QadamAI yordamchi', '/qadam-ai'], ['Rezyume yaratish', '/profile/edit'], ['Xarita', '/map']] },
  { title: "Bo'limlar", items: [['Kompaniyalar', '/companies'], ['Maqolalar', '/articles'], ['Tadbirlar', '/events']] },
  { title: 'Yordam', items: [['Texnik yordam', '/support'], ['Sozlamalar', '/settings'], ["Qo'shimcha", '/more']] },
]

const SOCIAL = [
  { label: 'Telegram kanal', icon: FaTelegramPlane, href: 'https://t.me/ayolqadami' },
  { label: 'Instagram', icon: FaInstagram, href: 'https://www.instagram.com/ayolqadami.ai' },
  { label: 'Telegram bot', icon: FaRobot, href: 'https://t.me/ayolqadam_bot' },
]

function FaqItem({ q, a, open, onToggle }) {
  const t = useT()
  return (
    <div className={`hf-q ${open ? 'open' : ''}`}>
      <button type="button" className="hf-q-head" onClick={onToggle} aria-expanded={open}>
        <span>{t(q)}</span>
        <Plus size={18} className="hf-q-plus" />
      </button>
      <div className="hf-q-body"><p>{t(a)}</p></div>
    </div>
  )
}

export default function HomeFooter() {
  const { viewRole, notify } = useApp()
  const content = useContent()
  // bo'sh bo'limlarga havola ko'rsatilmaydi
  const hidden = new Set([!content.articles.length && '/articles', !content.events.length && '/events'].filter(Boolean))
  const t = useT()
  const [openQ, setOpenQ] = useState(-1)
  const [email, setEmail] = useState('')
  const subscribe = (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return notify(t("Email manzilni to'g'ri kiriting"))
    setEmail('')
    notify(t("Obuna bo'ldingiz! Yangiliklarni emailingizga yuboramiz"))
  }
  const isEmp = viewRole === 'employer'

  return (
    <footer className="hf">
      <section className="hf-faq">
        <div className="hf-faq-head">
          <span className="hf-chip dark">{t('Savol-javob')}</span>
          <h2>{t("Ko'p beriladigan savollar")}</h2>
        </div>
        <div className="hf-faq-grid">
          {FAQ.map(([q, a], i) => (
            <FaqItem key={q} q={q} a={a} open={openQ === i} onToggle={() => setOpenQ(openQ === i ? -1 : i)} />
          ))}
          <div className="hf-q hf-q-contact">
            <span>{t('Javob topa olmadingizmi?')}</span>
            <Link to="/support" className="hf-contact-btn">{t("Bog'lanish")} <i><ArrowRight size={12} weight="bold" /></i></Link>
          </div>
        </div>
      </section>

      <section className="hf-cta">
        <svg className="hf-cta-bg" viewBox="0 0 900 380" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="46" strokeLinecap="round">
            <path d="M-40 300 C 60 120, 220 120, 260 260 S 420 420, 470 250" />
            <circle cx="120" cy="40" r="110" />
            <path d="M560 -40 L 560 200" />
            <circle cx="760" cy="300" r="130" />
            <path d="M900 60 C 820 60, 780 140, 860 190" />
          </g>
        </svg>
        <span className="hf-float f1"><Icon3D name="briefcase" size={38} /></span>
        <span className="hf-float f2"><Icon3D name="heart" size={38} /></span>
        <span className="hf-float f3"><Icon3D name="resume" size={38} /></span>
        <span className="hf-float f4"><Icon3D name="sparkle" size={38} /></span>

        <div className="hf-cta-in">
          <span className="hf-chip"><img src="/ayolqadami-mark.webp" alt="" loading="lazy" decoding="async" /> {t('Ayollar uchun yaratilgan')}</span>
          <h2>{t('Karyerangizni yangi bosqichga')} <br />{t('olib chiqing')} <span className="hf-logo-tile"><i /></span> {t('AyolQadami bilan')}</h2>
          <p>{t("AyolQadami — ayollar uchun ish topish, rezyume yaratish va kasbiy o'sish platformasi: mos vakansiyalar, QadamAI tavsiyalari va ishonchli ish beruvchilar bir joyda.")}</p>
          <Link to={isEmp ? '/post-job' : '/profile/edit'} className="hf-cta-btn">
            <img src="/roles/seeker.webp" alt="" loading="lazy" decoding="async" />
            {isEmp ? t('Vakansiya joylash') : t('Rezyume joylash')}
          </Link>
        </div>
      </section>

      {/* Ikki panelli footer: chapda brend kartasi, o'ngda havolalar + obuna */}
      <div className="hf-foot">
        <div className="hf-bcard">
          <Link to="/" className="hf-brand"><img src="/ayolqadami-mark.webp" alt="" loading="lazy" decoding="async" /> AyolQadami</Link>
          <p>{t('Ayollar uchun ish va karyera,')} <span>{t('QadamAI yordamida.')}</span></p>
          <div className="hf-touch">
            <b>{t("Biz bilan bog'laning!")}</b>
            <div className="hf-social">
              {SOCIAL.map(({ label, icon: Ico, href }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={t(label)} title={t(label)}><Ico size={13} /></a>
              ))}
            </div>
          </div>
        </div>

        <div className="hf-icard">
          <nav className="hf-links">
            {LINKS.map((c) => (
              <div key={c.title}>
                <b>{t(c.title)}</b>
                {c.items.filter(([, to]) => !hidden.has(to)).map(([label, to]) => <Link key={label} to={to}>{t(label)}</Link>)}
              </div>
            ))}
          </nav>

          <form className="hf-news" onSubmit={subscribe} noValidate>
            <small>{t("Yangiliklardan birinchi bo'lib xabardor bo'ling.")}</small>
            <b>{t('AyolQadami bilan birga qoling.')}</b>
            <div className="hf-news-row">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('Email manzilingiz')} aria-label={t('Email manzil')} />
              <button type="submit">{t("Obuna bo'lish")}</button>
            </div>
          </form>

          <div className="hf-copy">
            <span>© {new Date().getFullYear()} AyolQadami. {t('Barcha huquqlar himoyalangan.')}</span>
            <div>
              <Link to="/terms">{t('Foydalanish shartlari')}</Link>
              <Link to="/privacy">{t('Maxfiylik siyosati')}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
