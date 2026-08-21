import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'
import { mapDeliveryCharges, mapDeliveryCheck } from './mappers'

/** POST /api/delivery/check-delivery */
export async function checkDelivery({ pincode, cartId } = {}) {
  const payload = await http.post(API_ENDPOINTS.delivery.check, {
    pincode: String(pincode || '').trim(),
    ...(cartId ? { cartId } : {}),
  })
  return mapDeliveryCheck(payload)
}

/** GET /api/delivery/delivery-charges/:pincode?weight= */
export async function getDeliveryCharges(pincode, { weight = 1, signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.delivery.charges(pincode), {
    params: { weight },
    signal,
  })
  return mapDeliveryCharges(payload, pincode)
}
