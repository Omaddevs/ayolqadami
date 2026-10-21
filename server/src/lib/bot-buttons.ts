import 'server-only'

// ayolqadam-bot (Python) kanal postlari tagidagi rangli tugmalar — botning REST API'si orqali (/api/buttons, X-Api-Key)
export type BotButtonStyle = '' | 'primary' | 'danger' | 'success'
export type BotButton = { text: string; url: string; style: BotButtonStyle }
export type BotButtons = { buttons: BotButton[]; apply_text: string; apply_enabled: boolean }

// Muharrir ranglari (buttons-editor.tsx) ↔ Telegram style
export const COLOR_TO_STYLE: Record<string, BotButtonStyle> = { '': '', blue: 'primary', red: 'danger', green: 'success' }
export const STYLE_TO_COLOR: Record<BotButtonStyle, string> = { '': '', primary: 'blue', danger: 'red', success: 'green' }

const conf = () => ({ base: (process.env.BOT_API_URL || '').replace(/\/$/, ''), key: process.env.BOT_API_KEY || '' })
export const botApiConfigured = () => Boolean(conf().base && conf().key)

async function call(method: 'GET' | 'PUT', body?: unknown): Promise<BotButtons> {
  const { base, key } = conf()
  let res: Response
  try {
    res = await fetch(`${base}/api/buttons`, {
      method,
      headers: { 'X-Api-Key': key, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    throw new Error('Bot ishlamayapti yoki javob bermadi')
  }
  const data = (await res.json().catch(() => null)) as (BotButtons & { error?: string }) | null
  // eski bot: yo'l yo'q (404) yoki "web sync disabled" (503) — yangi kod bilan qayta ishga tushirish kerak
  if (res.status === 404 || (res.status === 503 && /sync/i.test(data?.error || ''))) {
    throw new Error("Bot eski kod bilan ishlayapti — ayolqadam-bot'ni qayta ishga tushiring")
  }
  if (res.status === 401 || res.status === 503) throw new Error("BOT_API_KEY noto'g'ri (botdagi WEB_API_KEY bilan bir xil bo'lishi kerak)")
  if (!res.ok || !data) throw new Error(`Bot: ${data?.error || `HTTP ${res.status}`}`)
  return data
}

export const getBotButtons = () => call('GET')
export const saveBotButtons = (input: Partial<BotButtons> & { buttons: BotButton[] }) => call('PUT', input)

// "Matn | havola | rang" qatorlari (muharrir) ↔ ro'yxat
export const buttonsToLines = (bs: BotButton[]) => bs.map((b) => [b.text, b.url, STYLE_TO_COLOR[b.style] ?? ''].join(' | ')).join('\n')
export const linesToButtons = (src: string): BotButton[] =>
  src.split(/\r?\n/).map((l) => l.split('|').map((s) => s.trim())).filter(([t]) => t)
    .map(([text, url = '', color = '']) => ({ text, url, style: COLOR_TO_STYLE[color] ?? '' }))
