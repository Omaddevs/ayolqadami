// Telegram Bot API bilan past darajadagi aloqa.
// TELEGRAM_API_BASE — testlar uchun soxta server manzili (sukut: https://api.telegram.org)

export class TelegramError extends Error {
  constructor(public code: number, public description: string, public retryAfter?: number) {
    super(description)
  }
  // Foydalanuvchi botni bloklagan yoki chat mavjud emas — qayta urinish befoyda
  get isForbidden() {
    return this.code === 403 || /chat not found|user is deactivated|bot was blocked/i.test(this.description)
  }
}

const base = () => (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/$/, '')

export async function tg<T = unknown>(token: string, method: string, params: Record<string, unknown> = {}, timeoutMs = 15000): Promise<T> {
  if (!token) throw new TelegramError(401, 'Bot tokeni kiritilmagan')
  let res: Response
  try {
    res = await fetch(`${base()}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    })
  } catch (e) {
    throw new TelegramError(0, `Telegram serveriga ulanib bo'lmadi: ${(e as Error).message}`)
  }
  const data = (await res.json().catch(() => null)) as { ok: boolean; result?: T; error_code?: number; description?: string; parameters?: { retry_after?: number } } | null
  if (!data?.ok) {
    throw new TelegramError(data?.error_code || res.status, data?.description || `HTTP ${res.status}`, data?.parameters?.retry_after)
  }
  return data.result as T
}

// 429 (juda tez) javobida Telegram ko'rsatgan vaqtcha kutib, bir marta qayta urinadi
export async function tgRetry<T = unknown>(token: string, method: string, params: Record<string, unknown> = {}): Promise<T> {
  try {
    return await tg<T>(token, method, params)
  } catch (e) {
    if (e instanceof TelegramError && e.code === 429 && e.retryAfter && e.retryAfter <= 30) {
      await new Promise((r) => setTimeout(r, e.retryAfter! * 1000 + 200))
      return tg<T>(token, method, params)
    }
    throw e
  }
}

// --- Tiplar (faqat ishlatiladigan maydonlar) ---
export type TgUser = { id: number; is_bot: boolean; first_name: string; last_name?: string; username?: string; language_code?: string }
export type TgChat = { id: number; type: string; title?: string; username?: string; first_name?: string }
export type TgMessage = {
  message_id: number; from?: TgUser; chat: TgChat; date: number; text?: string
  contact?: { phone_number: string; first_name?: string; last_name?: string; user_id?: number }
}
export type TgUpdate = {
  update_id: number
  message?: TgMessage
  callback_query?: { id: string; from: TgUser; message?: TgMessage; data?: string }
  my_chat_member?: { chat: TgChat; from: TgUser; new_chat_member: { status: string; user: TgUser } }
}
export type TgChatMember = { status: string; can_post_messages?: boolean; can_delete_messages?: boolean }
export type TgWebhookInfo = { url: string; pending_update_count: number; last_error_message?: string; last_error_date?: number }
