import { useCallback, useState } from 'react'
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  MapPin,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Separator } from '@/components/ui/Separator'
import { PAYMENT_STATE } from '@/features/checkout/constants'
import { useVerifyRazorpayPayment } from '@/features/checkout/hooks'
import RazorpayCheckout from '@/features/checkout/razorpay/RazorpayCheckout'
import { PaymentErrorOverlay } from '@/features/checkout/razorpay/PaymentErrorOverlay'
import { PaymentLoadingOverlay } from '@/features/checkout/razorpay/PaymentLoadingOverlay'
import {
  useInitiateOrderPayment,
  useInvalidateOrders,
  useOrderDetail,
} from '@/features/orders/hooks'
import {
  canResumeOnlinePayment,
  formatOrderDate,
  formatOrderDateTime,
  getOrderItemImage,
  getOrderItemLineTotal,
  getOrderItemName,
  getOrderItemVariantLabel,
  getOrderItems,
  getOrderStatusClass,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  isPaymentWindowExpired,
} from '@/features/orders/utils'
import { formatPrice } from '@/lib/utils'
import { useAppStore } from '@/store'

function OrderStatusBadge({ status }) {
  return (
    <span className={`account-order-status ${getOrderStatusClass(status)}`}>
      {getOrderStatusLabel(status)}
    </span>
  )
}

function OrderLineItem({ item }) {
  const name = getOrderItemName(item)
  const image = getOrderItemImage(item)
  const variant = getOrderItemVariantLabel(item)
  const qty = Number(item.quantity) || 1
  const lineTotal = getOrderItemLineTotal(item)

  return (
    <div className="account-order-item">
      <div className="account-order-item__media">
        {image ? (
          <img src={image} alt={name} loading="lazy" />
        ) : (
          <Package size={18} aria-hidden="true" />
        )}
      </div>
      <div className="account-order-item__body">
        <p className="account-order-item__name">{name}</p>
        {variant ? (
          <p className="account-order-item__meta">{variant}</p>
        ) : null}
        <p className="account-order-item__qty">Qty {qty}</p>
      </div>
      <p className="account-order-item__price">{formatPrice(lineTotal)}</p>
    </div>
  )
}

