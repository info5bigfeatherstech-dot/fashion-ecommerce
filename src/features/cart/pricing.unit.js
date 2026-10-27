/**
 * Cart line MRP / sale / on-sale display math (no network).
 * Run: node src/features/cart/pricing.unit.js
 */
import assert from 'node:assert/strict'
import { getCartLinePricing, summarizeCartProductPricing } from './pricing.js'

const twoTier = getCartLinePricing({
  price: 150,
  originalPrice: 499,
  quantity: 1,
})
assert.equal(twoTier.lineBase, 499)
assert.equal(twoTier.linePayable, 150)
assert.equal(twoTier.productDiscount, 349)
assert.equal(twoTier.showThreeTier, false)

const onSale = getCartLinePricing({
  price: 80,
  originalPrice: 120,
  salePrice: 100,
  isPromoActive: true,
  quantity: 2,
})
assert.equal(onSale.showThreeTier, true)
assert.equal(onSale.lineSale, 200)
assert.equal(onSale.lineBase, 240)
assert.equal(onSale.linePayable, 160)
assert.equal(onSale.productDiscount, 80)

const untaggedWithSaleField = getCartLinePricing({
  price: 100,
  originalPrice: 120,
  salePrice: 100,
  isPromoActive: false,
  quantity: 1,
})
assert.equal(untaggedWithSaleField.showThreeTier, false)
assert.equal(untaggedWithSaleField.productDiscount, 20)

const totals = summarizeCartProductPricing([
  { price: 150, originalPrice: 499, quantity: 1 },
  { price: 450, originalPrice: 999, quantity: 1 },
])
assert.equal(totals.mrpTotal, 1498)
assert.equal(totals.payableTotal, 600)
assert.equal(totals.productDiscount, 898)

const noSale = getCartLinePricing({ price: 200, quantity: 1 })
assert.equal(noSale.lineBase, 200)
assert.equal(noSale.productDiscount, 0)

console.log('cart pricing.unit.js: ok')
