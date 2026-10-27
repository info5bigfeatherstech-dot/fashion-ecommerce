import { Tag } from 'lucide-react'
import { formatPrice, formatDiscount } from '@/lib/utils'

export function PriceBlock({
  price,
  originalPrice,
  comparePrice = null,
  size = 'default',
  couponDiscount = 0,
  couponCode = null,
}) {
  const hasCoupon = couponDiscount > 0 && couponDiscount < price
  const finalPrice = hasCoupon ? Math.max(0, price - couponDiscount) : price
  const discount = formatDiscount(originalPrice, finalPrice)
  const isLarge = size === 'large'
  const showThreeTier =
    comparePrice != null &&
    Number(comparePrice) > Number(price) &&
    originalPrice != null &&
    Number(originalPrice) > Number(comparePrice)

  return (
    <div className="product-card__price-wrapper">
      {showThreeTier ? (
        <div className="product-card__price-row">
          <span className="product-card__price product-card__price--struck">{formatPrice(comparePrice)}</span>
          <span className="product-card__original">{formatPrice(originalPrice)}</span>
          {discount ? <span className="product-card__discount">{discount}%</span> : null}
        </div>
      ) : null}

      <div
        className={`product-card__price-row${showThreeTier ? ' product-card__price-row--promo' : ''}`}
      >
        {showThreeTier ? (
          <span className={`product-card__sale-label${isLarge ? ' product-card__sale-label--large' : ''}`}>
            Sale price
          </span>
        ) : null}

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
        ) : !showThreeTier && originalPrice ? (
          <span className="product-card__original">{formatPrice(originalPrice)}</span>
        ) : null}

        {!showThreeTier && discount ? (
          <span className="product-card__discount">{discount}%</span>
        ) : null}
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
