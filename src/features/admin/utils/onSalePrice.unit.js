/**
 * On-sale price eligibility helpers (no network).
 * Run: node src/features/admin/utils/onSalePrice.unit.js
 */
import assert from 'node:assert/strict'
import {
  onSaleBulkWarningText,
  productHasValidOnSalePrice,
  splitSelectedOnSaleEligibility,
} from './onSalePrice.js'

const priced = {
  slug: 'priced',
  variants: [{ price: { base: 200, sale: 150, promo: 120 } }],
}
const unpriced = {
  slug: 'unpriced',
  variants: [{ price: { base: 200, sale: 150 } }],
}
const mixedVariants = {
  slug: 'mixed',
  variants: [
    { price: { base: 200, sale: 150, promo: 120 } },
    { price: { base: 220, sale: 180 } },
  ],
}

assert.equal(productHasValidOnSalePrice(priced), true)
assert.equal(productHasValidOnSalePrice(unpriced), false)
assert.equal(productHasValidOnSalePrice(mixedVariants), false)
assert.equal(productHasValidOnSalePrice({ slug: 'empty', variants: [] }), false)
assert.equal(productHasValidOnSalePrice(null), false)

const mixed = splitSelectedOnSaleEligibility(
  [priced, unpriced, { slug: 'other' }],
  new Set(['priced', 'unpriced'])
)
assert.equal(mixed.selectedCount, 2)
assert.equal(mixed.withPriceCount, 1)
assert.equal(mixed.withoutPriceCount, 1)
assert.equal(mixed.isMixed, true)
assert.equal(mixed.noneEligible, false)
assert.match(onSaleBulkWarningText(mixed), /1 of 2 selected product\(s\) have On-sale price/)

const none = splitSelectedOnSaleEligibility([unpriced], ['unpriced'])
assert.equal(none.noneEligible, true)
assert.match(onSaleBulkWarningText(none), /None of the 1 selected product/)

const allOk = splitSelectedOnSaleEligibility([priced], new Set(['priced']))
assert.equal(allOk.isMixed, false)
assert.equal(onSaleBulkWarningText(allOk), '')

console.log('onSalePrice.unit.js: ok')
