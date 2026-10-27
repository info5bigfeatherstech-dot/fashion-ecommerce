import { formatPrice } from '@/lib/utils'
import { getCartLinePricing } from '@/features/cart/pricing'

/** MRP struck, optional middle sale struck, payable last. Coupon is not shown here. */
export function CartLinePriceStack({ item, className = '' }) {
  const pricing = getCartLinePricing(item)
  const hasProductDiscount = pricing.unitBase > pricing.unitPayable

  if (!hasProductDiscount) {
    return (
      <span className={className || undefined}>
        {formatPrice(pricing.linePayable)}
      </span>
    )
  }

  return (
    <div className={`cart-line-prices${className ? ` ${className}` : ''}`}>
      <span className="cart-line-prices__struck">{formatPrice(pricing.lineBase)}</span>
      {pricing.showThreeTier ? (
        <span className="cart-line-prices__struck">{formatPrice(pricing.lineSale)}</span>
      ) : null}
      <span className="cart-line-prices__now">{formatPrice(pricing.linePayable)}</span>
    </div>
  )
}
