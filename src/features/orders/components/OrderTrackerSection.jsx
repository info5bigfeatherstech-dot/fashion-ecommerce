import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useOrderTracking } from '../hooks'
import { formatOrderDate, formatOrderDateTime, getOrderStatusLabel } from '../utils'

const TRACKING_MILESTONES = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'confirmed', label: 'Order Confirmed' },
  { key: 'processing', label: 'Packed & Ready' },
  { key: 'shipped', label: 'In Transit' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
]

export function OrderTrackerSection({ orderId, order, className = '' }) {
  const { data: trackingData, isLoading, isError, error, refetch, isFetching } = useOrderTracking(
    orderId,
    { enabled: Boolean(orderId) }
  )
  const [copied, setCopied] = useState(false)

  // Merge API tracking data with order shipment fallback
  const tracking = trackingData || (order?.shipmentInfo ? {
    orderId,
    currentStatus: order.orderStatus,
    trackingNumber: order.shipmentInfo.trackingNumber || order.shipmentInfo.awbCode,
    courier: order.shipmentInfo.courier,
    estimatedDelivery: order.shipmentInfo.estimatedDelivery,
    providerStatus: order.shipmentInfo.providerStatus,
    timeline: [],
    courierTimeline: [],
  } : null)

  const handleCopyAwb = (awb) => {
    if (!awb) return
    navigator.clipboard?.writeText(awb)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentStatus = String(
    tracking?.currentStatus || order?.orderStatus || 'pending'
  ).toLowerCase()

  const providerStatus =
    tracking?.providerStatus ||
    tracking?.statusSummary?.status ||
    order?.shipmentInfo?.providerStatus ||
    null

  const courier =
    tracking?.courier ||
    tracking?.shippingProvider ||
    order?.shipmentInfo?.courier ||
    'Courier Partner'

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

  const timeline = Array.isArray(tracking?.timeline) ? tracking.timeline : []
  const courierTimeline = Array.isArray(tracking?.courierTimeline) ? tracking.courierTimeline : []
  const simpleTimeline = Array.isArray(tracking?.simpleTimeline) ? tracking.simpleTimeline : []

  // Active milestone index
  const stageOrder = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered']
  let activeIndex = stageOrder.indexOf(currentStatus)
  if (activeIndex === -1) {
    if (timeline.length > 0) {
      activeIndex = Math.max(0, timeline.filter((t) => t.completed).length - 1)
    } else {
      activeIndex = currentStatus === 'cancelled' ? 0 : 1
    }
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
          <p className="body-sm text-muted">Checking tracking status with carrier…</p>
        </div>
      ) : (
        <div className="order-tracker-body">
          {/* Status highlight strip */}
          <div className="order-tracker-strip">
            <div className="order-tracker-status-meta">
              <span className="order-tracker-status-badge">
                <Truck size={14} />
                {getOrderStatusLabel(currentStatus)}
              </span>

              {providerStatus && (
                <span className="order-tracker-provider-badge">
                  {providerStatus}
                </span>
              )}
            </div>

            <div className="order-tracker-info-grid">
              <div className="order-tracker-info-cell">
                <span className="order-tracker-info-label">Courier Partner</span>
                <span className="order-tracker-info-val">{courier}</span>
              </div>

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

              {estimatedDelivery && (
                <div className="order-tracker-info-cell">
                  <span className="order-tracker-info-label">Estimated Delivery</span>
                  <span className="order-tracker-info-val">
                    {formatOrderDate(estimatedDelivery)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stepper progress */}
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
                      {isCompleted ? <CheckCircle2 size={16} /> : <span className="order-stepper-step__circle" />}
                    </div>
                    <span className="order-stepper-step__label">{milestone.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detailed timeline if courier updates exist */}
          {courierTimeline.length > 0 ? (
            <div className="order-tracker-live-updates">
              <h4 className="order-tracker-subhead">Carrier Activity & Scans</h4>
              <div className="order-timeline-scans">
                {courierTimeline.map((item, index) => (
                  <div key={index} className="order-timeline-scan-item">
                    <div className="order-timeline-scan-item__pin">
                      <MapPin size={13} />
                    </div>
                    <div className="order-timeline-scan-item__info">
                      <p className="order-timeline-scan-item__activity">
                        {item.activity || item.status || 'Carrier update'}
                      </p>
                      {item.location && (
                        <p className="order-timeline-scan-item__location">{item.location}</p>
                      )}
                      <span className="order-timeline-scan-item__time">
                        {formatOrderDateTime(item.date || item.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : timeline.length > 0 ? (
            <div className="order-tracker-live-updates">
              <h4 className="order-tracker-subhead">Order Timeline</h4>
              <div className="order-timeline-scans">
                {timeline.map((item, index) => (
                  <div key={index} className="order-timeline-scan-item">
                    <div className="order-timeline-scan-item__pin">
                      <Clock size={13} />
                    </div>
                    <div className="order-timeline-scan-item__info">
                      <p className="order-timeline-scan-item__activity">{item.status}</p>
                      <span className="order-timeline-scan-item__time">
                        {formatOrderDateTime(item.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="order-tracker-note">
              <Clock size={14} className="text-muted" />
              <p className="body-xs text-muted">
                Detailed carrier scans and live transit updates will appear here once the package is picked up by our delivery partner.
              </p>
            </div>
          )}

          {tracking?.lastSyncedAt && (
            <p className="order-tracking-sync-time">
              Last synced: {formatOrderDateTime(tracking.lastSyncedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
