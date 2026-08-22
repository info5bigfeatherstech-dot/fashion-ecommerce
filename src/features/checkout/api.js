import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'
import {
  mapCheckoutConfirm,
  mapCheckoutQuote,
  mapCheckoutSettings,
  mapPlacedOrder,
  mapVerifyPayment,
  resolveOrderEndpoint,
} from './mappers'

/** GET /api/checkout/settings */
export async function getCheckoutSettings({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.checkout.settings, { signal })
  return mapCheckoutSettings(payload)
}

/**
 * POST /api/checkout/quote
 * Required: addressId. Optional: couponCode, paymentMethodHint, paymentPlan, balanceCollection.
 */
export async function createCheckoutQuote({
  addressId,
  couponCode,
  paymentMethodHint,
  paymentPlan = 'full',
  balanceCollection = 'online',
  signal,
} = {}) {
  const body = {
    addressId: String(addressId || '').trim(),
    paymentPlan,
    balanceCollection,
  }
  const code = String(couponCode || '').trim()
  if (code) body.couponCode = code
  if (paymentMethodHint) body.paymentMethodHint = paymentMethodHint

  const payload = await http.post(API_ENDPOINTS.checkout.quote, body, { signal })
  return mapCheckoutQuote(payload)
}

/**
 * POST /api/checkout/confirm
 * Locks payment choice on the quote and returns next.payload for create-order.
 */
export async function confirmCheckoutQuote(body) {
  const payload = await http.post(API_ENDPOINTS.checkout.confirm, body)
  return mapCheckoutConfirm(payload)
}

/**
 * Create order using confirm.next — do not invent fields.
 * Uses next.createOrderEndpoint when provided.
 */
export async function createOrderFromConfirm(next, { idempotencyKey } = {}) {
  if (!next?.payload || typeof next.payload !== 'object') {
    throw new Error('Missing create-order payload from confirm')
  }

  const endpoint = resolveOrderEndpoint(
    next.createOrderEndpoint || API_ENDPOINTS.orders.items
  )

  const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined
  const payload = await http.post(endpoint, next.payload, { headers })
  return mapPlacedOrder(payload)
}

/** GET /api/public/razorpay-key */
export async function getRazorpayKey({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.public.razorpayKey, { signal })
  if (!payload?.success && !payload?.keyId) {
    throw new Error(payload?.message || 'Failed to get Razorpay key')
  }
  return payload?.keyId || payload?.data?.keyId || null
}

/** POST /api/orders/items/verify-payment */
export async function verifyRazorpayPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  orderId,
}) {
  const payload = await http.post(API_ENDPOINTS.orders.verifyPayment, {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  })
  return mapVerifyPayment(payload)
}

/** POST /api/orders/items/:orderId/abandon-online-checkout */
export async function abandonOnlineCheckout(orderId) {
  const payload = await http.post(
    API_ENDPOINTS.orders.abandonOnlineCheckout(orderId)
  )
  return payload
}
