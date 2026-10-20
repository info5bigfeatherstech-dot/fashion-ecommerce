/**
 * Referral helpers (no network).
 * Run: node src/features/referral/referral.unit.js
 */
import assert from 'node:assert/strict'
import {
  buildReferralShareText,
  isReferralCodeFormat,
  normalizeReferralCode,
  referralDiscountLabel,
} from './utils.js'

assert.equal(isReferralCodeFormat('RF-001'), true)
assert.equal(isReferralCodeFormat('rf-12'), true)
assert.equal(isReferralCodeFormat('WEL50'), false)
assert.equal(isReferralCodeFormat('RF001'), false)
assert.equal(isReferralCodeFormat(''), false)
assert.equal(normalizeReferralCode(' rf-001 '), 'RF-001')
assert.equal(referralDiscountLabel({ discountType: 'percentage', discountValue: 8 }), '8% off')
assert.equal(referralDiscountLabel({ discountType: 'fixed', discountValue: 50 }), '₹50 off')

const share = buildReferralShareText({
  code: 'RF-001',
  settings: { discountType: 'percentage', discountValue: 8, rewardPoints: 80 },
  siteName: 'FABUNIQO',
  origin: 'https://shop.example',
})
assert.match(share, /RF-001/)
assert.match(share, /8% off/)
assert.match(share, /80 loyalty points/)
assert.match(share, /https:\/\/shop\.example/)

console.log('referral.unit.js ok')
