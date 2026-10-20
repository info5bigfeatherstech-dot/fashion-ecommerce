/**
 * Coupon mapping + cart apply gate (no network).
 * Run: node src/features/coupon/coupon.unit.js
 */
import assert from 'node:assert/strict'
import { mapCouponValidation, mapAvailableCoupons } from './mappers.js'
import {
  calculateCartCouponDiscounts,
  evaluateCouponForCart,
  getCouponCode,
} from './utils.js'

const backendValidateShape = {
  success: true,
  valid: true,
  coupon: {
    code: 'WEL50',
    name: 'Welcome 50',
    discountType: 'fixed',
    discountValue: 50,
    discountAmount: 50,
    maxDiscountAmount: null,
    minOrderValue: 0,
    description: '₹50 off',
  },
}

const mapped = mapCouponValidation(backendValidateShape)
assert.equal(mapped.valid, true)
assert.equal(mapped.code, 'WEL50')
assert.equal(mapped.couponCode, 'WEL50')
assert.equal(mapped.discountType, 'fixed')
assert.equal(mapped.discountValue, 50)
assert.equal(mapped.discountAmount, 50)
assert.equal(mapped.minOrderAmount, 0)

const percentMapped = mapCouponValidation({
  success: true,
  valid: true,
  coupon: {
    code: 'BABA10',
    discountType: 'percentage',
    discountValue: 10,
    discountAmount: 16,
    maxDiscountAmount: 100,
    minOrderValue: 100,
  },
})
assert.equal(percentMapped.code, 'BABA10')
assert.equal(percentMapped.discountType, 'percentage')
assert.equal(percentMapped.discountValue, 10)
assert.equal(percentMapped.maxDiscountAmount, 100)
assert.equal(percentMapped.minOrderAmount, 100)

assert.equal(mapCouponValidation({ success: false, message: 'Invalid coupon code' }).valid, false)
assert.equal(getCouponCode({ couponCode: 'wel50' }), 'WEL50')
assert.equal(getCouponCode({ code: 'BABA10' }), 'BABA10')

const cartItems = [
  {
    productId: 'p1',
    id: 'p1',
    productCode: 'FU260370-1',
    price: 159,
    quantity: 1,
  },
]

const fromCouponCodeOnly = calculateCartCouponDiscounts(cartItems, {
  couponCode: 'WEL50',
  discountType: 'fixed',
  discountValue: 50,
})
assert.equal(fromCouponCodeOnly.totalDiscount, 50)
assert.equal(fromCouponCodeOnly.hasCoupon, true)
assert.equal(fromCouponCodeOnly.appliedCoupon.code, 'WEL50')

const evaluated = evaluateCouponForCart(cartItems, mapped, 'WEL50')
assert.equal(evaluated.ok, true)
assert.equal(evaluated.coupon.code, 'WEL50')
assert.equal(evaluated.coupon.couponCode, 'WEL50')
assert.equal(evaluated.calculation.totalDiscount, 50)

const percentEval = evaluateCouponForCart(cartItems, percentMapped, 'BABA10')
assert.equal(percentEval.ok, true)
assert.equal(percentEval.calculation.totalDiscount, 16)

const belowMin = evaluateCouponForCart(cartItems, {
  ...percentMapped,
  minOrderAmount: 500,
}, 'BABA10')
assert.equal(belowMin.ok, false)
assert.match(belowMin.errorMessage, /Minimum order/i)

const available = mapAvailableCoupons({
  success: true,
  coupons: [
    { code: 'BABA10', discountType: 'percentage', discountValue: 10, minOrderValue: 199 },
    { code: 'WEL50', discountType: 'fixed', discountValue: 50, minOrderValue: 0 },
  ],
})
assert.equal(available.length, 2)
assert.equal(available[0].code, 'BABA10')
assert.equal(available[0].minOrderAmount, 199)

console.log('coupon mapping + apply gate OK')
