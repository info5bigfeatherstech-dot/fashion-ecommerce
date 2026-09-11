import { Eye, ExternalLink } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

function getRtoStatusBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  switch (s) {
    case 'pending':
      return 'rto-status-badge--pending'
    case 'refunded':
      return 'rto-status-badge--refunded'
    case 'closed':
      return 'rto-status-badge--closed'
    case 'refund_failed':
      return 'rto-status-badge--failed'
    case 'refund_rejected':
      return 'rto-status-badge--rejected'
    default:
      return 'rto-status-badge--default'
  }
}

function getPaymentBadgeClass(type) {
  const p = String(type || '').toLowerCase()
  if (p.includes('cod')) return 'rto-payment-badge--cod'
  if (p.includes('prepaid') || p.includes('online')) return 'rto-payment-badge--prepaid'
  if (p.includes('partial')) return 'rto-payment-badge--partial'
  return 'rto-payment-badge--default'
}

export function RtoOrdersTable({
  orders,
  isLoading,
  selectedOrderIds,
  onSelectOrder,
  onSelectAll,
  onViewOrder,
}) {
  const allSelected =
    orders.length > 0 &&
    orders.every((order) => {
      const id = String(order.orderId || order.id || order._id)
      return selectedOrderIds.includes(id)
    })

  const someSelected =
    orders.some((order) => {
      const id = String(order.orderId || order.id || order._id)
      return selectedOrderIds.includes(id)
    }) && !allSelected

  if (isLoading) {
    return (
      <div className="rto-table-container">
        <table className="rto-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}><div className="rto-skeleton-box w-4 h-4" /></th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Amount Paid</th>
              <th>RTO Status</th>
              <th>Stage</th>
              <th>Reason</th>
              <th>Refund Amount</th>
              <th>Payment Type</th>
              <th>Created At</th>
              <th style={{ width: '60px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="rto-table-row--skeleton">
                <td><div className="rto-skeleton-box w-4 h-4" /></td>
                <td><div className="rto-skeleton-line w-20" /></td>
                <td><div className="rto-skeleton-line w-28" /></td>
                <td><div className="rto-skeleton-line w-16" /></td>
                <td><div className="rto-skeleton-line w-16" /></td>
                <td><div className="rto-skeleton-box w-20 h-6" /></td>
                <td><div className="rto-skeleton-line w-16" /></td>
                <td><div className="rto-skeleton-line w-24" /></td>
                <td><div className="rto-skeleton-line w-16" /></td>
                <td><div className="rto-skeleton-box w-16 h-6" /></td>
                <td><div className="rto-skeleton-line w-20" /></td>
                <td><div className="rto-skeleton-box w-8 h-8 rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="rto-table-container rto-table-container--empty">
        <div className="rto-empty-state">
          <span className="rto-empty-state__icon">📦</span>
          <h3 className="rto-empty-state__title">No RTO Orders Found</h3>
          <p className="rto-empty-state__desc">
            No returned-to-origin orders match your current filters or search criteria.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rto-table-container">
      <div className="rto-table-scroll">
        <table className="rto-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  className="rto-checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected
                  }}
                  onChange={onSelectAll}
                  aria-label="Select all orders"
                />
              </th>
              <th>Order ID</th>
              <th>Customer Name</th>
              <th>Amount</th>
              <th>Amount Paid</th>
              <th>RTO Status</th>
              <th>Stage</th>
              <th>Reason</th>
              <th>Refund Amount</th>
              <th>Payment Type</th>
              <th>Created At</th>
              <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const id = String(order.orderId || order.id || order._id || '')
              const isSelected = selectedOrderIds.includes(id)
              const customerName =
                order.customerName ||
                order.user?.name ||
                order.shippingAddress?.fullName ||
                order.userEmail ||
                '—'
              const customerEmail = order.userEmail || order.user?.email || ''
              const customerPhone = order.customerPhone || order.shippingAddress?.phone || ''
              const amount = Number(order.totalAmount ?? order.amount ?? 0)
              const amountPaid = Number(
                order.amountPaid ??
                (order.paymentStatus === 'paid' ? amount : 0)
              )
              const refundAmount = Number(
                order.refundAmount ??
                order.refundCalculation?.proposedRefundAmount ??
                0
              )
              const stage = order.stage || order.rtoStage || order.status || '—'
              const reason = order.rtoReason || order.reason || order.cancellationReason || '—'
              const paymentType =
                order.paymentType ||
                order.paymentMethod ||
                (order.isCod ? 'COD' : 'Prepaid')

              const formattedDate = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'

              return (
                <tr
                  key={id}
                  className={`rto-table-row${isSelected ? ' is-selected' : ''}`}
                  onClick={() => onViewOrder(order)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="rto-checkbox"
                      checked={isSelected}
                      onChange={() => onSelectOrder(id)}
                      aria-label={`Select order ${id}`}
                    />
                  </td>

                  <td>
                    <div className="rto-order-cell">
                      <span className="rto-order-id">{id}</span>
                      {order.trackingNumber && (
                        <span className="rto-tracking-sub">
                          AWB: {order.trackingNumber}
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="rto-customer-cell">
                      <strong className="rto-customer-name">{customerName}</strong>
                      {customerPhone && (
                        <span className="rto-customer-phone">{customerPhone}</span>
                      )}
                      {customerEmail && (
                        <span className="rto-customer-email">{customerEmail}</span>
                      )}
                    </div>
                  </td>

                  <td>
                    <span className="rto-amount">{formatPrice(amount)}</span>
                  </td>

                  <td>
                    <span className="rto-amount-paid">{formatPrice(amountPaid)}</span>
                  </td>

                  <td>
                    <span
                      className={`rto-status-badge ${getRtoStatusBadgeClass(
                        order.rtoStatus
                      )}`}
                    >
                      {order.rtoStatus || 'pending'}
                    </span>
                  </td>

                  <td>
                    <span className="rto-stage-text">{stage}</span>
                  </td>

                  <td>
                    <div className="rto-reason-cell" title={reason}>
                      {reason}
                    </div>
                  </td>

                  <td>
                    <span className="rto-refund-amount">
                      {refundAmount > 0 ? formatPrice(refundAmount) : '₹0'}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`rto-payment-badge ${getPaymentBadgeClass(
                        paymentType
                      )}`}
                    >
                      {paymentType}
                    </span>
                  </td>

                  <td>
                    <span className="rto-date-text">{formattedDate}</span>
                  </td>

                  <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="rto-action-icon-btn"
                      onClick={() => onViewOrder(order)}
                      title="View details and take action"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
