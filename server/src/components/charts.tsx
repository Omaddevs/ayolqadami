// Dashboard grafiklari — tashqi kutubxonasiz, server tomonda SVG sifatida chiziladi.
// Har bir grafikda <title> bor: sichqoncha bilan ustiga kelinganda aniq qiymat ko'rinadi.
import { formatSum } from '@/lib/format'

export type Seg = { label: string; value: number; color: string }

const pct = (v: number, total: number) => (total ? Math.round((v / total) * 100) : 0)

// 1) Gorizontal segmentli chiziq (foydalanuvchilar tarkibi)
export function SegmentBar({ segments, highlight }: { segments: Seg[]; highlight?: number }) {
  const total = segments.reduce((n, s) => n + s.value, 0) || 1
  return (
    <div className="seg">
      <div className="seg-labels">
        {segments.map((s, i) => (
          <span key={s.label} style={{ flex: Math.max(s.value, total * 0.12), minWidth: 0 }}>
            {i === highlight ? <span className="tip-chip">{formatSum(s.value)}</span> : `${pct(s.value, total)}%`}
          </span>
        ))}
      </div>
      <div className="seg-bar" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}>
        {segments.map((s) => (
          <span key={s.label} style={{ flex: Math.max(s.value, total * 0.12), background: s.color }} title={`${s.label}: ${formatSum(s.value)}`} />
        ))}
      </div>
      <div className="legend" style={{ marginTop: 14, justifyContent: 'center' }}>
        {segments.map((s) => <span key={s.label}><i style={{ background: s.color }} />{s.label}</span>)}
      </div>
    </div>
  )
}

