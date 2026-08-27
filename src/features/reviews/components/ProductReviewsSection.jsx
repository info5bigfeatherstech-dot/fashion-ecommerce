import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import {
  getBlendedStarDistribution,
  getProductRatingDisplay,
} from '@/lib/productRatingDisplay'
import {
  useMyProductReview,
  useProductReviews,
  useSubmitProductReview,
} from '@/features/reviews/hooks'
import { StarRatingInput } from '@/features/reviews/components/StarRatingInput'
import { useAppStore } from '@/store'

function formatReviewDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function ReviewCard({ review }) {
  const images = Array.isArray(review.images) ? review.images : []
  const initial = review.author?.charAt(0)?.toUpperCase() || '?'

  return (
    <li className="pdp-reviews__item">
      <div className="pdp-reviews__avatar" aria-hidden="true">
        {initial}
      </div>
      <div className="pdp-reviews__body">
        <div className="pdp-reviews__meta">
          <strong className="pdp-reviews__author">{review.author}</strong>
          {review.verifiedPurchase ? (
            <span className="pdp-reviews__verified">Verified purchase</span>
          ) : null}
        </div>
        <div className="pdp-reviews__stars" aria-label={`${review.rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={13}
              fill={i < Math.round(review.rating) ? 'currentColor' : 'none'}
            />
          ))}
          {review.createdAt ? (
            <span className="pdp-reviews__date">{formatReviewDate(review.createdAt)}</span>
          ) : null}
        </div>
        {review.comment ? (
          <p className="pdp-reviews__comment">{review.comment}</p>
        ) : (
          <p className="pdp-reviews__comment pdp-reviews__comment--muted">
            Rated {review.rating} stars
          </p>
        )}
        {images.length > 0 ? (
          <div className="pdp-reviews__photos">
            {images.map((image, index) => {
              const url = image?.url || image?.secure_url || image
              if (!url) return null
              return (
                <img
                  key={`${review.id}-${index}`}
                  src={url}
                  alt=""
                  loading="lazy"
                  className="pdp-reviews__photo"
                />
              )
            })}
          </div>
        ) : null}
      </div>
    </li>
  )
}

/** Summary + write form — sits under the gallery on the PDP. */
export function ProductReviewCompose({ product, filterStar = null, onFilterStarChange }) {
  const productId = product?.id
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const openAuthModal = useAppStore((s) => s.openAuthModal)
  const { data, isLoading } = useProductReviews(productId)
  const { data: myReview } = useMyProductReview(productId)
  const submitReview = useSubmitProductReview(productId)

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const reviewSummary = data?.summary ?? null
  const reviews = data?.reviews ?? []

  const ratingDisplay = useMemo(
    () => getProductRatingDisplay(product, reviewSummary),
    [product, reviewSummary]
  )

  const starDistribution = useMemo(
    () => getBlendedStarDistribution(product, reviews),
    [product, reviews]
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!productId) return

    if (!isAuthenticated) {
      openAuthModal({
        redirectTo: product?.slug ? `/product/${product.slug}` : '/account/cart',
        mode: 'login',
      })
      toast.info('Please log in to write a review')
      return
    }

    if (myReview?.id) {
      toast.info('You’ve already submitted a review for this product.')
      return
    }

    if (!rating) {
      toast.error('Please select a star rating')
      return
    }

    try {
      await submitReview.mutateAsync({ rating, comment })
      toast.success('Thanks! Your review will appear after moderation.')
      setRating(0)
      setComment('')
    } catch (err) {
      toast.error(err?.message || 'Could not save review')
    }
  }

  if (!productId) return null

  return (
    <section
      id="product-reviews-write"
      className="pdp-reviews-compose"
      aria-labelledby="pdp-reviews-compose-heading"
    >
      <div className="pdp-reviews-compose__card">
        <div className="pdp-reviews-compose__summary">
          <h2 id="pdp-reviews-compose-heading" className="pdp-reviews-compose__title">
            Customer reviews
          </h2>

          {isLoading ? (
            <p className="pdp-reviews-compose__muted">Loading reviews…</p>
          ) : (
            <>
              <div className="pdp-reviews-compose__score">
                <span className="pdp-reviews-compose__score-value">
                  {Number(ratingDisplay.average).toFixed(1)}
                </span>
                <div className="pdp-reviews-compose__score-stars" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      fill={i < Math.round(ratingDisplay.average) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <span className="pdp-reviews-compose__score-count">
                  {ratingDisplay.count}{' '}
                  {ratingDisplay.count === 1 ? 'rating' : 'ratings'}
                </span>
              </div>

              <div className="pdp-reviews-compose__bars">
                {starDistribution.map(({ star, pct }) => {
                  const active = filterStar === star
                  return (
                    <button
                      key={star}
                      type="button"
                      className={`pdp-reviews-compose__bar${active ? ' is-active' : ''}`}
                      onClick={() => {
                        const next = filterStar === star ? null : star
                        onFilterStarChange?.(next)
                        document
                          .getElementById('product-reviews-published')
                          ?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
                      }}
                      aria-pressed={active}
                    >
                      <span className="pdp-reviews-compose__bar-label">{star} star</span>
                      <span className="pdp-reviews-compose__bar-track">
                        <span
                          className="pdp-reviews-compose__bar-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="pdp-reviews-compose__bar-pct">{pct}%</span>
                    </button>
                  )
                })}
              </div>

              {!isAuthenticated ? (
                <p className="pdp-reviews-compose__login-hint">
                  <button
                    type="button"
                    className="pdp-reviews-compose__login-link"
                    onClick={() => openAuthModal({
                      redirectTo: product?.slug ? `/product/${product.slug}` : '/',
                      mode: 'login',
                    })}
                  >
                    Log in
                  </button>
                  {' '}
                  to leave a review
                </p>
              ) : null}
            </>
          )}
        </div>

        {isAuthenticated && !isLoading ? (
          <div className="pdp-reviews-compose__write">
            {myReview?.id ? (
              <p className="pdp-reviews-compose__already">
                You’ve already submitted a review for this product
                {myReview.isActive
                  ? '. See it in the reviews below.'
                  : ' — pending moderation.'}
              </p>
            ) : (
              <form className="pdp-reviews-compose__form" onSubmit={handleSubmit} noValidate>
                <p className="pdp-reviews-compose__form-label">Write a review</p>
                <StarRatingInput
                  value={rating}
                  onChange={setRating}
                  disabled={submitReview.isPending}
                  size={28}
                />
                <textarea
                  className="pdp-reviews-compose__textarea"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Share your thoughts about this product… (optional)"
                  disabled={submitReview.isPending}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitReview.isPending || rating === 0}
                  className="pdp-reviews-compose__submit"
                >
                  {submitReview.isPending ? 'Saving…' : 'Submit review'}
                </Button>
              </form>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** Published reviews list — below related products. */
export function ProductPublishedReviews({ product, filterStar = null, onFilterStarChange }) {
  const productId = product?.id
  const { data, isLoading } = useProductReviews(productId)
  const [visibleCount, setVisibleCount] = useState(5)

  const reviews = data?.reviews ?? []

  const filteredReviews = useMemo(() => {
    if (!filterStar) return reviews
    return reviews.filter((review) => Math.round(review.rating) === filterStar)
  }, [reviews, filterStar])

  const visibleReviews = filteredReviews.slice(0, visibleCount)

  if (!productId) return null

  return (
    <section
      id="product-reviews-published"
      className="pdp-reviews"
      aria-labelledby="pdp-reviews-heading"
    >
      <div className="pdp-reviews__list-wrap pdp-reviews__list-wrap--full">
        <h2 id="pdp-reviews-heading" className="pdp-reviews__title">
          Reviews
        </h2>

        {isLoading ? (
          <p className="pdp-reviews__loading">Loading reviews…</p>
        ) : (
          <>
            {filterStar != null ? (
              <button
                type="button"
                className="pdp-reviews__clear-filter"
                onClick={() => {
                  onFilterStarChange?.(null)
                  setVisibleCount(5)
                }}
              >
                Clear {filterStar}-star filter
              </button>
            ) : null}

            {filteredReviews.length === 0 ? (
              <p className="pdp-reviews__empty">
                {filterStar != null
                  ? `No reviews with ${filterStar} stars yet.`
                  : 'No published reviews yet.'}
              </p>
            ) : (
              <>
                <ul className="pdp-reviews__list">
                  {visibleReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </ul>
                {filteredReviews.length > visibleCount ? (
                  <button
                    type="button"
                    className="pdp-reviews__load-more"
                    onClick={() => setVisibleCount((count) => count + 5)}
                  >
                    Show more reviews
                  </button>
                ) : null}
              </>
            )}
          </>
        )}
      </div>
    </section>
  )
}

/** @deprecated Prefer ProductReviewCompose under the gallery. */
export function ProductReviewsSection({ product }) {
  return <ProductReviewCompose product={product} />
}
