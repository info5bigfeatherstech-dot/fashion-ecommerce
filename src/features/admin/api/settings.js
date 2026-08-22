import { API_ENDPOINTS, STOREFRONT } from '@/api/endpoints'
import { adminGet, adminPost, adminPut, unwrapAdmin } from './client'

const storefrontHeaders = { 'X-Storefront': STOREFRONT }

export async function getAdminCheckoutSettings({ signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.checkout.adminSettings, {
    signal,
    headers: storefrontHeaders,
  })
  return unwrapAdmin(payload)
}

export async function updateAdminCheckoutSettings(body) {
  const payload = await adminPut(
    API_ENDPOINTS.checkout.adminSettings,
    body,
    { headers: storefrontHeaders }
  )
  return unwrapAdmin(payload)
}

export async function getAdminShippingSettings({ signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.shippingSettings, { signal })
  return unwrapAdmin(payload)
}

export async function updateAdminShippingSettings(body) {
  const payload = await adminPut(API_ENDPOINTS.admin.shippingSettings, body)
  return unwrapAdmin(payload)
}

export async function testAdminShippingConnection(body = {}) {
  const payload = await adminPost(API_ENDPOINTS.admin.shippingTest, body)
  return unwrapAdmin(payload)
}
