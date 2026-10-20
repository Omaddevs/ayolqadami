import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Clock, ThumbsDown, ThumbsUp } from '@phosphor-icons/react'
import Icon3D from '../components/Icon3D'
import { Empty, TopBar } from '../components/UI'
import { useApp } from '../context/AppContext'
import { ARTICLES } from '../data/articles'

function Cover({ a, big }) {
  return (
    <div className={`ar-cover ${big ? 'big' : ''}`} style={{ '--c1': a.cover[0], '--c2': a.cover[1] }}>
      <span className="ar-tag">{a.tag}</span>
      <Icon3D name={a.icon} size={big ? 150 : 120} />
    </div>
  )
}

export function Articles() {
  return (
    <div className="page more">
      <TopBar title="Maqolalar" />
      <div className="page-body">
        <div className="ar-list">
          {ARTICLES.map((a) => (
            <Link key={a.id} to={`/articles/${a.id}`} className="ar-card">
              <Cover a={a} />
              <div className="ar-card-body">
                <h2>{a.title}</h2>
                <p>{a.excerpt}</p>
                <span className="ar-meta"><Clock size={15} /> {a.read} daqiqa · {a.date}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// key={id}: boshqa maqolaga o'tilganda baho holati yangilanadi
export function ArticleDetail() {
  const { id } = useParams()
  return <ArticleView key={id} id={id} />
}

function ArticleView({ id }) {
  const { notify, requireAuth } = useApp()
  const [vote, setVote] = useState(null)
  const a = ARTICLES.find((x) => x.id === id)
  if (!a) return <div className="page"><TopBar title="Maqola" /><Empty title="Maqola topilmadi" /></div>
  const more = ARTICLES.filter((x) => x.id !== a.id).slice(0, 2)
  const rate = (v) => requireAuth(() => { setVote(v); notify('Fikringiz uchun rahmat!') })

  return (
    <div className="page more">
      <TopBar title="Maqola" />
      <article className="page-body ar-detail">
        <Cover a={a} big />
        <h1>{a.title}</h1>
        <span className="ar-meta"><Clock size={15} /> {a.read} daqiqa o'qish · {a.date}</span>
        <div className="ar-text">
          {a.body.map((b, i) =>
            b.h ? <h2 key={i}>{b.h}</h2>
              : b.list ? <ul key={i}>{b.list.map((li) => <li key={li}>{li}</li>)}</ul>
              : <p key={i}>{b.p}</p>)}
        </div>

        <div className="ar-rate">
          <b>Maqola foydali bo'ldimi?</b>
          <div>
            <button type="button" className={vote === 'up' ? 'on' : ''} disabled={!!vote} onClick={() => rate('up')}>
              <ThumbsUp size={20} weight={vote === 'up' ? 'fill' : 'regular'} /> Ha
            </button>
            <button type="button" className={vote === 'down' ? 'on' : ''} disabled={!!vote} onClick={() => rate('down')}>
              <ThumbsDown size={20} weight={vote === 'down' ? 'fill' : 'regular'} /> Yo'q
            </button>
          </div>
        </div>

        <h2 className="ar-more-title">Yana o'qing</h2>
        <div className="ar-list">
          {more.map((x) => (
            <Link key={x.id} to={`/articles/${x.id}`} className="ar-card">
              <Cover a={x} />
              <div className="ar-card-body"><h2>{x.title}</h2><p>{x.excerpt}</p></div>
            </Link>
          ))}
        </div>
      </article>
    </div>
  )
}
