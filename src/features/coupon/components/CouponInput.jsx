import { useState } from 'react'
import { CheckCircle2, Loader2, Sparkles, Tag, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAvailableCoupons, useValidateCoupon } from '@/features/coupon/hooks'
import { calculateCartCouponDiscounts, normalizeCouponCode } from '@/features/coupon/utils'
import { formatPrice } from '@/lib/utils'
import { useAppStore } from '@/store'
import { useAppliedCoupon } from '@/store/selectors'

export function CouponInput({
  compact = false,
  className = '',
  onCouponApplied,
  onCouponRemoved,
}) {
  const [couponInput, setCouponInput] = useState('')
  const [couponsEnabled, setCouponsEnabled] = useState(false)
  const appliedCoupon = useAppliedCoupon()
  const applyCoupon = useAppStore((s) => s.applyCoupon)
  const removeCoupon = useAppStore((s) => s.removeCoupon)
  const cartItems = useAppStore((s) => s.cartItems)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)

  const validateCoupon = useValidateCoupon()
  const { data: availableCoupons = [], isLoading: loadingAvailable } = useAvailableCoupons({
    enabled: isAuthenticated && couponsEnabled,
  })

  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  )

  const handleApply = async (codeToApply) => {
    const rawCode = String(codeToApply || couponInput || '').trim()
    const code = normalizeCouponCode(rawCode)

    if (!code) {
      toast.error('Please enter a coupon code')
      return
    }

    if (cartItems.length === 0) {
      toast.error('Add items to your bag before applying a coupon')
      return
    }

    try {
      const result = await validateCoupon.mutateAsync({
        couponCode: code,
        useServercart: true,
        subtotal: cartSubtotal,
      })

      if (!result.valid) {
        toast.error(result.message || 'Invalid coupon code')
        return
      }

      const calculation = calculateCartCouponDiscounts(cartItems, result)

      if (!calculation.isMinOrderSatisfied) {
        toast.error(
          calculation.errorMessage ||
            `Minimum order value of ₹${result.minOrderAmount} required`
        )
        return
      }

      if (calculation.totalDiscount <= 0 && !result.freeShipping) {
        toast.error(
          calculation.errorMessage ||
            'This coupon does not apply to any items in your bag'
        )
        return
      }

      applyCoupon({
        ...result,
        code: result.couponCode || code,
        discountAmount: calculation.totalDiscount || result.discountAmount || 0,
      })

      setCouponInput('')
      const savingsText =
        calculation.totalDiscount > 0
          ? ` Saved ${formatPrice(calculation.totalDiscount)}!`
          : ''
      toast.success(result.message || `Coupon "${code}" applied!${savingsText}`)

      onCouponApplied?.(result)
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
    <div className={`coupon-box ${compact ? 'coupon-box--compact' : ''} ${className}`}>
      {appliedCoupon ? (
        <div className="coupon-box__applied">
          <div className="coupon-box__applied-main">
            <div className="coupon-box__applied-icon" aria-hidden="true">
              <CheckCircle2 size={16} />
            </div>
            <div className="coupon-box__applied-info">
              <div className="coupon-box__applied-header">
                <span className="coupon-box__applied-code">
                  {appliedCoupon.code || appliedCoupon.couponCode}
                </span>
                <span className="coupon-box__applied-tag">Applied</span>
              </div>
              <p className="coupon-box__applied-savings">
                {appliedCoupon.discountAmount > 0 ? (
                  <>
                    Discount: <strong>−{formatPrice(appliedCoupon.discountAmount)}</strong>
                  </>
                ) : appliedCoupon.freeShipping ? (
                  'Free delivery applied'
                ) : (
                  'Coupon discount active'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="coupon-box__remove-btn"
            onClick={handleRemove}
            aria-label="Remove coupon"
            title="Remove coupon"
          >
            <X size={14} />
            <span>Remove</span>
          </button>
        </div>
      ) : (
        <>
          <div className="coupon-box__header">
            <Tag size={15} className="coupon-box__header-icon" />
            <span className="coupon-box__title">Have a coupon code?</span>
          </div>

          <form
            className="coupon-box__form"
            onSubmit={(e) => {
              e.preventDefault()
              void handleApply()
            }}
          >
            <div className="coupon-box__input-wrap">
              <Input
                type="text"
                placeholder="Enter coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onFocus={() => setCouponsEnabled(true)}
                className="coupon-box__input"
                disabled={validateCoupon.isPending}
                aria-label="Coupon code"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              size={compact ? 'sm' : 'md'}
              disabled={!couponInput.trim() || validateCoupon.isPending}
              className="coupon-box__apply-btn"
            >
              {validateCoupon.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                'Apply'
              )}
            </Button>
          </form>

          {/* Quick available coupons chips */}
          {availableCoupons.length > 0 && (
            <div className="coupon-box__suggestions">
              <span className="coupon-box__suggestions-label">
                <Sparkles size={12} /> Available offers:
              </span>
              <div className="coupon-box__chips">
                {availableCoupons.slice(0, 4).map((coupon) => (
                  <button
                    key={coupon.id || coupon.code}
                    type="button"
                    className="coupon-box__chip"
                    onClick={() => {
                      setCouponInput(coupon.code)
                      void handleApply(coupon.code)
                    }}
                    title={coupon.description || coupon.title || `Apply ${coupon.code}`}
                  >
                    <span className="coupon-box__chip-code">{coupon.code}</span>
                    {coupon.discountValue > 0 && (
                      <span className="coupon-box__chip-val">
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
