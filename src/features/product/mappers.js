import { getDummyProductImages } from './constants'

const SIZE_KEYS = /size|capacity|fit/i
const COLOR_KEYS = /colou?r|shade|main\s*colou?r/i
const PLATING_KEYS = /plating|metal|finish|coating/i

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function collectAttributeValues(variants, productAttributes, matcher) {
  const values = []

  for (const variant of variants) {
    for (const attribute of asArray(variant.attributes)) {
      if (matcher.test(attribute.key)) values.push(attribute.value)
    }
  }

  for (const attribute of productAttributes) {
    if (matcher.test(attribute.key)) values.push(attribute.value)
  }

  return unique(values)
}

/** Variant option axes (Color, Size, …) for PDP pickers — variant attrs only.
 * Product-level-only attributes stay in composition / details, not selectors.
 */
function collectAttributeGroups(variants) {
  const groups = new Map()

  const add = (key, value) => {
    const k = String(key || '').trim()
    const v = String(value || '').trim()
    if (!k || !v) return
    if (!groups.has(k)) groups.set(k, new Set())
    groups.get(k).add(v)
  }

  for (const variant of variants) {
    for (const attribute of asArray(variant.attributes)) {
      add(attribute.key, attribute.value)
    }
  }

  return [...groups.entries()]
    .map(([key, values]) => ({
      key,
      label: key,
      values: [...values],
      isColor: COLOR_KEYS.test(key),
      isSize: SIZE_KEYS.test(key),
    }))
    .filter((group) => group.values.length > 0)
}

function collectImages(dto, variants) {
  const urls = []

  if (dto?.seo?.og_image) urls.push(dto.seo.og_image)

  for (const variant of variants) {
    const images = asArray(variant.images)
      .slice()
      .sort((a, b) => toNumber(a.order, 0) - toNumber(b.order, 0))

    for (const image of images) {
      if (image?.url) urls.push(image.url)
    }
  }

  const uniqueUrls = unique(urls)
  if (uniqueUrls.length) return uniqueUrls

  return getDummyProductImages(dto.slug || dto.id || dto._id || dto.name)
}

function resolveVariantInStock(variant) {
  if (!variant) return false

  const trackInventory = variant.inventory?.trackInventory ?? variant.inventory?.tracked
  if (trackInventory === false) {
    return variant.availability?.purchasable !== false
  }

  const qtyRaw = variant.availability?.quantity ?? variant.inventory?.quantity
  if (qtyRaw != null && qtyRaw !== '') {
    return toNumber(qtyRaw) > 0
  }

  if (typeof variant.availability?.purchasable === 'boolean') {
    return variant.availability.purchasable
  }

  return true
}

function pickPrimaryVariant(variants) {
  return (
    variants.find((variant) => variant?.isActive !== false && resolveVariantInStock(variant)) ||
    variants.find((variant) => variant?.isActive !== false) ||
    variants[0] ||
    null
  )
}

function normalizeBadgeKey(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
  if (!raw) return null
  if (raw === 'new' || raw === 'new-arrival' || raw === 'new-arrivals') return 'new'
  if (raw === 'bestseller' || raw === 'best-seller') return 'bestseller'
  if (raw === 'on-sale' || raw === 'sale') return 'sale'
  if (raw === 'limited') return 'limited'
  return null
}

/** Badge only from API fields (appliedTags / badge*) — no invented labels. */
function deriveBadge(dto) {
  const explicit =
    normalizeBadgeKey(dto.badge) ||
    normalizeBadgeKey(dto.badgeType) ||
    normalizeBadgeKey(dto.badgeLabel)
  if (explicit) return explicit

  const tags = asArray(dto.appliedTags).map((tag) => String(tag).toLowerCase())
  // Prefer first matching applied tag order that matches API intent
  for (const tag of tags) {
    const fromTag = normalizeBadgeKey(tag)
    if (fromTag) return fromTag
  }
  if (dto.isBestseller) return 'bestseller'
  return null
}

