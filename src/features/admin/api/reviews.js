import { API_ENDPOINTS } from '@/api/endpoints'
import { adminDelete, adminGet, adminPatch, adminPost, adminPut } from './client'

export async function getAdminProductReviews({
  signal,
  page = 1,
  limit = 20,
  source = 'admin',
} = {}) {
  return adminGet(API_ENDPOINTS.admin.productReviews, {
    signal,
    params: { page, limit, source },
  })
}

export async function resolveAdminProductByVariantCode(code, { signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.productByVariantCode(code), { signal })
  return payload
}

export async function createAdminGeneratedReview(body) {
  return adminPost(API_ENDPOINTS.admin.productReviewsGenerated, body)
}

export async function updateAdminGeneratedReview(id, body) {
  return adminPut(API_ENDPOINTS.admin.productReviewGeneratedById(id), body)
}

export async function deleteAdminGeneratedReview(id) {
  return adminDelete(API_ENDPOINTS.admin.productReviewGeneratedById(id))
}

export async function patchAdminProductReviewStatus(id, { isActive }) {
  return adminPatch(API_ENDPOINTS.admin.productReviewStatus(id), { isActive })
}
