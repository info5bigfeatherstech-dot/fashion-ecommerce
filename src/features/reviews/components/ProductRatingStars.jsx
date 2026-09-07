import { Star } from 'lucide-react'
import { getProductRatingDisplay } from '@/lib/productRatingDisplay'

export function getStarFillPct(average, index) {
  const diff = Number(average) - index
  if (diff >= 0.75) return 100
  if (diff >= 0.25) return 50
  return 0
}

export function RatingStar({ size = 14, fillPct = 0, className = '' }) {
  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: size,
        height: size,
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      <Star
        size={size}
        fill="none"
        stroke="currentColor"
        style={{
          width: size,
          minWidth: size,
          maxWidth: 'none',
          height: size,
          display: 'block',
          flexShrink: 0,
        }}
      />
      {fillPct > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${fillPct}%`,
            height: '100%',
            overflow: 'hidden',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <Star
            size={size}
            fill="currentColor"
            stroke="currentColor"
            style={{
              width: size,
              minWidth: size,
              maxWidth: 'none',
              height: size,
              display: 'block',
              flexShrink: 0,
            }}
          />
        </span>
      )}
    </span>
  )
}

export function RatingStarsRow({ rating, size = 14, className = 'product-rating__stars' }) {
  const average = Number(rating) || 0
  return (
    <span className={className} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <RatingStar key={i} size={size} fillPct={getStarFillPct(average, i)} />
      ))}
    </span>
  )
}

export function ProductRatingStars({
  product,
  reviewSummary = null,
  size = 14,
  className = '',
  showCount = true,
  countClassName = 'text-muted',
}) {
  const ratingDisplay = getProductRatingDisplay(product, reviewSummary)
  const average = Number(ratingDisplay.average) || 0

  return (
    <div className={`product-rating ${className}`.trim()}>
      <RatingStarsRow rating={average} size={size} />
      <span className="product-rating__value">{average.toFixed(1)}</span>
      {showCount ? (
        <span className={`product-rating__count ${countClassName}`.trim()}>
          ({ratingDisplay.count} {ratingDisplay.count === 1 ? 'review' : 'reviews'})
        </span>
      ) : null}
    </div>
  )
}

