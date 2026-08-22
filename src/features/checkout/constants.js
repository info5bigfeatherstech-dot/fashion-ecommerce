/** Checkout payment state machine (parent-owned). */
export const PAYMENT_STATE = {
  IDLE: 'idle',
  INITIATED: 'initiated',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  VERIFIED: 'verified',
}

export function createCheckoutAttemptKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

export function isQuoteRefreshError(code, message = '') {
  const text = String(message || '').toLowerCase()
  return (
    code === 'QUOTE_STALE'
    || code === 'QUOTE_EXPIRED'
    || code === 'QUOTE_NOT_FOUND'
    || code === 'CART_CHANGED'
    || text.includes('pricing changed')
    || text.includes('refresh quote')
  )
}

export function isIdempotencyError(code) {
  return (
    code === 'IDEMPOTENCY_REQUEST_IN_PROGRESS'
    || code === 'IDEMPOTENCY_KEY_REUSED'
  )
}

/** UI payment method → quote API params (matches fabFE backend). */
export function quoteParamsForPaymentMethod(uiMethod) {
  if (uiMethod === 'cod') {
    return { paymentMethodHint: 'cod', paymentPlan: 'full', balanceCollection: 'online' }
  }
  if (uiMethod === 'partial') {
    return { paymentMethodHint: 'online', paymentPlan: 'advance', balanceCollection: 'cod' }
  }
  return { paymentMethodHint: 'online', paymentPlan: 'full', balanceCollection: 'online' }
}
