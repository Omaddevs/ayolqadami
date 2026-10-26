import { ApiError, api, json } from '@/lib/http'
import { requireBotKey } from '@/lib/bot-auth'
import { MAX_IMAGE_BYTES, UploadError, absoluteMedia, publicOrigin, saveImageBytes } from '@/lib/media'

// Bot kanal posti uchun rasmni shu yerga yuklaydi (so'rov tanasi — rasmning o'zi). Uzun izohli e'lon rasm + matn
// bitta xabar bo'lib chiqishi uchun: Telegram havola ko'rinishi (link preview) sifatida shu manzildagi rasmni ko'rsatadi
export const POST = api(async (req) => {
  requireBotKey(req)
  if (Number(req.headers.get('content-length') || 0) > MAX_IMAGE_BYTES) throw new ApiError(413, 'too_large', 'Rasm hajmi 3 MB dan oshmasin')
  const buf = new Uint8Array(await req.arrayBuffer())
  try {
    const url = await saveImageBytes(buf, 'telegram-post', null)
    return json({ url: absoluteMedia(url, publicOrigin(req)) }, 201)
  } catch (e) {
    if (e instanceof UploadError) throw new ApiError(400, 'bad_image', e.message)
    throw e
  }
})
