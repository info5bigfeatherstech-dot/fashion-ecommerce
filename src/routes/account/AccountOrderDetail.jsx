import { Link } from 'react-router-dom'
import { useCallback, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  CreditCard,
  Download,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  PackageX,
  ShieldAlert,
  Truck,
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
  usePayOrderBalance,
} from '@/features/orders/hooks'
import {
  canRequestReturn,
  canResumeOnlinePayment,
  canShow24HourOption,
  formatOrderDate,
  formatOrderDateTime,
  getHoursRemainingIn24h,
  getOrderItemImage,
  getOrderItemLineTotal,
  getOrderItemName,
  getOrderItemProductHref,
  getOrderItemVariantLabel,
  getOrderItems,
  getOrderStatusClass,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  hasActiveReturn,
  isOrderTrackable,
  isPaymentWindowExpired,
} from '@/features/orders/utils'
import { formatPrice } from '@/lib/utils'
import { useAppStore } from '@/store'
import {
  Order24HourChangeModal,
  OrderInvoiceModal,
  OrderReturnModal,
  OrderTrackerSection,
  OrderTrackingModal,
} from '@/features/orders/components'

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
  const href = getOrderItemProductHref(item)
  const qty = Number(item.quantity) || 1
  const lineTotal = getOrderItemLineTotal(item)
  const Tag = href ? Link : 'div'
  const linkProps = href ? { to: href } : {}

  return (
    <Tag
      {...linkProps}
      className={`account-order-item${href ? ' account-order-item--link' : ''}`}
    >
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
        {item.sku ? (
          <p className="account-order-item__meta text-muted">SKU: {item.sku}</p>
        ) : null}
        <p className="account-order-item__qty">Qty {qty}</p>
      </div>
      <p className="account-order-item__price">{formatPrice(lineTotal)}</p>
    </Tag>
  )
}

