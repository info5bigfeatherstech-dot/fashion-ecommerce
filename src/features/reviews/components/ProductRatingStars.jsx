import { Star } from 'lucide-react'
import { getProductRatingDisplay } from '@/lib/productRatingDisplay'

export function ProductRatingStars({
  product,
  reviewSummary = null,
  size = 14,
  className = '',
  showCount = true,
  countClassName = 'text-muted',
}) {
  const ratingDisplay = getProductRatingDisplay(product, reviewSummary)
  const rounded = Math.round(Number(ratingDisplay.average))

  return (
    <div className={`product-rating ${className}`.trim()}>
      <span className="product-rating__stars" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            fill={i < rounded ? 'currentColor' : 'none'}
          />
        ))}
      </span>
      <span className="product-rating__value">{Number(ratingDisplay.average).toFixed(1)}</span>
      {showCount ? (
        <span className={`product-rating__count ${countClassName}`.trim()}>
          ({ratingDisplay.count} {ratingDisplay.count === 1 ? 'review' : 'reviews'})
        </span>
      ) : null}
    </div>
  )
}
