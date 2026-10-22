'use client'
// Post matni va Telegram'dagi ko'rinishi (taxminiy) yonma-yon
import { useState } from 'react'
import { ButtonsEditor, TgKeyboard, type BtnRow } from '@/components/buttons-editor'

const ALLOWED = /^\/?(b|strong|i|em|u|s|a|code|pre|blockquote)$/i
// Ko'rinish uchun xavfsiz HTML: faqat Telegram qo'llaydigan teglar, havolalar http(s)
function previewHtml(src: string) {
  const escd = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escd
    .replace(/&lt;(\/?)([a-z]+)((?:\s+href="[^"]*")?)&gt;/gi, (m, slash: string, tag: string, attrs: string) => {
      if (!ALLOWED.test(tag)) return m
      if (tag.toLowerCase() === 'a' && !slash) {
        const href = /href="([^"]*)"/.exec(attrs)?.[1] || ''
        return /^https?:\/\//.test(href) ? `<a href="${href}" target="_blank" rel="noopener noreferrer">` : m
      }
      return `<${slash}${tag}>`
    })
    .replace(/\n/g, '<br/>')
}

// defaultButtons — kanal postlarining standart tugmalari (Sozlamalar): post ular bilan ochiladi, kerak bo'lmasa o'chiriladi
export function Composer({ channels, canBroadcast, subscribers, defaultButtons }: { channels: { id: string; title: string; active: boolean }[]; canBroadcast: boolean; subscribers: number; defaultButtons: string }) {
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState('')
  const [buttons, setButtons] = useState<BtnRow[]>([])
  const wrap = (open: string, close: string) => {
    const el = document.getElementById('post-text') as HTMLTextAreaElement | null
    if (!el) return
    const { selectionStart: a, selectionEnd: b } = el
    const next = text.slice(0, a) + open + text.slice(a, b) + close + text.slice(b)
    setText(next)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + open.length, b + open.length) })
  }
  return (
    <div className="composer">
      <div className="grid" style={{ gap: 14 }}>
        <div className="field">
          <label>Qayerga</label>
          <div className="check-grid">
            {channels.filter((c) => c.active).map((c) => (
              <label key={c.id} className="check"><input type="checkbox" name="channels" value={c.id} /> {c.title}</label>
            ))}
            {canBroadcast && (
              <label className="check"><input type="checkbox" name="broadcast" /> Bot obunachilari ({subscribers})</label>
            )}
          </div>
          {!channels.some((c) => c.active) && <small>Faol kanal yo&apos;q — «Kanallar va postlar» bo&apos;limida qo&apos;shing</small>}
        </div>
        <div className="field">
          <label htmlFor="post-text">Matn *</label>
          <div className="fmt-bar">
            <button type="button" onClick={() => wrap('<b>', '</b>')}><b>B</b></button>
            <button type="button" onClick={() => wrap('<i>', '</i>')}><i>I</i></button>
            <button type="button" onClick={() => wrap('<u>', '</u>')}><u>U</u></button>
            <button type="button" onClick={() => wrap('<a href="https://">', '</a>')}>Havola</button>
          </div>
          <textarea id="post-text" className="textarea" name="text" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} required style={{ minHeight: 200 }} />
          <small>{text.length}/4000 · rasm bilan yuborilsa, 1024 belgigacha</small>
        </div>
        <div className="field"><label htmlFor="photo">Rasm manzili (ixtiyoriy)</label><input id="photo" className="input" name="photo" value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://…/rasm.jpg" /></div>
        <div className="field">
          <label>Tugmalar (ixtiyoriy)</label>
          <ButtonsEditor name="buttons" defaultValue={defaultButtons} onChange={setButtons} preview={false} />
          <small>Rang: ko&apos;k, qizil, yashil yoki oddiy — Telegram faqat shularni qo&apos;llaydi</small>
        </div>
      </div>
      <div>
        <div className="section-t" style={{ marginTop: 0 }}>Ko&apos;rinishi</div>
        <div className="tg-preview">
          <div className="tg-bubble">
            {/^https:\/\//.test(photo) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            )}
            <div className="tg-text" dangerouslySetInnerHTML={{ __html: text ? previewHtml(text) : '<span style="opacity:.5">Matn shu yerda ko‘rinadi</span>' }} />
            <span className="tg-time">hozir</span>
          </div>
          <TgKeyboard rows={buttons} />
        </div>
      </div>
    </div>
  )
}
