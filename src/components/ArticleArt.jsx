import { useState } from 'react'
import Icon3D from './Icon3D'

// Maqola muqovasi: img bo'lsa foto (butun fonni egallaydi), bo'lmasa yoki yuklanmasa — 3D ikonka
export default function ArticleArt({ a, size, className = '' }) {
  const [failed, setFailed] = useState(false)
  if (a.img && !failed) {
    return <img className="art-photo" src={a.img} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
  }
  return <Icon3D name={a.icon} size={size} className={className} />
}
