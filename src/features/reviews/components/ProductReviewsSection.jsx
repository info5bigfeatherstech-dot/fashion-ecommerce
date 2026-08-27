import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import {
  getBlendedStarDistribution,
  getProductRatingDisplay,
} from '@/lib/productRatingDisplay'
import { useProductReviews } from '@/features/reviews/hooks'

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

export function ProductReviewsSection({ product }) {
  const productId = product?.id
  const { data, isLoading } = useProductReviews(productId)
  const [filterStar, setFilterStar] = useState(null)
  const [visibleCount, setVisibleCount] = useState(5)

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

  const filteredReviews = useMemo(() => {
    if (!filterStar) return reviews
    return reviews.filter((review) => Math.round(review.rating) === filterStar)
  }, [reviews, filterStar])

  const visibleReviews = filteredReviews.slice(0, visibleCount)

  if (!productId) return null

  return (
    <section className="pdp-reviews" aria-labelledby="pdp-reviews-heading">
      <div className="pdp-reviews__summary">
        <h2 id="pdp-reviews-heading" className="display-md pdp-reviews__title">
          Customer Reviews
        </h2>

        {isLoading ? (
          <p className="pdp-reviews__loading">Loading reviews…</p>
        ) : (
          <>
            <div className="pdp-reviews__score">
              <span className="pdp-reviews__score-value">
                {Number(ratingDisplay.average).toFixed(1)}
              </span>
              <div className="pdp-reviews__score-stars" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i < Math.round(ratingDisplay.average) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <span className="pdp-reviews__score-count">
                {ratingDisplay.count} {ratingDisplay.count === 1 ? 'rating' : 'ratings'}
              </span>
            </div>

            <div className="pdp-reviews__bars">
              {starDistribution.map(({ star, pct }) => {
                const active = filterStar === star
                return (
                  <button
                    key={star}
                    type="button"
                    className={`pdp-reviews__bar${active ? ' is-active' : ''}`}
                    onClick={() => {
                      setFilterStar((current) => (current === star ? null : star))
                      setVisibleCount(5)
                    }}
                    aria-pressed={active}
                  >
                    <span className="pdp-reviews__bar-label">{star} star</span>
                    <span className="pdp-reviews__bar-track">
                      <span className="pdp-reviews__bar-fill" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="pdp-reviews__bar-pct">{pct}%</span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {!isLoading && (
        <div className="pdp-reviews__list-wrap">
          {filterStar != null ? (
            <button
              type="button"
              className="pdp-reviews__clear-filter"
              onClick={() => {
                setFilterStar(null)
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
        </div>
      )}
    </section>
  )
}
