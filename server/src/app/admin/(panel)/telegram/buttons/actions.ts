'use server'
// ayolqadam-bot kanal postlari tagidagi tugmalarni saqlash
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { linesToButtons, saveBotButtons } from '@/lib/bot-buttons'
import type { FormState } from '../../actions'

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
