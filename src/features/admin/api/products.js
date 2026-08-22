import { API_ENDPOINTS } from '@/api/endpoints'
import { adminDelete, adminGet, adminPatch, unwrapAdmin } from './client'

export async function getAdminProductsAll({ signal, page = 1, limit = 50, search = '' } = {}) {
  const params = { page, limit }
  if (String(search || '').trim()) params.search = String(search).trim()
  const payload = await adminGet(API_ENDPOINTS.admin.productsAll, { signal, params })
  return payload
}

export async function getAdminProductsActiveCount({ signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.productsActive, { signal })
  return unwrapAdmin(payload)
}

export async function getAdminProductsLowStock({ signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.productsLowStock, { signal })
  return unwrapAdmin(payload)
}

export async function getAdminProductsArchived({ signal, page = 1, limit = 50 } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.productsArchived, {
    signal,
    params: { page, limit },
  })
  return payload
}

export async function restoreAdminProduct(slug) {
  const payload = await adminPatch(API_ENDPOINTS.admin.productRestore(slug))
  return unwrapAdmin(payload)
}

export async function hardDeleteAdminProduct(slug) {
  const payload = await adminDelete(API_ENDPOINTS.admin.productHardDelete(slug))
  return unwrapAdmin(payload)
}

export async function toggleAdminProductStatus(slug, isActive) {
  const payload = await adminPost(API_ENDPOINTS.admin.productBySlug(slug), { isActive })
  return unwrapAdmin(payload)
}
