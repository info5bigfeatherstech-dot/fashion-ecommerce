/**
 * Product variation axes → flat SKU combinations.
 * Nested variants are never produced; each combo is a normal variant with attributes.
 */

import { isColorAttributeKey, normalizeHexColor } from '../../../product/colorSwatch.js'

export const MAX_VARIATION_AXES = 3
export const MAX_VARIATION_COMBINATIONS = 50
export const PRESET_OPTION_KEYS = ['Color', 'Size', 'Plating']

const SUFFIXED_PRODUCT_CODE_REGEX = /^([A-Z0-9_-]+)-(\d+)$/
const PRESET_KEY_SET = new Set(PRESET_OPTION_KEYS.map((k) => k.toLowerCase()))

export function normalizeKey(key) {
  return String(key || '').trim().toLowerCase()
}

export function normalizeValue(value) {
  return String(value || '').trim().toLowerCase()
}

export function defaultVariationOptions() {
  return [
    { id: 'opt-color', key: 'Color', enabled: true, values: [] },
    { id: 'opt-size', key: 'Size', enabled: false, values: [] },
  ]
}

export function getAttrValue(attrs, key) {
  const nk = normalizeKey(key)
  if (!nk) return ''
  const hit = (Array.isArray(attrs) ? attrs : []).find(
    (a) => normalizeKey(a?.key) === nk && String(a?.value || '').trim()
  )
  return hit ? String(hit.value).trim() : ''
}

export function getAttrHex(attrs, key) {
  const nk = normalizeKey(key)
  const hit = (Array.isArray(attrs) ? attrs : []).find(
    (a) => normalizeKey(a?.key) === nk && String(a?.value || '').trim()
  )
  return normalizeHexColor(hit?.hex) || ''
}

/** Order-independent identity. Hex is ignored (swatch change ≠ new SKU). */
export function normalizeAttrSignature(attrs, axisKeys = null) {
  const keys = Array.isArray(axisKeys) && axisKeys.length
    ? axisKeys.map(normalizeKey).filter(Boolean)
    : null
  const parts = []
  const seen = new Set()
  for (const attr of Array.isArray(attrs) ? attrs : []) {
    const k = normalizeKey(attr?.key)
    const v = normalizeValue(attr?.value)
    if (!k || !v) continue
    if (keys && !keys.includes(k)) continue
    if (seen.has(k)) continue
    seen.add(k)
    parts.push(`${k}=${v}`)
  }
  parts.sort()
  return parts.join('|')
}

export function uniqueOptionValues(values) {
  const seen = new Set()
  const out = []
  for (const raw of Array.isArray(values) ? values : []) {
    const value = String(raw?.value ?? raw ?? '').trim()
    if (!value) continue
    const nv = normalizeValue(value)
    if (seen.has(nv)) continue
    seen.add(nv)
    const hex = isColorAttributeKey(raw?.key) ? (normalizeHexColor(raw?.hex) || '') : (normalizeHexColor(raw?.hex) || '')
    out.push({
      id: raw?.id || `val-${out.length}`,
      value,
      hex: hex || '',
    })
  }
  return out
}

export function getEnabledOptions(options) {
  return (Array.isArray(options) ? options : []).filter((opt) => {
    if (!opt || opt.enabled === false) return false
    const key = String(opt.key || '').trim()
    if (!key) return false
    return uniqueOptionValues(opt.values).length > 0
  })
}

export function getEnabledAxisKeys(options) {
  return getEnabledOptions(options).map((opt) => String(opt.key).trim())
}

/** Enabled option names even before values are entered (admin editor / spec hiding). */
export function getSelectedOptionKeys(options) {
  return (Array.isArray(options) ? options : [])
    .filter((opt) => opt && opt.enabled !== false && String(opt.key || '').trim())
    .map((opt) => String(opt.key).trim())
}

export function sanitizeVariationOptions(options) {
  const seenKeys = new Set()
  const out = []
  for (const raw of Array.isArray(options) ? options : []) {
    const key = String(raw?.key || '').trim()
    if (!key) continue
    const nk = normalizeKey(key)
    if (seenKeys.has(nk)) continue
    seenKeys.add(nk)
    const values = uniqueOptionValues(
      (raw.values || []).map((v) => ({ ...v, key }))
    )
    out.push({
      id: raw.id || `opt-${nk}`,
      key,
      enabled: raw.enabled !== false,
      values,
    })
  }
  return out
}

