import { Check } from '@phosphor-icons/react'
import { tr } from '../i18n'


// Ko'p qadamli formalar (rezyume, vakansiya) uchun umumiy bloklar. Uslublar: styles/resume.css (rb-*)

export function Field({ label, req, error, hint, wide, as: Tag = 'label', children }) {
  return (
    <Tag className={`field rb-field ${wide ? 'wide' : ''} ${error ? 'has-err' : ''}`}>
      {label && <span>{req && <i className="rb-req">*</i>}{label}</span>}
      {children}
      {error ? <small className="rb-err">{error}</small> : hint ? <small className="rb-hint">{hint}</small> : null}
    </Tag>
  )
}

export function Chips({ options, isOn, onPick, icons }) {
  return (
    <div className="rb-chips">
      {options.map((o) => {
        const Ic = icons?.[o.id]
        const on = isOn(o.id)
        return (
          <button key={o.id} type="button" className={`rb-chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => onPick(o.id)}>
            {Ic && <Ic size={18} weight={on ? 'fill' : 'regular'} />}{tr(o.label)}
          </button>
        )
      })}
    </div>
  )
}

export function Check2({ checked, onChange, children }) {
  return (
    <label className="rb-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true"><Check size={14} weight="bold" /></i>
      <span>{children}</span>
    </label>
  )
}

export function Stepper({ steps, step, reached, onGo, label }) {
  return (
    <ol className="rb-steps" aria-label={label}>
      {steps.map((s, i) => {
        const state = i < step || (i <= reached && i !== step) ? 'done' : i === step ? 'on' : ''
        return (
          <li key={s} className={`rb-step ${state} ${i < reached ? 'line-on' : ''}`}>
            <button type="button" onClick={() => onGo(i)} disabled={i > reached} aria-current={i === step ? 'step' : undefined}>
              <span className="rb-dot">{state === 'done' ? <Check size={15} weight="bold" /> : i + 1}</span>
              <span className="rb-step-label">{s}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
