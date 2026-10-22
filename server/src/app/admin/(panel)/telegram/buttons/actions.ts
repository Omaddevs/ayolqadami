'use server'
// ayolqadam-bot kanal postlari tagidagi tugmalarni saqlash
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { botApiConfigured, buttonsToLines, getBotButtons, linesToButtons, saveBotButtons } from '@/lib/bot-buttons'
import { getTelegramConfig, saveTelegramConfig } from '@/lib/telegram/config'
import { DEFAULT_CHANNEL_BUTTONS, FOLDER_LINK_RE, withFolderLink } from '@/lib/telegram/format'
import type { FormState } from '../../actions'

// «📂 Ish kanallari» papka havolasi — bir joyda: server postlari (Sozlamalar) va bot postlari (Kanal tugmalari) ikkalasiga yoziladi
export async function saveFolderLink(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin(['ADMIN'])
  const url = String(f.get('folder') ?? '').trim().replace(/^http:\/\//, 'https://').replace(/^t\.me\//, 'https://t.me/')
  if (url && !FOLDER_LINK_RE.test(url)) return { error: "Havola https://t.me/addlist/... ko'rinishida bo'lishi kerak" }

  const cfg = await getTelegramConfig()
  await saveTelegramConfig({ channelButtons: withFolderLink(cfg.channelButtons ?? DEFAULT_CHANNEL_BUTTONS, url) })
  let botNote = ''
  if (botApiConfigured()) {
    try {
      const bot = await getBotButtons()
      await saveBotButtons({ buttons: linesToButtons(withFolderLink(buttonsToLines(bot.buttons), url)) })
    } catch (e) {
      botNote = ` Botga yozilmadi: ${(e as Error).message}`
    }
  }
  await audit(admin.id, 'telegram.folder_link', 'telegram', null, { url })
  revalidatePath('/admin/telegram', 'layout')
  const ok = url ? 'Saqlandi — keyingi kanal postlarida «📂 Ish kanallari» tugmasi chiqadi.' : "Havola olib tashlandi — tugma kanal postlarida chiqmaydi."
  return botNote ? { error: ok + botNote } : { ok }
}

export async function saveChannelButtons(_: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin(['ADMIN'])
  const buttons = linesToButtons(String(f.get('buttons') ?? ''))
  const bad = buttons.find((b) => b.url && !/^(https?:\/\/|tg:\/\/)\S+$/.test(b.url) && !/^\{(post|site|bot)\}\S*$/.test(b.url))
  if (bad) return { error: `«${bad.text}» tugmasining havolasi noto'g'ri (bu yerda {job} ishlamaydi)` }
  try {
    await saveBotButtons({
      buttons,
      apply_enabled: f.get('apply_enabled') === 'on',
      apply_text: String(f.get('apply_text') ?? '').trim() || undefined,
    })
  } catch (e) {
    return { error: (e as Error).message }
  }
  await audit(admin.id, 'telegram.bot_buttons', 'telegram', null, { count: buttons.length })
  revalidatePath('/admin/telegram/buttons')
  return { ok: 'Saqlandi — keyingi kanal postlari shu tugmalar bilan chiqadi' }
}
