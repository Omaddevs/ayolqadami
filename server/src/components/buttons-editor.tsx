'use client'
// Telegram post tugmalari muharriri: qo'shish, o'chirish, tartib, rang — va jonli ko'rinish.
// Natija yashirin maydonda "Matn | havola | rang" qatorlari ko'rinishida yuboriladi (lib/telegram/format.ts parseChannelButtons).
import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'

type Color = '' | 'blue' | 'red' | 'green'
type Row = { text: string; url: string; color: Color }
export type BtnRow = Row

// Telegram faqat shu ranglarni qo'llaydi (InlineKeyboardButton.style: primary / danger / success)
export const TG_COLORS: { id: Color; label: string; bg: string }[] = [
  { id: '', label: 'Oddiy', bg: '#5b6b7a' },
  { id: 'blue', label: "Ko'k", bg: '#3b7a99' },
  { id: 'red', label: 'Qizil', bg: '#a14b40' },
  { id: 'green', label: 'Yashil', bg: '#3e7b2f' },
]
const COLOR_ALIASES: Record<string, Color> = { blue: 'blue', "ko'k": 'blue', primary: 'blue', red: 'red', qizil: 'red', danger: 'red', green: 'green', yashil: 'green', success: 'green' }

function parse(src: string): Row[] {
  return src.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => {
    const [text = '', url = '', color = ''] = l.split('|').map((s) => s.trim())
    return { text, url, color: COLOR_ALIASES[color.toLowerCase()] ?? '' }
  })
}
const serialize = (rows: Row[]) =>
  rows.filter((r) => r.text.trim()).map((r) => [r.text, r.url, r.color].map((s) => s.replace(/\|/g, '/').trim()).join(' | ')).join('\n')

// @kanal, t.me/... ham bo'ladi — serverda https://t.me/... ga aylantiriladi (format.ts normalizeButtonUrl)
const urlOk = (u: string) => /^(https?:\/\/|tg:\/\/)\S+$/.test(u) || /^\{(post|site|job|bot)\}\S*$/.test(u) || /^@[A-Za-z0-9_]{4,64}$/.test(u) || /^(t\.me|telegram\.me|www\.)\S+$/i.test(u)

// Telegram'dagi ko'rinish: har tugma alohida qatorda, to'liq kenglikda
export function TgKeyboard({ rows }: { rows: Row[] }) {
  const shown = rows.filter((r) => r.text.trim())
  if (!shown.length) return null
  return (
    <div className="tg-kb">
      {shown.map((r, i) => (
        <div key={i} className="tg-kb-btn" style={{ background: TG_COLORS.find((c) => c.id === r.color)!.bg, opacity: urlOk(r.url) ? 1 : 0.45 }}>
          {r.text}<span className="tg-kb-arrow">↗</span>
        </div>
      ))}
    </div>
  )
}

export function ButtonsEditor({ name, defaultValue, max = 8, preview = true, onChange }: {
  name: string; defaultValue: string; max?: number; preview?: boolean; onChange?: (rows: Row[]) => void
}) {
  const [rows, setRows] = useState<Row[]>(() => parse(defaultValue))
  useEffect(() => onChange?.(rows), [rows]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const move = (i: number, d: -1 | 1) => setRows((rs) => {
    const next = [...rs]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    return next
  })

  return (
    <div className="btn-editor">
      <input type="hidden" name={name} value={serialize(rows)} />
      <div className="btn-editor-list">
        {rows.map((r, i) => (
          <div key={i} className="btn-editor-row">
            <div className="btn-editor-fields">
              <input className="input" value={r.text} onChange={(e) => set(i, { text: e.target.value })} maxLength={64} placeholder="Tugma matni, masalan: 📢 E'lon joylash" aria-label="Tugma matni" />
              <input className={`input${r.url && !urlOk(r.url) ? ' invalid' : ''}`} value={r.url} onChange={(e) => set(i, { url: e.target.value.trim() })}
                maxLength={500} placeholder="https://…, @kanal yoki {post}, {site}" aria-label="Havola" spellCheck={false} />
            </div>
            <div className="btn-editor-tools">
              <div className="swatches" role="radiogroup" aria-label="Rang">
                {TG_COLORS.map((c) => (
                  <button key={c.id || 'none'} type="button" role="radio" aria-checked={r.color === c.id} title={c.label}
                    className={`swatch${r.color === c.id ? ' on' : ''}`} style={{ background: c.bg }} onClick={() => set(i, { color: c.id })} />
                ))}
              </div>
              <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} title="Yuqoriga"><ArrowUp size={15} /></button>
              <button type="button" className="icon-btn" onClick={() => move(i, 1)} disabled={i === rows.length - 1} title="Pastga"><ArrowDown size={15} /></button>
              <button type="button" className="icon-btn danger" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} title="O'chirish"><Trash2 size={15} /></button>
            </div>
            {!r.url && <small className="btn-editor-hint">Havolasi bo&apos;sh tugma postda chiqmaydi</small>}
            {r.url && !urlOk(r.url) && <small className="btn-editor-hint err">Havola https://, @kanal yoki t.me/... bo&apos;lishi kerak</small>}
          </div>
        ))}
      </div>
      {rows.length < max && (
        <button type="button" className="btn" onClick={() => setRows((rs) => [...rs, { text: '', url: '', color: 'blue' }])}>
          <Plus size={15} /> Tugma qo&apos;shish
        </button>
      )}
      {preview && rows.some((r) => r.text.trim()) && (
        <div className="tg-preview tg-dark"><TgKeyboard rows={rows} /></div>
      )}
    </div>
  )
}
