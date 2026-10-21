// Muhit o'zgaruvchilari. JWT_SECRET bo'lmasa server ishga tushmaydi — zaif kalit bilan production'ga chiqib ketmaslik uchun.
function required(name: string, minLength = 1): string {
  const v = process.env[name]
  if (!v || v.length < minLength) throw new Error(`${name} muhit o'zgaruvchisi berilmagan yoki juda qisqa (kamida ${minLength})`)
  return v
}

export const env = {
  get jwtSecret() {
    return new TextEncoder().encode(required('JWT_SECRET', 32))
  },
  get webOrigins(): string[] {
    return (process.env.WEB_ORIGINS || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean)
  },
  get isProd() {
    return process.env.NODE_ENV === 'production'
  },
}
