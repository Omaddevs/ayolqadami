import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { PHONE_PREFIX, checkUzPhone, formatUzPhone } from '../lib/phone'
import { useT } from '../i18n'
import { Sheet } from './UI'

// Raqamsiz hisob (Google bilan ro'yxatdan o'tgan) vakansiyaga ariza / savol yozmoqchi bo'lsa — telefon raqami so'raladi
export default function PhoneAsk() {
  const { phoneAsk, savePhone, closePhoneAsk } = useApp()
  const t = useT()
  const [phone, setPhone] = useState(PHONE_PREFIX)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (!phoneAsk) return null
  const state = checkUzPhone(phone)

  const submit = async (e) => {
    e.preventDefault()
    if (state !== 'ok') return setErr(state === 'code' ? t("Operator kodi noto'g'ri") : t("Telefon raqamini to'liq kiriting"))
    setBusy(true)
    const r = await savePhone(phone)
    setBusy(false)
    if (r === 'exists') setErr(t("Bu raqam boshqa hisobga bog'langan"))
    else if (r !== 'ok') setErr(t("Saqlab bo'lmadi. Qaytadan urinib ko'ring"))
  }

  return (
    <Sheet open onClose={closePhoneAsk} title={t('Telefon raqamingiz')}>
      <form onSubmit={submit}>
        <p className="muted small">{t("Ish beruvchi siz bilan bog'lana olishi uchun telefon raqamingizni kiriting. Raqam faqat siz murojaat qilgan ish beruvchiga ko'rinadi.")}</p>
        <label className="field"><span>{t('Telefon raqami')}</span>
          <input className="input" value={phone} inputMode="tel" autoComplete="tel" autoFocus placeholder={`${PHONE_PREFIX}XX XXX XX XX`}
            onChange={(e) => { setErr(''); setPhone(formatUzPhone(e.target.value)) }} />
        </label>
        {err && <p className="small" role="alert" style={{ color: 'var(--danger, #e5484d)' }}>{err}</p>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy || state !== 'ok'}>{t('Davom etish')}</button>
      </form>
    </Sheet>
  )
}
