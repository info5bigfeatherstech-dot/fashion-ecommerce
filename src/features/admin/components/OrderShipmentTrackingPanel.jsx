import { useMemo } from 'react'
import { Truck } from 'lucide-react'
import { Button } from '@/components/ui/Button'

function safeText(value, fallback = '—') {
  const s = String(value ?? '').trim()
  return s || fallback
}

function logisticsProgressFromOps({ ops, ship, orderStatus }) {
  const state = String(ops?.opsState || '').toUpperCase()
  const st = String(orderStatus || '').toLowerCase()
  const hasAwb = Boolean(ship?.awbCode || ship?.trackingNumber)
  const hasPickup = Boolean(
    ship?.pickupDate ||
      ship?.pickupScheduledAt ||
      ['PICKUP_SCHEDULED', 'MANIFEST_READY', 'LABEL_READY', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(state)
  )
  const hasManifest = Boolean(
    ship?.manifestUrl ||
      ['MANIFEST_READY', 'LABEL_READY', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(state)
  )
  const hasShipped = Boolean(
    ship?.shippedAt ||
      ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(state) ||
      ['shipped', 'out_for_delivery', 'delivered'].includes(st)
  )

  const steps = [
    { key: 'assigned', label: 'Assigned', done: hasAwb || hasPickup || hasManifest || hasShipped },
    { key: 'picked', label: 'Picked up', done: hasPickup || hasManifest || hasShipped },
    { key: 'manifest', label: 'Manifested', done: hasManifest || hasShipped },
    { key: 'shipped', label: 'Shipped', done: hasShipped },
  ]

  let currentIdx = steps.findIndex((s) => !s.done)
  if (currentIdx < 0) currentIdx = steps.length - 1
  else if (!steps[0].done) currentIdx = 0

  return { steps, currentIdx }
}

function LogisticsProgressStepper({ ops, ship, orderStatus }) {
  const { steps, currentIdx } = useMemo(
    () => logisticsProgressFromOps({ ops, ship, orderStatus }),
    [ops, ship, orderStatus]
  )

  if (!steps.some((s) => s.done) && !ship?.trackingNumber && !ship?.awbCode) return null

  const allDone = steps.every((s) => s.done)

  return (
    <div className="od-tracking-stepper" aria-label="Logistics progress">
      <div className="od-tracking-stepper__row">
        {steps.map((step, idx) => {
          const done = step.done
          const current = !allDone && idx === currentIdx
          const active = done || current
          const connectorFilled = done && (steps[idx + 1]?.done || (!allDone && idx < currentIdx))
          const isLast = idx === steps.length - 1
          return (
            <div key={step.key} className={`od-tracking-stepper__item${isLast ? ' is-last' : ''}`}>
              <div className="od-tracking-stepper__node-wrap">
                <div
                  className={`od-tracking-stepper__node${done ? ' is-done' : ''}${current ? ' is-current' : ''}`}
                  aria-current={current ? 'step' : undefined}
                >
                  {done ? (
                    <svg className="od-tracking-stepper__check" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : current ? (
                    <span className="od-tracking-stepper__dot" />
                  ) : null}
                </div>
                <p className={`od-tracking-stepper__label${active ? ' is-active' : ''}`}>{step.label}</p>
              </div>
              {!isLast ? (
                <div
                  className={`od-tracking-stepper__connector${connectorFilled ? ' is-filled' : ''}`}
                  aria-hidden
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function buildTrackHref({ ship, trackingUrl, providerKey }) {
  if (trackingUrl && /^https?:\/\//i.test(String(trackingUrl))) return String(trackingUrl)
  const awb = String(ship?.trackingNumber || ship?.awbCode || '').trim()
  if (!awb) return null
  const courier = String(ship?.courier || '').trim()
  const q = encodeURIComponent(`${awb} ${courier || 'tracking'}`.trim())
  return `https://www.google.com/search?q=${q}`
}

function trackLinkLabel(providerKey) {
  if (providerKey === 'shipmozo') return 'Track via Shipmozo'
  return 'Track via Shiprocket'
}

export function OrderShipmentTrackingPanel({
  ship = {},
  ops = null,
  orderStatus = '',
  carrierStatusDisplay = null,
  carrierStatusSecondary = null,
  lastSyncedAt = null,
  lastSyncError = null,
  hideStaleTracking = false,
  carrierTimeline = [],
  trackingLoading = false,
  trackingError = null,
  providerKey = 'shiprocket',
  trackingUrl = null,
  formatDateTime,
  onRefreshTracking,
}) {
  const formatFn = typeof formatDateTime === 'function' ? formatDateTime : () => '—'
  const trackHref = buildTrackHref({ ship, trackingUrl, providerKey })
  const timeline = Array.isArray(carrierTimeline) ? carrierTimeline : []
  const hasAnyShipmentSignal = Boolean(
    ship?.trackingNumber ||
      ship?.awbCode ||
      ship?.courier ||
      carrierStatusDisplay ||
      timeline.length > 0
  )

  if (hideStaleTracking) {
    return (
      <section className="od-card od-tracking od-tracking--warn">
        <div className="od-card__head">
          <h3 className="od-card__title">Shipment tracking</h3>
        </div>
        <div className="od-tracking__body">
          <p className="od-tracking__status-warn">{safeText(carrierStatusDisplay, 'Reset needed')}</p>
          {carrierStatusSecondary ? (
            <p className="od-muted">Previous label: {carrierStatusSecondary}</p>
          ) : null}
          <p className="od-muted">Old tracking cleared — use Ship now after refresh.</p>
        </div>
      </section>
    )
  }

  if (!hasAnyShipmentSignal) {
    return (
      <section className="od-card od-tracking">
        <div className="od-card__head">
          <h3 className="od-card__title">Shipment tracking</h3>
        </div>
        <div className="od-tracking__body">
          <p className="od-muted">
            No courier assigned yet. Tracking appears here after you ship the order.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="od-card od-tracking">
      <div className="od-card__head">
        <div className="od-card__title-row">
          <span className="od-tracking__icon" aria-hidden>
            <Truck size={16} />
          </span>
          <div>
            <h3 className="od-card__title">Shipment tracking</h3>
            <p className="od-muted">Where the parcel is right now</p>
          </div>
        </div>
        <div className="od-tracking__head-actions">
          {trackHref ? (
            <a
              href={trackHref}
              target="_blank"
              rel="noopener noreferrer"
              className="od-tracking__ext-link"
            >
              {trackLinkLabel(providerKey)}
            </a>
          ) : null}
          {typeof onRefreshTracking === 'function' ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={trackingLoading}
              onClick={onRefreshTracking}
            >
              {trackingLoading ? 'Refreshing…' : 'Refresh'}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="od-tracking__body">
        <LogisticsProgressStepper ops={ops} ship={ship} orderStatus={orderStatus} />

        <div className="od-tracking-grid">
          <div>
            <p className="od-field-label">Courier</p>
            <p className="od-field-value">{safeText(ship?.courier)}</p>
          </div>
          <div>
            <p className="od-field-label">Tracking number</p>
            <p className="od-field-value od-mono">
              {safeText(ship?.trackingNumber || ship?.awbCode)}
            </p>
          </div>
          <div>
            <p className="od-field-label">Provider status</p>
            <p className="od-tracking__provider-status">{safeText(carrierStatusDisplay)}</p>
            {carrierStatusSecondary && carrierStatusSecondary !== carrierStatusDisplay ? (
              <p className="od-muted" style={{ marginTop: 4, fontSize: 11 }}>
                Also: {carrierStatusSecondary}
              </p>
            ) : null}
          </div>
          <div>
            <p className="od-field-label">Shipped on</p>
            <p className="od-field-value">{formatFn(ship?.shippedAt)}</p>
          </div>
        </div>

        {(ship?.shipmentId || ship?.shiprocketOrderId || lastSyncedAt) && (
          <div className="od-tracking__meta">
            {ship?.shipmentId ? <span>Shipment ID: {ship.shipmentId}</span> : null}
            {ship?.shiprocketOrderId ? (
              <span className="od-mono">Provider order: {ship.shiprocketOrderId}</span>
            ) : null}
            {lastSyncedAt ? <span>Last synced: {formatFn(lastSyncedAt)}</span> : null}
          </div>
        )}

        {trackingError?.data?.message ? (
          <div className="od-banner od-banner--warn" role="status">
            Could not fetch live tracking: {String(trackingError.data.message)}
          </div>
        ) : null}

        {lastSyncError ? (
          <div className="od-banner od-banner--err" role="status">
            Last sync error: {String(lastSyncError)}
          </div>
        ) : null}

        <div className="od-tracking__timeline-section">
          <div className="od-tracking__timeline-head">
            <p className="od-field-label">Carrier timeline</p>
            {timeline.length > 0 ? (
              <p className="od-muted">{timeline.length} updates · scroll</p>
            ) : null}
          </div>
          {timeline.length > 0 ? (
            <div className="od-tracking__timeline-scroll">
              <ol className="od-tracking__timeline">
                {timeline.map((event, idx) => {
                  const isLatest = idx === 0
                  const title = safeText(event?.description || event?.status, 'Update')
                  const when = event?.timestamp ? formatFn(event.timestamp) : '—'
                  const where = String(event?.location || '').trim()
                  const code = String(event?.status || '').trim()
                  return (
                    <li key={event?.id || `${idx}-${title}`} className="od-tracking__timeline-item">
                      {idx < timeline.length - 1 ? (
                        <span className="od-tracking__timeline-line" aria-hidden />
                      ) : null}
                      <span
                        className={`od-tracking__timeline-dot${isLatest ? ' is-latest' : ''}`}
                        aria-hidden
                      />
                      <div className="od-tracking__timeline-content">
                        <p className={`od-tracking__timeline-title${isLatest ? ' is-latest' : ''}`}>
                          {title}
                          {code && code !== title && code.length <= 8 ? (
                            <span className="od-tracking__timeline-code">{code}</span>
                          ) : null}
                        </p>
                        <p className="od-tracking__timeline-when">
                          {when}
                          {where ? ` · ${where}` : ''}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          ) : (
            <p className="od-muted">No courier updates yet. Tap Refresh after pickup.</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default OrderShipmentTrackingPanel
