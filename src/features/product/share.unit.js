/**
 * Product share URL helpers (no network).
 * Run: node src/features/product/share.unit.js
 */
import assert from 'node:assert/strict'
import {
  getProductSharePath,
  getProductShareText,
  buildWhatsAppShareHref,
  buildFacebookShareHref,
  buildSmsShareHref,
  buildTelegramShareHref,
} from './share.js'

assert.equal(getProductSharePath('gold-choker'), '/product/gold-choker')
assert.equal(getProductSharePath('/gold-choker?ref=x'), '/product/gold-choker')
assert.equal(getProductSharePath(''), '')
assert.equal(getProductShareText('Choker', 'https://fabuniqo.com/product/x'), 'Choker\nhttps://fabuniqo.com/product/x')

const wa = buildWhatsAppShareHref('Hi\nhttps://x.com/p')
assert.ok(wa.startsWith('https://wa.me/?text='))
assert.ok(wa.includes(encodeURIComponent('Hi\nhttps://x.com/p')))

const fb = buildFacebookShareHref('https://fabuniqo.com/product/gold-choker')
assert.ok(fb.includes('facebook.com/sharer'))
assert.ok(fb.includes(encodeURIComponent('https://fabuniqo.com/product/gold-choker')))

assert.ok(buildSmsShareHref('hello').startsWith('sms:?&body='))

const tg = buildTelegramShareHref('https://fabuniqo.com/product/x', 'Choker')
assert.ok(tg.startsWith('https://t.me/share/url?'))
assert.ok(tg.includes(encodeURIComponent('https://fabuniqo.com/product/x')))

console.log('product share.unit.js: ok')