function mapVariant(variant) {
  if (!variant) return null

  const quantity = toNumber(variant.availability?.quantity ?? variant.inventory?.quantity)

  return {
    id: variant.id || variant._id,
    sku: variant.sku,
    productCode: variant.productCode || variant.product_code || null,
    title: variant.title || null,
    price: toNumber(variant.finalPrice ?? variant.price?.current),
    originalPrice: toNumber(variant.price?.base),
    inStock: resolveVariantInStock(variant),
    quantity,
    images: asArray(variant.images).map((image) => image.url).filter(Boolean),
    attributes: asArray(variant.attributes).map((attribute) => ({
      key: attribute.key,
      value: attribute.value,
    })),
  }
}

export function mapProduct(dto) {
  if (!dto) return null

  const variants = asArray(dto.variants)
  const attributes = asArray(dto.attributes)
  const primaryVariant = pickPrimaryVariant(variants)
  const mappedVariants = variants.map(mapVariant).filter(Boolean)
  const price = toNumber(dto.minPrice ?? primaryVariant?.finalPrice ?? primaryVariant?.price?.current)
  const originalPrice = toNumber(primaryVariant?.price?.base ?? dto.maxPrice)
  const images = collectImages(dto, variants)
  const categorySlug = dto.category?.slug || 'uncategorized'
  const categoryName = dto.category?.name || ''

  return {
    id: dto.id || dto._id,
    slug: dto.slug,
    name: dto.name || dto.title || 'Untitled product',
    title: dto.title || dto.name || '',
    displayTitle: String(dto.title || dto.name || 'Untitled product').trim(),
    productCode:
      dto.productCode ||
      dto.product_code ||
      primaryVariant?.productCode ||
      primaryVariant?.sku ||
      null,
    description: dto.description || '',
    brand: dto.brand || '',
    category: categorySlug,
    categoryLabel: categoryName,
    subcategory: null,
    price,
    originalPrice: originalPrice > price ? originalPrice : null,
    badge: deriveBadge(dto),
    tags: asArray(dto.appliedTags),
    isTodayDeal:
      asArray(dto.appliedTags).some(
        (tag) => String(tag).toLowerCase() === 'today-arrival'
      ) || Boolean(dto.isTodayDeal || dto.todayDeal),
    rating: toNumber(dto.rating?.value, 0),
    reviewCount: toNumber(dto.rating?.count, 0),
    sizes: collectAttributeValues(variants, attributes, SIZE_KEYS),
    colors: collectAttributeValues(variants, attributes, COLOR_KEYS),
    platings: collectAttributeValues(variants, attributes, PLATING_KEYS),
    optionGroups: collectAttributeGroups(variants),
    images,
    inStock: mappedVariants.length
      ? mappedVariants.some((variant) => variant.inStock)
      : Boolean(dto.inStock ?? resolveVariantInStock(primaryVariant)),
    isFeatured: Boolean(dto.isFeatured),
    soldCount: toNumber(dto.soldInfo?.count),
    soldLabel: dto.soldLabel || null,
    fomoLabel: dto.fomoLabel || null,
    createdAt: dto.createdAt || null,
    composition: attributes.map((item) => `${item.key}: ${item.value}`).join(' · ') || null,
    care: null,
    ingredients: null,
    variants: mappedVariants,
  }
}

export function mapProductList(items) {
  return asArray(items).map(mapProduct).filter(Boolean)
}

function attributeValue(attributes, matcher) {
  for (const attribute of asArray(attributes)) {
    if (matcher.test(attribute.key)) return attribute.value
  }
  return undefined
}

function attrKeyEquals(a, b) {
  return String(a || '').toLowerCase() === String(b || '').toLowerCase()
}

function attrValueEquals(a, b) {
  return String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase()
}

/**
 * Score a variant against selected attributes.
 * Rejects variants that contradict any selected key they define
 * (e.g. Color=black cannot win when Color=grey is selected, even if Size matches).
 */