// 2) Nuqtali matritsa: har guruh — 8 hafta, ustun balandligi — o'sha haftadagi soni
export function DotMatrix({ groups }: { groups: (Seg & { weeks: number[] })[] }) {
  const ROWS = 5, COLS = 8, R = 2.6, GAP = 7.4, GROUP_GAP = 18
  const max = Math.max(1, ...groups.flatMap((g) => g.weeks))
  const groupW = COLS * GAP
  const W = groups.length * groupW + (groups.length - 1) * GROUP_GAP
  const H = ROWS * GAP
  const total = groups.reduce((n, g) => n + g.value, 0)
  return (
    <div>
      <div className="seg-labels" style={{ marginTop: 18 }}>
        {groups.map((g) => <span key={g.label} style={{ flex: 1 }}>{pct(g.value, total)}%</span>)}
      </div>
      <svg className="chart" viewBox={`-3 -3 ${W + 6} ${H + 2}`} role="img" aria-label="Vakansiyalar holati bo'yicha, so'nggi 8 hafta">
        {groups.map((g, gi) => {
          const x0 = gi * (groupW + GROUP_GAP)
          return (
            <g key={g.label}>
              <title>{`${g.label}: ${g.value}`}</title>
              {g.weeks.slice(-COLS).map((v, c) => {
                const filled = v ? Math.max(1, Math.round((v / max) * ROWS)) : 0
                return (
                  <g key={c} className="dot-col">
                    <title>{`${g.label} — ${COLS - c} hafta oldin: ${v}`}</title>
                    {Array.from({ length: ROWS }, (_, r) => (
                      <circle key={r} cx={x0 + c * GAP + R} cy={H - r * GAP - R} r={R} fill={r < filled ? g.color : '#e6e8ee'} />
                    ))}
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
      <div className="legend" style={{ marginTop: 12, justifyContent: 'center' }}>
        {groups.map((g) => <span key={g.label}><i style={{ background: g.color }} />{g.label}</span>)}
      </div>
    </div>
  )
}

// Silliq egri chiziq (Catmull-Rom → Bezier)
function smooth(pts: [number, number][]) {
  if (pts.length < 2) return ''
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1] || pts[i]
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const [x3, y3] = pts[i + 2] || pts[i + 1]
    d += ` C${x1 + (x2 - x0) / 6},${y1 + (y2 - y0) / 6} ${x2 - (x3 - x1) / 6},${y2 - (y3 - y1) / 6} ${x2},${y2}`
  }
  return d
}

// 3) Chiziqli grafik (so'nggi 7 kun). Chiziq SVG'da kenglikka cho'ziladi, nuqta va yozuvlar HTML —
//    shuning uchun har qanday ekran kengligida matn va nuqtalar bir xil o'lchamda qoladi
export function LineChart({ points, color = 'var(--pink)' }: { points: { label: string; value: number }[]; color?: string }) {
  const PAD = 3 // chetlardan % hisobida
  const max = Math.max(1, ...points.map((p) => p.value)) * 1.15
  const step = (100 - PAD * 2) / Math.max(1, points.length - 1)
  const xy = points.map((p, i) => [PAD + i * step, 100 - (p.value / max) * 88] as [number, number])
  const last = xy[xy.length - 1]
  return (
    <div className="lc" role="img" aria-label={points.map((p) => `${p.label}: ${p.value}`).join(', ')}>
      <div className="lc-plot">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {[25, 50, 75].map((y) => <line key={y} x1={0} x2={100} y1={y} y2={y} stroke="#eceef3" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />)}
          {xy.map(([x], i) => <line key={i} x1={x} x2={x} y1={0} y2={100} stroke="#f1f2f6" vectorEffect="non-scaling-stroke" />)}
          <path d={smooth(xy)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {last && <line x1={last[0]} x2={last[0]} y1={last[1]} y2={100} stroke={color} strokeDasharray="2 3" opacity={0.5} vectorEffect="non-scaling-stroke" />}
        </svg>
        {xy.map(([x, y], i) => (
          <span key={i} className={`lc-dot${i === xy.length - 1 ? ' last' : ''}`} style={{ left: `${x}%`, top: `${y}%`, color }}
            title={`${points[i].label}: ${points[i].value}`} />
        ))}
      </div>
      <div className="lc-x">
        {points.map((p, i) => <span key={i} style={{ left: `${PAD + i * step}%` }}>{p.label}</span>)}
      </div>
    </div>
  )
}

// 4) Ko'zgu ustunlar: tepada — ro'yxatdan o'tganlar, pastda — arizalar (haftalik)
export function WaveBars({ up, down, labels, highlightFrom }: { up: number[]; down: number[]; labels: string[]; highlightFrom: number }) {
  const max = Math.max(1, ...up, ...down)
  return (
    <div>
      <div className="wave" role="img" aria-label="Haftalik ro'yxatdan o'tish va arizalar">
        {up.map((v, i) => {
          const hot = i >= highlightFrom
          return (
            <div key={i} className={`wave-col${hot ? ' hot' : ''}`} title={`${labels[i] || ''} hafta: ${v} ro'yxatdan o'tish, ${down[i]} ariza`}>
              <span className="up" style={{ height: `${Math.max(3, (v / max) * 100)}%` }} />
              <span className="down" style={{ height: `${Math.max(3, (down[i] / max) * 100)}%` }} />
            </div>
          )
        })}
      </div>
      <div className="wave-axis">{[...new Set(labels)].map((l) => <span key={l}>{l}</span>)}</div>
    </div>
  )
}

// 5) Oylik yig'ma ustunlar (faollik oqimi) — HTML/CSS: kenglikka moslashadi, yozuvlar kattalashmaydi.
//    Joriy oy — chiziqli naqsh va qiymatlar oynasi bilan
export function StackedBars({ months, series }: { months: string[]; series: (Seg & { values: number[] })[] }) {
  const totals = months.map((_, i) => series.reduce((n, s) => n + s.values[i], 0))
  const rawMax = Math.max(1, ...totals)
  const mag = Math.pow(10, Math.floor(Math.log10(rawMax)))
  // 5 ga karrali — o'qdagi 6 ta belgi butun sonlar bo'lsin (kichik qiymatlarda 1, 1, 2, 2 kabi takrorlanmasin)
  const max = Math.ceil(Math.ceil((rawMax * 1.1) / mag) * mag / 5) * 5
  const cur = months.length - 1
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1]
  const colW = 100 / months.length
  const curTopPct = (totals[cur] / max) * 100
  return (
    <div className="sb" role="img" aria-label="Oylik faollik: ro'yxatdan o'tish, arizalar, kurslarga yozilish">
      <div className="sb-plot">
        {ticks.map((t) => <i key={t} className={`sb-grid${t ? '' : ' base'}`} style={{ bottom: `${t * 100}%` }} />)}
        <div className="sb-cols">
          {months.map((m, i) => (
            <div key={m} className={`sb-col${i === cur ? ' cur' : ''}`} title={`${m}: ${series.map((s) => `${s.label} ${s.values[i]}`).join(', ')}`}>
              <div className="sb-stack">
                {series.map((s, si) => s.values[i] > 0 && (
                  <span key={si} style={{ height: `${(s.values[i] / max) * 100}%`, ['--c' as string]: s.color }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <span className="sb-mark" style={{ left: `${cur * colW + colW / 2}%`, bottom: `calc(${curTopPct}% + 4px)` }} />
        <div className="sb-tip" style={{ right: `calc(${100 - cur * colW}% + 8px)`, bottom: `min(calc(${curTopPct}% - 20px), calc(100% - 68px))` }}>
          {series.map((s, i) => (
            <div key={i}><span><i style={{ background: s.color }} />{s.label}</span><b>{s.values[cur]}</b></div>
          ))}
        </div>
      </div>
      <div className="sb-y">
        {ticks.map((t) => <span key={t} style={{ bottom: `${t * 100}%` }}>{Math.round(max * t)}</span>)}
      </div>
      <div className="sb-x">{months.map((m) => <span key={m}>{m}</span>)}</div>
    </div>
  )
}

// 6) Halqa diagramma
export function Donut({ segments, center, sub }: { segments: Seg[]; center: string; sub: string }) {
  const R = 58, C = 2 * Math.PI * R, total = segments.reduce((n, s) => n + s.value, 0) || 1
  let off = 0
  return (
    <svg viewBox="0 0 150 150" width="150" height="150" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}>
      <circle cx={75} cy={75} r={R + 9} fill="none" stroke="#f1f2f6" strokeWidth={1} />
      <circle cx={75} cy={75} r={R - 11} fill="none" stroke="#f1f2f6" strokeWidth={1} strokeDasharray="2 3" />
      <g transform="rotate(-90 75 75)">
        {segments.map((s) => {
          const len = (s.value / total) * C
          const el = (
            <circle key={s.label} cx={75} cy={75} r={R} fill="none" stroke={s.color} strokeWidth={14}
              strokeDasharray={`${Math.max(0, len - 3)} ${C}`} strokeDashoffset={-off} strokeLinecap="butt">
              <title>{`${s.label}: ${s.value}`}</title>
            </circle>
          )
          off += len
          return el
        })}
      </g>
      <text x={75} y={73} textAnchor="middle" style={{ fontSize: 17, fontWeight: 700, fill: 'var(--ink)' }}>{center}</text>
      <text x={75} y={90} textAnchor="middle" style={{ fontSize: 10.5, fill: 'var(--muted)' }}>{sub}</text>
    </svg>
  )
}

// 7) Maqsad progressi — nuqtali chiziq
export function DotProgress({ value, color }: { value: number; color: string }) {
  const N = 30, on = Math.round(Math.min(1, Math.max(0, value)) * N)
  return (
    <div className="dots" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      {Array.from({ length: N }, (_, i) => <i key={i} style={i < on ? { background: color } : undefined} />)}
    </div>
  )
}
