function asArray(value) {
  return Array.isArray(value) ? value : []
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function variantImage(variant) {
  const images = asArray(variant?.images)
  const first = images[0]
  if (!first) return null
  if (typeof first === 'string') return first
  return first.url || null
}

/** Map one wishlist entry into the UI wishlist row shape. */
export function mapWishlistItem(raw) {
  if (!raw) return null

  const product = raw.product || raw
  const variants = asArray(product.variants)
  const variant = variants[0] || null
  const productId = product._id || product.id
  if (!productId && !product.slug) return null

  const price = toNumber(
    variant?.finalPrice
    ?? variant?.price?.current
    ?? product.price
  )
  const originalPrice = toNumber(variant?.price?.base ?? product.originalPrice ?? 0)
  const image = variantImage(variant)
    || product.images?.[0]?.url
    || product.images?.[0]
    || raw.image
    || null

  return {
    id: String(productId || product.slug),
    wishlistEntryId: raw._id || raw.id || null,
    variantId: variant?._id || variant?.id || null,
    slug: product.slug || null,
    name: product.name || product.title || 'Product',
    price,
    originalPrice: originalPrice > price ? originalPrice : null,
    image,
    badge: product.badge || null,
    rating: toNumber(product.rating?.value ?? product.rating, 0),
    reviewCount: toNumber(product.rating?.count ?? product.reviewCount, 0),
    productCode: variant?.sku || product.productCode || null,
    addedAt: raw.addedAt || null,
  }
}

export function mapWishlist(payload) {
  const wishlist = payload?.wishlist && typeof payload.wishlist === 'object'
    ? payload.wishlist
    : payload

  if (!wishlist || typeof wishlist !== 'object') {
    return {
      id: null,
      products: [],
      userType: payload?.userType || null,
      storefront: payload?.storefront || 'ecomm',
    }
  }

  return {
    id: wishlist._id || wishlist.id || null,
    products: asArray(wishlist.products).map(mapWishlistItem).filter(Boolean),
    userType: payload?.userType || null,
    storefront: payload?.storefront || 'ecomm',
  }
}

export function toWishlistMergeItems(localItems = []) {
  return asArray(localItems)
    .map((item) => {
      const slug = item.slug || item.productSlug || null
      if (!slug) return null
      return {
        slug: String(slug),
        variantId: item.variantId || null,
      }
    })
    .filter(Boolean)
}
