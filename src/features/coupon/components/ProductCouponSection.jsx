import { useState, useMemo } from 'react'
import { CheckCircle2, Loader2, Sparkles, Tag, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAvailableCoupons, useValidateCoupon } from '@/features/coupon/hooks'
import { isItemEligibleForCoupon, normalizeCouponCode } from '@/features/coupon/utils'
import { formatPrice } from '@/lib/utils'
import { useAppStore } from '@/store'
import { useAppliedCoupon } from '@/store/selectors'

export function ProductCouponSection({
  product,
  currentPrice = 0,
  onCouponApplied,
  onCouponRemoved,
  className = '',
}) {
  const [couponInput, setCouponInput] = useState('')
  const [couponsEnabled, setCouponsEnabled] = useState(false)
  const appliedCoupon = useAppliedCoupon()
  const applyCoupon = useAppStore((s) => s.applyCoupon)
  const removeCoupon = useAppStore((s) => s.removeCoupon)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)

  const validateCoupon = useValidateCoupon()
  const { data: availableCoupons = [], isLoading: loadingAvailable } = useAvailableCoupons({
    enabled: isAuthenticated && couponsEnabled,
  })

  // Check if the currently applied coupon is eligible for this specific product
  const isEligible = useMemo(() => {
    if (!appliedCoupon || !product) return false
    return isItemEligibleForCoupon(product, appliedCoupon)
  }, [appliedCoupon, product])

  // Calculate discount specifically on this product's current price
  const itemSavings = useMemo(() => {
    if (!appliedCoupon || !isEligible || currentPrice <= 0) return 0
    const type = String(appliedCoupon.discountType || '').toLowerCase()
    const val = Number(appliedCoupon.discountValue ?? appliedCoupon.discount ?? 0)
    let discount = 0

    if (type === 'percentage' || type === 'percent') {
      discount = val > 0 ? Math.round((currentPrice * val) / 100) : 0
    } else if (appliedCoupon.discountAmount > 0) {
      discount = Math.min(currentPrice, Number(appliedCoupon.discountAmount))
    } else if (val > 0) {
      discount = Math.min(currentPrice, val)
    }

    const maxDiscount = Number(appliedCoupon.maxDiscountAmount)
    if (Number.isFinite(maxDiscount) && maxDiscount > 0) {
      discount = Math.min(discount, maxDiscount)
    }
    return Math.min(discount, currentPrice)
  }, [appliedCoupon, isEligible, currentPrice])

  const handleApply = async (codeToApply) => {
    const rawCode = String(codeToApply || couponInput || '').trim()
    const code = normalizeCouponCode(rawCode)

    if (!code) {
      toast.error('Please enter a coupon code')
      return
    }

    try {
      const result = await validateCoupon.mutateAsync({
        couponCode: code,
        useServercart: false,
        subtotal: currentPrice,
      })

      if (!result.valid) {
        toast.error(result.message || 'Invalid coupon code')
        return
      }

      // Check product eligibility
      if (!isItemEligibleForCoupon(product, result)) {
        toast.error('This coupon is not applicable to this product')
        return
      }

      // Calculate discount amount for this product
      const type = String(result.discountType || '').toLowerCase()
      const val = Number(result.discountValue ?? result.discount ?? 0)
      let discount = 0

      if (type === 'percentage' || type === 'percent') {
        discount = val > 0 ? Math.round((currentPrice * val) / 100) : 0
      } else if (result.discountAmount > 0) {
        discount = Math.min(currentPrice, Number(result.discountAmount))
      } else if (val > 0) {
        discount = Math.min(currentPrice, val)
      }

      const maxDiscount = Number(result.maxDiscountAmount)
      if (Number.isFinite(maxDiscount) && maxDiscount > 0) {
        discount = Math.min(discount, maxDiscount)
      }
      discount = Math.min(discount, currentPrice)

      const minOrder = Number(result.minOrderAmount ?? result.minOrderValue ?? 0)
      const isBelowMin = minOrder > 0 && currentPrice < minOrder

      applyCoupon({
        ...result,
        code: result.couponCode || code,
        discountAmount: discount,
      })

      setCouponInput('')
      if (isBelowMin) {
        toast.info(
          `Coupon "${code}" saved! Min order is ₹${minOrder}. Add more to your bag to activate full discount.`
        )
      } else if (discount > 0) {
        toast.success(
          `Coupon "${code}" applied! You save ${formatPrice(discount)} on this item!`
        )
      } else {
        toast.success(result.message || `Coupon "${code}" applied!`)
      }

      onCouponApplied?.(result, discount)
    } catch (err) {
      toast.error(err?.message || 'Could not validate coupon. Please try again.')
    }
  }

  const handleRemove = () => {
    const prevCode = appliedCoupon?.code || appliedCoupon?.couponCode || 'Coupon'
    removeCoupon()
    setCouponInput('')
    toast.success(`${prevCode} removed`)
    onCouponRemoved?.()
  }

  return (
    <div className={`pdp-coupon-box ${className}`}>
      {appliedCoupon && isEligible ? (
        <div className="pdp-coupon-applied">
          <div className="pdp-coupon-applied__header">
            <div className="pdp-coupon-applied__title-group">
              <CheckCircle2 size={16} className="pdp-coupon-applied__icon" />
              <span className="pdp-coupon-applied__code">
                {appliedCoupon.code || appliedCoupon.couponCode}
              </span>
              <span className="pdp-coupon-applied__badge">Applied</span>
            </div>
            <button
              type="button"
              className="pdp-coupon-applied__remove"
              onClick={handleRemove}
              aria-label="Remove coupon"
            >
              <X size={14} />
              <span>Remove</span>
            </button>
          </div>
          {itemSavings > 0 ? (
            <p className="pdp-coupon-applied__savings">
              🎉 <strong>{formatPrice(itemSavings)}</strong> discount applied to this item!
            </p>
          ) : (
            <p className="pdp-coupon-applied__savings">
              ✓ Coupon active for this order.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="pdp-coupon-header">
            <Tag size={15} className="pdp-coupon-header__icon" />
            <span className="pdp-coupon-header__title">Coupons & Special Offers</span>
          </div>

          <form
            className="pdp-coupon-form"
            onSubmit={(e) => {
              e.preventDefault()
              void handleApply()
            }}
          >
            <div className="pdp-coupon-input-wrap">
              <Input
                type="text"
                placeholder="Enter coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onFocus={() => setCouponsEnabled(true)}
                className="pdp-coupon-input"
                disabled={validateCoupon.isPending}
                aria-label="Coupon code"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={!couponInput.trim() || validateCoupon.isPending}
              className="pdp-coupon-btn"
            >
              {validateCoupon.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                'Apply'
              )}
            </Button>
          </form>

          {/* Quick available coupons */}
          {availableCoupons.length > 0 && (
            <div className="pdp-coupon-suggestions">
              <span className="pdp-coupon-suggestions__label">
                <Sparkles size={12} /> Available offers for you:
              </span>
              <div className="pdp-coupon-chips">
                {availableCoupons.slice(0, 3).map((coupon) => (
                  <button
                    key={coupon.id || coupon.code}
                    type="button"
                    className="pdp-coupon-chip"
                    onClick={() => {
                      setCouponInput(coupon.code)
                      void handleApply(coupon.code)
                    }}
                    title={coupon.description || coupon.title || `Apply ${coupon.code}`}
                  >
                    <span className="pdp-coupon-chip__code">{coupon.code}</span>
                    {coupon.discountValue > 0 && (
                      <span className="pdp-coupon-chip__val">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% OFF`
                          : `₹${coupon.discountValue} OFF`}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
