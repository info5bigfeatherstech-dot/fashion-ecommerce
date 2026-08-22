import { quoteParamsForPaymentMethod } from './constants'

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function mapCheckoutSettings(payload) {
  const raw = payload?.data && typeof payload.data === 'object' ? payload.data : payload

  return {
    storefront: raw?.storefront || 'ecomm',
    codEnabled: raw?.codEnabled !== false,
    partialPaymentEnabled: Boolean(raw?.partialPaymentEnabled),
    partialPaymentPercent: Math.min(100, Math.max(0, toNumber(raw?.partialPaymentPercent, 0))),
  }
}

export function mapCheckoutQuote(payload) {
  const raw = payload?.data && typeof payload.data === 'object' && !payload.quoteId
    ? payload.data
    : payload

  const policy = mapCheckoutSettings({ data: raw?.checkoutPolicy || raw?.policy })

  return {
    quoteId: raw?.quoteId || raw?._id || raw?.id || null,
    isDeliverable: raw?.isDeliverable !== false,
    codAvailable: Boolean(raw?.codAvailable ?? policy.codEnabled),
    fullCodAvailable: Boolean(raw?.fullCodAvailable ?? raw?.codAvailable ?? policy.codEnabled),
    partialBalanceCodAvailable: Boolean(
      raw?.partialBalanceCodAvailable
      ?? (policy.partialPaymentEnabled && policy.codEnabled)
    ),
    checkoutPolicy: policy,
    deliveryEstimate: raw?.deliveryEstimate || raw?.estimatedDelivery || null,
    courierName: raw?.courierName || null,
    pincode: raw?.pincode ? String(raw.pincode) : null,
    itemCount: toNumber(raw?.itemCount, 0),
    itemsSubtotal: toNumber(raw?.itemsSubtotal, 0),
    promotionDiscount: toNumber(raw?.promotionDiscount, 0),
    deliveryCharges: toNumber(raw?.deliveryCharges, 0),
    taxes: toNumber(raw?.taxes, 0),
    amountPayable: toNumber(raw?.amountPayable, 0),
    includesShippingAndHandling: Boolean(raw?.includesShippingAndHandling),
    couponApplied: raw?.couponApplied || raw?.couponCode || null,
    quoteExpiresAt: raw?.quoteExpiresAt || null,
    cartFingerprint: raw?.cartFingerprint || null,
    demoMockShipping: Boolean(raw?.demoMockShipping),
    success: raw?.success !== false,
  }
}

export function mapCheckoutConfirm(payload) {
  const raw = payload?.data && typeof payload.data === 'object' && !payload.quoteId
    ? payload.data
    : payload

  const totalsRaw = raw?.totals || {}
  const next = raw?.next && typeof raw.next === 'object' ? raw.next : null

  return {
    quoteId: raw?.quoteId || null,
    validated: Boolean(raw?.validated ?? raw?.success),
    paymentMethod: raw?.paymentMethod || null,
    paymentPlan: raw?.paymentPlan || null,
    balanceCollection: raw?.balanceCollection || null,
    checkoutPolicy: mapCheckoutSettings({ data: raw?.checkoutPolicy }),
    codAvailable: Boolean(raw?.codAvailable),
    fullCodAvailable: Boolean(raw?.fullCodAvailable),
    partialBalanceCodAvailable: Boolean(raw?.partialBalanceCodAvailable),
    totals: {
      itemCount: toNumber(totalsRaw.itemCount, 0),
      itemsSubtotal: toNumber(totalsRaw.itemsSubtotal, 0),
      promotionDiscount: toNumber(totalsRaw.promotionDiscount, 0),
      deliveryCharges: toNumber(totalsRaw.deliveryCharges, 0),
      taxes: toNumber(totalsRaw.taxes, 0),
      amountPayable: toNumber(totalsRaw.amountPayable, 0),
    },
    next: next
      ? {
          createOrderEndpoint: next.createOrderEndpoint || '/api/orders/items',
          payload: next.payload && typeof next.payload === 'object' ? next.payload : {},
        }
      : null,
    success: raw?.success !== false,
  }
}

