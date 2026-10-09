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

function formatRefundWhen(value) {
  if (!value) return null
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return null
  }
}

function readLockedCollectable(orderSafe) {
  try {
    const facing = orderSafe?.customerFacing
    if (facing?.collectableLocked && facing.collectableInr != null) {
      return Number(facing.collectableInr) || 0
    }
    const si = orderSafe?.shipmentInfo
    if (si != null && si.courierCollectableInr != null && Number.isFinite(Number(si.courierCollectableInr))) {
      return Number(si.courierCollectableInr) || 0
    }
    return null
  } catch {
    return null
  }
}

export function OrderPaymentSummaryCard({
  order,
  showRazorpayIds = false,
}) {
  const orderSafe = order && typeof order === 'object' ? order : {}
  const pi = orderSafe.paymentInfo && typeof orderSafe.paymentInfo === 'object'
    ? orderSafe.paymentInfo
    : {}
  const ri = orderSafe.returnInfo && typeof orderSafe.returnInfo === 'object'
    ? orderSafe.returnInfo
    : {}

  const payStatus = String(orderSafe.paymentStatus || '').toLowerCase()
  const balanceDue = Number(orderSafe.balanceDueInr) || 0
  const amountPaid = Number(orderSafe.amountPaidInr) || 0
  const billTotal = Number(orderSafe.totalAmount) || 0
  const lockedCollectable = readLockedCollectable(orderSafe)
  const hasLockedCollectable = lockedCollectable != null
  const isPaid = payStatus === 'paid'
  const hasDue = balanceDue > 0.01
  const lockDiffHint =
    orderSafe?.courierCollectableLockHint?.message ||
    (hasLockedCollectable && hasDue && Math.abs(lockedCollectable - balanceDue) > 0.05
      ? `Courier collectable (locked at push): ${formatPrice(lockedCollectable)}. Internal due differs: ${formatPrice(balanceDue)}.`
      : null)

  const refundHistory = Array.isArray(orderSafe.refundHistory) ? orderSafe.refundHistory : []
  const refundAmount = Math.max(
    0,
    Number(ri.refundAmount) ||
      refundHistory.reduce((s, r) => s + (Number(r.amountInr) || 0), 0) ||
      0,
  )
  const refundId = ri.refundId || refundHistory[0]?.refundId || null
  const refundWhen =
    formatRefundWhen(ri.approvedAt) ||
    formatRefundWhen(refundHistory[0]?.createdAt) ||
    formatRefundWhen(pi.cancelledAt) ||
    null
  const refundStatus = String(ri.status || '').toLowerCase()
  const refundFailureReason = String(pi.refundFailureReason || '').trim()
  const showRefundBlock =
    payStatus === 'refunded' ||
    payStatus === 'partially_refunded' ||
    refundAmount > 0.01 ||
    Boolean(refundId) ||
    ['refunded', 'refund_pending', 'refund_failed'].includes(refundStatus) ||
    Boolean(refundFailureReason)

  const statusTone = isPaid
    ? 'admin-badge admin-badge--success'
    : hasDue || payStatus === 'partially_paid' || (hasLockedCollectable && lockedCollectable > 0.01)
      ? 'admin-badge admin-badge--warn'
      : payStatus === 'failed' || payStatus === 'refunded' || payStatus === 'partially_refunded'
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
        {hasLockedCollectable ? (
          <div className="admin-payment-row admin-payment-row--due">
            <span>Courier collectable (locked at push)</span>
            <strong>{formatPrice(lockedCollectable)}</strong>
          </div>
        ) : null}
        {hasDue ? (
          <div className="admin-payment-row admin-payment-row--due">
            <span>{hasLockedCollectable ? 'Still due (internal)' : 'Still due'}</span>
            <strong>{formatPrice(balanceDue)}</strong>
          </div>
        ) : (
          <div className="admin-payment-row">
            <span>Balance</span>
            <strong className="text-success">All clear</strong>
          </div>
        )}
      </div>

      {lockDiffHint ? (
        <p className="admin-card__subtitle" style={{ marginTop: '0.5rem' }}>
          {lockDiffHint}
        </p>
      ) : null}

      {showRefundBlock ? (
        <div className="admin-payment-refs" style={{ marginTop: '0.75rem' }}>
          <p className="admin-card__subtitle">Refund</p>
          <div className="admin-payment-grid">
            <div className="admin-payment-row">
              <span>Refund status</span>
              <strong>{refundStatus ? refundStatus.replace(/_/g, ' ') : labelPaymentStatus(payStatus)}</strong>
            </div>
            {refundAmount > 0.01 ? (
              <div className="admin-payment-row">
                <span>Refund amount</span>
                <strong>{formatPrice(refundAmount)}</strong>
              </div>
            ) : null}
            {refundWhen ? (
              <div className="admin-payment-row">
                <span>Refunded on</span>
                <strong>{refundWhen}</strong>
              </div>
            ) : null}
            {refundId ? (
              <div className="admin-payment-row">
                <span>Refund id</span>
                <code>{refundId}</code>
              </div>
            ) : null}
          </div>
          {refundFailureReason ? (
            <p className="admin-card__subtitle" style={{ marginTop: '0.5rem', color: '#b91c1c' }}>
              Refund failure reason: {refundFailureReason}
            </p>
          ) : null}
          {refundHistory.length > 1 ? (
            <div style={{ marginTop: '0.5rem' }}>
              <p className="admin-card__subtitle">Refund history</p>
              {refundHistory.map((entry, idx) => (
                <p key={entry.refundId || idx} className="admin-card__subtitle">
                  {formatPrice(entry.amountInr || 0)}
                  {entry.refundId ? ` · ${entry.refundId}` : ''}
                  {formatRefundWhen(entry.createdAt) ? ` · ${formatRefundWhen(entry.createdAt)}` : ''}
                  {entry.status ? ` · ${entry.status}` : ''}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

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
