import { API_ENDPOINTS } from '@/api/endpoints'
import { adminDelete, adminGet, adminPatch, adminPost, adminPut, unwrapAdmin } from './client'

/** Normalize list payloads that may be flat or nested under `data`. */
function normalizeReviewsPayload(payload) {
  if (payload?.success === false) return payload
  const unwrapped = unwrapAdmin(payload)
  // Flat fabFE shape: { success, reviews, pagination } — keep as-is when already unwrapped
  if (Array.isArray(unwrapped?.reviews) || unwrapped?.pagination) {
    return unwrapped
  }
  // Rare: { success, data: { reviews, pagination } } already handled by unwrapAdmin
  // Fallback if unwrap left the outer shell
  if (Array.isArray(payload?.reviews) || payload?.pagination) {
    return payload
  }
  return unwrapped
}

export async function getAdminProductReviews({
  signal,
  page = 1,
  limit = 20,
  source = 'admin',
} = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.productReviews, {
    signal,
    params: { page, limit, source },
  })
  return normalizeReviewsPayload(payload)
}

export async function resolveAdminProductByVariantCode(code, { signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.productByVariantCode(code), { signal })
  if (payload?.success === false) return payload
  return unwrapAdmin(payload)
}

export async function createAdminGeneratedReview(body) {
  const payload = await adminPost(API_ENDPOINTS.admin.productReviewsGenerated, body)
  if (payload?.success === false) return payload
  return unwrapAdmin(payload)
}

export async function updateAdminGeneratedReview(id, body) {
  const payload = await adminPut(API_ENDPOINTS.admin.productReviewGeneratedById(id), body)
  if (payload?.success === false) return payload
  return unwrapAdmin(payload)
}

export async function deleteAdminGeneratedReview(id) {
  const payload = await adminDelete(API_ENDPOINTS.admin.productReviewGeneratedById(id))
  if (payload?.success === false) return payload
  return unwrapAdmin(payload)
}

export async function patchAdminProductReviewStatus(id, { isActive }) {
  const payload = await adminPatch(API_ENDPOINTS.admin.productReviewStatus(id), { isActive })
  if (payload?.success === false) return payload
  return unwrapAdmin(payload)
}
