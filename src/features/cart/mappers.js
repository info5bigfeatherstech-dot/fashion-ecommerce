const SIZE_KEYS = /size|capacity|fit/i
const COLOR_KEYS = /colou?r|shade/i

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function attributeValue(attributes, matcher) {
  for (const attribute of asArray(attributes)) {
    if (matcher.test(attribute?.key)) return attribute.value
  }
  return undefined
}

function pickVariant(product, variantId) {
  const variants = asArray(product?.variants)
  if (variantId) {
    const match = variants.find((variant) => String(variant._id || variant.id) === String(variantId))
    if (match) return match
  }
  return variants[0] || null
}

function variantImage(variant) {
  const images = asArray(variant?.images)
  const first = images[0]
  if (!first) return null
  if (typeof first === 'string') return first
  return first.url || null
}

/** Map one API cart line into the UI cart row shape. */
export function mapCartItem(raw) {
  if (!raw) return null

  const product = raw.product || {}
  const variantId = raw.variantId || raw.variant?._id || raw.variant?.id
  const variant = pickVariant(product, variantId)
  const attributes = asArray(variant?.attributes)
  const price = toNumber(
    raw.price?.current
    ?? raw.price?.sale
    ?? variant?.finalPrice
    ?? variant?.price?.current
    ?? product.price
  )
  const originalPrice = toNumber(
    raw.price?.base
    ?? variant?.price?.base
    ?? product.originalPrice
    ?? 0
  )
  const productId = raw.productId || product._id || product.id
  const lineId = raw._id || raw.id || `${productId}-${variantId || 'default'}`

  return {
    id: String(lineId),
    productId: productId ? String(productId) : null,
    variantId: variantId ? String(variantId) : null,
    slug: product.slug || raw.productSlug || null,
    name: product.name || product.title || 'Product',
    price,
    originalPrice: originalPrice > price ? originalPrice : null,
    image: variantImage(variant) || product.images?.[0]?.url || product.images?.[0] || null,
    productCode: product.productCode || variant?.productCode || variant?.product_code || null,
    size: attributeValue(attributes, SIZE_KEYS) || raw.size || null,
    color: attributeValue(attributes, COLOR_KEYS) || raw.color || null,
    quantity: Math.max(1, toNumber(raw.quantity, 1)),
    lineTotal: toNumber(raw.total, price * toNumber(raw.quantity, 1)),
  }
}

export function mapCart(payload) {
  const cart = payload?.cart && typeof payload.cart === 'object' ? payload.cart : payload
  if (!cart || typeof cart !== 'object') {
    return {
      id: null,
      items: [],
      totalAmount: 0,
      totalOriginalAmount: 0,
      totalDiscount: 0,
      totalDiscountPercentage: 0,
    }
  }

  const items = asArray(cart.items).map(mapCartItem).filter(Boolean)

  return {
    id: cart._id || cart.id || null,
    items,
    totalAmount: toNumber(cart.totalAmount, items.reduce((sum, item) => sum + item.lineTotal, 0)),
    totalOriginalAmount: toNumber(cart.totalOriginalAmount, 0),
    totalDiscount: toNumber(cart.totalDiscount, 0),
    totalDiscountPercentage: toNumber(cart.totalDiscountPercentage, 0),
    userType: payload?.userType || null,
    storefront: payload?.storefront || 'ecomm',
  }
}

export function toCartMergeItems(localItems = []) {
  return asArray(localItems)
    .map((item) => {
      const quantity = Math.max(1, toNumber(item.quantity, 1))
      const productId = item.productId || null
      const productSlug = item.slug || item.productSlug || null
      const variantId = item.variantId || null
      if (!variantId && !productSlug && !productId) return null
      return {
        ...(productId ? { productId: String(productId) } : {}),
        ...(productSlug ? { productSlug: String(productSlug) } : {}),
        ...(variantId ? { variantId: String(variantId) } : {}),
        quantity,
      }
    })
    .filter(Boolean)
}
