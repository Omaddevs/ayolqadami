import { useId } from 'react'

/*
 * 3D uslubdagi SVG ikonkalar.
 * Har bir ikonka: hajm beruvchi gradientlar + yaltiroq (gloss) qatlam + yerga tushgan yumshoq soya.
 * Ranglar loyiha brendiga mos (binafsha #6366F6 / #4F46E5).
 */

function Defs({ u }) {
  return (
    <defs>
      <linearGradient id={`${u}p`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#B4B7FF" />
        <stop offset=".45" stopColor="#7C7FF8" />
        <stop offset="1" stopColor="#4B44E6" />
      </linearGradient>
      <linearGradient id={`${u}pl`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#D9DBFF" />
        <stop offset="1" stopColor="#8F92FA" />
      </linearGradient>
      <linearGradient id={`${u}pd`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7377F2" />
        <stop offset="1" stopColor="#3730C9" />
      </linearGradient>
      <linearGradient id={`${u}w`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#E3E4FA" />
      </linearGradient>
      <linearGradient id={`${u}s`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F4F5FB" />
        <stop offset=".5" stopColor="#C9CCE0" />
        <stop offset="1" stopColor="#8D91AE" />
      </linearGradient>
      <linearGradient id={`${u}g`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".85" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${u}gold`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFF1B8" />
        <stop offset=".5" stopColor="#FBBF24" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
      <filter id={`${u}b`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.5" />
      </filter>
      <filter id={`${u}b1`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.2" />
      </filter>
    </defs>
  )
}

const Shadow = ({ u, cx = 60, cy = 106, rx = 32, ry = 6, o = 0.28 }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#2A2380" opacity={o} filter={`url(#${u}b)`} />
)

const ICONS = {
  briefcase: (u) => (
    <>
      <Shadow u={u} />
      <path d="M45 36v-7a9 9 0 0 1 9-9h12a9 9 0 0 1 9 9v7" fill="none" stroke={`url(#${u}pd)`} strokeWidth="7" strokeLinecap="round" />
      <rect x="16" y="38" width="88" height="62" rx="15" fill={`url(#${u}pd)`} />
      <rect x="16" y="34" width="88" height="62" rx="15" fill={`url(#${u}p)`} />
      <path d="M16 56c14 8 30 11 44 11s30-3 44-11" fill="none" stroke="#3B34D0" strokeOpacity=".35" strokeWidth="2" />
      <rect x="51" y="58" width="18" height="15" rx="5" fill={`url(#${u}w)`} />
      <rect x="55" y="62" width="10" height="3" rx="1.5" fill="#8F92FA" />
      <rect x="24" y="39" width="56" height="7" rx="3.5" fill={`url(#${u}g)`} opacity=".7" />
    </>
  ),

  folder: (u) => (
    <>
      <Shadow u={u} />
      <path d="M14 34a9 9 0 0 1 9-9h21l9 9h44a9 9 0 0 1 9 9v46a9 9 0 0 1-9 9H23a9 9 0 0 1-9-9z" fill={`url(#${u}pd)`} />
      <g transform="rotate(-8 60 50)">
        <rect x="30" y="20" width="58" height="56" rx="7" fill="#fff" />
        <rect x="38" y="30" width="30" height="4" rx="2" fill="#C7C9FB" />
        <rect x="38" y="39" width="40" height="4" rx="2" fill="#E1E2FD" />
        <rect x="38" y="48" width="36" height="4" rx="2" fill="#E1E2FD" />
      </g>
      <path d="M12 52a9 9 0 0 1 9-9h78a9 9 0 0 1 9 9l-3 37a10 10 0 0 1-10 9H25a10 10 0 0 1-10-9z" fill={`url(#${u}pl)`} opacity=".93" />
      <path d="M20 48h80" stroke="#fff" strokeOpacity=".8" strokeWidth="3" strokeLinecap="round" />
      <rect x="22" y="54" width="44" height="6" rx="3" fill="#fff" opacity=".35" />
    </>
  ),

  cap: (u) => (
    <>
      <Shadow u={u} cy={104} rx={28} />
      <path d="M33 55v20c0 9 12 15 27 15s27-6 27-15V55z" fill={`url(#${u}pd)`} />
      <path d="M33 62c6 6 16 9 27 9s21-3 27-9" fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="3" />
      <polygon points="60,33 108,52 60,73 12,52" fill="#3B34D0" transform="translate(0 5)" />
      <polygon points="60,30 108,49 60,70 12,49" fill={`url(#${u}pl)`} />
      <polygon points="60,34 98,49 60,40 24,49" fill="#fff" opacity=".35" />
      <ellipse cx="60" cy="49" rx="5" ry="3" fill={`url(#${u}gold)`} />
      <path d="M60 49 92 58v18" fill="none" stroke={`url(#${u}gold)`} strokeWidth="3" strokeLinecap="round" />
      <path d="M88 76h8l2 12h-12z" fill={`url(#${u}gold)`} />
    </>
  ),

  calendar: (u) => (
    <>
      <Shadow u={u} />
      <rect x="18" y="30" width="84" height="72" rx="15" fill="#B9BBF5" />
      <rect x="18" y="26" width="84" height="72" rx="15" fill={`url(#${u}w)`} />
      <path d="M18 41a15 15 0 0 1 15-15h54a15 15 0 0 1 15 15v9H18z" fill={`url(#${u}p)`} />
      <rect x="24" y="30" width="44" height="5" rx="2.5" fill="#fff" opacity=".4" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect key={`${r}${c}`} x={29 + c * 17} y={58 + r * 12} width="11" height="7" rx="3"
            fill={r === 1 && c === 2 ? '#6366F6' : '#D9DAFB'} />
        ))
      )}
      <rect x="36" y="14" width="10" height="22" rx="5" fill={`url(#${u}s)`} />
      <rect x="74" y="14" width="10" height="22" rx="5" fill={`url(#${u}s)`} />
    </>
  ),

  sparkle: (u) => (
    <>
      <Shadow u={u} cy={108} rx={26} />
      <path d="M58 16c4 26 12 36 38 42-26 6-34 16-38 42-4-26-12-36-38-42 26-6 34-16 38-42z" fill="#3B34D0" transform="translate(3 4)" />
      <path d="M58 16c4 26 12 36 38 42-26 6-34 16-38 42-4-26-12-36-38-42 26-6 34-16 38-42z" fill={`url(#${u}p)`} />
      <path d="M58 26c3 18 8 25 22 30-14-2-19 2-22 4-3-2-8-6-22-4 14-5 19-12 22-30z" fill={`url(#${u}g)`} opacity=".75" />
      <path d="M94 14c1.6 9 4 12 12 14-8 2-10.4 5-12 14-1.6-9-4-12-12-14 8-2 10.4-5 12-14z" fill={`url(#${u}gold)`} />
      <circle cx="26" cy="26" r="5" fill={`url(#${u}pl)`} />
    </>
  ),

  books: (u) => {
    const book = (y, w, x, rot, from, to, k) => (
      <g transform={`rotate(${rot} 60 ${y + 9})`} key={k}>
        <rect x={x} y={y + 3} width={w} height="18" rx="4" fill="#3730C9" />
        <rect x={x} y={y} width={w} height="18" rx="4" fill={`url(#${u}${from})`} />
        <rect x={x + w - 14} y={y + 3} width="11" height="12" rx="2" fill="#F5F5FF" />
        <path d={`M${x + w - 13} ${y + 7}h9M${x + w - 13} ${y + 11}h9`} stroke="#CFD1F5" strokeWidth="1.2" />
        <rect x={x + 6} y={y + 3} width={w * 0.45} height="3.5" rx="1.75" fill="#fff" opacity=".35" />
      </g>
    )
    return (
      <>
        <Shadow u={u} cy={106} rx={40} />
        {book(78, 82, 18, 0, 'pd', '', 1)}
        {book(58, 76, 24, -3, 'p', '', 2)}
        {book(38, 70, 22, 4, 'pl', '', 3)}
        {book(18, 64, 30, -5, 'p', '', 4)}
      </>
    )
  },

  plus: (u) => {
    const d = 'M48 14h24a8 8 0 0 1 8 8v26h26a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8H80v26a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8V88H14a8 8 0 0 1-8-8V56a8 8 0 0 1 8-8h26V22a8 8 0 0 1 8-8z'
    return (
      <g transform="translate(6 0) scale(.88)">
        <Shadow u={u} cy={122} rx={44} ry={7} />
        <path d={d} fill="#3D36C8" transform="translate(7 8)" />
        <path d={d} fill={`url(#${u}p)`} />
        <path d="M50 20h20a4 4 0 0 1 4 4v10H46V24a4 4 0 0 1 4-4z" fill="#fff" opacity=".5" />
        <path d="M12 56a4 4 0 0 1 4-4h20v8H12z" fill="#fff" opacity=".35" />
      </g>
    )
  },

  resume: (u) => (
    <>
      <Shadow u={u} />
      <rect x="26" y="18" width="70" height="86" rx="12" fill="#A9ABF2" transform="translate(4 4)" />
      <rect x="24" y="14" width="70" height="86" rx="12" fill={`url(#${u}w)`} />
      <circle cx="45" cy="38" r="11" fill={`url(#${u}p)`} />
      <circle cx="45" cy="35" r="4" fill="#fff" opacity=".9" />
      <path d="M38 45a8 6 0 0 1 14 0" fill="#fff" opacity=".9" />
      <rect x="61" y="31" width="24" height="5" rx="2.5" fill="#8F92FA" />
      <rect x="61" y="41" width="18" height="4" rx="2" fill="#D3D4FB" />
      {[60, 70, 80].map((y, i) => (
        <rect key={y} x="34" y={y} width={i === 2 ? 34 : 50} height="5" rx="2.5" fill="#E2E3FC" />
      ))}
      <g transform="rotate(38 88 78)">
        <rect x="82" y="50" width="12" height="48" rx="3" fill={`url(#${u}gold)`} />
        <rect x="82" y="50" width="12" height="8" rx="3" fill="#F472B6" />
        <path d="M82 98h12l-6 11z" fill="#FDE7C2" />
        <path d="M86 105.5h4l-2 3.5z" fill="#374151" />
      </g>
    </>
  ),

  laptop: (u) => (
    <>
      <Shadow u={u} cy={106} rx={44} />
      <rect x="24" y="22" width="72" height="52" rx="7" fill="#2E2A86" />
      <rect x="29" y="27" width="62" height="42" rx="4" fill={`url(#${u}p)`} />
      <path d="M29 27h36L45 69H29z" fill="#fff" opacity=".18" />
      <rect x="35" y="35" width="22" height="4" rx="2" fill="#fff" opacity=".85" />
      <rect x="35" y="43" width="34" height="3.5" rx="1.75" fill="#fff" opacity=".55" />
      <rect x="35" y="50" width="28" height="3.5" rx="1.75" fill="#fff" opacity=".55" />
      <path d="M12 76h96l-5 12a8 8 0 0 1-7.4 5H24.4A8 8 0 0 1 17 88z" fill={`url(#${u}s)`} />
      <path d="M12 76h96l-1 3H13z" fill="#fff" opacity=".8" />
      <rect x="50" y="77" width="20" height="4" rx="2" fill="#A3A7C4" />
    </>
  ),

  stethoscope: (u) => (
    <>
      <Shadow u={u} cx={70} cy={106} rx={30} />
      <path d="M38 22c-6 22 2 38 19 40 17-2 25-18 19-40" fill="none" stroke="#3730C9" strokeWidth="8" strokeLinecap="round" transform="translate(1.5 2)" />
      <path d="M38 22c-6 22 2 38 19 40 17-2 25-18 19-40" fill="none" stroke={`url(#${u}p)`} strokeWidth="7" strokeLinecap="round" />
      <path d="M57 62c0 20-3 36 14 36 14 0 14-12 14-22" fill="none" stroke={`url(#${u}pd)`} strokeWidth="7" strokeLinecap="round" />
      <path d="M40 24c-3 14-1 24 6 31" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
      <circle cx="38" cy="19" r="5.5" fill={`url(#${u}s)`} />
      <circle cx="76" cy="19" r="5.5" fill={`url(#${u}s)`} />
      <circle cx="85" cy="68" r="15" fill={`url(#${u}s)`} />
      <circle cx="85" cy="68" r="9.5" fill={`url(#${u}pd)`} />
      <circle cx="85" cy="68" r="5" fill={`url(#${u}pl)`} />
      <ellipse cx="80" cy="60" rx="5" ry="2.5" fill="#fff" opacity=".8" />
    </>
  ),

  // qopqoqli idish (restoran)
  cloche: (u) => (
    <>
      <Shadow u={u} cy={106} rx={40} />
      {/* tovoq */}
      <ellipse cx="60" cy="90" rx="48" ry="11" fill={`url(#${u}pd)`} />
      <ellipse cx="60" cy="86" rx="48" ry="10" fill={`url(#${u}pl)`} />
      <ellipse cx="60" cy="85" rx="38" ry="6" fill="#fff" opacity=".35" />
      {/* qopqoq */}
      <path d="M18 84c0-26 19-44 42-44s42 18 42 44z" fill={`url(#${u}p)`} />
      <path d="M18 84c0-3 .3-6 .9-9h82.2c.6 3 .9 6 .9 9z" fill={`url(#${u}pd)`} opacity=".55" />
      <path d="M30 70c3-12 12-20 24-22" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".55" />
      {/* tutqich */}
      <rect x="55" y="31" width="10" height="11" rx="3" fill={`url(#${u}pd)`} />
      <circle cx="60" cy="29" r="8" fill={`url(#${u}w)`} />
      <circle cx="57.5" cy="26.5" r="2.5" fill="#fff" />
    </>
  ),
  apple: (u) => (
    <>
      <Shadow u={u} cy={108} rx={30} />
      <defs>
        <radialGradient id={`${u}ap`} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#FFB3C1" />
          <stop offset=".45" stopColor="#F43F5E" />
          <stop offset="1" stopColor="#9F1239" />
        </radialGradient>
        <linearGradient id={`${u}lf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#86EFAC" />
          <stop offset="1" stopColor="#15803D" />
        </linearGradient>
      </defs>
      <path d="M60 38c-12-10-40-8-40 22 0 26 18 42 31 42 4 0 6-2 9-2s5 2 9 2c13 0 31-16 31-42 0-30-28-32-40-22z" fill={`url(#${u}ap)`} />
      <path d="M58 38c0-8 2-16 6-22" fill="none" stroke="#7C4A1E" strokeWidth="4" strokeLinecap="round" />
      <path d="M64 28c6-12 18-14 26-10-4 10-16 14-26 10z" fill={`url(#${u}lf)`} />
      <ellipse cx="38" cy="54" rx="7" ry="11" fill="#fff" opacity=".45" transform="rotate(20 38 54)" />
    </>
  ),

  spool: (u) => (
    <>
      <Shadow u={u} cy={108} rx={30} />
      <defs>
        <linearGradient id={`${u}wd`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FDE7C8" />
          <stop offset="1" stopColor="#C68A52" />
        </linearGradient>
        <linearGradient id={`${u}th`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5B54E8" />
          <stop offset=".4" stopColor="#A5A8FF" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      <ellipse cx="54" cy="92" rx="30" ry="10" fill="#A86B37" />
      <ellipse cx="54" cy="88" rx="30" ry="10" fill={`url(#${u}wd)`} />
      <rect x="32" y="34" width="44" height="54" fill={`url(#${u}th)`} />
      {[40, 46, 52, 58, 64, 70, 76, 82].map((y) => (
        <path key={y} d={`M32 ${y}q22 4 44 0`} fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1.4" />
      ))}
      <ellipse cx="54" cy="32" rx="30" ry="10" fill={`url(#${u}wd)`} />
      <ellipse cx="54" cy="32" rx="8" ry="3" fill="#8B5A2B" />
      <path d="M76 60c14 2 22 12 20 26" fill="none" stroke="#7C7FF8" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M100 16 74 70" stroke={`url(#${u}s)`} strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="98" cy="20" rx="2" ry="4" fill="none" stroke="#6B7280" strokeWidth="1.4" transform="rotate(27 98 20)" />
    </>
  ),

  bag: (u) => (
    <>
      <Shadow u={u} />
      <defs>
        <linearGradient id={`${u}pk`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBCFE8" />
          <stop offset=".5" stopColor="#F472B6" />
          <stop offset="1" stopColor="#BE185D" />
        </linearGradient>
      </defs>
      <path d="M44 44V34a16 16 0 0 1 32 0v10" fill="none" stroke={`url(#${u}pd)`} strokeWidth="6" strokeLinecap="round" />
      <path d="M22 40h76l-5 54a10 10 0 0 1-10 9H37a10 10 0 0 1-10-9z" fill="#9D174D" transform="translate(3 3)" />
      <path d="M22 40h76l-5 54a10 10 0 0 1-10 9H37a10 10 0 0 1-10-9z" fill={`url(#${u}pk)`} />
      <path d="M28 46h22l-3 46h-14z" fill="#fff" opacity=".22" />
      <circle cx="44" cy="52" r="4" fill="#831843" />
      <circle cx="76" cy="52" r="4" fill="#831843" />
      <path d="M44 52v-6M76 52v-6" stroke={`url(#${u}pd)`} strokeWidth="6" strokeLinecap="round" />
    </>
  ),

  lipstick: (u) => (
    <>
      <Shadow u={u} cy={108} rx={22} />
      <defs>
        <linearGradient id={`${u}lp`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#BE123C" />
          <stop offset=".35" stopColor="#FB7185" />
          <stop offset="1" stopColor="#9F1239" />
        </linearGradient>
        <linearGradient id={`${u}gh`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B45309" />
          <stop offset=".35" stopColor="#FDE68A" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <path d="M48 46V26c0-6 10-14 24-16v36z" fill={`url(#${u}lp)`} />
      <rect x="45" y="44" width="30" height="16" rx="3" fill={`url(#${u}gh)`} />
      <rect x="40" y="58" width="40" height="46" rx="7" fill={`url(#${u}pd)`} />
      <rect x="40" y="58" width="40" height="46" rx="7" fill={`url(#${u}p)`} opacity=".85" />
      <rect x="45" y="62" width="7" height="38" rx="3.5" fill="#fff" opacity=".35" />
    </>
  ),

  coins: (u) => {
    const coin = (y, k) => (
      <g key={k}>
        <ellipse cx="54" cy={y + 6} rx="30" ry="10" fill="#B45309" />
        <rect x="24" y={y} width="60" height="6" fill="#D97706" />
        <ellipse cx="54" cy={y} rx="30" ry="10" fill={`url(#${u}gold)`} />
        <ellipse cx="54" cy={y} rx="20" ry="6" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
      </g>
    )
    return (
      <>
        <Shadow u={u} cy={108} rx={38} />
        {[92, 80, 68, 56].map((y, i) => coin(y, i))}
        <g transform="rotate(14 90 52)">
          <circle cx="90" cy="52" r="22" fill="#B45309" />
          <circle cx="88" cy="50" r="22" fill={`url(#${u}gold)`} />
          <circle cx="88" cy="50" r="15" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2.5" />
          <path d="M88 40v20M82 45h9a4 4 0 0 1 0 8h-6a4 4 0 0 0 0 8h9" fill="none" stroke="#92400E" strokeWidth="2.6" strokeLinecap="round" transform="translate(0 -5) scale(1 .85) translate(0 6)" />
        </g>
      </>
    )
  },

  palette: (u) => (
    <>
      <Shadow u={u} />
      <defs>
        <linearGradient id={`${u}pt`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF7ED" />
          <stop offset="1" stopColor="#E8C9A6" />
        </linearGradient>
      </defs>
      <path d="M60 16C32 16 12 36 12 60c0 22 16 40 38 40 10 0 10-8 6-14-4-6 0-12 8-12h14c18 0 30-10 30-26 0-18-20-32-48-32z" fill="#C79A6A" transform="translate(3 4)" />
      <path d="M60 16C32 16 12 36 12 60c0 22 16 40 38 40 10 0 10-8 6-14-4-6 0-12 8-12h14c18 0 30-10 30-26 0-18-20-32-48-32z" fill={`url(#${u}pt)`} />
      <circle cx="34" cy="50" r="8" fill="#6366F6" />
      <circle cx="50" cy="32" r="8" fill="#F472B6" />
      <circle cx="74" cy="32" r="8" fill="#FBBF24" />
      <circle cx="34" cy="74" r="8" fill="#34D399" />
      {[[34, 50], [50, 32], [74, 32], [34, 74]].map(([x, y]) => (
        <circle key={x + y} cx={x - 2.5} cy={y - 2.5} r="2.5" fill="#fff" opacity=".7" />
      ))}
    </>
  ),

  building: (u) => (
    <>
      <Shadow u={u} cy={108} rx={42} />
      <rect x="64" y="46" width="40" height="58" rx="7" fill={`url(#${u}pl)`} />
      <rect x="18" y="16" width="52" height="88" rx="9" fill="#3730C9" transform="translate(3 2)" />
      <rect x="18" y="16" width="52" height="88" rx="9" fill={`url(#${u}p)`} />
      {[0, 1, 2, 3].map((r) =>
        [0, 1].map((c) => (
          <rect key={`${r}${c}`} x={28 + c * 18} y={28 + r * 15} width="12" height="9" rx="2.5" fill="#fff" opacity={r === 1 && c === 1 ? 0.95 : 0.55} />
        ))
      )}
      <rect x="36" y="88" width="16" height="16" rx="3" fill="#2E2A86" />
      {[0, 1, 2].map((r) => (
        <rect key={r} x="74" y={56 + r * 13} width="20" height="7" rx="2.5" fill="#fff" opacity=".7" />
      ))}
      <rect x="22" y="20" width="8" height="70" rx="4" fill="#fff" opacity=".2" />
    </>
  ),

  woman: (u) => (
    <>
      <Shadow u={u} cy={108} rx={34} />
      <defs>
        <radialGradient id={`${u}sk`} cx=".4" cy=".35" r=".7">
          <stop offset="0" stopColor="#FFE4D6" />
          <stop offset="1" stopColor="#E9A98B" />
        </radialGradient>
        <linearGradient id={`${u}hr`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7C5A4A" />
          <stop offset="1" stopColor="#3B2620" />
        </linearGradient>
      </defs>
      <path d="M22 104c0-24 17-38 38-38s38 14 38 38z" fill={`url(#${u}pd)`} />
      <path d="M22 104c0-24 17-38 38-38s38 14 38 38z" fill={`url(#${u}p)`} opacity=".9" />
      <path d="M50 68l10 14 10-14" fill="#fff" opacity=".85" />
      <circle cx="60" cy="20" r="10" fill={`url(#${u}hr)`} />
      <path d="M36 46c0-16 10-26 24-26s24 10 24 26c0 14-4 22-6 26H42c-2-4-6-12-6-26z" fill={`url(#${u}hr)`} />
      <ellipse cx="60" cy="46" rx="16" ry="19" fill={`url(#${u}sk)`} />
      <path d="M44 42c4-10 12-14 22-12 6 2 10 6 10 12-10-2-20-4-32 0z" fill={`url(#${u}hr)`} />
      <circle cx="53" cy="48" r="1.8" fill="#3B2620" />
      <circle cx="67" cy="48" r="1.8" fill="#3B2620" />
      <path d="M55 56q5 4 10 0" fill="none" stroke="#C2410C" strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="48" cy="54" rx="3" ry="2" fill="#FB7185" opacity=".35" />
      <ellipse cx="72" cy="54" rx="3" ry="2" fill="#FB7185" opacity=".35" />
    </>
  ),

  users: (u) => (
    <>
      <Shadow u={u} cy={108} rx={44} />
      <circle cx="80" cy="40" r="15" fill={`url(#${u}pl)`} />
      <path d="M56 98c0-20 11-32 26-32s26 12 26 32z" fill={`url(#${u}pl)`} />
      <circle cx="48" cy="40" r="18" fill="#3730C9" transform="translate(2 2)" />
      <circle cx="48" cy="40" r="18" fill={`url(#${u}p)`} />
      <ellipse cx="42" cy="32" rx="7" ry="4" fill="#fff" opacity=".5" />
      <path d="M14 104c0-24 14-38 34-38s34 14 34 38z" fill={`url(#${u}p)`} />
      <path d="M22 98c2-14 10-24 22-26" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" />
    </>
  ),

  bell: (u) => (
    <>
      <Shadow u={u} cy={108} rx={30} />
      <path d="M60 18c-18 0-30 14-30 32v20l-8 14h76l-8-14V50c0-18-12-32-30-32z" fill={`url(#${u}p)`} />
      <rect x="18" y="80" width="84" height="12" rx="6" fill={`url(#${u}pd)`} />
      <circle cx="60" cy="98" r="9" fill={`url(#${u}gold)`} />
      <path d="M42 34c4-6 10-9 16-9" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="4" strokeLinecap="round" />
    </>
  ),

  // enaga: chaqaloq shishasi
  bottle: (u) => (
    <>
      <Shadow u={u} cy={110} rx={26} />
      <path d="M50 14h20l2 14H48z" fill="#F472B6" />
      <rect x="44" y="26" width="32" height="10" rx="4" fill={`url(#${u}pd)`} />
      <rect x="40" y="34" width="40" height="72" rx="14" fill="#3730C9" transform="translate(2 2)" />
      <rect x="40" y="34" width="40" height="72" rx="14" fill={`url(#${u}w)`} />
      <path d="M40 66h40v26a14 14 0 0 1-14 14H54a14 14 0 0 1-14-14z" fill={`url(#${u}pl)`} />
      {[0, 1, 2].map((r) => <rect key={r} x="64" y={46 + r * 12} width="10" height="3" rx="1.5" fill="#7C7FF8" opacity=".8" />)}
      <rect x="45" y="40" width="6" height="56" rx="3" fill="#fff" opacity=".6" />
    </>
  ),
  // uy xizmatchisi: uy
  house: (u) => (
    <>
      <Shadow u={u} cy={108} rx={40} />
      <rect x="24" y="52" width="72" height="52" rx="8" fill="#3730C9" transform="translate(3 2)" />
      <rect x="24" y="52" width="72" height="52" rx="8" fill={`url(#${u}w)`} />
      <path d="M14 58 60 18l46 40c3 3 0 8-4 6L60 30 18 64c-4 2-7-3-4-6z" fill={`url(#${u}p)`} />
      <rect x="78" y="22" width="12" height="22" rx="3" fill={`url(#${u}pd)`} />
      <rect x="50" y="72" width="20" height="32" rx="5" fill={`url(#${u}p)`} />
      <circle cx="65" cy="88" r="2" fill="#fff" />
      <rect x="32" y="66" width="12" height="12" rx="3" fill={`url(#${u}pl)`} />
      <rect x="76" y="66" width="12" height="12" rx="3" fill={`url(#${u}pl)`} />
      <path d="M30 50 58 26" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".45" />
    </>
  ),
  // tozalik: purkagich + pufakchalar
  spray: (u) => (
    <>
      <Shadow u={u} cy={110} rx={30} />
      <path d="M40 20h30l14 8-4 6-12-4H40z" fill={`url(#${u}pd)`} />
      <rect x="44" y="30" width="22" height="14" rx="3" fill={`url(#${u}p)`} />
      <path d="M38 44h34c6 0 10 6 10 12v42a8 8 0 0 1-8 8H36a8 8 0 0 1-8-8V58c0-8 4-14 10-14z" fill="#3730C9" transform="translate(2 2)" />
      <path d="M38 44h34c6 0 10 6 10 12v42a8 8 0 0 1-8 8H36a8 8 0 0 1-8-8V58c0-8 4-14 10-14z" fill={`url(#${u}p)`} />
      <rect x="36" y="64" width="38" height="24" rx="5" fill={`url(#${u}w)`} />
      <path d="M44 76h22" stroke="#7C7FF8" strokeWidth="3" strokeLinecap="round" />
      <rect x="33" y="50" width="6" height="48" rx="3" fill="#fff" opacity=".3" />
      <circle cx="96" cy="24" r="8" fill={`url(#${u}w)`} stroke="#B4B7FF" strokeWidth="2" />
      <circle cx="104" cy="42" r="5" fill={`url(#${u}w)`} stroke="#B4B7FF" strokeWidth="2" />
      <circle cx="94" cy="54" r="4" fill={`url(#${u}w)`} stroke="#B4B7FF" strokeWidth="2" />
    </>
  ),
  // oshpaz: qozon + bug'
  pot: (u) => (
    <>
      <Shadow u={u} cy={108} rx={40} />
      <path d="M44 30c-4-6 4-10 0-16M60 30c-4-6 4-10 0-16M76 30c-4-6 4-10 0-16" fill="none" stroke="#B4B7FF" strokeWidth="4" strokeLinecap="round" />
      <rect x="8" y="54" width="18" height="10" rx="5" fill={`url(#${u}pd)`} />
      <rect x="94" y="54" width="18" height="10" rx="5" fill={`url(#${u}pd)`} />
      <path d="M20 48h80v34c0 14-10 22-24 22H44c-14 0-24-8-24-22z" fill="#3730C9" transform="translate(2 2)" />
      <path d="M20 48h80v34c0 14-10 22-24 22H44c-14 0-24-8-24-22z" fill={`url(#${u}p)`} />
      <rect x="16" y="40" width="88" height="12" rx="6" fill={`url(#${u}pl)`} />
      <rect x="52" y="32" width="16" height="10" rx="4" fill={`url(#${u}gold)`} />
      <rect x="28" y="58" width="8" height="34" rx="4" fill="#fff" opacity=".3" />
    </>
  ),
  // parvarishchi: yurak
  heart: (u) => (
    <>
      <Shadow u={u} cy={108} rx={34} />
      <path d="M60 100C24 76 12 58 12 40c0-14 11-24 24-24 10 0 18 6 24 14 6-8 14-14 24-14 13 0 24 10 24 24 0 18-12 36-48 60z" fill="#3730C9" transform="translate(2 3)" />
      <path d="M60 100C24 76 12 58 12 40c0-14 11-24 24-24 10 0 18 6 24 14 6-8 14-14 24-14 13 0 24 10 24 24 0 18-12 36-48 60z" fill={`url(#${u}p)`} />
      <path d="M48 54h8v-8h8v8h8v8h-8v8h-8v-8h-8z" fill={`url(#${u}w)`} />
      <ellipse cx="34" cy="34" rx="10" ry="6" fill="#fff" opacity=".4" transform="rotate(-35 34 34)" />
    </>
  ),
  target: (u) => (
    <>
      <Shadow u={u} cy={108} rx={34} />
      <circle cx="58" cy="60" r="42" fill="#3730C9" transform="translate(2 3)" />
      <circle cx="58" cy="60" r="42" fill={`url(#${u}p)`} />
      <circle cx="58" cy="60" r="30" fill={`url(#${u}w)`} />
      <circle cx="58" cy="60" r="19" fill={`url(#${u}p)`} />
      <circle cx="58" cy="60" r="8" fill={`url(#${u}w)`} />
      <path d="M58 60 96 22" stroke={`url(#${u}gold)`} strokeWidth="5" strokeLinecap="round" />
      <path d="M92 16l12-2-2 12-8 2z" fill="#F472B6" />
      <ellipse cx="40" cy="36" rx="10" ry="5" fill="#fff" opacity=".35" transform="rotate(-30 40 36)" />
    </>
  ),
}

// SVG o'rniga tayyor rasm ishlatiladigan ikonkalar (public/ ichida)
const IMG_ICONS = {
  gradcap: '/kurslar-cap.png',
}

export const ICON_NAMES = [...Object.keys(ICONS), ...Object.keys(IMG_ICONS)]

export default function Icon3D({ name, size = 64, className = '', style }) {
  const u = 'i' + useId().replace(/[^a-zA-Z0-9]/g, '')
  if (IMG_ICONS[name]) {
    return <img src={IMG_ICONS[name]} alt="" aria-hidden="true" className={`icon3d icon3d-img ${className}`}
      style={{ width: size, height: size, ...style }} draggable="false" />
  }
  const render = ICONS[name] || ICONS.sparkle
  return (
    <svg className={`icon3d ${className}`} style={style} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <Defs u={u} />
      {render(u)}
    </svg>
  )
}
