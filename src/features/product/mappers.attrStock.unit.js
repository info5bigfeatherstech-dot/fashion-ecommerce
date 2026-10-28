/**
 * PDP swatch availability: loose in-stock check (no network).
 * Run: node src/features/product/mappers.attrStock.unit.js
 */
import assert from 'node:assert/strict'
import { isAttrValueInStock } from './mappers.js'

function product(variants) {
  return { variants }
}

/** Two SKUs: red+silver vs maroon+rose gold — the live jewellery pairing. */
const pairedInStock = product([
  {
    id: 'v1',
    inStock: true,
    attributes: [
      { key: 'Color', value: 'red' },
      { key: 'PLATING', value: 'Silver Plated' },
    ],
  },
  {
    id: 'v2',
    inStock: true,
    attributes: [
      { key: 'Color', value: 'Maroon' },
      { key: 'PLATING', value: 'Rose Gold Plated' },
    ],
  },
])

const selectedRedSilver = { Color: 'red', PLATING: 'Silver Plated' }
const selectedMaroonRose = { Color: 'Maroon', PLATING: 'Rose Gold Plated' }

assert.equal(isAttrValueInStock(pairedInStock, selectedRedSilver, 'Color', 'red'), true)
assert.equal(isAttrValueInStock(pairedInStock, selectedRedSilver, 'Color', 'Maroon'), true)
assert.equal(isAttrValueInStock(pairedInStock, selectedRedSilver, 'PLATING', 'Silver Plated'), true)
assert.equal(
  isAttrValueInStock(pairedInStock, selectedRedSilver, 'PLATING', 'Rose Gold Plated'),
  true
)

assert.equal(isAttrValueInStock(pairedInStock, selectedMaroonRose, 'Color', 'red'), true)
assert.equal(isAttrValueInStock(pairedInStock, selectedMaroonRose, 'Color', 'Maroon'), true)
assert.equal(isAttrValueInStock(pairedInStock, selectedMaroonRose, 'PLATING', 'Silver Plated'), true)
assert.equal(
  isAttrValueInStock(pairedInStock, selectedMaroonRose, 'PLATING', 'Rose Gold Plated'),
  true
)

const maroonOos = product([
  {
    id: 'v1',
    inStock: true,
    attributes: [
      { key: 'Color', value: 'red' },
      { key: 'PLATING', value: 'Silver Plated' },
    ],
  },
  {
    id: 'v2',
    inStock: false,
    attributes: [
      { key: 'Color', value: 'Maroon' },
      { key: 'PLATING', value: 'Rose Gold Plated' },
    ],
  },
])

assert.equal(isAttrValueInStock(maroonOos, selectedRedSilver, 'Color', 'red'), true)
assert.equal(isAttrValueInStock(maroonOos, selectedRedSilver, 'Color', 'Maroon'), false)
assert.equal(isAttrValueInStock(maroonOos, selectedRedSilver, 'PLATING', 'Silver Plated'), true)
assert.equal(isAttrValueInStock(maroonOos, selectedRedSilver, 'PLATING', 'Rose Gold Plated'), false)

assert.equal(isAttrValueInStock(maroonOos, selectedMaroonRose, 'Color', 'Maroon'), false)
assert.equal(isAttrValueInStock(maroonOos, selectedMaroonRose, 'Color', 'red'), true)

const bothOos = product([
  {
    id: 'v1',
    inStock: false,
    attributes: [
      { key: 'Color', value: 'red' },
      { key: 'PLATING', value: 'Silver Plated' },
    ],
  },
  {
    id: 'v2',
    inStock: false,
    attributes: [
      { key: 'Color', value: 'Maroon' },
      { key: 'PLATING', value: 'Rose Gold Plated' },
    ],
  },
])
assert.equal(isAttrValueInStock(bothOos, selectedRedSilver, 'Color', 'red'), false)
assert.equal(isAttrValueInStock(bothOos, selectedRedSilver, 'Color', 'Maroon'), false)

assert.equal(isAttrValueInStock(pairedInStock, selectedRedSilver, 'color', 'RED'), true)
assert.equal(isAttrValueInStock(pairedInStock, selectedRedSilver, 'Color', ' maroon '), true)
assert.equal(isAttrValueInStock(pairedInStock, selectedRedSilver, 'plating', 'rose gold plated'), true)

assert.equal(isAttrValueInStock(null, {}, 'Color', 'red'), false)
assert.equal(isAttrValueInStock({}, {}, 'Color', 'red'), false)
assert.equal(isAttrValueInStock(pairedInStock, selectedRedSilver, null, 'red'), false)
assert.equal(isAttrValueInStock(pairedInStock, selectedRedSilver, 'Color', null), false)
assert.equal(isAttrValueInStock(pairedInStock, selectedRedSilver, 'Color', '   '), false)
assert.equal(isAttrValueInStock(pairedInStock, selectedRedSilver, 'Color', 'Navy'), false)

const sizeMatrix = product([
  {
    id: 'black-s',
    inStock: true,
    attributes: [
      { key: 'Color', value: 'Black' },
      { key: 'Size', value: 'S' },
    ],
  },
  {
    id: 'black-m',
    inStock: false,
    attributes: [
      { key: 'Color', value: 'Black' },
      { key: 'Size', value: 'M' },
    ],
  },
  {
    id: 'white-m',
    inStock: true,
    attributes: [
      { key: 'Color', value: 'White' },
      { key: 'Size', value: 'M' },
    ],
  },
])
assert.equal(isAttrValueInStock(sizeMatrix, { Color: 'Black', Size: 'S' }, 'Size', 'M'), true)
assert.equal(isAttrValueInStock(sizeMatrix, { Color: 'Black', Size: 'S' }, 'Color', 'White'), true)
assert.equal(isAttrValueInStock(sizeMatrix, { Color: 'Black' }, 'Size', 'S'), true)

console.log('product mappers.attrStock.unit.js: ok')
