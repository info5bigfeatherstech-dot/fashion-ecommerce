import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  AlertCircle,
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
import {
  useAbandonOnlineCheckout,
  useCheckoutQuote,
  useCheckoutSettings,
  useConfirmCheckout,
  useCreateOrderFromConfirm,
  useRazorpayKey,
  useVerifyRazorpayPayment,
  fetchFreshCheckoutQuote,
  buildCheckoutCartKey,
} from '@/features/checkout/hooks'
import { getRazorpayKey } from '@/features/checkout/api'
import {
  createCheckoutAttemptKey,
  isQuoteRefreshError,
  PAYMENT_STATE,
} from '@/features/checkout/constants'
import { isCodPlacedOrder, isQuoteExpired, toConfirmPaymentBody } from '@/features/checkout/mappers'
import RazorpayCheckout from '@/features/checkout/razorpay/RazorpayCheckout'
import { PaymentErrorOverlay } from '@/features/checkout/razorpay/PaymentErrorOverlay'
import { PaymentLoadingOverlay } from '@/features/checkout/razorpay/PaymentLoadingOverlay'
import { getCart } from '@/features/cart/api'
import { useAvailableCoupons, useValidateCoupon } from '@/features/coupon/hooks'
import { useAppStore } from '@/store'
import { useCartTotal } from '@/store/selectors'
import { formatPrice } from '@/lib/utils'
import { SITE_NAME } from '@/config/site'

const CHECKOUT_STEP = {
  REVIEW: 0,
  DELIVERY: 1,
  PAYMENT: 2,
}

const STEPS = [
  { id: 'review', label: 'Order', icon: Package },
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'payment', label: 'Payment', icon: CreditCard },
]

function normalizeCouponCode(code) {
  return String(code || '').trim().toUpperCase()
}

function removeCachedCheckoutQuotes(queryClient) {
  return queryClient.removeQueries({
    predicate: (query) => (
      Array.isArray(query.queryKey)
      && query.queryKey[0] === 'checkout'
      && query.queryKey[1] === 'quote'
    ),
  })
}

