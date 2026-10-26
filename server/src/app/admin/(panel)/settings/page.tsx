import { KeyRound, Settings } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { loginBotStatus } from '@/lib/login-bot'
import { Card, PageHead } from '@/components/ui'
import { ActionForm } from '@/components/action-form'
import { changeOwnPassword, saveSettings } from '../actions'

export const metadata = { title: 'Sozlamalar' }

export default async function SettingsPage() {
  const admin = await requireAdmin()
  const s = await getSettings()
  const isAdmin = admin.role === 'ADMIN'
  const bot = loginBotStatus()
  return (
    <>
      <PageHead title="Sozlamalar" sub="Platforma qoidalari va hisobingiz xavfsizligi" />
      <div className="grid g-2" style={{ alignItems: 'start' }}>
        <Card title="Platforma" icon={<Settings size={12} />}>
          {!isAdmin ? <p style={{ color: 'var(--muted)', margin: 0 }}>Platforma sozlamalarini faqat administrator o&apos;zgartiradi.</p> : (
            <ActionForm action={saveSettings}>
              <div className="grid" style={{ gap: 14 }}>
                <label className="check"><input type="checkbox" name="jobModeration" defaultChecked={s.jobModeration} /> Ish beruvchi vakansiyalari avval moderatsiyadan o&apos;tadi</label>
                <label className="check"><input type="checkbox" name="registrationOpen" defaultChecked={s.registrationOpen} /> Yangi foydalanuvchilar ro&apos;yxatdan o&apos;ta oladi</label>
                <label className="check"><input type="checkbox" name="phoneVerification" defaultChecked={s.phoneVerification} /> Ro&apos;yxatdan o&apos;tishda telefon raqami kirish boti orqali tasdiqlanadi</label>
                <small style={{ color: 'var(--muted)', marginTop: -8 }}>
                  Kirish boti: {bot.configured ? (bot.username ? `@${bot.username}` : 'ulanmoqda…') : 'TELEGRAM_LOGIN_BOT_TOKEN berilmagan'}
                  {bot.configured && !bot.polling ? ' · bu server botni tinglamaydi (LOGIN_BOT_POLLING)' : ''}
                  {bot.lastError ? ` · xato: ${bot.lastError}` : ''}
                </small>
                <div className="field"><label htmlFor="supportGreeting">Murojaatga avtomatik javob</label><textarea id="supportGreeting" className="textarea" name="supportGreeting" defaultValue={s.supportGreeting} maxLength={500} style={{ minHeight: 70 }} /></div>
                <div className="section-t" style={{ margin: '6px 0 0' }}>Dashboard maqsadlari</div>
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                  <div className="field"><label htmlFor="goalUsers">Foydalanuvchilar</label><input id="goalUsers" className="input" type="number" min={1} name="goalUsers" defaultValue={s.goals.users} /></div>
                  <div className="field"><label htmlFor="goalJobs">Faol vakansiyalar</label><input id="goalJobs" className="input" type="number" min={1} name="goalJobs" defaultValue={s.goals.jobs} /></div>
                  <div className="field"><label htmlFor="goalHires">Ishga joylashganlar</label><input id="goalHires" className="input" type="number" min={1} name="goalHires" defaultValue={s.goals.hires} /></div>
                </div>
              </div>
            </ActionForm>
          )}
        </Card>
        <Card title="Parolni almashtirish" icon={<KeyRound size={12} />} tone="pink">
          <ActionForm action={changeOwnPassword} submit="Parolni almashtirish">
            <div className="grid" style={{ gap: 14 }}>
              <div className="field"><label htmlFor="current">Joriy parol</label><input id="current" className="input" type="password" name="current" autoComplete="current-password" required /></div>
              <div className="field"><label htmlFor="next">Yangi parol</label><input id="next" className="input" type="password" name="next" autoComplete="new-password" minLength={10} required /><small>Kamida 10 belgi. Harf, raqam va belgilarni aralashtiring</small></div>
              <div className="field"><label htmlFor="confirm">Yangi parolni takrorlang</label><input id="confirm" className="input" type="password" name="confirm" autoComplete="new-password" required /></div>
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  )
}
