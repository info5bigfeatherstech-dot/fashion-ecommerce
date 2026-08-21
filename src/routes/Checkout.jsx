import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Check,
  CreditCard,
  Lock,
  MapPin,
  Package,
  ShieldCheck,
  Tag,
  Truck,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { CheckoutAddressModal } from '@/components/checkout/CheckoutAddressModal'
import { useCheckoutSettings } from '@/features/checkout/hooks'
import { useDeliveryCheckQuery } from '@/features/delivery/hooks'
import { useAvailableCoupons, useValidateCoupon } from '@/features/coupon/hooks'
import { useAppStore } from '@/store'
import { useCartTotal } from '@/store/selectors'
import { formatPrice } from '@/lib/utils'

const STEPS = [
  { id: 'contact', label: 'Contact', icon: Package },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'payment', label: 'Payment', icon: CreditCard },
]

export default function Checkout() {
  const cartItems = useAppStore((s) => s.cartItems)
  const cartTotal = useCartTotal()
  const clearCart = useAppStore((s) => s.clearCart)
  const user = useAppStore((s) => s.user)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const checkoutAddress = useAppStore((s) => s.checkoutAddress)
  const clearCheckoutAddress = useAppStore((s) => s.clearCheckoutAddress)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [prepaidOption, setPrepaidOption] = useState('card')
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)

  const { data: checkoutSettings } = useCheckoutSettings({ enabled: isAuthenticated })
  const codEnabled = checkoutSettings?.codEnabled !== false
  const partialPaymentEnabled = Boolean(checkoutSettings?.partialPaymentEnabled)
  const partialPaymentPercent = checkoutSettings?.partialPaymentPercent || 0

  const { data: availableCoupons = [] } = useAvailableCoupons({ enabled: isAuthenticated })
  const validateCoupon = useValidateCoupon()

  const shipping = cartTotal >= 100 ? 0 : 9.95
  const couponDiscount = appliedCoupon?.valid ? (appliedCoupon.discountAmount || 0) : 0
  const total = Math.max(0, cartTotal + shipping - couponDiscount)
  const suggestedPartial = partialPaymentPercent > 0
    ? Math.round((total * partialPaymentPercent) / 100)
    : 0
  const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)

  const checkoutSchema = useMemo(() => {
    return z
      .object({
        email: z.string().email('Valid email required'),
        firstName: z.string().min(1, 'First name required'),
        lastName: z.string().min(1, 'Last name required'),
        address: z.string().min(1, 'Address required'),
        city: z.string().min(1, 'City required'),
        state: z.string().min(1, 'State required'),
        zip: z.string().min(3, 'ZIP code required'),
        paymentMethod: z.enum(['prepaid', 'cod', 'partial']),
        prepaidOption: z.enum(['razorpay', 'card']).optional(),
        cardNumber: z.string().optional(),
        expiry: z.string().optional(),
        cvv: z.string().optional(),
        partialAmount: z.string().optional(),
      })
      .superRefine((data, ctx) => {
        if (data.paymentMethod === 'prepaid') {
          if (!data.prepaidOption) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['prepaidOption'],
              message: 'Select a prepaid option',
            })
            return
          }
          if (data.prepaidOption === 'card') {
            if (!data.cardNumber || data.cardNumber.replace(/\s/g, '').length < 16) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['cardNumber'],
                message: 'Valid card number required',
              })
            }
            if (!data.expiry || !/^\d{2}\/\d{2}$/.test(data.expiry)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['expiry'],
                message: 'Use MM/YY format',
              })
            }
            if (!data.cvv || data.cvv.length < 3 || data.cvv.length > 4) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['cvv'],
                message: 'CVV required',
              })
            }
          }
        }

        if (data.paymentMethod === 'partial') {
          const num = Number(data.partialAmount)
          if (!data.partialAmount || Number.isNaN(num) || num <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['partialAmount'],
              message: 'Enter a valid amount',
            })
          } else if (num > total) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['partialAmount'],
              message: `Amount cannot exceed ${formatPrice(total)}`,
            })
          }
        }
      })
  }, [total])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'prepaid',
      prepaidOption: 'card',
      partialAmount: '',
      email: user?.email ?? '',
      firstName: user?.firstName ?? checkoutAddress?.fullName?.split(' ')[0] ?? '',
      lastName:
        user?.lastName ??
        checkoutAddress?.fullName?.split(' ').slice(1).join(' ') ??
        '',
      address: checkoutAddress?.fullAddress ?? checkoutAddress?.displayLine1 ?? '',
      city: checkoutAddress?.city ?? '',
      state: checkoutAddress?.state ?? '',
      zip: checkoutAddress?.postalCode || checkoutAddress?.zip || '',
    },
  })

  const paymentMethod = watch('paymentMethod')
  const zipValue = watch('zip')
  const partialAmountNum = Number(watch('partialAmount') || 0)

  const deliveryPincode = String(
    checkoutAddress?.postalCode || checkoutAddress?.zip || zipValue || ''
  ).trim()

  const {
    data: deliveryCheck,
    isFetching: deliveryChecking,
    isError: deliveryCheckFailed,
    error: deliveryCheckError,
  } = useDeliveryCheckQuery(deliveryPincode, {
    enabled: isAuthenticated && deliveryPincode.length >= 6,
  })

  useEffect(() => {
    if (!user && !checkoutAddress) return

    if (user?.email) setValue('email', user.email)
    if (user?.firstName) setValue('firstName', user.firstName)
    if (user?.lastName) setValue('lastName', user.lastName)

    if (checkoutAddress?.fullName && !user?.firstName) {
      const [first = '', ...rest] = checkoutAddress.fullName.trim().split(/\s+/)
      if (first) setValue('firstName', first)
      if (rest.length) setValue('lastName', rest.join(' '))
    }

    if (checkoutAddress?.fullAddress || checkoutAddress?.displayLine1) {
      setValue('address', checkoutAddress.fullAddress || checkoutAddress.displayLine1)
    }
    if (checkoutAddress?.city) setValue('city', checkoutAddress.city)
    if (checkoutAddress?.state) setValue('state', checkoutAddress.state)
    if (checkoutAddress?.postalCode || checkoutAddress?.zip) {
      setValue('zip', checkoutAddress.postalCode || checkoutAddress.zip)
    }
  }, [user, checkoutAddress, setValue])

  useEffect(() => {
    if (paymentMethod === 'cod' && !codEnabled) {
      setValue('paymentMethod', 'prepaid', { shouldValidate: true })
    }
    if (paymentMethod === 'partial' && !partialPaymentEnabled) {
      setValue('paymentMethod', 'prepaid', { shouldValidate: true })
    }
  }, [codEnabled, partialPaymentEnabled, paymentMethod, setValue])

  useEffect(() => {
    if (paymentMethod !== 'partial' || !partialPaymentEnabled || !suggestedPartial) return
    const current = watch('partialAmount')
    if (!current) {
      setValue('partialAmount', String(suggestedPartial), { shouldValidate: true })
    }
  }, [paymentMethod, partialPaymentEnabled, suggestedPartial, setValue, watch])

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="container empty-state">
        <h1 className="empty-state__title">Nothing to checkout</h1>
        <p className="body-lg text-muted">Your bag is empty. Add something you love first.</p>
        <Link to="/shop/women">
          <Button variant="primary">Continue Shopping</Button>
        </Link>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="container checkout-success">
        <div className="checkout-success__card">
          <div className="checkout-success__icon" aria-hidden="true">
            <Check size={28} strokeWidth={2.5} />
          </div>
          <p className="heading-sm text-accent">Order placed</p>
          <h1 className="display-md checkout-success__title">Thank you for shopping with VERAÒ</h1>
          <p className="body-lg text-muted">
            A confirmation email is on its way. We’ll notify you when your pieces leave the atelier.
          </p>
          <div className="checkout-success__actions">
            <Link to="/">
              <Button variant="primary">Back to Home</Button>
            </Link>
            <Link to="/shop/women">
              <Button variant="secondary">Keep Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 1000))
    clearCart()
    clearCheckoutAddress()
    setOrderPlaced(true)
  }

  const setPaymentMethod = (method) => {
    setValue('paymentMethod', method, { shouldValidate: true })
    if (method === 'partial' && suggestedPartial) {
      setValue('partialAmount', String(suggestedPartial), { shouldValidate: true })
    }
  }

  const handleApplyCoupon = async (code) => {
    const couponCode = String(code || couponInput || '').trim().toUpperCase()
    if (!couponCode) {
      toast.error('Enter a coupon code')
      return
    }

    try {
      const result = await validateCoupon.mutateAsync({
        couponCode,
        useServercart: true,
      })
      if (!result.valid) {
        setAppliedCoupon(null)
        toast.error(result.message || 'Invalid coupon')
        return
      }
      setAppliedCoupon(result)
      setCouponInput(result.couponCode || couponCode)
      toast.success(result.message || 'Coupon applied')
    } catch (err) {
      setAppliedCoupon(null)
      toast.error(err?.message || 'Could not validate coupon')
    }
  }

  const handleClearCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput('')
  }

  return (
    <div className="checkout-page">
      <div className="container checkout-page__inner">
        <div className="checkout-page__header">
          <Link to="/cart" className="checkout-back">
            <ArrowLeft size={16} />
            Back to bag
          </Link>
          <div className="checkout-page__heading">
            <p className="heading-sm text-accent">Secure checkout</p>
            <h1 className="display-lg">Checkout</h1>
            <p className="body-sm text-muted">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatPrice(total)}
            </p>
          </div>
        </div>

        <nav className="checkout-steps" aria-label="Checkout progress">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.id} className="checkout-steps__item">
                <span className="checkout-steps__index">
                  <Icon size={14} />
                  <span>{index + 1}</span>
                </span>
                <span className="checkout-steps__label">{step.label}</span>
                {index < STEPS.length - 1 && <span className="checkout-steps__divider" aria-hidden="true" />}
              </div>
            )
          })}
        </nav>

        <div className="checkout">
          <form className="checkout-main" onSubmit={handleSubmit(onSubmit)} noValidate>
            <section className="checkout-panel">
              <div className="checkout-panel__head">
                <div>
                  <p className="heading-sm text-accent">01</p>
                  <h2 className="checkout-panel__title">Contact</h2>
                </div>
              </div>
              <InputGroup label="Email" htmlFor="email" required error={errors.email?.message}>
                <Input id="email" type="email" error={errors.email} {...register('email')} />
              </InputGroup>
              <p className="body-sm text-muted checkout-panel__hint">
                Order updates and shipping notifications go here.
              </p>
            </section>

            <section className="checkout-panel">
              <div className="checkout-panel__head">
                <div>
                  <p className="heading-sm text-accent">02</p>
                  <h2 className="checkout-panel__title">Shipping address</h2>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setAddressModalOpen(true)}>
                  {checkoutAddress ? 'Change' : 'Choose address'}
                </Button>
              </div>

              {checkoutAddress ? (
                <div className="checkout-address-card">
                  <div className="checkout-address-card__icon" aria-hidden="true">
                    <MapPin size={18} />
                  </div>
                  <div className="checkout-address-card__body">
                    <div className="checkout-address-card__top">
                      <p className="heading-sm" style={{ margin: 0 }}>
                        {checkoutAddress.fullName || `${watch('firstName')} ${watch('lastName')}`.trim()}
                      </p>
                      {checkoutAddress.isDefault && <Badge>Default</Badge>}
                    </div>
                    <p className="body-sm">{checkoutAddress.displayLine1 || checkoutAddress.fullAddress}</p>
                    {checkoutAddress.displayLine2 && (
                      <p className="body-sm text-muted">{checkoutAddress.displayLine2}</p>
                    )}
                    <p className="body-sm text-muted">
                      {[checkoutAddress.city, checkoutAddress.state, checkoutAddress.postalCode || checkoutAddress.zip]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {checkoutAddress.phone && (
                      <p className="body-sm text-muted">Phone: {checkoutAddress.phone}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="checkout-address-empty">
                  <MapPin size={20} />
                  <div>
                    <p className="body-sm" style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 4 }}>
                      No delivery address selected
                    </p>
                    <p className="body-sm text-muted">Choose a saved address or add a new one to continue.</p>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setAddressModalOpen(true)}>
                    Select address
                  </Button>
                </div>
              )}

              <div className="form-grid" style={{ marginTop: 'var(--space-3)' }}>
                <div className="form-grid form-grid--2">
                  <InputGroup label="First Name" htmlFor="firstName" required error={errors.firstName?.message}>
                    <Input id="firstName" error={errors.firstName} {...register('firstName')} />
                  </InputGroup>
                  <InputGroup label="Last Name" htmlFor="lastName" required error={errors.lastName?.message}>
                    <Input id="lastName" error={errors.lastName} {...register('lastName')} />
                  </InputGroup>
                </div>
                <InputGroup label="Address" htmlFor="address" required error={errors.address?.message}>
                  <Input id="address" error={errors.address} {...register('address')} />
                </InputGroup>
                <div className="form-grid form-grid--2">
                  <InputGroup label="City" htmlFor="city" required error={errors.city?.message}>
                    <Input id="city" error={errors.city} {...register('city')} />
                  </InputGroup>
                  <InputGroup label="State" htmlFor="state" required error={errors.state?.message}>
                    <Input id="state" error={errors.state} {...register('state')} />
                  </InputGroup>
                </div>
                <InputGroup label="PIN / ZIP" htmlFor="zip" required error={errors.zip?.message}>
                  <Input id="zip" error={errors.zip} {...register('zip')} />
                </InputGroup>
                {deliveryPincode.length >= 6 && (
                  <p
                    className={`body-sm checkout-delivery-hint${
                      deliveryCheck && !deliveryCheck.isDeliverable ? ' checkout-delivery-hint--warn' : ''
                    }`}
                  >
                    {deliveryChecking && 'Checking delivery for this PIN…'}
                    {!deliveryChecking && deliveryCheckFailed && (
                      deliveryCheckError?.message || 'Could not verify delivery for this PIN.'
                    )}
                    {!deliveryChecking && !deliveryCheckFailed && deliveryCheck && (
                      deliveryCheck.isDeliverable
                        ? [
                            deliveryCheck.message || 'Deliverable to this PIN',
                            deliveryCheck.estimatedDays && `ETA ${deliveryCheck.estimatedDays} days`,
                            deliveryCheck.courierName,
                          ].filter(Boolean).join(' · ')
                        : (deliveryCheck.message || 'Not deliverable to this PIN')
                    )}
                  </p>
                )}
              </div>
            </section>

            <section className="checkout-panel">
              <div className="checkout-panel__head">
                <div>
                  <p className="heading-sm text-accent">03</p>
                  <h2 className="checkout-panel__title">Payment</h2>
                </div>
                <span className="checkout-secure">
                  <Lock size={14} />
                  Encrypted
                </span>
              </div>

              <input type="hidden" {...register('paymentMethod')} />
              <input type="hidden" {...register('prepaidOption')} />

              <div className="checkout-pay-options" role="radiogroup" aria-label="Payment method">
                <button
                  type="button"
                  role="radio"
                  aria-checked={paymentMethod === 'prepaid'}
                  className={`checkout-pay-option${paymentMethod === 'prepaid' ? ' checkout-pay-option--active' : ''}`}
                  onClick={() => setPaymentMethod('prepaid')}
                >
                  <CreditCard size={18} />
                  <span>
                    <strong>Prepaid</strong>
                    <small>Pay now with card or Razorpay</small>
                  </span>
                </button>
                {codEnabled && (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === 'cod'}
                    className={`checkout-pay-option${paymentMethod === 'cod' ? ' checkout-pay-option--active' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <Truck size={18} />
                    <span>
                      <strong>Cash on delivery</strong>
                      <small>Pay when your order arrives</small>
                    </span>
                  </button>
                )}
                {partialPaymentEnabled && (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === 'partial'}
                    className={`checkout-pay-option${paymentMethod === 'partial' ? ' checkout-pay-option--active' : ''}`}
                    onClick={() => setPaymentMethod('partial')}
                  >
                    <Wallet size={18} />
                    <span>
                      <strong>Partial payment</strong>
                      <small>
                        {partialPaymentPercent > 0
                          ? `Pay ${partialPaymentPercent}% now (${formatPrice(suggestedPartial)})`
                          : 'Pay a portion now, rest later'}
                      </small>
                    </span>
                  </button>
                )}
              </div>

              {paymentMethod === 'prepaid' && (
                <div className="checkout-pay-panel">
                  <div className="checkout-prepaid-toggle">
                    <button
                      type="button"
                      className={`checkout-prepaid-chip${prepaidOption === 'razorpay' ? ' is-active' : ''}`}
                      onClick={() => {
                        setPrepaidOption('razorpay')
                        setValue('prepaidOption', 'razorpay', { shouldValidate: true })
                      }}
                    >
                      Razorpay
                    </button>
                    <button
                      type="button"
                      className={`checkout-prepaid-chip${prepaidOption === 'card' ? ' is-active' : ''}`}
                      onClick={() => {
                        setPrepaidOption('card')
                        setValue('prepaidOption', 'card', { shouldValidate: true })
                      }}
                    >
                      Card
                    </button>
                  </div>

                  {prepaidOption === 'razorpay' ? (
                    <div className="checkout-info-card">
                      <ShieldCheck size={18} />
                      <p className="body-sm">
                        You’ll be redirected to Razorpay’s secure checkout to complete payment of{' '}
                        <strong>{formatPrice(total)}</strong>.
                      </p>
                    </div>
                  ) : (
                    <div className="form-grid">
                      <InputGroup label="Card Number" htmlFor="cardNumber" required error={errors.cardNumber?.message}>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          error={errors.cardNumber}
                          {...register('cardNumber')}
                        />
                      </InputGroup>
                      <div className="form-grid form-grid--2">
                        <InputGroup label="Expiry" htmlFor="expiry" required error={errors.expiry?.message}>
                          <Input id="expiry" placeholder="MM/YY" error={errors.expiry} {...register('expiry')} />
                        </InputGroup>
                        <InputGroup label="CVV" htmlFor="cvv" required error={errors.cvv?.message}>
                          <Input id="cvv" placeholder="123" error={errors.cvv} {...register('cvv')} />
                        </InputGroup>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="checkout-info-card">
                  <Truck size={18} />
                  <p className="body-sm">
                    Pay in cash or UPI when your order is delivered. No card details needed now.
                  </p>
                </div>
              )}

              {paymentMethod === 'partial' && (
                <div className="checkout-pay-panel">
                  <InputGroup
                    label="Amount to pay now"
                    htmlFor="partialAmount"
                    required
                    error={errors.partialAmount?.message}
                  >
                    <Input
                      id="partialAmount"
                      placeholder={`Up to ${formatPrice(total)}`}
                      error={errors.partialAmount}
                      {...register('partialAmount')}
                    />
                  </InputGroup>
                  <p className="body-sm text-muted">
                    {partialPaymentPercent > 0
                      ? `Suggested advance: ${partialPaymentPercent}% (${formatPrice(suggestedPartial)}). Remaining balance will be collected before dispatch.`
                      : 'Remaining balance will be collected before dispatch.'}
                  </p>
                </div>
              )}
            </section>

            <div className="checkout-submit-bar">
              <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
                {isSubmitting
                  ? 'Processing…'
                  : paymentMethod === 'cod'
                    ? 'Place order'
                    : paymentMethod === 'partial'
                      ? `Pay ${formatPrice(partialAmountNum || 0)} now`
                      : `Pay ${formatPrice(total)}`}
              </Button>
              <p className="checkout-submit-note">
                <Lock size={12} />
                Your payment details are encrypted and never stored on our servers.
              </p>
            </div>
          </form>

          <aside className="checkout-summary">
            <div className="checkout-summary__head">
              <h2 className="checkout-panel__title">Order summary</h2>
              <Link to="/cart" className="body-sm section-header__link">
                Edit bag
              </Link>
            </div>

            <div className="checkout-summary__items">
              {cartItems.map((item) => (
                <div key={item.id} className="checkout-summary__item">
                  <div className="checkout-summary__thumb">
                    <img src={item.image} alt="" />
                    <span>{item.quantity}</span>
                  </div>
                  <div className="checkout-summary__item-meta">
                    <p className="checkout-summary__item-name">{item.name}</p>
                    <p className="body-sm text-muted">
                      {[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <p className="checkout-summary__item-price">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="checkout-summary__rows">
              <div className="checkout-coupon">
                <div className="checkout-coupon__head">
                  <Tag size={14} />
                  <span>Coupon</span>
                </div>
                <div className="checkout-coupon__row">
                  <Input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    aria-label="Coupon code"
                    disabled={Boolean(appliedCoupon?.valid)}
                  />
                  {appliedCoupon?.valid ? (
                    <Button type="button" variant="secondary" size="sm" onClick={handleClearCoupon}>
                      Remove
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleApplyCoupon()}
                      disabled={validateCoupon.isPending}
                    >
                      {validateCoupon.isPending ? '…' : 'Apply'}
                    </Button>
                  )}
                </div>
                {appliedCoupon?.valid && (
                  <p className="checkout-coupon__ok">
                    {appliedCoupon.couponCode} · −{formatPrice(appliedCoupon.discountAmount || 0)}
                  </p>
                )}
                {availableCoupons.length > 0 && !appliedCoupon?.valid && (
                  <div className="checkout-coupon__list">
                    {availableCoupons.slice(0, 4).map((coupon) => (
                      <button
                        key={coupon.id}
                        type="button"
                        className="checkout-coupon__chip"
                        onClick={() => {
                          setCouponInput(coupon.code)
                          handleApplyCoupon(coupon.code)
                        }}
                      >
                        {coupon.code}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="checkout-summary__row">
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="checkout-summary__row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="checkout-summary__row">
                  <span>Coupon</span>
                  <span>−{formatPrice(couponDiscount)}</span>
                </div>
              )}
              {shipping === 0 && (
                <p className="checkout-summary__perk">Complimentary shipping on this order</p>
              )}
              <div className="checkout-summary__total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <CheckoutAddressModal
        open={addressModalOpen}
        onOpenChange={setAddressModalOpen}
      />
    </div>
  )
}