export function formatVariantAxisLabel(attrs, axisKeys = null) {
  const list = Array.isArray(attrs) ? attrs : []
  const keys = Array.isArray(axisKeys) && axisKeys.length
    ? axisKeys.map(normalizeKey)
    : null
  const parts = []
  if (keys) {
    for (const nk of keys) {
      const hit = list.find((a) => normalizeKey(a?.key) === nk && String(a?.value || '').trim())
      if (hit) parts.push(String(hit.value).trim())
    }
  }
  if (!parts.length) {
    for (const attr of list) {
      const v = String(attr?.value || '').trim()
      if (v) parts.push(v)
    }
  }
  return parts.join(' · ')
}

function cartesian(optionRows) {
  return optionRows.reduce((acc, opt) => {
    const values = uniqueOptionValues((opt.values || []).map((v) => ({ ...v, key: opt.key })))
    if (!acc.length) {
      return values.map((val) => [{ key: opt.key, value: val.value, hex: val.hex }])
    }
    const next = []
    for (const row of acc) {
      for (const val of values) {
        next.push([...row, { key: opt.key, value: val.value, hex: val.hex }])
      }
    }
    return next
  }, [])
}

export function buildCombinations(options) {
  const enabled = getEnabledOptions(sanitizeVariationOptions(options))
  if (enabled.length > MAX_VARIATION_AXES) {
    return {
      ok: false,
      error: `A product can vary by at most ${MAX_VARIATION_AXES} options.`,
      combinations: [],
    }
  }
  if (!enabled.length) {
    return { ok: true, combinations: [], error: null }
  }
  const rows = cartesian(enabled)
  if (rows.length > MAX_VARIATION_COMBINATIONS) {
    return {
      ok: false,
      error: `Too many combinations (${rows.length}). Keep it to ${MAX_VARIATION_COMBINATIONS} or fewer.`,
      combinations: [],
    }
  }
  const axisKeys = enabled.map((opt) => opt.key)
  const combinations = rows.map((attrs) => {
    const clean = attrs.map((a) => {
      const item = { key: a.key, value: a.value }
      if (isColorAttributeKey(a.key)) {
        const hex = normalizeHexColor(a.hex)
        if (hex) item.hex = hex
      }
      return item
    })
    return {
      attributes: clean,
      signature: normalizeAttrSignature(clean, axisKeys),
      label: formatVariantAxisLabel(clean, axisKeys),
    }
  })
  return { ok: true, combinations, error: null }
}

function presetLikeKey(key) {
  return PRESET_KEY_SET.has(normalizeKey(key))
}

export function inferVariationOptions(variants) {
  const groups = new Map()
  for (const variant of Array.isArray(variants) ? variants : []) {
    for (const attr of Array.isArray(variant?.attributes) ? variant.attributes : []) {
      const key = String(attr?.key || '').trim()
      const value = String(attr?.value || '').trim()
      if (!key || !value) continue
      const nk = normalizeKey(key)
      if (!groups.has(nk)) {
        groups.set(nk, { key, values: [] })
      }
      const group = groups.get(nk)
      const hex = normalizeHexColor(attr.hex) || ''
      group.values.push({ key, value, hex })
    }
  }

  const inferred = []
  for (const group of groups.values()) {
    const values = uniqueOptionValues(group.values)
    const isAxis = values.length > 1 || (presetLikeKey(group.key) && values.length >= 1)
    if (!isAxis) continue
    inferred.push({
      id: `opt-${normalizeKey(group.key)}`,
      key: group.key,
      enabled: true,
      values,
    })
  }

  inferred.sort((a, b) => {
    const ai = PRESET_OPTION_KEYS.findIndex((k) => normalizeKey(k) === normalizeKey(a.key))
    const bi = PRESET_OPTION_KEYS.findIndex((k) => normalizeKey(k) === normalizeKey(b.key))
    const ao = ai === -1 ? 100 : ai
    const bo = bi === -1 ? 100 : bi
    if (ao !== bo) return ao - bo
    return a.key.localeCompare(b.key)
  })
  return inferred
}

