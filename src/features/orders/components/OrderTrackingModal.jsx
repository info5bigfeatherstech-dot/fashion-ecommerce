import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  RefreshCw,
  Truck,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useOrderTracking } from '../hooks'
import {
  formatOrderDateTime,
  getCustomerSafeCourierName,
  getCustomerSafeProviderStatus,
  getOrderStatusLabel,
} from '../utils'

const DEFAULT_STAGES = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing & Packed' },
  { key: 'shipped', label: 'In Transit' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
]

export function OrderTrackingModal({ open, onClose, orderId, initialTracking = null }) {
  const { data: trackingData, isLoading, isError, error, refetch, isFetching } = useOrderTracking(
    orderId,
    { enabled: Boolean(open && orderId) }
  )
  const [copied, setCopied] = useState(false)

  const tracking = trackingData || initialTracking

  const handleCopyAwb = (awb) => {
    if (!awb) return
    navigator.clipboard?.writeText(awb)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentStatus = String(tracking?.currentStatus || '').toLowerCase()
  // Never use shippingProvider as display courier (that field is aggregator key).
  const courier = getCustomerSafeCourierName(tracking)
  const trackingNumber = tracking?.trackingNumber || tracking?.awbCode || null
  const providerStatus = getCustomerSafeProviderStatus(
    tracking?.providerStatus || tracking?.statusSummary?.headline
  )
  const estimatedDelivery = tracking?.estimatedDelivery || null

  const stageOrder = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered']
  let activeIndex = stageOrder.indexOf(currentStatus)
  if (activeIndex === -1) {
    activeIndex = 1
  }

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="Track Your Order"
      subtitle={`Order #${orderId || ''}`}
      className="order-tracking-modal"
    >
      <div className="order-tracking-content">
        {isLoading && !tracking && (
          <div className="account-orders-state" style={{ minHeight: '220px' }}>
            <Loader2 size={24} className="account-orders-state__spin" aria-hidden="true" />
            <p className="body-sm text-muted">Fetching tracking updates…</p>
          </div>
        )}

        {isError && !tracking && (
          <div className="order-tracking-empty">
            <AlertCircle size={32} className="text-muted" />
            <p className="heading-sm">Unable to load tracking details</p>
            <p className="body-sm text-muted">
              {error?.message || 'Tracking updates are currently unavailable for this order.'}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              style={{ marginTop: '12px' }}
            >
              <RefreshCw size={14} /> Retry
            </Button>
          </div>
        )}

        {tracking && (
          <>
            <div className="order-tracking-hero">
              <div className="order-tracking-hero__header">
                <div>
                  <span className="order-tracking-hero__badge">
                    <Truck size={14} />
                    {getOrderStatusLabel(tracking.currentStatus || 'Processing')}
                  </span>
                  {providerStatus ? (
                    <p className="order-tracking-hero__provider-status">{providerStatus}</p>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="order-tracking-refresh"
                  aria-label="Refresh tracking"
                >
                  <RefreshCw size={14} className={isFetching ? 'account-orders-state__spin' : ''} />
                </Button>
              </div>

              <div className="order-tracking-details-grid">
                {courier ? (
                  <div className="order-tracking-detail-item">
                    <span className="order-tracking-detail-item__label">Courier</span>
                    <span className="order-tracking-detail-item__val">{courier}</span>
                  </div>
                ) : null}

                {trackingNumber ? (
                  <div className="order-tracking-detail-item">
                    <span className="order-tracking-detail-item__label">Tracking / AWB #</span>
                    <span className="order-tracking-detail-item__val order-tracking-awb">
                      {trackingNumber}
                      <button
                        type="button"
                        onClick={() => handleCopyAwb(trackingNumber)}
                        className="order-tracking-copy-btn"
                        title="Copy AWB number"
                      >
                        <Copy size={13} />
                        {copied ? 'Copied' : ''}
                      </button>
                    </span>
                  </div>
                ) : null}

                {estimatedDelivery ? (
                  <div className="order-tracking-detail-item">
                    <span className="order-tracking-detail-item__label">Est. Delivery</span>
                    <span className="order-tracking-detail-item__val">
                      {formatOrderDateTime(estimatedDelivery)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="order-tracking-section">
              <h4 className="order-tracking-section__title">Milestones</h4>
              <div className="order-stepper">
                {DEFAULT_STAGES.map((stage, idx) => {
                  const isDone = idx <= activeIndex
                  const isCurrent = idx === activeIndex

                  return (
                    <div
                      key={stage.key}
                      className={`order-step ${isDone ? 'order-step--completed' : ''} ${
                        isCurrent ? 'order-step--current' : ''
                      }`}
                    >
                      <div className="order-step__indicator">
                        {isDone ? <CheckCircle2 size={16} /> : <span className="order-step__dot" />}
                      </div>
                      <div className="order-step__content">
                        <p className="order-step__label">{stage.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
