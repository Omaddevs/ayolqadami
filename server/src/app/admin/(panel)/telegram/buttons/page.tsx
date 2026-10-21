import { requireAdmin } from '@/lib/auth'
import { botApiConfigured, buttonsToLines, getBotButtons, type BotButtons } from '@/lib/bot-buttons'
import { Card, PageHead } from '@/components/ui'
import { ActionForm } from '@/components/action-form'
import { ButtonsEditor } from '@/components/buttons-editor'
import { TgTabs } from '../shared'
import { saveChannelButtons } from './actions'

export const metadata = { title: 'Kanal tugmalari' }
export const dynamic = 'force-dynamic'

export default async function ChannelButtonsPage() {
  const admin = await requireAdmin()
  let data: BotButtons | null = null
  let error = ''
  if (botApiConfigured()) {
    try {
      data = await getBotButtons()
    } catch (e) {
      error = (e as Error).message
    }
  }

  return (
    <>
      <PageHead title="Kanal tugmalari" sub="ayolqadam-bot kanalga joylaydigan e'lonlar tagidagi tugmalar" />
      <TgTabs active="buttons" />
      <div style={{ height: 12 }} />
      {!botApiConfigured() ? (
        <div className="card">
          Bot ulanmagan. <code>server/.env</code> faylida <code>BOT_API_URL</code> va <code>BOT_API_KEY</code> (botdagi <code>WEB_API_KEY</code>) ni kiriting,
          botda esa <code>API_ENABLED=true</code> bo&apos;lsin.
        </div>
      ) : error ? (
        <div className="card warn-box"><b>Botga ulanib bo&apos;lmadi:</b> {error}</div>
      ) : admin.role !== 'ADMIN' ? (
        <div className="card">Tugmalarni faqat administrator o&apos;zgartiradi.</div>
      ) : (
        <div className="grid g-side" style={{ alignItems: 'start' }}>
          <Card>
            <ActionForm action={saveChannelButtons}>
              <div className="form-grid">
                <div className="field full">
                  <label className="check">
                    <input type="checkbox" name="apply_enabled" defaultChecked={data!.apply_enabled} /> Har bir vakansiya tagida «Ishlamoqchiman» tugmasi (birinchi qatorda)
                  </label>
                </div>
                <div className="field full">
                  <label htmlFor="apply_text">«Ishlamoqchiman» tugmasi matni</label>
                  <input id="apply_text" className="input" name="apply_text" defaultValue={data!.apply_text} maxLength={64} />
                </div>
                <div className="field full">
                  <label>Qo&apos;shimcha tugmalar</label>
                  <ButtonsEditor name="buttons" defaultValue={buttonsToLines(data!.buttons)} />
                  <small>
                    Havolada: <code>{'{post}'}</code> — botda e&apos;lon berish, <code>{'{site}'}</code> — sayt (botdagi WEB_URL), <code>{'{bot}'}</code> — bot.
                    Hammasini o&apos;chirsangiz — eski «E&apos;lon berish» tugmasi chiqadi.
                  </small>
                </div>
              </div>
            </ActionForm>
          </Card>
          <Card title="Qanday ishlaydi">
            <ol className="steps" style={{ marginTop: 0 }}>
              <li>Tugma qo&apos;shing, matni va havolasini yozing</li>
              <li>Fon rangini tanlang: ko&apos;k, qizil, yashil yoki oddiy — Telegram faqat shu ranglarni qo&apos;llaydi</li>
              <li>Saqlang — bot <b>keyingi</b> joylaydigan postlar shu tugmalar bilan chiqadi (eski postlar o&apos;zgarmaydi)</li>
            </ol>
          </Card>
        </div>
      )}
    </>
  )
}
