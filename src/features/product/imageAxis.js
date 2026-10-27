/**
 * Image groups for flat SKUs.
 * Photos follow the look-changing option (Color, Fragrance, Model, …),
 * not each size/capacity row. No nested variant schema.
 */

export const SIZE_LIKE_KEY_RE = /^(size|capacity|fit|qty|quantity|volume)$/i
const COLOR_KEY_RE = /color|colour|shade/i

export function normalizeKey(key) {
  return String(key || '').trim().toLowerCase()
}

export function normalizeValue(value) {
  return String(value || '').trim().toLowerCase()
}

export function isSizeLikeKey(key) {
  return SIZE_LIKE_KEY_RE.test(String(key || '').trim())
}

export function isColorKey(key) {
  return COLOR_KEY_RE.test(String(key || '').trim())
}

export function getAttrValue(attrs, key) {
  const nk = normalizeKey(key)
  if (!nk) return ''
  const hit = (Array.isArray(attrs) ? attrs : []).find(
    (a) => normalizeKey(a?.key) === nk && String(a?.value || '').trim()
  )
  return hit ? String(hit.value).trim() : ''
}

/** Color if present; else first non-size-like key; else '' (share across the product). */
export function resolveImageAxisKey(variantAttrLists = []) {
  const lists = Array.isArray(variantAttrLists) ? variantAttrLists : []
  for (const attrs of lists) {
    const color = (Array.isArray(attrs) ? attrs : []).find(
      (attr) => isColorKey(attr?.key) && String(attr?.value || '').trim()
    )
    if (color) return String(color.key).trim()
  }
  for (const attrs of lists) {
    const look = (Array.isArray(attrs) ? attrs : []).find((attr) => {
      const key = String(attr?.key || '').trim()
      const value = String(attr?.value || '').trim()
      return key && value && !isSizeLikeKey(key) && !isColorKey(key)
    })
    if (look) return String(look.key).trim()
  }
  return ''
}

export function imageGroupToken(attrs, axisKey) {
  if (!axisKey) return '__all__'
  const value = getAttrValue(attrs, axisKey)
  if (!value) return '__ungrouped__'
  return `${normalizeKey(axisKey)}=${normalizeValue(value)}`
}

export function cloneSharedImages(images) {
  return (Array.isArray(images) ? images : [])
    .filter((img) => img && typeof img === 'object' && (img.url || img.file))
    .map((img, index) => ({ ...img, order: index }))
}

export function collectVariantAttrLists(formData) {
  const lists = []
  if (Array.isArray(formData?.attributes) && formData.attributes.length) {
    lists.push(formData.attributes)
  }
  for (const variant of Array.isArray(formData?.variants) ? formData.variants : []) {
    lists.push(variant?.attributes || [])
  }
  return lists
}

export function applyImagesToImageGroup(formData, sourceAttrs, images) {
  const lists = collectVariantAttrLists(formData)
  const axisKey = resolveImageAxisKey(lists)
  const token = imageGroupToken(sourceAttrs, axisKey)
  const shared = cloneSharedImages(images)
  const variants = (Array.isArray(formData?.variants) ? formData.variants : []).map((variant) => {
    if (imageGroupToken(variant?.attributes, axisKey) !== token) return variant
    return { ...variant, images: shared.map((img) => ({ ...img })) }
  })
  const primaryInGroup = imageGroupToken(formData?.attributes || variants[0]?.attributes, axisKey) === token
  return {
    ...formData,
    variants,
    images: primaryInGroup ? shared.map((img) => ({ ...img })) : formData?.images,
  }
}

function normalizeImageList(images) {
  return (Array.isArray(images) ? images : [])
    .map((img) => (typeof img === 'string' ? { url: img } : img))
    .filter((img) => img && (img.url || img.file))
}

export function imagesForImageGroup({
  variants = [],
  attrs = {},
  selectedAttrs = {},
  productImages = [],
  currentImages = null,
  axisKey = null,
}) {
  const own = normalizeImageList(currentImages).filter((img) => img.url)
  if (own.length) return own

  const list = Array.isArray(variants) ? variants : []
  const lists = list.map((v) => v?.attributes)
  const axis = axisKey != null ? axisKey : resolveImageAxisKey(lists)
  const selectedValue = axis && selectedAttrs && selectedAttrs[axis]
    ? String(selectedAttrs[axis]).trim()
    : getAttrValue(attrs, axis)
  const token = imageGroupToken(
    selectedValue && axis ? [{ key: axis, value: selectedValue }, ...(Array.isArray(attrs) ? attrs : [])] : attrs,
    axis
  )

  const sibling = list.find((variant) => {
    return imageGroupToken(variant?.attributes, axis) === token
      && normalizeImageList(variant?.images).some((img) => img.url)
  })
  if (sibling?.images?.length) return normalizeImageList(sibling.images)

  const product = normalizeImageList(productImages).filter((img) => img.url)
  if (product.length) return product
  return []
}
