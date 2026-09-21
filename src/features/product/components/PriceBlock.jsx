import { Tag } from 'lucide-react'
import { formatPrice, formatDiscount } from '@/lib/utils'

export function PriceBlock({
  price,
  originalPrice,
  size = 'default',
  couponDiscount = 0,
  couponCode = null,
}) {
  const hasCoupon = couponDiscount > 0 && couponDiscount < price
  const finalPrice = hasCoupon ? Math.max(0, price - couponDiscount) : price
  const discount = formatDiscount(originalPrice, finalPrice)
  const isLarge = size === 'large'

  return (
    <div className="product-card__price-wrapper">
      <div
        className="product-card__price-row"
        style={isLarge ? { fontSize: 'var(--text-xl)' } : undefined}
      >
        <span
          className={`product-card__price ${
            hasCoupon ? 'product-card__price--coupon' : ''
          }`}
        >
          {formatPrice(finalPrice)}
        </span>

        {hasCoupon ? (
          <span className="product-card__original product-card__original--strike">
            {formatPrice(price)}
          </span>
        ) : originalPrice ? (
          <span className="product-card__original">{formatPrice(originalPrice)}</span>
        ) : null}

        {discount && (
          <span className="product-card__discount">{discount}%</span>
        )}
      </div>

      {hasCoupon && (
        <div className="product-card__coupon-pill">
          <Tag size={12} />
          <span>
            With coupon <strong>{couponCode}</strong>: Save {formatPrice(couponDiscount)}
          </span>
        </div>
      )}
    </div>
  )
}
