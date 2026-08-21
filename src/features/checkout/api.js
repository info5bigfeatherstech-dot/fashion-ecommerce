import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'
import { mapCheckoutSettings } from './mappers'

/** GET /api/checkout/settings */
export async function getCheckoutSettings({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.checkout.settings, { signal })
  return mapCheckoutSettings(payload)
}
