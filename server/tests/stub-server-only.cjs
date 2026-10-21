// e2e testlar route handlerlarni Next'siz chaqiradi: 'server-only' (RSC tashqarisida xato tashlaydi) bo'sh modulga almashtiriladi
const Module = require('node:module')
const orig = Module._resolveFilename
Module._resolveFilename = function (req, ...rest) {
  if (req === 'server-only') return require.resolve('./stub-empty.cjs')
  return orig.call(this, req, ...rest)
}
