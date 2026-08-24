import { API_ENDPOINTS } from '@/api/endpoints'
import { adminDelete, adminGet, adminPatch, adminPost, adminPut, unwrapAdmin } from './client'

export async function getAdminFreeShippingOffers({
  signal,
  page = 1,
  limit = 10,
  status = 'all',
  search = '',
} = {}) {
  const params = { page, limit }
  if (status && status !== 'all') params.status = status
  if (String(search || '').trim()) params.search = String(search).trim()
  const payload = await adminGet(API_ENDPOINTS.admin.freeShippingOffers, { signal, params })
  return payload
}

export async function getAdminFreeShippingOffer(id, { signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.freeShippingOfferById(id), { signal })
  return unwrapAdmin(payload)
}

export async function createAdminFreeShippingOffer(body) {
  const payload = await adminPost(API_ENDPOINTS.admin.freeShippingOffers, body)
  return unwrapAdmin(payload)
}

export async function updateAdminFreeShippingOffer(id, body) {
  const payload = await adminPut(API_ENDPOINTS.admin.freeShippingOfferById(id), body)
  return unwrapAdmin(payload)
}

export async function deleteAdminFreeShippingOffer(id) {
  const payload = await adminDelete(API_ENDPOINTS.admin.freeShippingOfferById(id))
  return unwrapAdmin(payload)
}

export async function toggleAdminFreeShippingOffer(id) {
  const payload = await adminPatch(API_ENDPOINTS.admin.freeShippingOfferToggle(id))
  return unwrapAdmin(payload)
}