export function mergeInferredOptions(inferred, defaults = defaultVariationOptions()) {
  const byKey = new Map()
  for (const item of defaults) {
    byKey.set(normalizeKey(item.key), {
      ...item,
      values: uniqueOptionValues(item.values || []),
    })
  }
  for (const inf of inferred || []) {
    const nk = normalizeKey(inf.key)
    const prev = byKey.get(nk)
    byKey.set(nk, {
      id: prev?.id || inf.id || `opt-${nk}`,
      key: inf.key || prev?.key,
      enabled: true,
      values: uniqueOptionValues(inf.values || []),
    })
  }
  const ordered = []
  const seen = new Set()
  for (const item of defaults) {
    const nk = normalizeKey(item.key)
    ordered.push(byKey.get(nk))
    seen.add(nk)
  }
  for (const inf of inferred || []) {
    const nk = normalizeKey(inf.key)
    if (seen.has(nk)) continue
    ordered.push(byKey.get(nk))
    seen.add(nk)
  }
  return ordered
}

export function collectExistingVariantRecords(formData, { isEdit } = {}) {
  if (isEdit) {
    return (formData?.variants || []).map((variant, index) => ({
      id: index === 0 ? 'primary' : `v-${index}`,
      index,
      isPrimary: index === 0,
      isCreateExtra: false,
      isLocalNew: Boolean(variant?.isLocalNew),
      productCode: String(variant?.ProductCode || variant?.productCode || '').trim(),
      attributes: Array.isArray(variant?.attributes) ? variant.attributes : [],
      images: Array.isArray(variant?.images) ? variant.images : [],
      raw: variant,
    }))
  }

  const records = [
    {
      id: 'primary',
      index: 'primary',
      isPrimary: true,
      isCreateExtra: false,
      isLocalNew: false,
      productCode: String(formData?.ProductCode || formData?.productCode || '').trim(),
      attributes: Array.isArray(formData?.attributes) ? formData.attributes : [],
      images: Array.isArray(formData?.images) ? formData.images : [],
      raw: null,
    },
  ]
  ;(formData?.variants || []).forEach((variant, index) => {
    records.push({
      id: `extra-${index}`,
      index,
      isCreateExtra: true,
      isPrimary: false,
      isLocalNew: true,
      productCode: String(variant?.ProductCode || variant?.productCode || '').trim(),
      attributes: Array.isArray(variant?.attributes) ? variant.attributes : [],
      images: Array.isArray(variant?.images) ? variant.images : [],
      raw: variant,
    })
  })
  return records
}

export function analyzeVariantAxes(attrs, axisKeys) {
  const keys = (axisKeys || []).map((k) => String(k).trim()).filter(Boolean)
  const present = []
  const missing = []
  for (const key of keys) {
    if (getAttrValue(attrs, key)) present.push(key)
    else missing.push(key)
  }
  return {
    present,
    missing,
    incomplete: missing.length > 0,
    emptyOfAxes: present.length === 0,
    signature: normalizeAttrSignature(attrs, keys),
  }
}

function comboMatchesExisting(comboAttrs, existingAttrs, axisKeys) {
  for (const key of axisKeys) {
    const existingVal = getAttrValue(existingAttrs, key)
    if (!existingVal) continue
    if (normalizeValue(existingVal) !== normalizeValue(getAttrValue(comboAttrs, key))) {
      return false
    }
  }
  return true
}

function pickPreferredSplit(candidates, existingAttrs, options, axisKeys) {
  if (!candidates.length) return null
  const enabled = getEnabledOptions(options)
  const preferredAttrs = []
  for (const key of axisKeys) {
    const existingVal = getAttrValue(existingAttrs, key)
    if (existingVal) {
      preferredAttrs.push({ key, value: existingVal })
      continue
    }
    const opt = enabled.find((o) => normalizeKey(o.key) === normalizeKey(key))
    const first = uniqueOptionValues(opt?.values || [])[0]
    if (first) preferredAttrs.push({ key, value: first.value })
  }
  const preferredSig = normalizeAttrSignature(preferredAttrs, axisKeys)
  return candidates.find((c) => c.signature === preferredSig) || null
}