export function AccountOrderDetail({ orderId, onBack }) {
  const user = useAppStore((s) => s.user)
  const { data: order, isLoading, isError, error, refetch } = useOrderDetail(orderId)
  const initiatePayment = useInitiateOrderPayment()
  const verifyPayment = useVerifyRazorpayPayment()
  const payBalance = usePayOrderBalance()
  const invalidateOrders = useInvalidateOrders()

  // Modals state
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [show24hModal, setShow24hModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)

  // Razorpay payment flow state
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

  const handleRazorpaySuccess = useCallback(
    async (response) => {
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
    },
    [invalidateOrders, orderId, refetch, verifyPayment]
  )

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
        <p className="body-sm text-muted">Loading order details…</p>
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
  const address = order.shippingAddress || order.addressSnapshot || order.address || order.deliveryAddress
  const hasAddress = Boolean(
    address &&
    typeof address === 'object' &&
    (address.fullName || address.name || address.addressLine1 || address.line1 || address.city || address.state || address.pincode || address.phone)
  )
  const shipment = order.shipmentInfo || null
  const resumePayment = canResumeOnlinePayment(order)
  const holdExpired = isPaymentWindowExpired(order)
  const paymentMethod = String(order.paymentInfo?.method || order.paymentMethod || '').toLowerCase()
  const canTrack = isOrderTrackable(order)
  const can24h = canShow24HourOption(order)
  const hoursLeft = can24h ? getHoursRemainingIn24h(order?.createdAt) : 0
  const isDelivered = String(order.orderStatus || '').toLowerCase() === 'delivered'
  const returnActive = hasActiveReturn(order)
  const returnEligible = canRequestReturn(order)

  return (
    <>
      <div className="account-order-detail">
        <div className="account-order-detail__top-nav">
          <button type="button" className="account-order-detail__back" onClick={onBack}>
            <ArrowLeft size={14} aria-hidden="true" />
            All orders
          </button>

          <div className="account-order-detail__quick-actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowTrackingModal(true)}
            >
              <Truck size={14} /> Track Order
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowInvoiceModal(true)}
            >
              <FileText size={14} /> Tax Invoice
            </Button>
          </div>
        </div>

        {/* 24-Hour Confirmed Order Return & Refund Notification / Action Banner */}
        {can24h && (
          <div className="order-detail-24h-banner">
            <div className="order-detail-24h-banner__content">
              <div className="order-detail-24h-banner__badge">
                <Clock size={16} />
                <span>Confirmed Order · 24-Hour Return & Refund Window</span>
              </div>
              <p className="body-sm">
                Your order is confirmed. You have <strong>{hoursLeft} hour{hoursLeft === 1 ? '' : 's'} remaining</strong> to
                submit a return/refund request with your product video, photos, and query before dispatch.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShow24hModal(true)}
            >
              Request Return / Refund
            </Button>
          </div>
        )}

        {/* Return Active Banner */}
        {returnActive && (
          <div className="order-detail-return-banner">
            <div className="order-detail-return-banner__content">
              <PackageX size={18} />
              <div>
                <p className="body-sm font-semibold">Return Request Active</p>
                <p className="body-xs text-muted">
                  A return inquiry has been submitted. You can chat with our support team regarding your return.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowReturnModal(true)}
            >
              <MessageSquare size={14} /> Return Support Chat
            </Button>
          </div>
        )}

        {/* Main Header Panel */}
        <div className="account-panel account-order-detail__header">
          <div className="account-order-detail__heading">
            <div>
              <div className="account-order-detail__id-row">
                <h3 className="display-md">{order.orderId}</h3>
                <OrderStatusBadge status={order.orderStatus} />
              </div>
              <p className="body-sm text-muted">{formatOrderDateTime(order.createdAt)}</p>
            </div>

            <div className="account-order-detail__header-btns">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowTrackingModal(true)}
              >
                <Truck size={14} /> Track Order
              </Button>

              {can24h && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShow24hModal(true)}
                >
                  <Clock size={14} /> Return / Refund (24h)
                </Button>
              )}

              {returnEligible && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowReturnModal(true)}
                >
                  <PackageX size={14} /> Request Return
                </Button>
              )}
            </div>
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
            {Number(order.discount) > 0 && (
              <div>
                <p className="account-order-detail__label">Discount</p>
                <p className="body-sm text-accent">-{formatPrice(order.discount)}</p>
              </div>
            )}
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
              <p className="body-sm text-muted">
                Coupon:{' '}
                {typeof order.appliedCoupon === 'string'
                  ? order.appliedCoupon
                  : `${order.appliedCoupon.code || 'Applied'}${
                      Number(order.appliedCoupon.discount) > 0
                        ? ` (${formatPrice(order.appliedCoupon.discount)} off)`
                        : ''
                    }`}
              </p>
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

        {/* Live Order Tracker Section */}
        <OrderTrackerSection orderId={orderId} order={order} />

        {/* Items List */}
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

        {/* Delivery Address */}
        {hasAddress && (
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
                <p className="body-lg">{address?.fullName || address?.name || 'Recipient'}</p>
                <p className="body-sm text-muted">
                  {[address?.addressLine1 || address?.line1, address?.addressLine2 || address?.line2]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <p className="body-sm text-muted">
                  {[address?.city, address?.state, address?.pincode || address?.postalCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {address?.phone && <p className="body-sm text-muted">{address.phone}</p>}
              </div>
            </div>
            {order.deliveryEstimate && (
              <>
                <Separator style={{ marginBlock: 'var(--space-3)' }} />
                <p className="body-sm text-muted">
                  {typeof order.deliveryEstimate === 'string'
                    ? order.deliveryEstimate
                    : order.deliveryEstimate?.text ||
                      order.deliveryEstimate?.date ||
                      order.deliveryEstimate?.estimate ||
                      ''}
                </p>
              </>
            )}
          </div>
        )}

        {/* Customer Facing Notes if any */}
        {Array.isArray(order.customerFacingNotes) && order.customerFacingNotes.length > 0 && (
          <div className="account-panel">
            <div className="account-panel__header">
              <h4 className="heading-sm">Order Updates & Notes</h4>
            </div>
            <div className="order-notes-list">
              {order.customerFacingNotes.map((note, idx) => (
                <div key={idx} className="order-note-item">
                  <p className="body-sm">{typeof note === 'string' ? note : (note?.message || note?.text || note?.note || '')}</p>
                  {note?.createdAt && (
                    <span className="body-xs text-muted">{formatOrderDateTime(note.createdAt)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showTrackingModal && (
        <OrderTrackingModal
          open={showTrackingModal}
          onClose={() => setShowTrackingModal(false)}
          orderId={orderId}
          initialTracking={shipment ? {
            orderId,
            currentStatus: order.orderStatus,
            trackingNumber: shipment.trackingNumber || shipment.awbCode,
            courier: shipment.courier,
            estimatedDelivery: shipment.estimatedDelivery,
            providerStatus: shipment.providerStatus,
          } : null}
        />
      )}

      {showInvoiceModal && (
        <OrderInvoiceModal
          open={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          orderId={orderId}
        />
      )}

      {show24hModal && (
        <Order24HourChangeModal
          open={show24hModal}
          onClose={() => setShow24hModal(false)}
          order={order}
        />
      )}

      {showReturnModal && (
        <OrderReturnModal
          open={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          order={order}
        />
      )}

      {/* Razorpay Online Payment Modals */}
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
