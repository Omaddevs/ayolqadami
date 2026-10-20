// localStorage'ga sig'ishi uchun rasm 256px kvadratga qirqilib, JPEG data-URL qilib qaytariladi
export function readPhoto(file, size = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const s = Math.min(img.width, img.height)
      const c = document.createElement('canvas')
      c.width = c.height = size
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
      URL.revokeObjectURL(img.src)
      resolve(c.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('bad image')) }
    img.src = URL.createObjectURL(file)
  })
}