/**
 * Map Checkout UI payment choice → confirm API body.
 * Advance % is never trusted from the client — server uses checkoutPolicy.
 */
export function toConfirmPaymentBody(uiMethod, quote) {
  const quoteId = quote?.quoteId
  if (!quoteId) return null

  const params = quoteParamsForPaymentMethod(uiMethod)

  if (uiMethod === 'cod') {
    return {
      quoteId,
      paymentMethod: 'cod',
      paymentPlan: params.paymentPlan,
      balanceCollection: params.balanceCollection,
    }
  }

  const body = {
    quoteId,
    paymentMethod: 'online',
    paymentPlan: params.paymentPlan,
    balanceCollection: params.balanceCollection,
  }

  if (
    params.paymentPlan !== 'full'
    && quote?.checkoutPolicy?.partialPaymentEnabled
  ) {
    const percent = quote.checkoutPolicy.partialPaymentPercent
    if (percent != null && Number.isFinite(Number(percent))) {
      body.paymentAdvancePercent = Number(percent)
    }
  }

  return body
}

function mapPlacedOrderSummary(order) {
  if (!order || typeof order !== 'object') return null

  return {
    orderId: order.orderId || order.id || null,
    totalAmount: toNumber(order.totalAmount, 0),
    subtotal: toNumber(order.subtotal ?? order.itemsSubtotal, 0),
    tax: toNumber(order.tax ?? order.taxes, 0),
    discount: toNumber(order.discount ?? order.promotionDiscount, 0),
    orderStatus: order.orderStatus || null,
    paymentStatus: order.paymentStatus || null,
    balanceDueInr: toNumber(order.balanceDueInr, 0),
    onlinePaymentMode: order.onlinePaymentMode || null,
    paymentAdvancePercent: order.paymentAdvancePercent ?? null,
  }
}

/** Map placed order + Razorpay create response. */
export function mapPlacedOrder(payload) {
  const raw = payload?.order ? payload : { order: payload?.data || payload }
  const order = mapPlacedOrderSummary(raw?.order)

  return {
    order,
    razorpayOrder: raw?.razorpayOrder || null,
    razorpayErrorDetail: raw?.razorpayErrorDetail || null,
    appliedCoupon: raw?.appliedCoupon || null,
    paymentMethod: raw?.paymentMethod || null,
    idempotentReplay: Boolean(raw?.idempotentReplay),
    success: raw?.success !== false,
    message: raw?.message || null,
    raw: payload,
  }
}

/** True when create-order response is COD (no Razorpay step). */
export function isCodPlacedOrder(orderResult) {
  if (!orderResult) return false
  if (orderResult.paymentMethod === 'online') return false
  if (orderResult.paymentMethod === 'cod') return true
  return !orderResult.razorpayOrder?.id
}

export function mapVerifyPayment(payload) {
  const raw = payload?.data && typeof payload.data === 'object' ? payload.data : payload
  return {
    order: raw?.order || null,
    success: raw?.success !== false,
    message: raw?.message || 'Payment verified',
  }
}

const API_FALLBACK_ORDERS = '/orders/items'

export function isQuoteExpired(quote, now = Date.now()) {
  if (!quote?.quoteExpiresAt) return false
  const expires = new Date(quote.quoteExpiresAt).getTime()
  if (Number.isNaN(expires)) return false
  return expires <= now
}

/** Normalize next.createOrderEndpoint to a path under our /api baseURL. */
export function resolveOrderEndpoint(path) {
  const raw = String(path || API_FALLBACK_ORDERS).trim()
  if (!raw) return API_FALLBACK_ORDERS
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const url = new URL(raw)
      const pathname = url.pathname.replace(/^\/api(?=\/)/, '')
      return pathname || API_FALLBACK_ORDERS
    } catch {
      return API_FALLBACK_ORDERS
    }
  }
  return raw.replace(/^\/api(?=\/)/, '') || API_FALLBACK_ORDERS
}
