/**
 * Run: node src/features/product/imageAxis.unit.js
 */
import assert from 'node:assert/strict'
import {
  resolveImageAxisKey,
  imageGroupToken,
  applyImagesToImageGroup,
  imagesForImageGroup,
} from './imageAxis.js'

assert.equal(
  resolveImageAxisKey([
    [{ key: 'Size', value: 'M' }, { key: 'Color', value: 'Red' }],
  ]),
  'Color'
)
assert.equal(
  resolveImageAxisKey([
    [{ key: 'Fragrance', value: 'Rose' }, { key: 'Size', value: '50ml' }],
  ]),
  'Fragrance'
)
assert.equal(imageGroupToken([{ key: 'Color', value: 'Red' }], 'Color'), 'color=red')

const form = applyImagesToImageGroup(
  {
    attributes: [{ key: 'Color', value: 'Red' }, { key: 'Size', value: 'X' }],
    images: [],
    variants: [
      { attributes: [{ key: 'Color', value: 'Red' }, { key: 'Size', value: 'X' }], images: [] },
      { attributes: [{ key: 'Color', value: 'Red' }, { key: 'Size', value: 'XL' }], images: [] },
      { attributes: [{ key: 'Color', value: 'Black' }, { key: 'Size', value: 'SM' }], images: [{ url: 'https://cdn/blk.jpg' }] },
    ],
  },
  [{ key: 'Color', value: 'Red' }],
  [{ url: 'https://cdn/red.jpg', publicId: 'r1' }]
)
assert.equal(form.variants[0].images[0].url, 'https://cdn/red.jpg')
assert.equal(form.variants[1].images[0].url, 'https://cdn/red.jpg')
assert.equal(form.variants[2].images[0].url, 'https://cdn/blk.jpg')
assert.equal(form.images[0].url, 'https://cdn/red.jpg')

const gallery = imagesForImageGroup({
  variants: [
    { attributes: [{ key: 'Color', value: 'Red' }, { key: 'Size', value: 'X' }], images: [{ url: 'https://cdn/red.jpg' }] },
    { attributes: [{ key: 'Color', value: 'Red' }, { key: 'Size', value: 'XL' }], images: [] },
    { attributes: [{ key: 'Color', value: 'Black' }, { key: 'Size', value: 'X' }], images: [{ url: 'https://cdn/blk.jpg' }] },
  ],
  attrs: [{ key: 'Color', value: 'Red' }, { key: 'Size', value: 'XL' }],
  selectedAttrs: { Color: 'Red', Size: 'XL' },
})
assert.equal(gallery[0].url, 'https://cdn/red.jpg')

const rose = imagesForImageGroup({
  variants: [
    { attributes: [{ key: 'Fragrance', value: 'Rose' }, { key: 'Size', value: '50ml' }], images: [{ url: 'https://cdn/rose.jpg' }] },
    { attributes: [{ key: 'Fragrance', value: 'Rose' }, { key: 'Size', value: '100ml' }], images: [] },
  ],
  selectedAttrs: { Fragrance: 'Rose', Size: '100ml' },
})
assert.equal(rose[0].url, 'https://cdn/rose.jpg')

console.log('imageAxis.unit.js: all assertions passed')
