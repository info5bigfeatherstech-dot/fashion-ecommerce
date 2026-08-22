const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

const PAYMENT_STATUS_LABELS = {
  pending: 'Payment pending',
  paid: 'Paid',
  failed: 'Payment failed',
  refunded: 'Refunded',
  partially_refunded: 'Partially refunded',
}

export function formatOrderDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatOrderDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function getOrderStatusLabel(status) {
  const key = String(status || '').toLowerCase()
  return ORDER_STATUS_LABELS[key] || status || 'Unknown'
}

export function getPaymentStatusLabel(status) {
  const key = String(status || '').toLowerCase()
  return PAYMENT_STATUS_LABELS[key] || status || 'Unknown'
}

export function getOrderStatusClass(status) {
  const key = String(status || '').toLowerCase()
  const map = {
    pending: 'account-order-status--pending',
    confirmed: 'account-order-status--confirmed',
    processing: 'account-order-status--processing',
    shipped: 'account-order-status--shipped',
    out_for_delivery: 'account-order-status--shipped',
    delivered: 'account-order-status--delivered',
    cancelled: 'account-order-status--cancelled',
  }
  return map[key] || 'account-order-status--neutral'
}

export function isPaymentWindowExpired(order) {
  if (!order?.paymentHoldExpiresAt) return false
  return new Date(order.paymentHoldExpiresAt).getTime() < Date.now()
}

export function canResumeOnlinePayment(order) {
  if (!order) return false
  if (String(order.orderStatus || '').toLowerCase() !== 'pending') return false
  if (String(order.paymentStatus || '').toLowerCase() !== 'pending') return false
  if (String(order.paymentInfo?.method || order.paymentMethod || '').toLowerCase() !== 'online') {
    return false
  }
  if (Number(order.amountPaidInr) > 0.01) return false
  if (isPaymentWindowExpired(order)) return false
  return true
}

function resolveProductRef(item = {}) {
  const product = item.productId
  if (product && typeof product === 'object') return product
  return null
}

function resolveImageUrl(value) {
  if (!value) return null
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value?.url === 'string' && value.url.trim()) return value.url.trim()
  return null
}

function isOrderLineItem(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

/** API returns `item` for single-line orders and `items` for multi-line orders. */
function normalizeOrderLineItems(value) {
  if (Array.isArray(value)) {
    return value.filter(isOrderLineItem)
  }
  if (isOrderLineItem(value)) {
    return [value]
  }
  return []
}

export function getOrderItems(order = {}) {
  const fromItems = normalizeOrderLineItems(order.items)
  if (fromItems.length > 0) return fromItems

  const fromItem = normalizeOrderLineItems(order.item)
  if (fromItem.length > 0) return fromItem

  const fromLineItems = normalizeOrderLineItems(order.lineItems)
  if (fromLineItems.length > 0) return fromLineItems

  return []
}

export function getOrderItemCount(order = {}) {
  const items = getOrderItems(order)
  if (items.length > 0) {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
  }
  return Number(order.itemCount) || 0
}

export function getOrderItemName(item = {}) {
  const product = resolveProductRef(item)
  return (
    item.productName
    || item.name
    || item.title
    || product?.name
    || product?.title
    || 'Product'
  )
}

export function getOrderItemProductSlug(item = {}) {
  const product = resolveProductRef(item)
  const slug = item.slug || item.productSlug || product?.slug || null
  const normalized = slug ? String(slug).trim() : ''
  return normalized || null
}

export function getOrderItemProductHref(item = {}) {
  const slug = getOrderItemProductSlug(item)
  return slug ? `/product/${slug}` : null
}

export function getOrderItemImage(item = {}) {
  const product = resolveProductRef(item)
  const variantId = String(item.variantId || '')

  const matchedVariant = product?.variants?.find(
    (variant) => String(variant._id || variant.id) === variantId
  )

  const candidates = [
    item.image,
    item.productImage,
    item.thumbnail,
    item.thumbnailUrl,
    item.images?.[0],
    product?.images?.[0],
    matchedVariant?.images?.[0],
    product?.variants?.[0]?.images?.[0],
  ]

  for (const candidate of candidates) {
    const url = resolveImageUrl(candidate)
    if (url) return url
  }

  return null
}

export function getOrderItemVariantLabel(item = {}) {
  const product = resolveProductRef(item)
  const variantId = String(item.variantId || '')
  const variant = product?.variants?.find(
    (entry) => String(entry._id || entry.id) === variantId
  )

  const parts = [
    item.variantLabel,
    variant?.label,
    variant?.name,
    variant?.size,
    item.size,
    item.color,
    variant?.color,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' · ') : null
}

export function getOrderItemUnitPrice(item = {}) {
  return Number(
    item.priceSnapshot?.sale
    ?? item.priceSnapshot?.base
    ?? item.price
    ?? item.unitPrice
    ?? 0
  )
}

export function getOrderItemLineTotal(item = {}) {
  if (item.lineTotal != null) return Number(item.lineTotal)
  const qty = Number(item.quantity) || 1
  return getOrderItemUnitPrice(item) * qty
}

export function getOrderItemsSummary(order = {}) {
  const items = getOrderItems(order)
  if (items.length === 0) return null

  const names = items.map(getOrderItemName)
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names[0]} and ${names.length - 1} more`
}

export function mergeOrderWithDetail(order, detail) {
  if (!detail) return order
  return {
    ...order,
    ...detail,
    orderId: order.orderId || detail.orderId,
    items: getOrderItems(detail).length > 0 ? getOrderItems(detail) : getOrderItems(order),
  }
}