export default function Checkout() {
  const queryClient = useQueryClient()
  const cartItems = useAppStore((s) => s.cartItems)
  const cartTotal = useCartTotal()
  const replaceCartFromApi = useAppStore((s) => s.replaceCartFromApi)
  const clearCart = useAppStore((s) => s.clearCart)
  const user = useAppStore((s) => s.user)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const checkoutAddress = useAppStore((s) => s.checkoutAddress)
  const clearCheckoutAddress = useAppStore((s) => s.clearCheckoutAddress)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState(CHECKOUT_STEP.REVIEW)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCouponCode, setAppliedCouponCode] = useState('')
  const [placedOrder, setPlacedOrder] = useState(null)
  const [showRazorpay, setShowRazorpay] = useState(false)
  const [razorpayOrderData, setRazorpayOrderData] = useState(null)
  const [razorpayKey, setRazorpayKey] = useState(null)
  const [razorpayPaymentState, setRazorpayPaymentState] = useState(PAYMENT_STATE.IDLE)
  const [isRecoveringCheckout, setIsRecoveringCheckout] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [showPaymentError, setShowPaymentError] = useState(false)
  const checkoutAttemptKeyRef = useRef(null)
  const gatewayDismissRecoveryInFlight = useRef(false)
  const gatewayDismissHandlerRef = useRef(null)
  const lastQuoteErrorToastRef = useRef('')

  const cartKey = useMemo(() => buildCheckoutCartKey(cartItems), [cartItems])

  const hasPendingOnlineOrder = Boolean(
    placedOrder?.order?.orderId
    && !isCodPlacedOrder(placedOrder)
  )

  const isReviewStep = checkoutStep === CHECKOUT_STEP.REVIEW
  const isDeliveryStep = checkoutStep === CHECKOUT_STEP.DELIVERY
  const isPaymentStep = checkoutStep === CHECKOUT_STEP.PAYMENT

  const { data: checkoutSettings } = useCheckoutSettings({
    enabled: isAuthenticated && checkoutStep >= CHECKOUT_STEP.DELIVERY,
  })

  const checkoutSchema = useMemo(() => (
    z.object({
      email: z.string().email('Valid email required'),
      firstName: z.string().min(1, 'First name required'),
      lastName: z.string().min(1, 'Last name required'),
      address: z.string().min(1, 'Address required'),
      city: z.string().min(1, 'City required'),
      state: z.string().min(1, 'State required'),
      zip: z.string().min(3, 'ZIP code required'),
      paymentMethod: z.enum(['prepaid', 'cod', 'partial']),
    })
  ), [])

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

  const needsRazorpayKey = paymentMethod === 'prepaid' || paymentMethod === 'partial'

  const {
    data: prefetchedRazorpayKey,
    isLoading: razorpayKeyLoading,
    isError: razorpayKeyError,
    error: razorpayKeyFetchError,
  } = useRazorpayKey({
    enabled: isAuthenticated && isPaymentStep && needsRazorpayKey,
  })

  useEffect(() => {
    if (prefetchedRazorpayKey) {
      setRazorpayKey(prefetchedRazorpayKey)
    }
  }, [prefetchedRazorpayKey])

  const {
    data: quote,
    isFetching: quoteLoading,
    isError: quoteFailed,
    error: quoteError,
    refetch: refetchQuote,
  } = useCheckoutQuote({
    addressId: checkoutAddress?.id,
    couponCode: appliedCouponCode,
    cartKey,
    paymentMethod,
    enabled:
      isAuthenticated
      && checkoutStep >= CHECKOUT_STEP.DELIVERY
      && Boolean(checkoutAddress?.id)
      && !hasPendingOnlineOrder
      && !isRecoveringCheckout,
  })

  /** Ignore cached quotes that still carry a coupon after the user removed it. */
  const activeQuote = useMemo(() => {
    if (!quote) return null
    const quoteCoupon = normalizeCouponCode(quote.couponApplied)
    const desiredCoupon = normalizeCouponCode(appliedCouponCode)
    if (quoteCoupon !== desiredCoupon) return null
    return quote
  }, [quote, appliedCouponCode])

  const confirmCheckout = useConfirmCheckout()
  const createOrder = useCreateOrderFromConfirm()
  const verifyPayment = useVerifyRazorpayPayment()
  const abandonCheckout = useAbandonOnlineCheckout()

  const policy = activeQuote?.checkoutPolicy || checkoutSettings
  const codEnabled = Boolean(
    activeQuote
      ? activeQuote.fullCodAvailable
      : checkoutSettings?.codEnabled !== false
  )
  const partialPaymentEnabled = Boolean(
    activeQuote
      ? activeQuote.checkoutPolicy?.partialPaymentEnabled
      : checkoutSettings?.partialPaymentEnabled
  )
  const partialPaymentPercent = policy?.partialPaymentPercent || 0

  const { data: availableCoupons = [] } = useAvailableCoupons({
    enabled: isAuthenticated && isReviewStep,
  })
  const validateCoupon = useValidateCoupon()

  const itemsSubtotal = activeQuote ? activeQuote.itemsSubtotal : cartTotal
  const promotionDiscount = activeQuote ? activeQuote.promotionDiscount : 0
  const deliveryCharges = activeQuote
    ? activeQuote.deliveryCharges
    : (isReviewStep ? null : (cartTotal >= 100 ? 0 : 9.95))
  const taxes = activeQuote ? activeQuote.taxes : 0
  const total = activeQuote
    ? activeQuote.amountPayable
    : Math.max(0, cartTotal + (deliveryCharges ?? 0))
  const suggestedPartial = partialPaymentPercent > 0
    ? Math.round((total * partialPaymentPercent) / 100)
    : 0
  const itemCount = activeQuote?.itemCount
    || cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)

  const quoteExpired = isQuoteExpired(activeQuote)
  const razorpayKeyUnavailable = needsRazorpayKey
    && (razorpayKeyLoading || razorpayKeyError || (!prefetchedRazorpayKey && !razorpayKey))
  const canPlaceOrder = isPaymentStep && Boolean(
    checkoutAddress?.id
    && activeQuote?.quoteId
    && activeQuote.isDeliverable
    && !quoteExpired
    && !quoteLoading
    && !isRecoveringCheckout
    && !gatewayDismissRecoveryInFlight.current
    && !(placedOrder?.order?.orderId && paymentMethod !== 'cod')
    && !razorpayKeyUnavailable
  )

  useEffect(() => {
    if (isDeliveryStep && !checkoutAddress?.id) {
      setAddressModalOpen(true)
    }
  }, [isDeliveryStep, checkoutAddress?.id])

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
    if (!quoteFailed || !quoteError?.message) {
      lastQuoteErrorToastRef.current = ''
      return
    }
    if (
      quoteError.code === 'CART_EMPTY'
      && (hasPendingOnlineOrder || isRecoveringCheckout)
    ) {
      return
    }
    if (quoteError.message === lastQuoteErrorToastRef.current) return
    lastQuoteErrorToastRef.current = quoteError.message
    toast.error(quoteError.message)
  }, [quoteFailed, quoteError?.message, quoteError?.code, hasPendingOnlineOrder, isRecoveringCheckout])

  useEffect(() => {
    gatewayDismissHandlerRef.current = async () => {
      if (gatewayDismissRecoveryInFlight.current) return
      gatewayDismissRecoveryInFlight.current = true

      try {
        setShowRazorpay(false)
        setRazorpayOrderData(null)
        setRazorpayPaymentState(PAYMENT_STATE.CANCELLED)
        await queryClient.cancelQueries({ queryKey: ['checkout'] })

        const oid = placedOrder?.order?.orderId || placedOrder?.order?.id
        if (!oid) {
          setRazorpayPaymentState(PAYMENT_STATE.IDLE)
          return
        }

        try {
          await abandonCheckout.mutateAsync(String(oid))
        } catch (err) {
          toast.error(err?.message || 'Could not return to checkout. Your order may still be pending.')
          setRazorpayPaymentState(PAYMENT_STATE.IDLE)
          return
        }

        checkoutAttemptKeyRef.current = null

        try {
          const cart = await getCart()
          replaceCartFromApi(cart)
        } catch {
          toast.error('Your bag could not be reloaded. Please refresh the page.')
          setRazorpayPaymentState(PAYMENT_STATE.IDLE)
          return
        }

        setPlacedOrder(null)
        await queryClient.invalidateQueries({ queryKey: ['checkout'] })
        await queryClient.invalidateQueries({ queryKey: ['cart'] })
        setRazorpayPaymentState(PAYMENT_STATE.IDLE)
        toast.success('Payment closed. Your bag was restored — you can place the order again.')
      } finally {
        gatewayDismissRecoveryInFlight.current = false
        setIsRecoveringCheckout(false)
      }
    }
  }, [abandonCheckout, placedOrder, queryClient, replaceCartFromApi])

  const finishOrderSuccess = useCallback((isOnline = false) => {
    checkoutAttemptKeyRef.current = null
    clearCart()
    clearCheckoutAddress()
    setPlacedOrder(null)
    setShowRazorpay(false)
    setRazorpayOrderData(null)
    setRazorpayPaymentState(PAYMENT_STATE.IDLE)
    setOrderPlaced(true)
    toast.success(isOnline ? 'Payment verified — order confirmed' : 'Order placed successfully')
  }, [clearCart, clearCheckoutAddress])

  const handleRazorpaySuccess = useCallback(async (response) => {
    try {
      const currentOrderId =
        placedOrder?.order?.orderId
        || placedOrder?.order?.id
        || response.notes?.orderId
      if (!currentOrderId) throw new Error('Order ID not found. Please contact support.')

      await verifyPayment.mutateAsync({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        orderId: currentOrderId,
      })

      setRazorpayPaymentState(PAYMENT_STATE.VERIFIED)
      finishOrderSuccess(true)
    } catch (err) {
      setShowRazorpay(false)
      setRazorpayOrderData(null)
      setRazorpayPaymentState(PAYMENT_STATE.FAILED)
      const verificationMessage = err?.code === 'PAYMENT_NOT_CAPTURED_YET'
        ? 'Payment is received but capture is still pending. Check your orders in a moment.'
        : (err?.message || 'Payment verification failed. Please contact support.')
      setPaymentError(verificationMessage)
      setShowPaymentError(true)
    }
  }, [finishOrderSuccess, placedOrder, verifyPayment])

  const handleRazorpayNaturalDismiss = useCallback(() => {
    setShowRazorpay(false)
    setRazorpayOrderData(null)
  }, [])

  const handleRazorpayFailure = useCallback((error) => {
    setRazorpayPaymentState(PAYMENT_STATE.FAILED)
    setShowPaymentError(false)
    setPaymentError(null)

    const msg = typeof error === 'string'
      ? error
      : error?.error?.description || error?.message || 'Payment failed. Please try again.'

    const isGatewayInitFailure = /browser is not supported|failed to initialize|failed to load payment gateway|invalid payment order/i.test(msg)
    if (isGatewayInitFailure) {
      toast.error(msg)
      void gatewayDismissHandlerRef.current?.()
      return
    }

    toast.error(msg)
    checkoutAttemptKeyRef.current = null
  }, [])

  const handleRazorpayRecoveryStart = useCallback(() => {
    setIsRecoveringCheckout(true)
  }, [])

  const handleRazorpayClose = useCallback(() => {
    setShowPaymentError(false)
    setPaymentError(null)
    setShowRazorpay(false)
    setRazorpayOrderData(null)
    void gatewayDismissHandlerRef.current?.()
  }, [])

  if (cartItems.length === 0 && !orderPlaced && !placedOrder && !isRecoveringCheckout) {
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
          <h1 className="display-md checkout-success__title">Thank you for shopping with {SITE_NAME}</h1>
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

  const onSubmit = async (formData) => {
    if (!isPaymentStep) return
    if (isRecoveringCheckout || gatewayDismissRecoveryInFlight.current) {
      toast.info('Restoring your bag after payment was closed. Please wait.')
      return
    }
    if (placedOrder?.order?.orderId && formData.paymentMethod !== 'cod') {
      toast.info('Please wait — your previous payment attempt is still being cleared.')
      return
    }
    if (!checkoutAddress?.id) {
      toast.error('Select a delivery address')
      setAddressModalOpen(true)
      return
    }

    if (quoteLoading) {
      toast.info('Updating checkout totals — please wait.')
      return
    }

    const idempotencyKey =
      checkoutAttemptKeyRef.current || createCheckoutAttemptKey()
    checkoutAttemptKeyRef.current = idempotencyKey

    const runCheckout = async (activeQuote) => {
      if (!activeQuote?.quoteId) {
        throw new Error('Could not load checkout totals')
      }
      if (isQuoteExpired(activeQuote)) {
        throw new Error('Quote expired — please try again')
      }
      if (!activeQuote.isDeliverable) {
        throw new Error('This address is not deliverable for your bag')
      }

      const confirmBody = toConfirmPaymentBody(formData.paymentMethod, activeQuote)
      if (!confirmBody) {
        throw new Error('Could not build payment confirmation')
      }

      const confirmed = await confirmCheckout.mutateAsync(confirmBody)
      if (!confirmed?.validated && confirmed?.success === false) {
        throw Object.assign(new Error(confirmed?.message || 'Could not confirm checkout quote'), {
          code: 'QUOTE_NOT_CONFIRMED',
        })
      }

      const orderResult = await createOrder.mutateAsync({
        idempotencyKey,
        addressId: checkoutAddress.id,
        confirmBody,
        confirmed,
        activeQuote,
        couponCode: appliedCouponCode,
      })

      setPlacedOrder(orderResult)

      if (orderResult.idempotentReplay) {
        toast.info('Resuming your checkout…')
      }

      if (isCodPlacedOrder(orderResult)) {
        toast.success(orderResult.message || 'Order placed successfully')
        finishOrderSuccess(false)
        return
      }

      if (!orderResult.razorpayOrder?.id) {
        throw new Error(
          orderResult.razorpayErrorDetail?.description
          || orderResult.message
          || 'Failed to initiate payment. Please try again.'
        )
      }

      let gatewayKey = prefetchedRazorpayKey || razorpayKey
      if (!gatewayKey) {
        gatewayKey = await getRazorpayKey()
        setRazorpayKey(gatewayKey)
      }
      if (!gatewayKey) {
        throw new Error('Payment gateway not configured. Please use COD or try again later.')
      }

      setRazorpayOrderData(orderResult.razorpayOrder)
      setRazorpayPaymentState(PAYMENT_STATE.IDLE)
      setShowRazorpay(true)
    }

    try {
      let activeQuote = await fetchFreshCheckoutQuote({
        queryClient,
        addressId: checkoutAddress.id,
        couponCode: appliedCouponCode,
        paymentMethod: formData.paymentMethod,
        replaceCartFromApi,
      })

      try {
        await runCheckout(activeQuote)
      } catch (err) {
        if (!isQuoteRefreshError(err?.code, err?.message)) {
          throw err
        }

        activeQuote = await fetchFreshCheckoutQuote({
          queryClient,
          addressId: checkoutAddress.id,
          couponCode: appliedCouponCode,
          paymentMethod: formData.paymentMethod,
          replaceCartFromApi,
        })
        await runCheckout(activeQuote)
      }
    } catch (err) {
      if (isQuoteRefreshError(err?.code, err?.message)) {
        checkoutAttemptKeyRef.current = null
        setPlacedOrder(null)
        setShowRazorpay(false)
        setRazorpayOrderData(null)
        toast.error(err?.message || 'Totals changed — please try placing the order again.')
      } else if (err?.code === 'IDEMPOTENCY_REQUEST_IN_PROGRESS') {
        toast.info('Your order is already being processed. Please wait a moment.')
      } else if (err?.code === 'IDEMPOTENCY_KEY_REUSED') {
        checkoutAttemptKeyRef.current = null
        toast.error('Checkout session changed. Please place the order again.')
      } else if (err?.code === 'QUOTE_ID_REQUIRED') {
        checkoutAttemptKeyRef.current = null
        toast.error(err?.message || 'Checkout expired — please refresh and try again.')
      } else if (err?.code === 'MISSING_RAZORPAY_ENV') {
        checkoutAttemptKeyRef.current = null
        toast.error('Payment not configured. Please use COD for now.')
      } else {
        checkoutAttemptKeyRef.current = null
        toast.error(err?.message || 'Could not place order')
      }
    }
  }

  const setPaymentMethod = (method) => {
    setValue('paymentMethod', method, { shouldValidate: true })
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
        toast.error(result.message || 'Invalid coupon')
        return
      }
      // Quote locks the discount — validation alone does not.
      await removeCachedCheckoutQuotes(queryClient)
      setAppliedCouponCode(result.couponCode || couponCode)
      setCouponInput(result.couponCode || couponCode)
      toast.success(result.message || 'Coupon applied — updating quote…')
    } catch (err) {
      toast.error(err?.message || 'Could not validate coupon')
    }
  }

  const handleClearCoupon = async () => {
    setAppliedCouponCode('')
    setCouponInput('')
    await removeCachedCheckoutQuotes(queryClient)
    if (
      checkoutStep >= CHECKOUT_STEP.DELIVERY
      && checkoutAddress?.id
      && isAuthenticated
    ) {
      refetchQuote()
    }
    toast.success('Coupon removed')
  }

  const goToDeliveryStep = () => {
    if (cartItems.length === 0) {
      toast.error('Your bag is empty')
      return
    }
    setCheckoutStep(CHECKOUT_STEP.DELIVERY)
  }

  const goToReviewStep = () => {
    setCheckoutStep(CHECKOUT_STEP.REVIEW)
  }

  const goToPaymentStep = () => {
    if (!checkoutAddress?.id) {
      toast.error('Select a delivery address')
      setAddressModalOpen(true)
      return
    }
    if (quoteLoading) {
      toast.info('Calculating shipping and totals…')
      return
    }
    if (!activeQuote?.quoteId) {
      toast.info('Waiting for checkout quote…')
      return
    }
    if (!activeQuote.isDeliverable) {
      toast.error('This address is not deliverable for your bag')
      return
    }
    if (quoteExpired) {
      toast.error('Quote expired — refresh and try again')
      return
    }
    setCheckoutStep(CHECKOUT_STEP.PAYMENT)
  }

  const submitting = isSubmitting
    || confirmCheckout.isPending
    || createOrder.isPending
    || verifyPayment.isPending
    || isRecoveringCheckout
  const deliveryHint = activeQuote
    ? [
        activeQuote.isDeliverable
          ? (activeQuote.deliveryEstimate || 'Deliverable to this address')
          : 'Not deliverable to this address',
        activeQuote.courierName,
      ].filter(Boolean).join(' · ')
    : null

  const checkoutUserName = user?.name
    || checkoutAddress?.fullName
    || `${watch('firstName')} ${watch('lastName')}`.trim()
    || 'Customer'

  const shippingLabel = activeQuote
    ? (deliveryCharges === 0 ? 'Free' : formatPrice(deliveryCharges))
    : isReviewStep
      ? 'Calculated next step'
      : quoteLoading
        ? 'Calculating…'
        : 'Select address'

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
              {quoteLoading ? ' · Updating quote…' : ''}
            </p>
          </div>
        </div>

        <nav className="checkout-steps" aria-label="Checkout progress">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = checkoutStep === index
            const isComplete = checkoutStep > index
            return (
              <div
                key={step.id}
                className={`checkout-steps__item${isActive ? ' checkout-steps__item--active' : ''}${isComplete ? ' checkout-steps__item--complete' : ''}`}
              >
                <span className="checkout-steps__index">
                  {isComplete ? <Check size={14} /> : <Icon size={14} />}
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
            {isReviewStep && (
              <section className="checkout-panel">
                <div className="checkout-panel__head">
                  <div>
                    <p className="heading-sm text-accent">Step 1</p>
                    <h2 className="checkout-panel__title">Review your order</h2>
                  </div>
                </div>
                <p className="body-sm text-muted checkout-panel__hint">
                  Check items and apply a coupon. Shipping is calculated after you choose a delivery address.
                </p>
                <div className="checkout-review-items">
                  {cartItems.map((item) => (
                    <div key={item.id} className="checkout-summary__item">
                      <div className="checkout-summary__thumb">
                        <img src={item.image} alt="" />
                        <span>{item.quantity}</span>
                      </div>
                      <div className="checkout-summary__item-meta">
                        <p className="checkout-summary__item-name">{item.name}</p>
                        {item.productCode && (
                          <p className="body-sm text-muted">{item.productCode}</p>
                        )}
                      </div>
                      <p className="checkout-summary__item-price">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="checkout-coupon checkout-coupon--inline">
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
                      disabled={Boolean(appliedCouponCode)}
                    />
                    {appliedCouponCode ? (
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
                  {appliedCouponCode && (
                    <p className="checkout-coupon__ok">{appliedCouponCode} will apply at delivery step</p>
                  )}
                  {availableCoupons.length > 0 && !appliedCouponCode && (
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
                <div className="checkout-step-actions">
                  <Button type="button" variant="primary" size="lg" fullWidth onClick={goToDeliveryStep}>
                    Continue to delivery
                  </Button>
                </div>
              </section>
            )}

            {isDeliveryStep && (
              <section className="checkout-panel">
                <div className="checkout-panel__head">
                  <div>
                    <p className="heading-sm text-accent">Step 2</p>
                    <h2 className="checkout-panel__title">Delivery address</h2>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAddressModalOpen(true)}>
                    {checkoutAddress ? 'Change' : 'Choose address'}
                  </Button>
                </div>
                <InputGroup label="Email" htmlFor="email" required error={errors.email?.message}>
                  <Input id="email" type="email" error={errors.email} {...register('email')} />
                </InputGroup>
                <p className="body-sm text-muted checkout-panel__hint">
                  Order updates and shipping notifications go here.
                </p>

                {checkoutAddress ? (
                  <div className="checkout-address-card">
                    <div className="checkout-address-card__icon" aria-hidden="true">
                      <MapPin size={18} />
                    </div>
                    <div className="checkout-address-card__body">
                      <div className="checkout-address-card__top">
                        <p className="heading-sm" style={{ margin: 0 }}>
                          {checkoutAddress.fullName || checkoutUserName}
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

                {(deliveryHint || quoteLoading) && (
                  <p
                    className={`body-sm checkout-delivery-hint${
                      activeQuote && !activeQuote.isDeliverable ? ' checkout-delivery-hint--warn' : ''
                    }`}
                  >
                    {quoteLoading && 'Calculating shipping and totals…'}
                    {!quoteLoading && deliveryHint}
                  </p>
                )}
                {quoteExpired && (
                  <p className="body-sm checkout-delivery-hint--warn">
                    Quote expired.{' '}
                    <button type="button" className="section-header__link" onClick={() => refetchQuote()}>
                      Refresh quote
                    </button>
                  </p>
                )}

                <div className="checkout-step-actions checkout-step-actions--split">
                  <Button type="button" variant="secondary" size="lg" onClick={goToReviewStep}>
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={goToPaymentStep}
                    disabled={!checkoutAddress?.id || quoteLoading || Boolean(activeQuote && !activeQuote.isDeliverable)}
                  >
                    {quoteLoading ? 'Calculating…' : 'Continue to payment'}
                  </Button>
                </div>
              </section>
            )}

            {isPaymentStep && (
              <>
                <section className="checkout-panel">
                  <div className="checkout-panel__head">
                    <div>
                      <p className="heading-sm text-accent">Step 3</p>
                      <h2 className="checkout-panel__title">Payment</h2>
                    </div>
                    <span className="checkout-secure">
                      <Lock size={14} />
                      Encrypted
                    </span>
                  </div>

                  <input type="hidden" {...register('paymentMethod')} />

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
                        <strong>Pay online</strong>
                        <small>Secure checkout via Razorpay</small>
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
                      <div className="checkout-info-card">
                        <ShieldCheck size={18} />
                        <p className="body-sm">
                          You&apos;ll complete payment securely through Razorpay for{' '}
                          <strong>{formatPrice(total)}</strong>.
                        </p>
                      </div>
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
                      <div className="checkout-info-card">
                        <Wallet size={18} />
                        <p className="body-sm">
                          Pay <strong>{formatPrice(suggestedPartial)}</strong> now
                          {partialPaymentPercent > 0 ? ` (${partialPaymentPercent}% advance)` : ''}.
                          Remaining balance will be collected
                          {activeQuote?.partialBalanceCodAvailable ? ' on delivery' : ' online'} before dispatch.
                        </p>
                      </div>
                    </div>
                  )}

                  {needsRazorpayKey && razorpayKeyError && (
                    <div className="checkout-info-card" style={{ borderColor: '#fde68a', background: '#fefce8' }}>
                      <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
                      <p className="body-sm" style={{ color: '#b45309', margin: 0 }}>
                        {razorpayKeyFetchError?.message || 'Payment gateway unavailable'}. Please use COD or try again later.
                      </p>
                    </div>
                  )}
                </section>

                <div className="checkout-submit-bar">
                  <div className="checkout-step-actions checkout-step-actions--split">
                    <Button type="button" variant="secondary" size="lg" onClick={() => setCheckoutStep(CHECKOUT_STEP.DELIVERY)}>
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={submitting || !canPlaceOrder}
                    >
                      {submitting
                        ? 'Processing…'
                        : quoteLoading
                          ? 'Updating quote…'
                          : needsRazorpayKey && razorpayKeyLoading
                            ? 'Loading payment gateway…'
                            : paymentMethod === 'cod'
                              ? 'Place order'
                              : paymentMethod === 'partial'
                                ? `Pay ${formatPrice(suggestedPartial)} now`
                                : `Pay ${formatPrice(total)}`}
                    </Button>
                  </div>
                  <p className="checkout-submit-note">
                    <Lock size={12} />
                    {paymentMethod === 'cod'
                      ? 'Pay when your order arrives — no online payment now.'
                      : 'Secured by Razorpay · your card details never touch our servers.'}
                  </p>
                </div>
              </>
            )}
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
              {!isReviewStep && appliedCouponCode && (
                <p className="checkout-coupon__ok" style={{ marginBottom: 8 }}>
                  Coupon {appliedCouponCode}
                  {promotionDiscount > 0 ? ` · −${formatPrice(promotionDiscount)}` : ''}
                </p>
              )}

              <div className="checkout-summary__row">
                <span>Subtotal</span>
                <span>{formatPrice(itemsSubtotal)}</span>
              </div>
              {promotionDiscount > 0 && (
                <div className="checkout-summary__row">
                  <span>Discount</span>
                  <span>−{formatPrice(promotionDiscount)}</span>
                </div>
              )}
              <div className="checkout-summary__row">
                <span>Shipping</span>
                <span>{shippingLabel}</span>
              </div>
              {taxes > 0 && (
                <div className="checkout-summary__row">
                  <span>Taxes</span>
                  <span>{formatPrice(taxes)}</span>
                </div>
              )}
              {deliveryCharges === 0 && activeQuote?.includesShippingAndHandling && (
                <p className="checkout-summary__perk">Complimentary shipping on this order</p>
              )}
              <div className="checkout-summary__total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              {activeQuote?.quoteId && (
                <p className="body-sm text-muted" style={{ marginTop: 8 }}>
                  Quote locked until{' '}
                  {activeQuote.quoteExpiresAt
                    ? new Date(activeQuote.quoteExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'checkout completes'}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>

      <CheckoutAddressModal
        open={addressModalOpen}
        onOpenChange={setAddressModalOpen}
      />

      {showRazorpay && razorpayOrderData && (prefetchedRazorpayKey || razorpayKey) && (
        <RazorpayCheckout
          key={razorpayOrderData.id}
          razorpayOrder={razorpayOrderData}
          razorpayKey={prefetchedRazorpayKey || razorpayKey}
          orderId={placedOrder?.order?.orderId || placedOrder?.order?.id}
          userEmail={user?.email}
          userName={checkoutUserName}
          userPhone={checkoutAddress?.phone}
          paymentState={razorpayPaymentState}
          onPaymentStateChange={setRazorpayPaymentState}
          onSuccess={handleRazorpaySuccess}
          onFailure={handleRazorpayFailure}
          onClose={handleRazorpayClose}
          onRecoveryStart={handleRazorpayRecoveryStart}
          onNaturalDismiss={handleRazorpayNaturalDismiss}
        />
      )}

      {isRecoveringCheckout && (
        <PaymentLoadingOverlay message="Restoring your bag after payment was closed…" />
      )}

      {(verifyPayment.isPending || razorpayPaymentState === PAYMENT_STATE.SUCCESS) && (
        <PaymentLoadingOverlay message="Verifying your payment… please wait" />
      )}

      {showPaymentError && (
        <PaymentErrorOverlay
          error={paymentError}
          orderId={placedOrder?.order?.orderId || placedOrder?.order?.id}
          onRetry={() => {
            setShowPaymentError(false)
            setPaymentError(null)
            setRazorpayPaymentState(PAYMENT_STATE.IDLE)
            checkoutAttemptKeyRef.current = null
            setPlacedOrder(null)
          }}
          onClose={() => {
            setShowPaymentError(false)
            setPaymentError(null)
          }}
        />
      )}
    </div>
  )
}
