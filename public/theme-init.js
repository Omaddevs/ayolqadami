// Mavzu birinchi bo'yashdan oldin qo'llanadi (qorong'i rejimda oq chaqnash bo'lmasin). Mantiq: src/lib/theme.js
// Alohida faylda — Content-Security-Policy inline skriptlarni taqiqlaydi.
(function () {
  var mode = 'system'
  try { mode = JSON.parse(localStorage.getItem('ayolkaryera_v1')).prefs.theme || mode } catch (e) {}
  var dark = mode === 'dark' || (mode !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  if (dark) document.querySelector('meta[name="theme-color"]').setAttribute('content', '#161722')
})()
