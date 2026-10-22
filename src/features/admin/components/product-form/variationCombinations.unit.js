/**
 * Variation combination planner (no network).
 * Run: node src/features/admin/components/product-form/variationCombinations.unit.js
 */
import assert from 'node:assert/strict'
import {
  allocateNextProductCodes,
  applyPlanToFormData,
  buildCombinations,
  childTypeLabel,
  defaultVariationOptions,
  formatVariantAxisLabel,
  groupVariantsByParent,
  inferVariationOptions,
  mergeComboAttributes,
  mergeInferredOptions,
  normalizeAttrSignature,
  planCombinationApply,
  resolveParentAxisKey,
  uniqueOptionValues,
} from './variationCombinations.js'

function opts(colorValues, sizeValues, extra = []) {
  return [
    { id: 'opt-color', key: 'Color', enabled: true, values: colorValues.map((v) => ({ value: v })) },
    {
      id: 'opt-size',
      key: 'Size',
      enabled: Boolean(sizeValues?.length),
      values: (sizeValues || []).map((v) => ({ value: v })),
    },
    ...extra,
  ]
}

const colorSize = buildCombinations(opts(['Red', 'Blue'], ['S', 'M']))
assert.equal(colorSize.ok, true)
assert.equal(colorSize.combinations.length, 4)
assert.deepEqual(
  colorSize.combinations.map((c) => c.label),
  ['Red · S', 'Red · M', 'Blue · S', 'Blue · M']
)

const skipEmptySize = buildCombinations(opts(['Red', 'Blue'], []))
assert.equal(skipEmptySize.ok, true)
assert.equal(skipEmptySize.combinations.length, 2)
assert.equal(skipEmptySize.combinations[0].label, 'Red')

const tooMany = buildCombinations([
  { key: 'Color', enabled: true, values: Array.from({ length: 10 }, (_, i) => ({ value: `C${i}` })) },
  { key: 'Size', enabled: true, values: Array.from({ length: 6 }, (_, i) => ({ value: `S${i}` })) },
])
assert.equal(tooMany.ok, false)
assert.match(tooMany.error, /50/)

const fourAxes = buildCombinations([
  { key: 'Color', enabled: true, values: [{ value: 'Red' }] },
  { key: 'Size', enabled: true, values: [{ value: 'S' }] },
  { key: 'Material', enabled: true, values: [{ value: 'Cotton' }] },
  { key: 'Length', enabled: true, values: [{ value: '16' }] },
])
assert.equal(fourAxes.ok, false)
assert.match(fourAxes.error, /at most 3/)

assert.equal(
  normalizeAttrSignature(
    [{ key: 'Size', value: 'S' }, { key: 'Color', value: 'Red', hex: '#FF0000' }],
    ['Color', 'Size']
  ),
  normalizeAttrSignature(
    [{ key: 'color', value: 'red' }, { key: 'size', value: 's', hex: '#00FF00' }],
    ['Size', 'Color']
  )
)

const collapsed = uniqueOptionValues([{ value: 'S' }, { value: 's' }, { value: 'S ' }, { value: '' }])
assert.equal(collapsed.length, 1)
assert.equal(collapsed[0].value, 'S')

const inferredColors = inferVariationOptions([
  { attributes: [{ key: 'Color', value: 'Red' }] },
  { attributes: [{ key: 'Color', value: 'Blue' }] },
])
assert.equal(inferredColors.length, 1)
assert.equal(inferredColors[0].key, 'Color')
assert.equal(inferredColors[0].values.length, 2)

const inferredMatrix = inferVariationOptions([
  { attributes: [{ key: 'Color', value: 'Red' }, { key: 'Size', value: 'S' }] },
  { attributes: [{ key: 'Color', value: 'Red' }, { key: 'Size', value: 'M' }] },
  { attributes: [{ key: 'Color', value: 'Blue' }, { key: 'Size', value: 'S' }] },
])
assert.deepEqual(inferredMatrix.map((o) => o.key), ['Color', 'Size'])

const inferredMaterial = inferVariationOptions([
  { attributes: [{ key: 'Color', value: 'Red' }, { key: 'Material', value: 'Cotton' }] },
  { attributes: [{ key: 'Color', value: 'Red' }, { key: 'Material', value: 'Silk' }] },
])
assert.ok(inferredMaterial.some((o) => o.key === 'Material'))
assert.ok(inferredMaterial.some((o) => o.key === 'Color'))

