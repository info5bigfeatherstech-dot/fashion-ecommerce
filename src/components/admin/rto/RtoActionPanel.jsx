import { useState } from 'react'
import {
  X,
  Package,
  DollarSign,
  Truck,
  Warehouse,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export function RtoActionPanel({
  order,
  isOpen,
  onClose,
  onRefund,
  onReject,
  onCloseCase,
  isRefunding,
  isRejecting,
}) {
  const [confirmModal, setConfirmModal] = useState({
    type: null, // 'refund' | 'reject' | 'close'
    orderId: null,
    amount: '',
    reason: '',
  })

  if (!isOpen || !order) return null

  const orderId = String(order.orderId || order.id || order._id || '')
  const rtoStatus = String(order.rtoStatus || 'pending').toLowerCase()
  const isRefunded = rtoStatus === 'refunded'
  const isClosed = rtoStatus === 'closed'
  const isRejected = rtoStatus === 'refund_rejected'

  // Action capabilities based on backend flags or status
  const canRefund =
    order.canRefund !== undefined
      ? Boolean(order.canRefund)
      : !isRefunded && !isClosed && !isRejected
  const canReject =
    order.canReject !== undefined
      ? Boolean(order.canReject)
      : !isRefunded && !isClosed && !isRejected
  const canClose =
    order.canClose !== undefined
      ? Boolean(order.canClose)
      : !isClosed

  // Calculation details
  const calc = order.refundCalculation || {}
  const totalAmount = Number(order.totalAmount ?? order.amount ?? 0)
  const amountPaid = Number(
    order.amountPaid ??
    (order.paymentStatus === 'paid' ? totalAmount : 0)
  )
  const shippingCharges = Number(calc.shippingCharges ?? 0)
  const rtoCharges = Number(calc.rtoCharges ?? (amountPaid > 0 ? 100 : 0))
  const otherDeductions = Number(calc.otherDeductions ?? 0)
  const deductionReason = calc.deductionReason || 'Forward and RTO reverse freight deduction'
  const eligibleRefund = Number(
    calc.eligibleRefundAmount ??
    calc.proposedRefundAmount ??
    Math.max(0, amountPaid - shippingCharges - rtoCharges - otherDeductions)
  )

  const paymentType = String(
    order.paymentType || order.paymentMethod || (order.isCod ? 'COD' : 'Prepaid')
  ).toUpperCase()

  const handleOpenConfirm = (type) => {
    setConfirmModal({
      type,
      orderId,
      amount: eligibleRefund > 0 ? String(eligibleRefund) : String(amountPaid),
      reason:
        type === 'reject'
          ? 'Customer requested cancellation after dispatch / address unreachable'
          : '',
    })
  }

  const handleExecuteAction = async () => {
    const { type, amount, reason } = confirmModal
    try {
      if (type === 'refund') {
        await onRefund({
          orderId,
          amount: Number(amount) || eligibleRefund,
          reason: reason || deductionReason,
        })
      } else if (type === 'reject') {
        await onReject({
          orderId,
          reason: reason || 'RTO claim rejected by admin',
        })
      } else if (type === 'close') {
        await onCloseCase(orderId)
      }
      setConfirmModal({ type: null, orderId: null, amount: '', reason: '' })
    } catch {
      // Error toasted in hook
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="rto-panel-backdrop" onClick={onClose} />

      {/* Slide-over Action Panel */}
      <aside className="rto-action-panel" aria-label="RTO Details">
        <div className="rto-action-panel__header">
          <div>
            <div className="rto-action-panel__eyebrow">RTO Order Inspection</div>
            <h2 className="rto-action-panel__title">#{orderId}</h2>
          </div>
          <button
            type="button"
            className="rto-action-panel__close"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
        </div>

        <div className="rto-action-panel__content">
          {/* Status Banner */}
          <div className="rto-panel-card rto-panel-card--status">
            <div className="rto-panel-status-row">
              <span className="rto-panel-label">Current Status:</span>
              <span className={`rto-status-badge rto-status-badge--${rtoStatus}`}>
                {order.rtoStatus || 'Pending'}
              </span>
            </div>
            <div className="rto-panel-status-row">
              <span className="rto-panel-label">Delivery Stage:</span>
              <strong>{order.stage || order.rtoStage || 'Returned to Hub'}</strong>
            </div>
            {order.rtoReason && (
              <div className="rto-panel-status-row">
                <span className="rto-panel-label">RTO Reason:</span>
                <span className="text-rose-600 font-medium">{order.rtoReason}</span>
              </div>
            )}
          </div>

          {/* Customer & Order Summary */}
          <div className="rto-panel-card">
            <h3 className="rto-panel-card__title">
              <Package size={16} />
              Customer Information
            </h3>
            <div className="rto-detail-grid">
              <div>
                <span className="rto-detail-label">Customer Name</span>
                <strong className="rto-detail-val">
                  {order.customerName || order.user?.name || '—'}
                </strong>
              </div>
              <div>
                <span className="rto-detail-label">Phone</span>
                <span className="rto-detail-val">
                  {order.customerPhone || order.shippingAddress?.phone || '—'}
                </span>
              </div>
              <div>
                <span className="rto-detail-label">Email</span>
                <span className="rto-detail-val">
                  {order.userEmail || order.user?.email || '—'}
                </span>
              </div>
              <div>
                <span className="rto-detail-label">Created At</span>
                <span className="rto-detail-val">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString('en-IN')
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Refund Calculation & Deductions */}
          <div className="rto-panel-card">
            <h3 className="rto-panel-card__title">
              <DollarSign size={16} />
              RTO Refund Calculation & Deductions
            </h3>

            <div className="rto-calc-table">
              <div className="rto-calc-row">
                <span>Total Order Value:</span>
                <strong>{formatPrice(totalAmount)}</strong>
              </div>
              <div className="rto-calc-row">
                <span>Amount Paid by Customer:</span>
                <strong className="text-emerald-600">{formatPrice(amountPaid)}</strong>
              </div>
              <div className="rto-calc-divider" />
              <div className="rto-calc-row text-muted">
                <span>Forward Shipping Deduction:</span>
                <span>-{formatPrice(shippingCharges)}</span>
              </div>
              <div className="rto-calc-row text-muted">
                <span>RTO Reverse Freight Deduction:</span>
                <span>-{formatPrice(rtoCharges)}</span>
              </div>
              {otherDeductions > 0 && (
                <div className="rto-calc-row text-muted">
                  <span>Other Restocking Deductions:</span>
                  <span>-{formatPrice(otherDeductions)}</span>
                </div>
              )}
              <div className="rto-calc-divider" />
              <div className="rto-calc-row rto-calc-row--total">
                <span>Eligible Net Refund:</span>
                <strong className="rto-eligible-amount">
                  {formatPrice(eligibleRefund)}
                </strong>
              </div>
            </div>

            {deductionReason && (
              <p className="rto-deduction-note">
                <AlertCircle size={14} />
                <span><strong>Policy:</strong> {deductionReason}</span>
              </p>
            )}
          </div>

          {/* Payment & Logistics Info */}
          <div className="rto-panel-card">
            <h3 className="rto-panel-card__title">
              <Truck size={16} />
              Payment & Logistics Details
            </h3>
            <div className="rto-detail-grid">
              <div>
                <span className="rto-detail-label">Payment Type</span>
                <span className="rto-payment-badge">{paymentType}</span>
              </div>
              <div>
                <span className="rto-detail-label">Courier Partner</span>
                <span className="rto-detail-val">{order.courierName || 'Shiprocket'}</span>
              </div>
              <div>
                <span className="rto-detail-label">Tracking / AWB #</span>
                <span className="rto-detail-val font-mono">{order.trackingNumber || '—'}</span>
              </div>
              <div>
                <span className="rto-detail-label">Return Triggered</span>
                <span className="rto-detail-val">
                  {order.rtoInitiatedAt
                    ? new Date(order.rtoInitiatedAt).toLocaleDateString('en-IN')
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Warehouse Delivered Info */}
          <div className="rto-panel-card">
            <h3 className="rto-panel-card__title">
              <Warehouse size={16} />
              Warehouse Delivered Information
            </h3>
            <div className="rto-detail-grid">
              <div>
                <span className="rto-detail-label">Receiving Warehouse</span>
                <span className="rto-detail-val">
                  {order.warehouseName || 'Main Central Fulfillment Hub'}
                </span>
              </div>
              <div>
                <span className="rto-detail-label">Intake / Delivered Date</span>
                <span className="rto-detail-val">
                  {order.warehouseDeliveredAt
                    ? new Date(order.warehouseDeliveredAt).toLocaleString('en-IN')
                    : order.returnedAt
                      ? new Date(order.returnedAt).toLocaleDateString('en-IN')
                      : 'Pending Warehouse Verification'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel Footer */}
        <div className="rto-action-panel__footer">
          <Button
            type="button"
            variant="primary"
            onClick={() => handleOpenConfirm('refund')}
            disabled={!canRefund || isRefunding}
            className="rto-btn--refund"
          >
            <RotateCcw size={16} />
            {isRefunding ? 'Refunding…' : 'Process Refund'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenConfirm('reject')}
            disabled={!canReject || isRejecting}
            className="rto-btn--reject"
          >
            <XCircle size={16} />
            {isRejecting ? 'Rejecting…' : 'Reject RTO'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenConfirm('close')}
            disabled={!canClose}
            className="rto-btn--close"
          >
            <CheckCircle2 size={16} />
            Close Case
          </Button>
        </div>
      </aside>

      {/* Confirmation Modals */}
      {confirmModal.type && (
        <Modal
          open={Boolean(confirmModal.type)}
          onOpenChange={() =>
            setConfirmModal({ type: null, orderId: null, amount: '', reason: '' })
          }
          title={
            confirmModal.type === 'refund'
              ? `Confirm Refund for Order #${orderId}`
              : confirmModal.type === 'reject'
                ? `Reject RTO for Order #${orderId}`
                : `Close RTO Case #${orderId}`
          }
          subtitle="Please confirm your action before proceeding"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="ghost"
                onClick={() =>
                  setConfirmModal({ type: null, orderId: null, amount: '', reason: '' })
                }
              >
                Cancel
              </Button>
              <Button
                variant={confirmModal.type === 'reject' ? 'destructive' : 'primary'}
                onClick={handleExecuteAction}
                disabled={isRefunding || isRejecting}
              >
                {confirmModal.type === 'refund'
                  ? 'Confirm Refund'
                  : confirmModal.type === 'reject'
                    ? 'Confirm Rejection'
                    : 'Confirm Close Case'}
              </Button>
            </div>
          }
        >
          <div className="rto-modal-body">
            {confirmModal.type === 'refund' && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted">
                  The refund will be credited back to the customer via the original payment source
                  or manual store credit.
                </p>
                <div>
                  <label className="text-xs font-semibold text-ink block mb-1">
                    Refund Amount (INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={amountPaid}
                    value={confirmModal.amount}
                    onChange={(e) =>
                      setConfirmModal({ ...confirmModal, amount: e.target.value })
                    }
                    className="rto-modal-input"
                    placeholder="Enter refund amount"
                  />
                  <span className="text-xs text-muted block mt-1">
                    Maximum eligible refund based on deductions: {formatPrice(eligibleRefund)}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink block mb-1">
                    Notes / Reason
                  </label>
                  <input
                    type="text"
                    value={confirmModal.reason}
                    onChange={(e) =>
                      setConfirmModal({ ...confirmModal, reason: e.target.value })
                    }
                    className="rto-modal-input"
                    placeholder="Reason for refund and deduction breakdown"
                  />
                </div>
              </div>
            )}

            {confirmModal.type === 'reject' && (
              <div className="flex flex-col gap-3">
                <div className="rto-modal-alert">
                  <ShieldAlert size={16} />
                  <span>
                    Rejecting this RTO means no refund will be disbursed and the order status will
                    be updated to <strong>Refund Rejected</strong>.
                  </span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink block mb-1">
                    Rejection Reason (Required)
                  </label>
                  <textarea
                    rows={3}
                    value={confirmModal.reason}
                    onChange={(e) =>
                      setConfirmModal({ ...confirmModal, reason: e.target.value })
                    }
                    className="rto-modal-textarea"
                    placeholder="Explain why this RTO claim is rejected..."
                  />
                </div>
              </div>
            )}

            {confirmModal.type === 'close' && (
              <p className="text-sm text-muted">
                Are you sure you want to mark case #{orderId} as closed? This indicates warehouse
                restocking and resolution have completed.
              </p>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