export function planCombinationApply({
  formData,
  isEdit = false,
  options,
  selectedSignatures = null,
}) {
  const sanitized = sanitizeVariationOptions(options)
  const built = buildCombinations(sanitized)
  if (!built.ok) {
    return {
      ok: false,
      error: built.error,
      needsSplitConfirm: false,
      keep: [],
      updates: [],
      creates: [],
      leftovers: [],
      combinations: [],
      axisKeys: [],
    }
  }

  const axisKeys = getEnabledAxisKeys(sanitized)
  let desired = built.combinations
  if (Array.isArray(selectedSignatures)) {
    const allow = new Set(selectedSignatures)
    desired = desired.filter((c) => allow.has(c.signature))
  }

  const existing = collectExistingVariantRecords(formData, { isEdit })
  const keep = []
  const updates = []
  const taken = new Set()

  for (const rec of existing) {
    const analysis = analyzeVariantAxes(rec.attributes, axisKeys)
    if (analysis.incomplete || analysis.emptyOfAxes) continue
    const match = desired.find((d) => d.signature === analysis.signature && !taken.has(d.signature))
    if (!match) continue
    keep.push({ rec, combo: match })
    taken.add(match.signature)
  }

  for (const rec of existing) {
    if (keep.some((k) => k.rec.id === rec.id)) continue
    const analysis = analyzeVariantAxes(rec.attributes, axisKeys)
    if (!analysis.incomplete && !analysis.emptyOfAxes) continue
    const candidates = desired.filter(
      (d) => !taken.has(d.signature) && comboMatchesExisting(d.attributes, rec.attributes, axisKeys)
    )
    if (!candidates.length) continue
    const combo = pickPreferredSplit(candidates, rec.attributes, sanitized, axisKeys)
    if (!combo) continue
    updates.push({
      rec,
      combo,
      previousAttributes: rec.attributes,
      isEmptyAssignment: analysis.emptyOfAxes,
    })
    taken.add(combo.signature)
  }

  const creates = desired.filter((d) => !taken.has(d.signature))
  const leftovers = existing.filter(
    (rec) => !keep.some((k) => k.rec.id === rec.id) && !updates.some((u) => u.rec.id === rec.id)
  )
  const needsSplitConfirm = updates.some((u) => !u.isEmptyAssignment)

  return {
    ok: true,
    error: null,
    needsSplitConfirm,
    keep,
    updates,
    creates,
    leftovers,
    combinations: built.combinations,
    axisKeys,
    summary: {
      keep: keep.length,
      update: updates.length,
      create: creates.length,
      leftover: leftovers.length,
    },
  }
}

export function allocateNextProductCodes(formData, count) {
  const n = Math.max(0, Number(count) || 0)
  if (!n) return []

  const used = new Set()
  const codes = []
  const main = String(formData?.ProductCode || formData?.productCode || '').trim().toUpperCase()
  if (main) codes.push(main)
  for (const variant of formData?.variants || []) {
    const code = String(variant?.ProductCode || variant?.productCode || '').trim().toUpperCase()
    if (code) codes.push(code)
  }

  let base = ''
  for (const code of codes) {
    const match = code.match(SUFFIXED_PRODUCT_CODE_REGEX)
    if (match) {
      if (!base) base = match[1]
      if (match[1] === base) used.add(parseInt(match[2], 10))
    } else if (/^[A-Z0-9_-]+$/.test(code) && !base) {
      base = code
      used.add(1)
    }
  }
  if (!base) return []

  const out = []
  let seq = 1
  while (out.length < n && seq < 10000) {
    if (!used.has(seq)) {
      out.push(`${base}-${seq}`)
      used.add(seq)
    }
    seq += 1
  }
  return out
}

