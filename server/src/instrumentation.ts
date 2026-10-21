// Server ishga tushganda bir marta bajariladi:
//  • asosiy Telegram bot polling rejimi (admin panelda yoqilgan bo'lsa)
//  • kirish boti (TELEGRAM_LOGIN_BOT_TOKEN berilgan bo'lsa) — telefonni tasdiqlash kodlari
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.TELEGRAM_POLLING !== 'false') {
    const { startPoller } = await import('./lib/telegram/runtime')
    startPoller()
    const { startLoginPoller } = await import('./lib/login-bot')
    startLoginPoller()
  }
}
