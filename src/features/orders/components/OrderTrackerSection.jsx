import { useState } from 'react'
import {
  CheckCircle2,
  Copy,
  Loader2,
  Truck,
} from 'lucide-react'
import { useOrderTracking } from '../hooks'
import {
  formatOrderDate,
  getCustomerSafeCourierName,
  getCustomerSafeProviderStatus,
  getOrderStatusLabel,
} from '../utils'

const TRACKING_MILESTONES = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'confirmed', label: 'Order Confirmed' },
  { key: 'processing', label: 'Packed & Ready' },
  { key: 'shipped', label: 'In Transit' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
]

export function OrderTrackerSection({ orderId, order, className = '' }) {
  const { data: trackingData, isLoading } = useOrderTracking(orderId, {
    enabled: Boolean(orderId),
  })
  const [copied, setCopied] = useState(false)

  // Merge API tracking data with order shipment fallback (no detailed timeline for customers)
  const tracking = trackingData || (order?.shipmentInfo
    ? {
        orderId,
        currentStatus: order.orderStatus,
        trackingNumber: order.shipmentInfo.trackingNumber || order.shipmentInfo.awbCode,
        courier: order.shipmentInfo.courier,
        estimatedDelivery: order.shipmentInfo.estimatedDelivery,
        providerStatus: order.shipmentInfo.providerStatus,
      }
    : null)

  const handleCopyAwb = (awb) => {
    if (!awb) return
    navigator.clipboard?.writeText(awb)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentStatus = String(
    tracking?.currentStatus || order?.orderStatus || 'pending'
  ).toLowerCase()

  const providerStatus = getCustomerSafeProviderStatus(
    tracking?.providerStatus ||
      tracking?.statusSummary?.headline ||
      order?.shipmentInfo?.providerStatus
  )

  const courier = getCustomerSafeCourierName(tracking || order?.shipmentInfo)

  const trackingNumber =
    tracking?.trackingNumber ||
    tracking?.awbCode ||
    order?.shipmentInfo?.trackingNumber ||
    order?.shipmentInfo?.awbCode ||
    null

  const estimatedDelivery =
    tracking?.estimatedDelivery ||
    order?.shipmentInfo?.estimatedDelivery ||
    order?.deliveryEstimate ||
    null

  const stageOrder = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered']
  let activeIndex = stageOrder.indexOf(currentStatus)
  if (activeIndex === -1) {
    activeIndex = currentStatus === 'cancelled' ? 0 : 1
  }

  return (
    <div className={`account-panel order-tracker-panel ${className}`}>
      <div className="account-panel__header">
        <div className="order-tracker-title-wrap">
          <div className="order-tracker-icon">
            <Truck size={20} />
          </div>
          <div>
            <p className="heading-sm text-accent">Real-Time Tracking</p>
            <h3 className="display-md">Order Shipment Status</h3>
          </div>
        </div>
      </div>

      {isLoading && !tracking ? (
        <div className="account-orders-state" style={{ padding: '24px 0' }}>
          <Loader2 size={22} className="account-orders-state__spin" />
          <p className="body-sm text-muted">Checking tracking status…</p>
        </div>
      ) : (
        <div className="order-tracker-body">
          <div className="order-tracker-strip">
            <div className="order-tracker-status-meta">
              <span className="order-tracker-status-badge">
                <Truck size={14} />
                {getOrderStatusLabel(currentStatus)}
              </span>

              {providerStatus ? (
                <span className="order-tracker-provider-badge">{providerStatus}</span>
              ) : null}
            </div>

            <div className="order-tracker-info-grid">
              {trackingNumber ? (
                <div className="order-tracker-info-cell">
                  <span className="order-tracker-info-label">Tracking # (AWB)</span>
                  <span className="order-tracker-info-val order-tracker-awb-val">
                    {trackingNumber}
                    <button
                      type="button"
                      onClick={() => handleCopyAwb(trackingNumber)}
                      className="order-tracking-copy-btn"
                      title="Copy AWB"
                    >
                      <Copy size={11} />
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </span>
                </div>
              ) : (
                <div className="order-tracker-info-cell">
                  <span className="order-tracker-info-label">Tracking #</span>
                  <span className="order-tracker-info-val text-muted">Generated upon dispatch</span>
                </div>
              )}

              {courier ? (
                <div className="order-tracker-info-cell">
                  <span className="order-tracker-info-label">Courier</span>
                  <span className="order-tracker-info-val">{courier}</span>
                </div>
              ) : null}

              {estimatedDelivery ? (
                <div className="order-tracker-info-cell">
                  <span className="order-tracker-info-label">Estimated Delivery</span>
                  <span className="order-tracker-info-val">
                    {formatOrderDate(estimatedDelivery)}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="order-tracker-progress-wrap">
            <h4 className="order-tracker-subhead">Delivery Milestones</h4>
            <div className="order-stepper-horizontal">
              {TRACKING_MILESTONES.map((milestone, idx) => {
                const isCompleted = idx <= activeIndex && currentStatus !== 'cancelled'
                const isCurrent = idx === activeIndex && currentStatus !== 'cancelled'

                return (
                  <div
                    key={milestone.key}
                    className={`order-stepper-step ${
                      isCompleted ? 'order-stepper-step--completed' : ''
                    } ${isCurrent ? 'order-stepper-step--current' : ''}`}
                  >
                    <div className="order-stepper-step__marker">
                      {isCompleted ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <span className="order-stepper-step__circle" />
                      )}
                    </div>
                    <span className="order-stepper-step__label">{milestone.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