const occasionIgnored = inferVariationOptions([
  { attributes: [{ key: 'Color', value: 'Red' }, { key: 'Occasion', value: 'Wedding' }] },
  { attributes: [{ key: 'Color', value: 'Blue' }, { key: 'Occasion', value: 'Wedding' }] },
])
assert.ok(!occasionIgnored.some((o) => o.key === 'Occasion'))

const merged = mergeInferredOptions(inferredColors, defaultVariationOptions())
assert.equal(merged[0].enabled, true)
assert.equal(merged[0].values.length, 2)
assert.equal(merged[1].key, 'Size')
assert.equal(merged[1].enabled, false)

const colorOnlyForm = {
  ProductCode: '4321-1',
  attributes: [{ key: 'Color', value: 'Red' }],
  variants: [{ ProductCode: '4321-2', attributes: [{ key: 'Color', value: 'Blue' }] }],
}
const keepPlan = planCombinationApply({
  formData: colorOnlyForm,
  isEdit: false,
  options: opts(['Red', 'Blue'], []),
})
assert.equal(keepPlan.ok, true)
assert.equal(keepPlan.summary.keep, 2)
assert.equal(keepPlan.summary.create, 0)
assert.equal(keepPlan.summary.update, 0)
assert.equal(keepPlan.needsSplitConfirm, false)

const splitPlan = planCombinationApply({
  formData: colorOnlyForm,
  isEdit: false,
  options: opts(['Red', 'Blue'], ['S', 'M']),
})
assert.equal(splitPlan.ok, true)
assert.equal(splitPlan.needsSplitConfirm, true)
assert.equal(splitPlan.summary.update, 2)
assert.equal(splitPlan.summary.create, 2)
assert.equal(splitPlan.updates[0].combo.label, 'Red · S')
assert.equal(splitPlan.updates[1].combo.label, 'Blue · S')
assert.deepEqual(splitPlan.creates.map((c) => c.label).sort(), ['Blue · M', 'Red · M'])

const emptyPrimary = {
  ProductCode: '4321-1',
  attributes: [{ key: 'Color', value: '' }, { key: 'Plating', value: 'Gold' }],
  variants: [],
}
const emptyPlan = planCombinationApply({
  formData: emptyPrimary,
  isEdit: false,
  options: opts(['Red'], ['S', 'M']),
})
assert.equal(emptyPlan.needsSplitConfirm, false)
assert.equal(emptyPlan.summary.update, 1)
assert.equal(emptyPlan.updates[0].combo.label, 'Red · S')
assert.equal(emptyPlan.summary.create, 1)

const leftoverForm = {
  ProductCode: '4321-1',
  attributes: [{ key: 'Color', value: 'Red' }],
  variants: [
    { ProductCode: '4321-2', attributes: [{ key: 'Color', value: 'Red' }, { key: 'Size', value: 'S' }] },
  ],
}
const leftoverPlan = planCombinationApply({
  formData: leftoverForm,
  isEdit: false,
  options: opts(['Red'], ['S', 'M']),
})
assert.equal(leftoverPlan.summary.keep, 1)
assert.equal(leftoverPlan.leftovers.length, 1)
assert.equal(leftoverPlan.leftovers[0].isPrimary, true)
assert.equal(leftoverPlan.summary.create, 1)

const editForm = {
  ProductCode: '4321-1',
  variants: [
    { ProductCode: '4321-1', attributes: [{ key: 'Color', value: 'Red' }] },
    { ProductCode: '4321-2', attributes: [{ key: 'Color', value: 'Blue' }] },
  ],
}
const editSplit = planCombinationApply({
  formData: editForm,
  isEdit: true,
  options: opts(['Red', 'Blue'], ['S', 'M']),
})
assert.equal(editSplit.updates[0].rec.productCode, '4321-1')
assert.equal(editSplit.updates[0].combo.label, 'Red · S')
assert.equal(editSplit.creates.length, 2)

const applied = applyPlanToFormData({ formData: colorOnlyForm, isEdit: false, plan: splitPlan })
assert.equal(applied.ok, true)
assert.equal(getLabel(applied.formData.attributes), 'Red · S')
assert.ok(applied.formData.attributes.some((a) => a.key === 'Color' && a.value === 'Red'))
assert.equal(applied.formData.variants.length, 3)
assert.deepEqual(
  applied.formData.variants.map((v) => v.ProductCode),
  ['4321-2', '4321-3', '4321-4']
)
assert.equal(applied.formData.variants[0].attributes.find((a) => a.key === 'Color').value, 'Blue')
assert.equal(applied.formData.variants[0].attributes.find((a) => a.key === 'Size').value, 'S')
assert.equal(applied.createdDrafts.length, 2)
assert.equal(applied.createdDrafts[0].wholesale, false)
assert.equal(applied.createdDrafts[0].inventory.quantity, 0)