export function AccountOrderDetail({ orderId, onBack }) {
  const user = useAppStore((s) => s.user)
  const { data: order, isLoading, isError, error, refetch } = useOrderDetail(orderId)
  const initiatePayment = useInitiateOrderPayment()
  const verifyPayment = useVerifyRazorpayPayment()
  const invalidateOrders = useInvalidateOrders()

  const [showRazorpay, setShowRazorpay] = useState(false)
  const [razorpayBundle, setRazorpayBundle] = useState(null)
  const [razorpayPaymentState, setRazorpayPaymentState] = useState(PAYMENT_STATE.IDLE)
  const [paymentError, setPaymentError] = useState(null)
  const [showPaymentError, setShowPaymentError] = useState(false)

  const handleContinuePayment = useCallback(async () => {
    if (!orderId) return
    setPaymentError(null)
    try {
      const data = await initiatePayment.mutateAsync(orderId)
      const key = data.razorpayKeyId || data.keyId
      const rzOrder = data.razorpayOrder
      if (!key || !rzOrder?.id) {
        throw new Error('Payment could not be started. Please try again.')
      }
      setRazorpayBundle({ key, order: rzOrder })
      setRazorpayPaymentState(PAYMENT_STATE.IDLE)
      setShowRazorpay(true)
    } catch (err) {
      setPaymentError(err?.message || 'Could not start payment')
      setShowPaymentError(true)
    }
  }, [initiatePayment, orderId])

  const handleRazorpaySuccess = useCallback(async (response) => {
    try {
      await verifyPayment.mutateAsync({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        orderId,
      })
      setRazorpayPaymentState(PAYMENT_STATE.VERIFIED)
      setShowRazorpay(false)
      setRazorpayBundle(null)
      invalidateOrders(orderId)
      await refetch()
    } catch (err) {
      setShowRazorpay(false)
      setRazorpayBundle(null)
      setRazorpayPaymentState(PAYMENT_STATE.FAILED)
      setPaymentError(err?.message || 'Payment verification failed. Please contact support.')
      setShowPaymentError(true)
    }
  }, [invalidateOrders, orderId, refetch, verifyPayment])

  const handleRazorpayFailure = useCallback((message) => {
    setShowRazorpay(false)
    setRazorpayBundle(null)
    setRazorpayPaymentState(PAYMENT_STATE.FAILED)
    setPaymentError(message || 'Payment failed. Please try again.')
    setShowPaymentError(true)
  }, [])

  const handleRazorpayClose = useCallback(() => {
    setShowRazorpay(false)
    setRazorpayBundle(null)
    setRazorpayPaymentState(PAYMENT_STATE.IDLE)
  }, [])

  if (isLoading) {
    return (
      <div className="account-orders-state">
        <Loader2 size={22} className="account-orders-state__spin" aria-hidden="true" />
        <p className="body-sm text-muted">Loading order…</p>
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="account-panel">
        <div className="account-empty">
          <p className="body-lg">{error?.message || 'Order not found'}</p>
          <Button type="button" variant="secondary" size="sm" onClick={onBack}>
            Back to orders
          </Button>
        </div>
      </div>
    )
  }

  const items = getOrderItems(order)
  const address = order.shippingAddress || order.address || order.deliveryAddress
  const resumePayment = canResumeOnlinePayment(order)
  const holdExpired = isPaymentWindowExpired(order)
  const paymentMethod = String(order.paymentInfo?.method || order.paymentMethod || '').toLowerCase()

  return (
    <>
      <div className="account-order-detail">
        <button type="button" className="account-order-detail__back" onClick={onBack}>
          <ArrowLeft size={14} aria-hidden="true" />
          All orders
        </button>

        <div className="account-panel account-order-detail__header">
          <div className="account-order-detail__heading">
            <div>
              <h3 className="display-md">{order.orderId}</h3>
              <p className="body-sm text-muted">{formatOrderDateTime(order.createdAt)}</p>
            </div>
            <OrderStatusBadge status={order.orderStatus} />
          </div>

          <div className="account-order-detail__totals">
            <div>
              <p className="account-order-detail__label">Subtotal</p>
              <p className="body-sm">{formatPrice(order.subtotal ?? order.itemsSubtotal ?? 0)}</p>
            </div>
            <div>
              <p className="account-order-detail__label">Delivery</p>
              <p className="body-sm">
                {Number(order.deliveryCharges) === 0 ? 'Free' : formatPrice(order.deliveryCharges || 0)}
              </p>
            </div>
            <div>
              <p className="account-order-detail__label">Tax</p>
              <p className="body-sm">{formatPrice(order.tax ?? order.taxes ?? 0)}</p>
            </div>
            <div>
              <p className="account-order-detail__label">Total</p>
              <p className="heading-sm">{formatPrice(order.totalAmount ?? 0)}</p>
            </div>
          </div>

          <div className="account-order-detail__meta">
            <p className="body-sm">
              Payment: <strong>{getPaymentStatusLabel(order.paymentStatus)}</strong>
              {paymentMethod ? ` · ${paymentMethod.toUpperCase()}` : ''}
            </p>
            {Number(order.balanceDueInr) > 0 && (
              <p className="body-sm text-muted">
                Balance due: {formatPrice(order.balanceDueInr)}
              </p>
            )}
            {order.appliedCoupon && (
              <p className="body-sm text-muted">Coupon: {order.appliedCoupon}</p>
            )}
          </div>

          {resumePayment && (
            <div className="account-order-detail__payment-alert">
              <CreditCard size={18} aria-hidden="true" />
              <div>
                <p className="heading-sm">Payment required</p>
                <p className="body-sm text-muted">
                  Complete online payment to confirm this order.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleContinuePayment}
                disabled={initiatePayment.isPending}
              >
                {initiatePayment.isPending ? 'Starting…' : 'Pay now'}
              </Button>
            </div>
          )}

          {holdExpired && paymentMethod === 'online' && order.paymentStatus === 'pending' && (
            <p className="account-order-detail__note body-sm text-muted">
              The payment window for this order has expired. Contact support if you need help.
            </p>
          )}
        </div>

        {items.length > 0 && (
          <div className="account-panel">
            <div className="account-panel__header">
              <div>
                <p className="heading-sm text-accent">Items</p>
                <h3 className="display-md">{items.length} {items.length === 1 ? 'item' : 'items'}</h3>
              </div>
            </div>
            <div className="account-order-items">
              {items.map((item, index) => (
                <OrderLineItem key={item._id || item.id || `${item.productId}-${index}`} item={item} />
              ))}
            </div>
          </div>
        )}

        {address && (
          <div className="account-panel">
            <div className="account-panel__header">
              <div>
                <p className="heading-sm text-accent">Delivery</p>
                <h3 className="display-md">Shipping address</h3>
              </div>
            </div>
            <div className="account-order-address">
              <MapPin size={16} aria-hidden="true" />
              <div>
                <p className="body-lg">{address.fullName || address.name || 'Recipient'}</p>
                <p className="body-sm text-muted">
                  {[address.addressLine1 || address.line1, address.addressLine2 || address.line2]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <p className="body-sm text-muted">
                  {[address.city, address.state, address.pincode || address.postalCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {address.phone && <p className="body-sm text-muted">{address.phone}</p>}
              </div>
            </div>
            {order.deliveryEstimate && (
              <>
                <Separator style={{ marginBlock: 'var(--space-3)' }} />
                <p className="body-sm text-muted">{order.deliveryEstimate}</p>
              </>
            )}
          </div>
        )}
      </div>

      {showRazorpay && razorpayBundle && (
        <RazorpayCheckout
          key={razorpayBundle.order.id}
          razorpayOrder={razorpayBundle.order}
          razorpayKey={razorpayBundle.key}
          orderId={orderId}
          userEmail={user?.email}
          userName={user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
          userPhone={address?.phone || user?.phone}
          paymentState={razorpayPaymentState}
          onPaymentStateChange={setRazorpayPaymentState}
          onSuccess={handleRazorpaySuccess}
          onFailure={handleRazorpayFailure}
          onClose={handleRazorpayClose}
          onNaturalDismiss={handleRazorpayClose}
        />
      )}

      {(verifyPayment.isPending || razorpayPaymentState === PAYMENT_STATE.SUCCESS) && (
        <PaymentLoadingOverlay message="Verifying your payment… please wait" />
      )}

      {showPaymentError && (
        <PaymentErrorOverlay
          error={paymentError}
          orderId={orderId}
          onRetry={() => {
            setShowPaymentError(false)
            setPaymentError(null)
            handleContinuePayment()
          }}
          onClose={() => {
            setShowPaymentError(false)
            setPaymentError(null)
          }}
        />
      )}
    </>
  )
}