export function mergeComboAttributes(existing = [], comboAttrs = [], axisKeys = []) {
  const axisSet = new Set((axisKeys || []).map(normalizeKey).filter(Boolean))
  const kept = (Array.isArray(existing) ? existing : []).filter((attr) => {
    const key = normalizeKey(attr?.key)
    const value = String(attr?.value || '').trim()
    if (!key || !value) return false
    if (axisSet.has(key)) return false
    return true
  })
  const combo = (Array.isArray(comboAttrs) ? comboAttrs : [])
    .filter((attr) => String(attr?.key || '').trim() && String(attr?.value || '').trim())
    .map((attr) => {
      const item = {
        key: String(attr.key).trim(),
        value: String(attr.value).trim(),
      }
      if (isColorAttributeKey(item.key)) {
        const hex = normalizeHexColor(attr.hex)
        if (hex) item.hex = hex
      }
      return item
    })
  return [...combo, ...kept]
}

export function persistableImages(images = []) {
  return (Array.isArray(images) ? images : [])
    .filter((img) => img && typeof img === 'object' && img.url && !img.file)
    .map((img, index) => ({
      url: img.url,
      publicId: img.publicId || img.public_id || '',
      altText: img.altText || '',
      order: index,
      id: img.id || img.publicId || img.url || `img-${index}`,
      isMain: index === 0 ? true : Boolean(img.isMain),
    }))
}

function colorValueOf(attrs) {
  const hit = (Array.isArray(attrs) ? attrs : []).find((a) => isColorAttributeKey(a?.key) && String(a?.value || '').trim())
  return hit ? String(hit.value).trim() : ''
}

export function copyImagesForCombo(comboAttrs, records, primaryImages = []) {
  const color = colorValueOf(comboAttrs)
  if (color) {
    const sameColor = (records || []).find((rec) => {
      const recColor = colorValueOf(rec.attributes)
      return recColor && normalizeValue(recColor) === normalizeValue(color) && persistableImages(rec.images).length > 0
    })
    if (sameColor) return persistableImages(sameColor.images)
  }
  if (color) return []
  return persistableImages(primaryImages)
}

function cloneShipping(shipping) {
  if (!shipping || typeof shipping !== 'object') {
    return { weight: '', dimensions: { length: '', width: '', height: '' } }
  }
  return {
    weight: shipping.weight ?? '',
    dimensions: {
      length: shipping.dimensions?.length ?? '',
      width: shipping.dimensions?.width ?? '',
      height: shipping.dimensions?.height ?? '',
    },
  }
}

export function buildGeneratedVariantDraft({
  combo,
  productCode,
  template = {},
  images = [],
  isEdit = false,
}) {
  const base = template.price?.base ?? ''
  const sale = template.price?.sale ?? ''
  return {
    ProductCode: productCode,
    productCode: productCode,
    attributes: Array.isArray(combo?.attributes) ? combo.attributes.map((a) => ({ ...a })) : [],
    price: {
      base,
      sale,
      wholesaleBase: '',
      wholesaleSale: '',
    },
    inventory: {
      quantity: 0,
      lowStockThreshold: template.inventory?.lowStockThreshold ?? 0,
      trackInventory: true,
    },
    images: persistableImages(images),
    isActive: true,
    wholesale: false,
    minimumOrderQuantity: 1,
    channelVisibility: { ecomm: 'active', wholesale: 'draft' },
    hsnCode: template.hsnCode || '',
    taxRate: template.taxRate !== undefined && template.taxRate !== '' ? template.taxRate : '',
    isFragile: Boolean(template.isFragile),
    shipping: cloneShipping(template.shipping),
    title: template.title || '',
    description: template.description || '',
    isLocalNew: isEdit ? true : undefined,
  }
}

function primaryTemplate(formData, isEdit) {
  if (isEdit) {
    const main = formData?.variants?.[0] || {}
    return {
      price: main.price || formData.price,
      inventory: main.inventory || formData.inventory,
      hsnCode: main.hsnCode || formData.hsnCode,
      taxRate: main.taxRate ?? formData.taxRate,
      isFragile: main.isFragile ?? formData.isFragile,
      shipping: main.shipping || formData.shipping,
      title: main.title || formData.title || formData.name,
      description: main.description || formData.description,
    }
  }
  return {
    price: formData?.price,
    inventory: formData?.inventory,
    hsnCode: formData?.hsnCode,
    taxRate: formData?.taxRate,
    isFragile: formData?.isFragile,
    shipping: formData?.shipping,
    title: formData?.title || formData?.name,
    description: formData?.description,
  }
}