const platingForm = {
  ProductCode: '4321-1',
  attributes: [{ key: 'Color', value: 'Red' }, { key: 'Plating', value: 'Gold' }],
  variants: [],
}
const platingPlan = planCombinationApply({
  formData: platingForm,
  isEdit: false,
  options: opts(['Red'], ['S', 'M']),
})
const platingApplied = applyPlanToFormData({ formData: platingForm, isEdit: false, plan: platingPlan })
assert.equal(platingApplied.formData.attributes.find((a) => a.key === 'Plating')?.value, 'Gold')
assert.equal(platingApplied.createdDrafts[0].attributes.find((a) => a.key === 'Plating')?.value, 'Gold')

function getLabel(attrs) {
  return formatVariantAxisLabel(attrs, ['Color', 'Size'])
}

const codes = allocateNextProductCodes(
  {
    ProductCode: '4321-1',
    variants: [{ ProductCode: '4321-2' }, { ProductCode: '4321-4', isLocalNew: true }],
  },
  2
)
assert.deepEqual(codes, ['4321-3', '4321-5'])

const mergedAttrs = mergeComboAttributes(
  [{ key: 'Color', value: 'Red' }, { key: 'Plating', value: 'Gold' }],
  [{ key: 'Color', value: 'Red' }, { key: 'Size', value: 'S' }],
  ['Color', 'Size']
)
assert.equal(mergedAttrs.find((a) => a.key === 'Plating').value, 'Gold')
assert.equal(mergedAttrs.find((a) => a.key === 'Size').value, 'S')
assert.equal(mergedAttrs.filter((a) => a.key === 'Color').length, 1)

const selectedOnly = planCombinationApply({
  formData: emptyPrimary,
  isEdit: false,
  options: opts(['Red', 'Blue'], ['S', 'M']),
  selectedSignatures: [
    normalizeAttrSignature(
      [{ key: 'Color', value: 'Red' }, { key: 'Size', value: 'S' }],
      ['Color', 'Size']
    ),
  ],
})
assert.equal(selectedOnly.summary.update + selectedOnly.summary.create, 1)

const noDelete = planCombinationApply({
  formData: {
    ProductCode: '99-1',
    variants: [
      { ProductCode: '99-1', attributes: [{ key: 'Color', value: 'Red' }, { key: 'Size', value: 'S' }] },
      { ProductCode: '99-2', attributes: [{ key: 'Color', value: 'Green' }, { key: 'Size', value: 'XL' }] },
    ],
  },
  isEdit: true,
  options: opts(['Red'], ['S']),
})
assert.equal(noDelete.summary.keep, 1)
assert.equal(noDelete.leftovers.length, 1)
assert.equal(noDelete.leftovers[0].productCode, '99-2')
assert.equal(noDelete.summary.create, 0)

assert.equal(
  resolveParentAxisKey([
    [{ key: 'Size', value: 'S' }, { key: 'Color', value: 'Red' }],
    [{ key: 'Color', value: 'Blue' }],
  ]),
  'Color'
)
assert.equal(childTypeLabel([{ key: 'Color', value: 'Red' }, { key: 'Size', value: 'S' }], 'Color'), 'S')
assert.equal(childTypeLabel([{ key: 'Color', value: 'Red' }], 'Color'), '')

const grouped = groupVariantsByParent(
  [
    { id: 'a', attributes: [{ key: 'Color', value: 'Red' }, { key: 'Size', value: 'S' }] },
    { id: 'b', attributes: [{ key: 'Color', value: 'Red' }, { key: 'Size', value: 'M' }] },
    { id: 'c', attributes: [{ key: 'Color', value: 'Green' }, { key: 'Size', value: 'M' }] },
    { id: 'd', attributes: [{ key: 'Color', value: 'Black' }, { key: 'Size', value: 'S' }] },
    { id: 'e', attributes: [{ key: 'Color', value: 'Black' }, { key: 'Size', value: 'M' }] },
    { id: 'f', attributes: [{ key: 'Size', value: 'L' }] },
  ],
  'Color'
)
assert.equal(grouped.length, 4)
assert.equal(grouped[0].value, 'Red')
assert.equal(grouped[0].items.length, 2)
assert.equal(grouped[1].value, 'Green')
assert.equal(grouped[1].items.length, 1)
assert.equal(grouped[2].value, 'Black')
assert.equal(grouped[2].items.length, 2)
assert.equal(grouped[3].value, 'Other')
assert.equal(grouped[3].items.length, 1)

console.log('variation combinations planner OK')
