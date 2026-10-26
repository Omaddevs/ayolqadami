import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// `npm run dev:prod` — lokal sayt production API bilan (.env.prodapi: API_PROXY). Kirish boti bitta serverga ulanadi,
// shuning uchun Telegram kodlari bilan lokalda faqat shu yo'l ishlaydi. So'rovlar Vite orqali o'tadi — production CORS'iga
// localhost qo'shish shart emas. Diqqat: bu rejimda haqiqiy (production) ma'lumotlar bilan ishlaysiz
export default defineConfig(({ mode }) => {
  const target = loadEnv(mode, process.cwd(), '').API_PROXY
  if (target) process.env.VITE_API_URL = '/prod-api'
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      ...(target && {
        proxy: {
          '/prod-api': {
            target,
            changeOrigin: true,
            secure: true,
            rewrite: (p) => p.replace(/^\/prod-api/, ''),
            configure: (proxy) => proxy.on('proxyReq', (req) => req.removeHeader('origin')),
          },
        },
      }),
    },
  }
})