export function applyPlanToFormData({ formData, isEdit = false, plan }) {
  if (!plan?.ok) {
    return { ok: false, error: plan?.error || 'Could not apply combinations', formData }
  }

  const axisKeys = plan.axisKeys || []
  const next = {
    ...formData,
    variants: [...(formData.variants || [])],
    attributes: [...(formData.attributes || [])],
  }

  const applyUpdate = (update) => {
    const merged = mergeComboAttributes(update.rec.attributes, update.combo.attributes, axisKeys)
    if (isEdit) {
      const idx = update.rec.index
      if (typeof idx === 'number' && next.variants[idx]) {
        next.variants[idx] = { ...next.variants[idx], attributes: merged }
      }
      if (update.rec.isPrimary) next.attributes = merged
      return
    }
    if (update.rec.isPrimary) {
      next.attributes = merged
      return
    }
    const idx = update.rec.index
    if (typeof idx === 'number' && next.variants[idx]) {
      next.variants[idx] = { ...next.variants[idx], attributes: merged }
    }
  }

  for (const update of plan.updates || []) applyUpdate(update)

  const recordsAfterUpdates = collectExistingVariantRecords(next, { isEdit })
  const template = primaryTemplate(next, isEdit)
  const codes = allocateNextProductCodes(next, (plan.creates || []).length)
  if ((plan.creates || []).length && codes.length < plan.creates.length) {
    return {
      ok: false,
      error: 'Add a Product Code (BASE-1) before generating variants.',
      formData,
    }
  }

  const createdDrafts = []
  const templateAttrs = isEdit ? next.variants?.[0]?.attributes : next.attributes
  ;(plan.creates || []).forEach((combo, i) => {
    const images = copyImagesForCombo(combo.attributes, recordsAfterUpdates, next.images)
    const draft = buildGeneratedVariantDraft({
      combo: {
        ...combo,
        attributes: mergeComboAttributes(templateAttrs, combo.attributes, axisKeys),
      },
      productCode: codes[i],
      template,
      images,
      isEdit,
    })
    createdDrafts.push(draft)
    next.variants.push(draft)
  })

  return {
    ok: true,
    formData: next,
    createdDrafts,
    error: null,
  }
}

/**
 * Display grouping only. Parent is Color when present; otherwise the first filled attr key.
 * Unequal child counts are expected (Red may have 3 types, Green 1).
 */
export function resolveParentAxisKey(variantAttrLists = []) {
  for (const attrs of variantAttrLists) {
    const color = (Array.isArray(attrs) ? attrs : []).find(
      (attr) => isColorAttributeKey(attr?.key) && String(attr?.value || '').trim()
    )
    if (color) return String(color.key).trim()
  }
  for (const attrs of variantAttrLists) {
    const first = (Array.isArray(attrs) ? attrs : []).find(
      (attr) => String(attr?.key || '').trim() && String(attr?.value || '').trim()
    )
    if (first) return String(first.key).trim()
  }
  return 'Color'
}

export function childTypeLabel(attrs = [], parentKey = 'Color') {
  const parent = normalizeKey(parentKey)
  const parts = (Array.isArray(attrs) ? attrs : [])
    .filter((attr) => {
      const key = normalizeKey(attr?.key)
      const value = String(attr?.value || '').trim()
      if (!key || !value) return false
      if (parent && key === parent) return false
      return true
    })
    .map((attr) => String(attr.value).trim())
  return parts.join(' · ')
}

export function groupVariantsByParent(items = [], parentKey = 'Color') {
  const groups = []
  const indexByValue = new Map()
  for (const item of Array.isArray(items) ? items : []) {
    const rawValue = getAttrValue(item?.attributes, parentKey)
    const value = rawValue || 'Other'
    const mapKey = rawValue ? normalizeValue(rawValue) : '__other__'
    if (!indexByValue.has(mapKey)) {
      indexByValue.set(mapKey, groups.length)
      groups.push({
        id: `grp-${mapKey}`,
        parentKey,
        value,
        hex: getAttrHex(item?.attributes, parentKey),
        items: [],
      })
    }
    groups[indexByValue.get(mapKey)].items.push(item)
  }
  return groups
}
