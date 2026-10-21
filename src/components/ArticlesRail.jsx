import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock } from '@phosphor-icons/react'
import ArticleArt from './ArticleArt'
import { SectionHead } from './UI'
import { useContent } from '../context/AppContext'
import { tx, useT } from '../i18n'

// Bosh sahifa: "Foydali maqolalar" — mobilda gorizontal aylantiriladi, desktopda bir qatorda
// Maqolada img bo'lsa rasm, bo'lmasa cover gradienti va 3D ikonka ko'rsatiladi
export default function ArticlesRail({ limit = 5 }) {
  const t = useT()
  const { articles: ARTICLES } = useContent()
  if (!ARTICLES.length) return null // maqola yo'q — bo'lim ko'rinmaydi
  return (
    <section className="ac-sec">
      <SectionHead title={t('Foydali maqolalar')} to="/articles" />
      <div className="ac-rail">
        {ARTICLES.slice(0, limit).map((a) => (
          <Link key={a.id} to={`/articles/${a.id}`} className={`ac-card ${a.img ? 'has-img' : ''}`} style={{ '--c1': a.cover[0], '--c2': a.cover[1] }}>
            <div className="ac-media" aria-hidden="true">
              <ArticleArt a={a} size={132} className="ac-art" />
            </div>
            <span className="ac-tag">{t(a.tag)}</span>
            <div className="ac-body">
              <span className="ac-meta"><Clock size={13} weight="bold" /> {t('{n} daqiqa', { n: a.read })}</span>
              <h3>{tx(a.title)}</h3>
            </div>
            <span className="ac-notch"><i><ArrowUpRight size={20} weight="bold" /></i></span>
          </Link>
        ))}
      </div>
    </section>
  )
}
