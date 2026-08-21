import { getDummyProductImages } from './constants'

const SIZE_KEYS = /size|capacity|fit/i
const COLOR_KEYS = /colou?r|shade/i
const NEW_ARRIVAL_WINDOW_MS = 1000 * 60 * 60 * 24 * 45

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

function isRecent(isoDate) {
  if (!isoDate) return false
  const created = new Date(isoDate).getTime()
  if (Number.isNaN(created)) return false
  return Date.now() - created <= NEW_ARRIVAL_WINDOW_MS
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

function pickPrimaryVariant(variants) {
  return (
    variants.find((variant) => variant?.isActive !== false && variant?.availability?.purchasable) ||
    variants.find((variant) => variant?.isActive !== false) ||
    variants[0] ||
    null
  )
}

function deriveBadge(dto) {
  const tags = asArray(dto.appliedTags)
  if (tags.includes('on-sale') || dto.maxDiscountPercentage >= 40) return 'limited'
  if (dto.isFeatured) return 'bestseller'
  if (isRecent(dto.createdAt)) return 'new'
  return null
}

function mapVariant(variant) {
  if (!variant) return null

  return {
    id: variant.id || variant._id,
    sku: variant.sku,
    productCode: variant.productCode || variant.product_code || null,
    title: variant.title || null,
    price: toNumber(variant.finalPrice ?? variant.price?.current),
    originalPrice: toNumber(variant.price?.base),
    inStock: Boolean(variant.availability?.purchasable),
    quantity: toNumber(variant.availability?.quantity ?? variant.inventory?.quantity),
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
    rating: toNumber(dto.rating?.value, 0),
    reviewCount: toNumber(dto.rating?.count, 0),
    sizes: collectAttributeValues(variants, attributes, SIZE_KEYS),
    colors: collectAttributeValues(variants, attributes, COLOR_KEYS),
    images,
    inStock: Boolean(dto.inStock ?? primaryVariant?.availability?.purchasable),
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

/**
 * Resolve a variant from mapped product.variants using selected size/color.
 * Falls back to the first variant when size/color are not provided or unmatched.
 */
export function resolveVariant(product, { size, color, variantId } = {}) {
  const variants = asArray(product?.variants)
  if (!variants.length) return null

  if (variantId) {
    const byId = variants.find((variant) => String(variant.id) === String(variantId))
    if (byId) return byId
  }

  const sizeStr = size != null ? String(size) : null
  const colorStr = color != null ? String(color) : null

  if (sizeStr != null || colorStr != null) {
    const matched = variants.find((variant) => {
      const variantSize = attributeValue(variant.attributes, SIZE_KEYS)
      const variantColor = attributeValue(variant.attributes, COLOR_KEYS)
      if (sizeStr != null && variantSize != null && String(variantSize) !== sizeStr) return false
      if (colorStr != null && variantColor != null && String(variantColor) !== colorStr) return false
      if (sizeStr != null && variantSize == null) return false
      if (colorStr != null && variantColor == null) return false
      return true
    })
    if (matched) return matched
  }

  return variants[0] || null
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
