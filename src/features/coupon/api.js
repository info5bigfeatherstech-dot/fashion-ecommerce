import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'
import { mapAvailableCoupons, mapCouponValidation } from './mappers'

/** GET /api/coupons/available */
export async function getAvailableCoupons({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.coupons.available, { signal })
  return mapAvailableCoupons(payload)
}

/**
 * POST /api/coupons/validate
 * Validation alone does not lock the discount — pass the same code into quote later.
 */
export async function validateCoupon({
  couponCode,
  useServercart = true,
  subtotal,
} = {}) {
  const body = {
    couponCode: String(couponCode || '').trim(),
    useServercart: Boolean(useServercart),
  }

  if (!useServercart && subtotal != null) {
    body.subtotal = Number(subtotal)
  }

  const payload = await http.post(API_ENDPOINTS.coupons.validate, body)
  return mapCouponValidation(payload)
}
