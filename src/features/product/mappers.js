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

export function mapPagination(pagination, fallbackCount = 0) {
  return {
    total: toNumber(pagination?.total, fallbackCount),
    page: toNumber(pagination?.page, 1),
    limit: toNumber(pagination?.limit, fallbackCount),
    totalPages: toNumber(pagination?.totalPages, 1),
    hasNextPage: Boolean(pagination?.hasNextPage),
    hasPrevPage: Boolean(pagination?.hasPrevPage),
  }
}
