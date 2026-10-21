import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock } from '@phosphor-icons/react'
import Icon3D from './Icon3D'
import { SectionHead } from './UI'
import { ARTICLES } from '../data/articles'

// Bosh sahifa: "Foydali maqolalar" — mobilda gorizontal aylantiriladi, desktopda bir qatorda
// Maqolada img bo'lsa rasm, bo'lmasa cover gradienti va 3D ikonka ko'rsatiladi
export default function ArticlesRail({ limit = 5 }) {
  return (
    <section className="ac-sec">
      <SectionHead title="Foydali maqolalar" to="/articles" />
      <div className="ac-rail">
        {ARTICLES.slice(0, limit).map((a) => (
          <Link key={a.id} to={`/articles/${a.id}`} className="ac-card" style={{ '--c1': a.cover[0], '--c2': a.cover[1] }}>
            <div className="ac-media" aria-hidden="true">
              {a.img ? <img src={a.img} alt="" loading="lazy" /> : <Icon3D name={a.icon} size={132} className="ac-art" />}
            </div>
            <span className="ac-tag">{a.tag}</span>
            <div className="ac-body">
              <span className="ac-meta"><Clock size={13} weight="bold" /> {a.read} daqiqa</span>
              <h3>{a.title}</h3>
            </div>
            <span className="ac-notch"><i><ArrowUpRight size={20} weight="bold" /></i></span>
          </Link>
        ))}
      </div>
    </section>
  )
}
