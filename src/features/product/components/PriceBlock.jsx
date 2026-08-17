import { formatPrice, formatDiscount } from '@/lib/utils'

export function PriceBlock({ price, originalPrice, size = 'default' }) {
  const discount = formatDiscount(originalPrice, price)
  const isLarge = size === 'large'

  return (
    <div className="product-card__price-row" style={isLarge ? { fontSize: 'var(--text-xl)' } : undefined}>
      <span className="product-card__price">{formatPrice(price)}</span>
      {originalPrice && (
        <span className="product-card__original">{formatPrice(originalPrice)}</span>
      )}
      {discount && (
        <span className="product-card__discount">-{discount}%</span>
      )}
    </div>
  )
}