function scoreVariantAgainstAttrs(variant, entries) {
  const variantAttrs = asArray(variant?.attributes)
  let score = 0

  for (const [key, value] of entries) {
    const match = variantAttrs.find((a) => attrKeyEquals(a.key, key))
    if (!match) continue
    if (!attrValueEquals(match.value, value)) {
      return { ok: false, score: 0 }
    }
    score += 1
  }

  return { ok: true, score }
}

/**
 * Whether any in-stock variant can satisfy this attribute value
 * together with the rest of the current selection.
 */
export function isAttrValueInStock(product, selectedAttrs = {}, key, value) {
  const variants = asArray(product?.variants)
  if (!variants.length || key == null || value == null) return false

  const trial = { ...(selectedAttrs || {}), [key]: value }
  const entries = Object.entries(trial).filter(([, v]) => v != null && String(v).trim() !== '')

  return variants.some((variant) => {
    if (!variant?.inStock) return false
    const hasValue = asArray(variant.attributes).some(
      (a) => attrKeyEquals(a.key, key) && attrValueEquals(a.value, value)
    )
    if (!hasValue) return false
    const { ok, score } = scoreVariantAgainstAttrs(variant, entries)
    return ok && score > 0
  })
}

/**
 * Resolve a variant from mapped product.variants using selected attrs / size / color.
 * Prefers an exact attribute match (even if out of stock) so OOS colors/sizes stay selected.
 * Product-level-only attrs (not present on any variant) are ignored for matching.
 */
export function resolveVariant(product, { size, color, variantId, attrs } = {}) {
  const variants = asArray(product?.variants)
  if (!variants.length) return null

  const fallback = () => variants.find((v) => v.inStock) || variants[0] || null

  if (variantId) {
    const byId = variants.find((variant) => String(variant.id) === String(variantId))
    if (byId) return byId
  }

  const selected = { ...(attrs && typeof attrs === 'object' ? attrs : {}) }
  if (size != null && size !== '') {
    const sizeGroup = asArray(product?.optionGroups).find((g) => g.isSize)
    if (sizeGroup?.key) selected[sizeGroup.key] = size
    else if (!Object.keys(selected).some((k) => SIZE_KEYS.test(k))) selected.Size = size
  }
  if (color != null && color !== '') {
    const colorGroup = asArray(product?.optionGroups).find((g) => g.isColor)
    if (colorGroup?.key) selected[colorGroup.key] = color
    else if (!Object.keys(selected).some((k) => COLOR_KEYS.test(k))) selected.Color = color
  }

  const knownKeys = new Set()
  for (const variant of variants) {
    for (const attribute of asArray(variant.attributes)) {
      if (attribute?.key) knownKeys.add(String(attribute.key).toLowerCase())
    }
  }

  const entries = Object.entries(selected).filter(([key, v]) => {
    if (v == null || String(v).trim() === '') return false
    // No variant-level axes → ignore selection and use primary stocked variant.
    if (knownKeys.size === 0) return false
    // Ignore product-only attributes that no variant defines (e.g. Material on product).
    if (!knownKeys.has(String(key).toLowerCase())) return false
    return true
  })

  if (!entries.length) return fallback()

  const exact = variants.find((variant) => {
    const variantAttrs = asArray(variant.attributes)
    if (!variantAttrs.length) return false
    return (
      entries.length === variantAttrs.length &&
      entries.every(([key, value]) =>
        variantAttrs.some((a) => attrKeyEquals(a.key, key) && attrValueEquals(a.value, value))
      )
    )
  })
  if (exact) return exact

  // Prefer full coverage of selected keys when the variant defines them
  const fullCoverMatches = variants.filter((variant) => {
    const { ok, score } = scoreVariantAgainstAttrs(variant, entries)
    return ok && score === entries.length
  })
  if (fullCoverMatches.length) {
    return fullCoverMatches.find((v) => v.inStock) || fullCoverMatches[0]
  }

  let best = null
  let bestScore = -1
  let bestInStock = null
  let bestInStockScore = -1
  for (const variant of variants) {
    const { ok, score } = scoreVariantAgainstAttrs(variant, entries)
    if (!ok || score <= 0) continue
    if (score > bestScore) {
      bestScore = score
      best = variant
    }
    if (variant.inStock && score > bestInStockScore) {
      bestInStockScore = score
      bestInStock = variant
    }
  }
  // Prefer the matching OOS/exact attr selection over a different in-stock color.
  // Only prefer in-stock when it matches at least as well as the best overall.
  if (bestInStock && bestInStockScore >= bestScore) return bestInStock
  if (best) return best

  // Last resort: ignore size-like keys and match color (or other axes) only
  const nonSizeEntries = entries.filter(([key]) => !SIZE_KEYS.test(key))
  if (nonSizeEntries.length && nonSizeEntries.length < entries.length) {
    const colorMatches = []
    for (const variant of variants) {
      const { ok, score } = scoreVariantAgainstAttrs(variant, nonSizeEntries)
      if (ok && score > 0) colorMatches.push(variant)
    }
    if (colorMatches.length) {
      return colorMatches.find((v) => v.inStock) || colorMatches[0]
    }
  }

  // No variant-axis match (e.g. variants have no attributes) — use primary stocked variant.
  return fallback()
}

