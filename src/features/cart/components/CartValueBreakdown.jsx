import { Gift, Tag } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

/**
 * Shared MRP / product-discount / coupon-or-referral rows for bag + checkout.
 * Display only — backend still charges payable subtotal minus one coupon amount.
 */
export function CartValueBreakdown({
  mrpTotal = 0,
  productDiscount = 0,
  promotionDiscount = 0,
  promotionKind = 'coupon',
  appliedCode = '',
}) {
  const isReferral = promotionKind === 'referral'
  const promoLabel = isReferral ? 'Referral Discount' : 'Coupon Discount'
  const code = String(appliedCode || '').trim()

  return (
    <>
      {code ? (
        <p className="checkout-coupon__ok checkout-summary__applied-tag">
          {isReferral ? <Gift size={13} /> : <Tag size={13} />}
          <span>
            {isReferral ? 'Referral' : 'Coupon'} <strong>{code}</strong> applied
            {promotionDiscount > 0 ? <span> · −{formatPrice(promotionDiscount)}</span> : null}
          </span>
        </p>
      ) : null}
      <div className="checkout-summary__row">
        <span>Total Cart Value</span>
        <span>{formatPrice(mrpTotal)}</span>
      </div>
      {productDiscount > 0 ? (
        <div className="checkout-summary__row checkout-summary__row--saving">
          <span>Total Cart Discount</span>
          <span>−{formatPrice(productDiscount)}</span>
        </div>
      ) : null}
      {promotionDiscount > 0 ? (
        <div className="checkout-summary__row checkout-summary__row--promo">
          <span>{promoLabel}</span>
          <span>−{formatPrice(promotionDiscount)}</span>
        </div>
      ) : null}
    </>
  )
}
