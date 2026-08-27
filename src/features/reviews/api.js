import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'

function mapPublicReview(review) {
  if (!review) return null

  return {
    id: review._id || review.id,
    author: review.displayName || review.author || 'Customer',
    rating: Math.max(0, Math.min(5, Number(review.rating) || 0)),
    comment: String(review.comment || '').trim(),
    images: Array.isArray(review.images) ? review.images : [],
    verifiedPurchase: Boolean(review.verifiedPurchase),
    createdAt: review.createdAt || null,
    source: review.source || null,
  }
}

export async function getProductReviewSummary(productId, { signal } = {}) {
  if (!productId) return null

  const payload = await http.get(API_ENDPOINTS.productReviews.summary(productId), { signal })
  return payload?.summary ?? payload?.data?.summary ?? null
}

export async function getProductReviews(productId, { signal, limit = 100, page = 1 } = {}) {
  if (!productId) return []

  const payload = await http.get(API_ENDPOINTS.productReviews.list(productId), {
    signal,
    params: { limit, page },
  })

  const raw = payload?.reviews ?? payload?.data?.reviews ?? payload?.data ?? []
  const list = Array.isArray(raw) ? raw : []

  return list
    .filter((review) => review?.isActive !== false)
    .map(mapPublicReview)
    .filter(Boolean)
}

export async function getProductReviewsBundle(productId, { signal } = {}) {
  const [summary, reviews] = await Promise.all([
    getProductReviewSummary(productId, { signal }),
    getProductReviews(productId, { signal }),
  ])

  return { summary, reviews }
}