/** Gallery URLs for the active selection — never mix other colors' images. */
export function resolveDisplayImages(product, selectedVariant, selectedAttrs = {}) {
  if (selectedVariant?.images?.length) return selectedVariant.images

  const colorGroup = asArray(product?.optionGroups).find((g) => g.isColor)
  const selectedColor = colorGroup ? selectedAttrs[colorGroup.key] : null
  if (selectedColor) {
    const sameColor = asArray(product?.variants).find((variant) => {
      const hasColor = asArray(variant.attributes).some(
        (a) => COLOR_KEYS.test(a.key) && attrValueEquals(a.value, selectedColor)
      )
      return hasColor && asArray(variant.images).length > 0
    })
    if (sameColor?.images?.length) return sameColor.images
  }

  // Fall back to product-level gallery or image if variant does not specify images
  const productImages = asArray(product?.images).filter(Boolean)
  if (productImages.length > 0) return productImages
  if (product?.image) return [product.image]

  return []
}

export function resolveVariantId(product, options = {}) {
  return resolveVariant(product, options)?.id || null
}

/** Normalize a single product payload from by-slug / detailed-by-id routes. */
export function extractProduct(payload) {
  if (!payload) return null
  if (Array.isArray(payload)) return mapProduct(payload[0]) || null
  if (typeof payload !== 'object') return null

  const candidates = [
    payload.product,
    payload.data?.product,
    payload.data,
    payload,
  ]

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue
    if (candidate.slug || candidate._id || candidate.id || candidate.name) {
      return mapProduct(candidate)
    }
  }

  return null
}

/** Normalize list payloads from category / related / catalog routes. */
export function extractProductList(payload) {
  if (Array.isArray(payload)) return mapProductList(payload)
  if (!payload || typeof payload !== 'object') return []

  const candidates = [
    payload.products,
    payload.related,
    payload.relatedProducts,
    payload.data?.products,
    payload.data?.related,
    payload.data?.relatedProducts,
    payload.data,
    payload.items,
    payload.results,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return mapProductList(candidate)
  }

  return []
}

export function mapPagination(pagination, fallbackCount = 0) {
  const total = toNumber(pagination?.total, fallbackCount)
  const page = toNumber(pagination?.page, 1)
  const limit = toNumber(pagination?.limit, fallbackCount || 12)
  const totalPages = toNumber(
    pagination?.totalPages,
    limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1
  )

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage:
      pagination?.hasNextPage != null
        ? Boolean(pagination.hasNextPage)
        : page < totalPages,
    hasPrevPage:
      pagination?.hasPrevPage != null
        ? Boolean(pagination.hasPrevPage)
        : page > 1,
  }
}
