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
    isActive: review.isActive !== false,
  }
}

export async function getProductReviewSummary(productId, { signal } = {}) {
  if (!productId) return null

  try {
    const payload = await http.get(API_ENDPOINTS.productReviews.summary(productId), { signal })
    return payload?.summary ?? payload?.data?.summary ?? null
  } catch {
    return null
  }
}

export async function getProductReviews(productId, { signal, limit = 100, page = 1 } = {}) {
  if (!productId) return []

  try {
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
  } catch {
    return []
  }
}

export async function getProductReviewsBundle(productId, { signal } = {}) {
  const [summary, reviews] = await Promise.all([
    getProductReviewSummary(productId, { signal }),
    getProductReviews(productId, { signal }),
  ])

  return { summary, reviews }
}

export async function getMyProductReview(productId, { signal } = {}) {
  if (!productId) return null

  const payload = await http.get(API_ENDPOINTS.productReviews.mine(productId), { signal })
  const review = payload?.review ?? payload?.data?.review ?? null
  if (!review) return null

  return {
    ...mapPublicReview(review),
    isActive: review.isActive !== false,
  }
}

export async function getProductReviewEligibility(productId, { signal } = {}) {
  if (!productId) return null

  const payload = await http.get(API_ENDPOINTS.productReviews.eligibility(productId), { signal })
  return payload?.eligibility ?? payload?.data?.eligibility ?? null
}

/**
 * Create a product review (stars + optional comment).
 * Cold PDP: no images. Order-linked flows may pass orderId later.
 */
export async function submitProductReview({
  productId,
  rating,
  comment = '',
  orderId = '',
} = {}) {
  const id = String(productId || '').trim()
  if (!id) throw new Error('Product is required')

  const fd = new FormData()
  fd.append('productId', id)
  fd.append('rating', String(Math.max(1, Math.min(5, Number(rating) || 0))))
  fd.append('comment', String(comment || '').trim())
  if (orderId) fd.append('orderId', String(orderId))

  return http.post(API_ENDPOINTS.productReviews.create, fd)
}
