import { Star } from 'lucide-react'

/** Accessible 1–5 star picker for the write-a-review form. */
export function StarRatingInput({
  value,
  onChange,
  max = 5,
  size = 26,
  disabled = false,
  className = '',
}) {
  const rating = Math.max(0, Math.min(max, Number(value) || 0))

  return (
    <div
      className={`pdp-star-input ${className}`.trim()}
      role="group"
      aria-label="Your rating"
    >
      {Array.from({ length: max }, (_, index) => {
        const star = index + 1
        const filled = star <= rating

        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            aria-label={`${star} out of ${max} stars`}
            aria-pressed={filled}
            onClick={() => onChange?.(star)}
            className="pdp-star-input__btn"
          >
            <Star
              size={size}
              fill={filled ? 'currentColor' : 'none'}
              className={filled ? 'pdp-star-input__icon is-filled' : 'pdp-star-input__icon'}
            />
          </button>
        )
      })}
    </div>
  )
}
