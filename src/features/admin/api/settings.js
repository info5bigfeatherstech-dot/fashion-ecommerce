import { API_ENDPOINTS, STOREFRONT } from '@/api/endpoints'
import { adminDelete, adminGet, adminPost, adminPut, unwrapAdmin } from './client'

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

export async function getAdminShipmozoWarehouses({ signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.shippingWarehouses, { signal })
  const list = payload?.warehouses || unwrapAdmin(payload)?.warehouses || []
  return Array.isArray(list) ? list : []
}

export async function getAdminShipmozoLabelSettings({ signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.shipmozoLabelSettings, { signal })
  if (payload?.success === false) {
    throw new Error(payload?.message || 'Could not load label settings')
  }
  return unwrapAdmin(payload)
}

export async function updateAdminShipmozoLabelSettings(settings) {
  const payload = await adminPut(API_ENDPOINTS.admin.shipmozoLabelSettings, { settings })
  if (payload?.success === false) {
    throw new Error(payload?.message || 'Could not save label settings')
  }
  return unwrapAdmin(payload)
}

export async function previewAdminShipmozoLabelSettings(settings) {
  const axiosClient = (await import('@/api/axiosClient')).default
  const response = await axiosClient.request({
    method: 'POST',
    url: API_ENDPOINTS.admin.shipmozoLabelSettingsPreview,
    data: { settings },
    responseType: 'text',
    transformResponse: [(data) => data],
    useAdminAuth: true,
    timeout: 60000,
  })
  const html = typeof response.data === 'string' ? response.data : String(response.data || '')
  if (!html.includes('<') && html.includes('{')) {
    let message = 'Preview did not return a label'
    try {
      const parsed = JSON.parse(html)
      if (parsed?.message) message = parsed.message
    } catch {
      /* keep default */
    }
    throw new Error(message)
  }
  return html
}

export async function uploadAdminShipmozoLabelLogo(file) {
  const form = new FormData()
  form.append('logo', file)
  const payload = await adminPost(API_ENDPOINTS.admin.shipmozoLabelSettingsLogo, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  if (payload?.success === false) {
    throw new Error(payload?.message || 'Logo upload failed')
  }
  return unwrapAdmin(payload)
}

export async function deleteAdminShipmozoLabelLogo() {
  const payload = await adminDelete(API_ENDPOINTS.admin.shipmozoLabelSettingsLogo)
  if (payload?.success === false) {
    throw new Error(payload?.message || 'Could not remove logo')
  }
  return unwrapAdmin(payload)
}
