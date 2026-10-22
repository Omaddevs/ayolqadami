import { requireAdmin } from '@/lib/auth'
import { botApiConfigured, buttonsToLines, getBotButtons, type BotButtons } from '@/lib/bot-buttons'
import { Card, PageHead } from '@/components/ui'
import { ActionForm } from '@/components/action-form'
import { ButtonsEditor } from '@/components/buttons-editor'
import { getTelegramConfig } from '@/lib/telegram/config'
import { DEFAULT_CHANNEL_BUTTONS, DEFAULT_FOLDER_LINK, folderLinkOf } from '@/lib/telegram/format'
import { TgTabs } from '../shared'
import { saveChannelButtons, saveFolderLink } from './actions'

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

  const cfg = await getTelegramConfig()
  const folder = folderLinkOf(cfg.channelButtons ?? DEFAULT_CHANNEL_BUTTONS) || (data ? folderLinkOf(buttonsToLines(data.buttons)) : '') || DEFAULT_FOLDER_LINK

  return (
    <>
      <PageHead title="Kanal tugmalari" sub="ayolqadam-bot kanalga joylaydigan e'lonlar tagidagi tugmalar" />
      <TgTabs active="buttons" />
      <div style={{ height: 12 }} />
      {admin.role === 'ADMIN' && (
        <div className="grid g-side" style={{ alignItems: 'start', marginBottom: 14 }}>
          <Card title="📂 Ish kanallari papkasi">
            <ActionForm action={saveFolderLink}>
              <div className="field">
                <label htmlFor="folder">Papka havolasi</label>
                <input id="folder" className="input" name="folder" defaultValue={folder} placeholder="https://t.me/addlist/AbCdEf123" />
                <small>
                  Kanal postlari tagida <b>«📂 Ish kanallari»</b> tugmasi chiqadi. Bosgan odamga Telegram barcha kanallaringiz ro&apos;yxatini
                  ko&apos;rsatadi va u hammasiga bir bosishda qo&apos;shiladi. Bo&apos;sh qoldirsangiz — AyolQadam papkasi (standart) ishlatiladi.
                </small>
              </div>
            </ActionForm>
          </Card>
          <Card title="Havolani qanday olish">
            <ol className="steps" style={{ marginTop: 0 }}>
              <li>Telegram → <b>Sozlamalar → Papkalar (Folders)</b> → <b>Yangi papka</b></li>
              <li>Nomini yozing (masalan, <i>Ish kanallari</i>) va <b>kanal/guruhlaringizni</b> qo&apos;shing</li>
              <li>Papkani oching → <b>Ulashish (Share folder)</b> → <b>Havola yaratish</b></li>
              <li><code>t.me/addlist/…</code> havolasini nusxalab, shu yerga qo&apos;ying</li>
            </ol>
            <small style={{ color: 'var(--muted)' }}>Faqat siz admin bo&apos;lgan kanallar yoki ochiq kanallar qo&apos;shiladi. Bot bu havolani o&apos;zi yarata olmaydi.</small>
          </Card>
        </div>
      )}
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
