import { useId } from 'react'

/*
 * Shisha (glassmorphism) uslubidagi ikonkalar — binafsha hero fonida ishlatiladi.
 * Har bir ikonka: oq-lavanda shaffof yuz + chuqurlik qatlami + oq yaltiroq qirra (rim) + yumshoq soya.
 */

// tone="brand" — och fon (masalan, lavanda tugma) uchun: yuz loyiha binafsha rangida, soyasiz
const TONES = {
  glass: { f: [['#FFFFFF', '.96'], ['#EFEEFF', '.8'], ['#C4C2FF', '.52']], d: [['#E2E0FF', '.78'], ['#9894F2', '.72']] },
  brand: { f: [['#8F8BFF', '1'], ['#6C68F4', '1'], ['#5B57F0', '1']], d: [['#4B47D6', '1'], ['#2E2A8C', '1']] },
}

function Defs({ u, tone }) {
  const { f, d } = TONES[tone] || TONES.glass
  return (
    <defs>
      <linearGradient id={`${u}f`} x1=".1" y1="0" x2=".9" y2="1">
        {f.map(([c, o], i) => <stop key={i} offset={i / (f.length - 1)} stopColor={c} stopOpacity={o} />)}
      </linearGradient>
      <linearGradient id={`${u}d`} x1="0" y1="0" x2="1" y2="1">
        {d.map(([c, o], i) => <stop key={i} offset={i / (d.length - 1)} stopColor={c} stopOpacity={o} />)}
      </linearGradient>
      <linearGradient id={`${u}r`} x1="0" y1="0" x2=".7" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset=".55" stopColor="#FFFFFF" stopOpacity=".55" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity=".15" />
      </linearGradient>
      <linearGradient id={`${u}i`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#A6A3F6" stopOpacity=".55" />
        <stop offset="1" stopColor="#D8D6FF" stopOpacity=".35" />
      </linearGradient>
      <filter id={`${u}b`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
      <filter id={`${u}b1`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.6" />
      </filter>
    </defs>
  )
}

const Shadow = ({ u, cx = 62, cy = 105, rx = 34, ry = 5 }) => (
  <ellipse className="gi-shadow" cx={cx} cy={cy} rx={rx} ry={ry} fill="#2B2190" opacity=".28" filter={`url(#${u}b)`} />
)
const Gloss = ({ u, cx, cy, rx, ry, r = 0 }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" opacity=".85" filter={`url(#${u}b1)`} transform={`rotate(${r} ${cx} ${cy})`} />
)
const rim = (u, w = 1.6) => ({ stroke: `url(#${u}r)`, strokeWidth: w, vectorEffect: 'non-scaling-stroke' })

const ICONS = {
  coin: (u) => (
    <>
      <Shadow u={u} cx={58} />
      <g transform="translate(60 58) rotate(-26) scale(.68 1) translate(-60 -60)">
        <circle cx="74" cy="60" r="40" fill={`url(#${u}d)`} />
        <rect x="52" y="20" width="22" height="80" fill={`url(#${u}d)`} />
        <circle cx="52" cy="60" r="40" fill={`url(#${u}f)`} {...rim(u, 1.8)} />
        <circle cx="52" cy="60" r="28" fill={`url(#${u}i)`} stroke="#fff" strokeOpacity=".75" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        <circle cx="52" cy="60" r="28" fill="none" stroke="#8C88EE" strokeOpacity=".35" strokeWidth="1.4" vectorEffect="non-scaling-stroke" transform="translate(-1.5 -1.5)" />
      </g>
      <Gloss u={u} cx={40} cy={34} rx={9} ry={3.5} r={-40} />
    </>
  ),

  briefcase: (u) => (
    <>
      <Shadow u={u} />
      <path d="M44 34v-7a8 8 0 0 1 8-8h16a8 8 0 0 1 8 8v7" fill="none" stroke={`url(#${u}d)`} strokeWidth="8" strokeLinecap="round" />
      <path d="M44 34v-7a8 8 0 0 1 8-8h16a8 8 0 0 1 8 8v7" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="1.4" strokeLinecap="round" transform="translate(-3 -3)" />
      <rect x="20" y="38" width="86" height="64" rx="15" fill={`url(#${u}d)`} />
      <rect x="14" y="33" width="86" height="64" rx="15" fill={`url(#${u}f)`} {...rim(u)} />
      <path d="M14 58c14 8 29 11 43 11s29-3 43-11" fill="none" stroke="#8C88EE" strokeOpacity=".4" strokeWidth="1.6" />
      <path d="M14 56c14 8 29 11 43 11s29-3 43-11" fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="1.4" />
      <rect x="48" y="60" width="18" height="14" rx="5" fill={`url(#${u}i)`} stroke="#fff" strokeOpacity=".9" strokeWidth="1.4" />
      <Gloss u={u} cx={36} cy={42} rx={14} ry={3} />
    </>
  ),

  resume: (u) => (
    <>
      <Shadow u={u} rx={30} />
      <rect x="32" y="20" width="72" height="86" rx="14" fill={`url(#${u}d)`} />
      <rect x="24" y="14" width="72" height="86" rx="14" fill={`url(#${u}f)`} {...rim(u)} />
      <circle cx="46" cy="38" r="10" fill={`url(#${u}i)`} stroke="#fff" strokeOpacity=".9" strokeWidth="1.4" />
      <rect x="62" y="32" width="24" height="4" rx="2" fill="#A6A3F6" fillOpacity=".7" />
      <rect x="62" y="41" width="16" height="4" rx="2" fill="#A6A3F6" fillOpacity=".45" />
      <path d="M24 58h72" stroke="#fff" strokeOpacity=".85" strokeWidth="1.4" />
      <path d="M24 60h72" stroke="#8C88EE" strokeOpacity=".3" strokeWidth="1.4" />
      {[68, 78, 88].map((y, i) => (
        <rect key={y} x="36" y={y} width={[48, 40, 30][i]} height="4" rx="2" fill="#A6A3F6" fillOpacity={i ? '.4' : '.6'} />
      ))}
      <Gloss u={u} cx={42} cy={20} rx={12} ry={2.4} />
    </>
  ),

  folder: (u) => (
    <>
      <Shadow u={u} />
      <path d="M16 30a10 10 0 0 1 10-10h20l9 9h40a10 10 0 0 1 10 10v50a10 10 0 0 1-10 10H26a10 10 0 0 1-10-10z" fill={`url(#${u}d)`} />
      <g transform="rotate(-7 62 46)">
        <rect x="32" y="22" width="56" height="54" rx="8" fill="#fff" fillOpacity=".92" />
        <rect x="40" y="32" width="26" height="4" rx="2" fill="#A6A3F6" fillOpacity=".7" />
        <rect x="40" y="41" width="38" height="4" rx="2" fill="#A6A3F6" fillOpacity=".4" />
        <rect x="40" y="50" width="32" height="4" rx="2" fill="#A6A3F6" fillOpacity=".4" />
      </g>
      <path d="M12 50a10 10 0 0 1 10-10h82a10 10 0 0 1 10 10l-4 40a10 10 0 0 1-10 9H26a10 10 0 0 1-10-9z" fill={`url(#${u}f)`} {...rim(u)} />
      <Gloss u={u} cx={38} cy={47} rx={16} ry={3} />
    </>
  ),

  cap: (u) => (
    <>
      <Shadow u={u} cy={106} rx={30} />
      <path d="M32 54v20c0 9 12 15 28 15s28-6 28-15V54L60 66z" fill={`url(#${u}d)`} />
      <path d="M32 58v16c0 9 12 15 28 15" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.4" />
      <polygon points="12,44 60,64 108,44 108,50 60,70 12,50" fill={`url(#${u}d)`} />
      <polygon points="60,22 108,44 60,64 12,44" fill={`url(#${u}f)`} strokeLinejoin="round" {...rim(u)} />
      <path d="M60 44 94 54v20" fill="none" stroke="#fff" strokeOpacity=".95" strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="60" cy="44" rx="6" ry="3.4" fill="#fff" />
      <rect x="89" y="72" width="10" height="16" rx="4" fill={`url(#${u}f)`} {...rim(u, 1.2)} />
      <Gloss u={u} cx={48} cy={34} rx={12} ry={2.6} r={-24} />
    </>
  ),

  calendar: (u) => (
    <>
      <Shadow u={u} />
      <rect x="22" y="32" width="84" height="72" rx="16" fill={`url(#${u}d)`} />
      <rect x="16" y="27" width="84" height="72" rx="16" fill={`url(#${u}f)`} {...rim(u)} />
      <path d="M16 50h84" stroke="#fff" strokeOpacity=".85" strokeWidth="1.4" />
      <path d="M16 52h84" stroke="#8C88EE" strokeOpacity=".3" strokeWidth="1.4" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect key={`${r}${c}`} x={27 + c * 17} y={60 + r * 12} width="11" height="7" rx="3"
            fill={r === 1 && c === 2 ? '#fff' : `url(#${u}i)`} />
        ))
      )}
      {[36, 72].map((x) => (
        <rect key={x} x={x} y="15" width="10" height="22" rx="5" fill={`url(#${u}f)`} {...rim(u, 1.3)} />
      ))}
      <Gloss u={u} cx={40} cy={34} rx={14} ry={2.6} />
    </>
  ),

  users: (u) => (
    <>
      <Shadow u={u} rx={40} />
      <circle cx="82" cy="40" r="15" fill={`url(#${u}d)`} />
      <path d="M58 98c0-20 11-32 26-32s26 12 26 32z" fill={`url(#${u}d)`} />
      <circle cx="48" cy="38" r="18" fill={`url(#${u}f)`} {...rim(u)} />
      <path d="M14 102c0-24 14-38 34-38s34 14 34 38z" fill={`url(#${u}f)`} {...rim(u)} />
      <Gloss u={u} cx={42} cy={28} rx={7} ry={3} r={-30} />
      <Gloss u={u} cx={34} cy={76} rx={9} ry={2.4} r={-40} />
    </>
  ),

  building: (u) => (
    <>
      <Shadow u={u} rx={40} />
      <rect x="70" y="47" width="38" height="57" rx="9" fill={`url(#${u}d)`} />
      <rect x="64" y="42" width="38" height="57" rx="9" fill={`url(#${u}f)`} {...rim(u)} />
      {[54, 68, 82].map((y) => <rect key={y} x="80" y={y} width="12" height="7" rx="3" fill={`url(#${u}i)`} />)}
      <rect x="26" y="22" width="48" height="82" rx="11" fill={`url(#${u}d)`} />
      <rect x="20" y="17" width="48" height="82" rx="11" fill={`url(#${u}f)`} {...rim(u)} />
      {[30, 44, 58].map((y) =>
        [30, 47].map((x) => (
          <rect key={`${x}${y}`} x={x} y={y} width="11" height="8" rx="3" fill={x === 47 && y === 44 ? '#fff' : `url(#${u}i)`} />
        ))
      )}
      <rect x="36" y="76" width="16" height="23" rx="5" fill="#fff" fillOpacity=".9" />
      <Gloss u={u} cx={34} cy={24} rx={9} ry={2.4} />
    </>
  ),

  grid: (u) => (
    <>
      <Shadow u={u} />
      {[[16, 16], [64, 16], [16, 64], [64, 64]].map(([x, y]) => (
        <rect key={`d${x}${y}`} x={x + 5} y={y + 5} width="40" height="40" rx="12" fill={`url(#${u}d)`} />
      ))}
      {[[16, 16], [64, 16], [16, 64], [64, 64]].map(([x, y]) => (
        <rect key={`f${x}${y}`} x={x} y={y} width="40" height="40" rx="12" fill={x === 64 && y === 16 ? '#fff' : `url(#${u}f)`}
          fillOpacity={x === 64 && y === 16 ? '.92' : undefined} {...rim(u)} />
      ))}
      <Gloss u={u} cx={30} cy={23} rx={8} ry={2.4} />
      <Gloss u={u} cx={30} cy={71} rx={8} ry={2.4} />
    </>
  ),

  plane: (u) => (
    <>
      <Shadow u={u} cx={58} rx={36} />
      <path d="M17 62 109 25 89 101 63 83z" fill={`url(#${u}d)`} />
      <path d="M12 57 104 20 84 96 58 78z" fill={`url(#${u}f)`} strokeLinejoin="round" {...rim(u)} />
      <path d="M58 78 104 20 46 72z" fill={`url(#${u}i)`} />
      <path d="M46 72 50 98 58 78z" fill={`url(#${u}d)`} stroke="#fff" strokeOpacity=".8" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M46 72 104 20" stroke="#fff" strokeOpacity=".9" strokeWidth="1.4" strokeLinecap="round" />
      <Gloss u={u} cx={40} cy={50} rx={14} ry={2.6} r={-22} />
    </>
  ),
}

export default function GlassIcon({ name, size = 64, tone = 'glass', className = '', style }) {
  const u = 'g' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const render = ICONS[name] || ICONS.briefcase
  return (
    <svg className={`glass-ico glass-ico--${tone} ${className}`} style={style} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <Defs u={u} tone={tone} />
      {render(u)}
    </svg>
  )
}
