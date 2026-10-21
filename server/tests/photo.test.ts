import { test } from 'node:test'
import assert from 'node:assert/strict'
import { profilePatchSchema, registerSchema } from '../src/lib/validators'

const base = { role: 'seeker', name: 'Test User', phone: '+998901234567', password: 'secret12' }

test('rasm manzili: faqat https yoki data:image', () => {
  const ok = (photo: string) => registerSchema.safeParse({ ...base, photo }).success
  assert.equal(ok(''), true)
  assert.equal(ok('https://lh3.googleusercontent.com/a/x'), true)
  assert.equal(ok('javascript:alert(1)'), false)
  assert.equal(ok('data:text/html;base64,PHNjcmlwdD4='), false)
  assert.equal(ok('http://x.uz/a.png'), false)
  assert.equal(profilePatchSchema.safeParse({ photo: 'data:image/jpeg;base64,/9j/4AAQ+/=' }).success, true)
  assert.equal(profilePatchSchema.safeParse({ photo: 'data:image/svg+xml;base64,PHN2Zz4=' }).success, false)
})
