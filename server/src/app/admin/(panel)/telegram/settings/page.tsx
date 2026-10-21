import { Unplug } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { envToken, getTelegramConfig, maskToken } from '@/lib/telegram/config'
import { Card, PageHead } from '@/components/ui'
import { ActionForm } from '@/components/action-form'
import { Submit } from '@/components/client'
import { ButtonsEditor } from '@/components/buttons-editor'
import { disconnectBot, saveBotSettings } from '../actions'
import { TgTabs } from '../shared'

export const metadata = { title: 'Bot sozlamalari' }

export default async function BotSettingsPage() {
  const admin = await requireAdmin()
  const cfg = await getTelegramConfig()
  const fromEnv = Boolean(envToken())
  if (admin.role !== 'ADMIN') {
    return (
      <>
        <PageHead title="Bot sozlamalari" />
        <TgTabs active="settings" />
        <div className="card" style={{ marginTop: 12 }}>Bot sozlamalarini faqat administrator o&apos;zgartiradi.</div>
      </>
    )
  }
  return (
    <>
      <PageHead title="Bot sozlamalari" sub={cfg.botUsername ? `Ulangan: @${cfg.botUsername} (${cfg.botName})` : 'Bot ulanmagan'}>
        {cfg.token && !fromEnv && (
          <form action={disconnectBot}>
            <Submit className="btn danger" confirm="Bot uzib qo'yiladi: avtomatik postlar va bot javoblari to'xtaydi. Davom etasizmi?"><Unplug size={15} /> Botni uzish</Submit>
          </form>
        )}
      </PageHead>
      <TgTabs active="settings" />
      <div style={{ height: 12 }} />
      <div className="grid g-side" style={{ alignItems: 'start' }}>
        <Card>
          <ActionForm action={saveBotSettings}>
            <div className="form-grid">
              <div className="field full">
                <label htmlFor="token">Bot tokeni</label>
                <input id="token" className="input" name="token" autoComplete="off" spellCheck={false} disabled={fromEnv}
                  placeholder={cfg.token ? `${maskToken(cfg.token)} — o'zgartirish uchun yangisini kiriting` : '1234567890:AAH…'} />
                <small>{fromEnv ? 'Token TELEGRAM_BOT_TOKEN muhit o\'zgaruvchisidan olinmoqda' : "@BotFather → /newbot. Bo'sh qoldirilsa — joriy token saqlanadi"}</small>
              </div>
              <div className="field full">
                <label>Ishlash rejimi</label>
                <div className="radio-cards">
                  {[
                    ['off', "O'chiq", 'Bot xabarlarga javob bermaydi. Kanallarga post yuborish ishlayveradi'],
                    ['polling', 'Polling', "Server Telegram'dan o'zi so'raydi. HTTPS kerak emas — lokal va oddiy serverlar uchun"],
                    ['webhook', 'Webhook', 'Telegram serverga o\'zi yuboradi. Production uchun tavsiya (HTTPS manzil kerak)'],
                  ].map(([v, t, d]) => (
                    <label key={v} className="radio-card">
                      <input type="radio" name="mode" value={v} defaultChecked={cfg.mode === v} />
                      <span><b>{t}</b><small>{d}</small></span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="field full">
                <div className="warn-box">
                  <b>Diqqat:</b> agar shu bot boshqa dasturda ham ishlayotgan bo&apos;lsa (masalan, <code>ayolqadam-bot</code>), rejimni
                  <b> «O&apos;chiq»</b> qoldiring. Unda admin panel faqat kanallarga post yuboradi, xabarlarni esa o&apos;sha dastur qabul qiladi.
                  «Polling» ikki dasturni to&apos;qnashtiradi, «Webhook» esa boshqa dasturning xabar olishini to&apos;xtatadi.
                </div>
              </div>
              <div className="field">
                <label htmlFor="publicUrl">Server manzili (webhook uchun)</label>
                <input id="publicUrl" className="input" name="publicUrl" defaultValue={cfg.publicUrl} placeholder="https://api.ayolqadami.uz" />
              </div>
              <div className="field">
                <label htmlFor="webAppUrl">Web ilova manzili</label>
                <input id="webAppUrl" className="input" name="webAppUrl" defaultValue={cfg.webAppUrl} placeholder="https://ayolqadami.uz" />
                <small>Vakansiya havolalari va «Ilovani ochish» (Mini App) tugmasi uchun</small>
              </div>
              <label className="check"><input type="checkbox" name="autoPostJobs" defaultChecked={cfg.autoPostJobs} /> Tasdiqlangan vakansiyalarni kanallarga avtomatik yuborish</label>
              <label className="check"><input type="checkbox" name="supportViaBot" defaultChecked={cfg.supportViaBot} /> Botga yozilgan xabarlar «Murojaatlar»ga tushsin</label>
              <div className="field full">
                <label htmlFor="welcomeText">/start salomlashuvi</label>
                <textarea id="welcomeText" className="textarea" name="welcomeText" defaultValue={cfg.welcomeText} maxLength={3000} />
                <small>{'{name}'} — foydalanuvchi ismi</small>
              </div>
              <div className="field full">
                <label htmlFor="jobFooter">Kanal postlari oxiridagi matn</label>
                <input id="jobFooter" className="input" name="jobFooter" defaultValue={cfg.jobFooter} placeholder={'👉 <a href="https://t.me/ayolqadami">@ayolqadami</a> — ayollar uchun ish'} />
                <small>HTML: &lt;b&gt;, &lt;i&gt;, &lt;a href=&quot;…&quot;&gt;</small>
              </div>
              <div className="field full">
                <label>Vakansiya postlari ostidagi tugmalar</label>
                <ButtonsEditor name="channelButtons" defaultValue={cfg.channelButtons} />
                <small>
                  Havolada: <code>{'{post}'}</code> — botda e&apos;lon joylash, <code>{'{site}'}</code> — web ilova, <code>{'{job}'}</code> — shu vakansiya, <code>{'{bot}'}</code> — bot.
                  Telegram tugma fonini faqat 3 rangda qo&apos;llaydi: ko&apos;k, qizil, yashil (yoki oddiy).
                </small>
              </div>
            </div>
          </ActionForm>
        </Card>
        <div className="grid" style={{ alignContent: 'start' }}>
          <Card title="Qanday ulanadi">
            <ol className="steps" style={{ marginTop: 0 }}>
              <li>Telegramda <b>@BotFather</b> → <code>/newbot</code> → nom va username bering</li>
              <li>Berilgan tokenni shu yerga kiriting va saqlang — bot tekshiriladi</li>
              <li>Rejimni tanlang: lokalda <b>Polling</b>, serverda <b>Webhook</b></li>
              <li>Botni kanalingizga administrator qilib qo&apos;shing — kanal o&apos;zi ro&apos;yxatda paydo bo&apos;ladi (yoki qo&apos;lda qo&apos;shing)</li>
              <li>Kanal sozlamalarida avtomatik yuborishni yoqing</li>
            </ol>
          </Card>
          <Card title="Bot buyruqlari">
            <dl className="kv">
              <dt>/start</dt><dd>Salomlashuv va «Ilovani ochish» tugmasi</dd>
              <dt>/jobs</dt><dd>So&apos;nggi 7 ta vakansiya</dd>
              <dt>/help</dt><dd>Yordam</dd>
              <dt>Oddiy matn</dt><dd>Murojaat → admin panel; operator javobi botga qaytadi</dd>
            </dl>
          </Card>
        </div>
      </div>
    </>
  )
}
