import { formatPrice } from '@/lib/utils'

const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  initiated: 'Initiated',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  partially_paid: 'Partially paid',
  partially_refunded: 'Partially refunded',
}

function labelPaymentStatus(raw) {
  const key = String(raw || '').trim()
  return PAYMENT_STATUS_LABELS[key] || key.replace(/_/g, ' ') || '—'
}

export function OrderPaymentSummaryCard({
  order,
  showRazorpayIds = false,
}) {
  const orderSafe = order && typeof order === 'object' ? order : {}
  const pi = orderSafe.paymentInfo && typeof orderSafe.paymentInfo === 'object'
    ? orderSafe.paymentInfo
    : {}

  const payStatus = String(orderSafe.paymentStatus || '').toLowerCase()
  const balanceDue = Number(orderSafe.balanceDueInr) || 0
  const amountPaid = Number(orderSafe.amountPaidInr) || 0
  const billTotal = Number(orderSafe.totalAmount) || 0
  const isPaid = payStatus === 'paid'
  const hasDue = balanceDue > 0.01

  const statusTone = isPaid
    ? 'admin-badge admin-badge--success'
    : hasDue || payStatus === 'partially_paid'
      ? 'admin-badge admin-badge--warn'
      : payStatus === 'failed' || payStatus === 'refunded'
        ? 'admin-badge admin-badge--error'
        : 'admin-badge'

  return (
    <div className="admin-card">
      <div className="admin-card__head">
        <div>
          <h3 className="admin-card__title">Payment details</h3>
          <p className="admin-card__subtitle">Money paid vs still due</p>
        </div>
        <span className={statusTone}>{labelPaymentStatus(orderSafe.paymentStatus)}</span>
      </div>

      <div className="admin-payment-grid">
        <div className="admin-payment-row">
          <span>Method</span>
          <strong>{pi.method || orderSafe.paymentMethod || '—'}</strong>
        </div>
        <div className="admin-payment-row">
          <span>Bill total</span>
          <strong>{formatPrice(billTotal)}</strong>
        </div>
        <div className="admin-payment-row">
          <span>Already paid</span>
          <strong className="text-accent">{formatPrice(amountPaid)}</strong>
        </div>
        {hasDue ? (
          <div className="admin-payment-row admin-payment-row--due">
            <span>Still due</span>
            <strong>{formatPrice(balanceDue)}</strong>
          </div>
        ) : (
          <div className="admin-payment-row">
            <span>Balance</span>
            <strong className="text-success">All clear</strong>
          </div>
        )}
      </div>

      {showRazorpayIds && (pi.razorpayOrderId || pi.razorpayPaymentId) && (
        <div className="admin-payment-refs">
          <p className="admin-card__subtitle">Gateway references</p>
          {pi.razorpayOrderId && (
            <p><span>Razorpay order</span><code>{pi.razorpayOrderId}</code></p>
          )}
          {pi.razorpayPaymentId && (
            <p><span>Razorpay payment</span><code>{pi.razorpayPaymentId}</code></p>
          )}
        </div>
      )}
    </div>
  )
}
