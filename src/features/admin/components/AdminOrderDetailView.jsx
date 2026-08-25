import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Package,
  Printer,
  RefreshCw,
  Truck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AdminError, AdminLoading } from '@/features/admin/components/AdminUi'
import { AdminPendingAddressPanel } from '@/features/admin/components/AdminPendingAddressPanel'
import { AdminPendingOrderEditPanel } from '@/features/admin/components/AdminPendingOrderEditPanel'
import { OrderPaymentSummaryCard } from '@/features/admin/components/OrderPaymentSummaryCard'
import { OrderShipmentTrackingPanel } from '@/features/admin/components/OrderShipmentTrackingPanel'
import {
  buildCarrierTimeline,
  resolveCarrierStatusDisplay,
  unwrapTrackingPayload,
} from '@/features/admin/utils/orderTrackingDisplay'
import { isPostConfirmOrderStatus } from '@/features/admin/api/orders'
import {
  useAdminOrderTracking,
  useAdminPickupCalendar,
  useAssignAdminOrderShip,
  useBulkCancelOrders,
  useBulkConfirmOrders,
  useCancelAdminOrderShipment,
  useDownloadAdminOrderManifest,
  useDownloadAdminOrderShippingLabel,
  useEnsureAdminOrderShipment,
  useGenerateAdminOrderManifest,
  usePrintAdminOrderInvoice,
  useScheduleAdminOrderPickup,
  useSyncAdminOrderShiprocket,
} from '@/features/admin/hooks'

function formatInr(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n)
}

function getDeliveryBreakdown(order) {
  const charges = Number(order?.deliveryCharges)
  if (Number.isFinite(charges) && charges !== 0) {
    return { mode: 'paid', amount: charges }
  }
  const original = Number(
    order?.appliedFreeShippingOffer?.originalDeliveryCharges
      ?? order?.deliveryFreightInr
      ?? 0
  )
  const codFee = Number(order?.deliveryCodFeeInr ?? 0)
  return {
    mode: 'free',
    original: Number.isFinite(original) && original > 0 ? original : 0,
    codFee: Number.isFinite(codFee) && codFee > 0 ? codFee : 0,
  }
}

function DeliveryTotalValue({ order }) {
  const delivery = getDeliveryBreakdown(order)
  if (delivery.mode === 'paid') {
    return <strong className="od-totals__amount">{formatInr(delivery.amount)}</strong>
  }
  return (
    <div className="od-totals__value-stack">
      <span className="od-free">FREE</span>
      {delivery.original > 0 ? (
        <span className="od-totals__sub">
          <s>{formatInr(delivery.original)}</s> FREE
        </span>
      ) : null}
      {delivery.codFee > 0 ? (
        <span className="od-totals__sub">
          <s>{formatInr(delivery.codFee)}</s> COD FREE
        </span>
      ) : null}
    </div>
  )
}

function formatKg(kg) {
  const n = Number(kg)
  if (!Number.isFinite(n)) return null
  return `${n.toFixed(2)} kg`
}

function formatPackageDims(dims) {
  if (!dims || typeof dims !== 'object') return null
  const l = Number(dims.lengthCm ?? dims.length)
  const w = Number(dims.widthCm ?? dims.width)
  const h = Number(dims.heightCm ?? dims.height)
  if (![l, w, h].every((n) => Number.isFinite(n) && n > 0)) return null
  return `${l} × ${w} × ${h} cm`
}

function formatDateHeader(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

function tomorrowYmd() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return requested',
  payment_failed: 'Payment failed',
}

const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  initiated: 'Initiated',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  partially_paid: 'Partially paid',
  partially_refunded: 'Partially refunded',
}

function labelOrderStatus(raw) {
  const k = String(raw || '').trim().toLowerCase()
  return ORDER_STATUS_LABELS[k] || (k ? k.replace(/_/g, ' ') : '—')
}

function labelPaymentStatus(raw) {
  const k = String(raw || '').trim().toLowerCase()
  return PAYMENT_STATUS_LABELS[k] || (k ? k.replace(/_/g, ' ') : '—')
}

function statusTone(orderStatus) {
  const s = String(orderStatus || '').toLowerCase()
  if (['delivered', 'confirmed', 'shipped', 'out_for_delivery', 'processing'].includes(s)) return 'info'
  if (['pending', 'return_requested'].includes(s)) return 'warn'
  if (['cancelled', 'payment_failed'].includes(s)) return 'error'
  return 'muted'
}

function paymentTone(paymentStatus) {
  const s = String(paymentStatus || '').toLowerCase()
  if (s === 'paid') return 'info'
  if (s === 'partially_paid' || s === 'pending' || s === 'initiated') return 'warn'
  if (['failed', 'refunded', 'partially_refunded'].includes(s)) return 'error'
  return 'muted'
}

function carrierPaymentReady(order, gateFromApi) {
  if (gateFromApi != null) return Boolean(gateFromApi.ok)
  if (!order) return false
  const method = String(order?.paymentInfo?.method || '').toLowerCase()
  if (method === 'cod') return true
  const pay = String(order?.paymentStatus || '').toLowerCase()
  if (pay === 'paid') return true
  if (pay === 'partially_refunded' && Number(order?.amountPaidInr || 0) > 0.01) return true
  const split = String(order?.paymentInfo?.splitMode || '').toLowerCase()
  const bc = String(order?.paymentInfo?.balanceCollectionMethod || '').toLowerCase()
  if (
    (method === 'online' || method === 'prepaid') &&
    split === 'advance' &&
    bc === 'cod' &&
    pay === 'partially_paid' &&
    Number(order?.amountPaidInr || 0) > 0.01
  ) {
    return true
  }
  return false
}

function errText(e, fallback = 'Request failed.') {
  return (
    e?.data?.message ||
    e?.response?.data?.message ||
    e?.message ||
    fallback
  )
}

function errPayload(e) {
  return e?.data || e?.response?.data || e || {}
}

function FulfillmentStepCard({ step, focusStep, done, title, heading, children }) {
  const focused = focusStep === step && !done
  return (
    <div className={`od-step${focused ? ' is-focus' : ''}${done ? ' is-done' : ''}`}>
      <div className="od-step__head">
        <div>
          <p className="od-step__eyebrow">
            {done ? 'DONE' : focused ? 'ACTION REQUIRED' : `STEP ${step}`}
            {focused ? ' — CREATE & ASSIGN' : ''}
          </p>
          <h4 className="od-step__title">{heading || title}</h4>
        </div>
        {focused && !done ? <span className="od-pill od-pill--action">Action required</span> : null}
      </div>
      <div className="od-step__body">{children}</div>
    </div>
  )
}

/**
 * Full-page admin order detail (fabFE-style).
 */
export function AdminOrderDetailView({
  orderId,
  order,
  loading,
  error,
  onBack,
  onOrderRefresh,
}) {
  const [pickupDate, setPickupDate] = useState(tomorrowYmd)
  const [actionMsg, setActionMsg] = useState(null)

  const confirmOrders = useBulkConfirmOrders()
  const cancelOrders = useBulkCancelOrders()
  const ensureShipment = useEnsureAdminOrderShipment()
  const assignShip = useAssignAdminOrderShip()
  const schedulePickup = useScheduleAdminOrderPickup()
  const syncShiprocket = useSyncAdminOrderShiprocket()
  const generateManifest = useGenerateAdminOrderManifest()
  const cancelShipment = useCancelAdminOrderShipment()
  const printInvoice = usePrintAdminOrderInvoice()
  const downloadLabel = useDownloadAdminOrderShippingLabel()
  const downloadManifest = useDownloadAdminOrderManifest()

  const {
    data: tracking,
    isFetching: trackingLoading,
    refetch: refetchTracking,
    error: trackingError,
  } = useAdminOrderTracking(orderId, { enabled: Boolean(orderId) })
  const { data: pickupCalendarRes } = useAdminPickupCalendar({
    enabled: Boolean(orderId) && isPostConfirmOrderStatus(order?.orderStatus),
  })

  const pickupAllowedDates = useMemo(() => {
    const cal = pickupCalendarRes?.calendar || pickupCalendarRes
    return Array.isArray(cal?.allowedDates) ? cal.allowedDates : []
  }, [pickupCalendarRes])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [orderId])

  useEffect(() => {
    const def = pickupCalendarRes?.calendar?.defaultDate || pickupCalendarRes?.defaultDate
    if (def && pickupAllowedDates.includes(def)) setPickupDate(def)
  }, [pickupCalendarRes, pickupAllowedDates])

  const refreshOrder = useCallback(async () => {
    if (typeof onOrderRefresh === 'function') await onOrderRefresh()
  }, [onOrderRefresh])

  const orderSt = String(order?.orderStatus || '').toLowerCase()
  const paySt = String(order?.paymentStatus || '').toLowerCase()
  const isPendingOrder = orderSt === 'pending'
  const showInvoiceAndLogistics = isPostConfirmOrderStatus(orderSt)
  const moneyCaptured =
    (paySt === 'paid' || paySt === 'partially_paid') && Number(order?.amountPaidInr || 0) > 0.01
  const unpaidTerminal =
    (orderSt === 'cancelled' || orderSt === 'payment_failed') && !moneyCaptured
  const fulfillmentPaymentGate = order?.fulfillmentPaymentGate
  const paymentReady = carrierPaymentReady(order, fulfillmentPaymentGate)

  const ship = order?.shipmentInfo || {}
  const ops = order?.shipmentOps || {}
  const caps = ops.actionCapabilities || {}
  const blockReasons = ops.blockReasons || {}
  const shippingProviderKey =
    String(order?.shippingProvider || ship?.provider || 'shiprocket').toLowerCase() === 'shipmozo'
      ? 'shipmozo'
      : 'shiprocket'
  const providerName = shippingProviderKey === 'shipmozo' ? 'Shipmozo' : 'Shiprocket'
  const hasCarrierAwb = Boolean(ship.awbCode || ship.trackingNumber)
  const step1Done = hasCarrierAwb
  const primaryActionKey = ops.primaryAction || 'openDetail'
  const primaryActionLabel = ops.primaryActionLabel || (primaryActionKey === 'shipNow' ? 'Ship now' : null)
  const fulfillmentFocusStep =
    primaryActionKey === 'shipNow' ? 1
      : primaryActionKey === 'schedulePickup' ? 2
        : primaryActionKey === 'generateManifest' || primaryActionKey === 'downloadManifest' ? 3
          : primaryActionKey === 'downloadLabel' ? 4
            : !step1Done ? 1 : 0

  const pickupAlreadyScheduled =
    ops.opsState === 'PICKUP_SCHEDULED' ||
    ops.opsState === 'MANIFEST_READY' ||
    ops.opsState === 'LABEL_READY' ||
    (Boolean(ship.pickupScheduledAt || ship.pickupDate) && !caps.schedulePickup)

  const fulfillmentBusy =
    confirmOrders.isPending ||
    cancelOrders.isPending ||
    ensureShipment.isPending ||
    assignShip.isPending ||
    schedulePickup.isPending ||
    syncShiprocket.isPending ||
    generateManifest.isPending ||
    cancelShipment.isPending ||
    printInvoice.isPending ||
    downloadLabel.isPending ||
    downloadManifest.isPending

  const items = order?.items || order?.orderItems || []
  const weightSnap = order?.packageWeightSnapshot || order?.weightSnapshot || null
  const packageDimsLabel = formatPackageDims(
    weightSnap?.packageDims || weightSnap?.dimensions || order?.packageDimensions
  )
  const weightLabel = formatKg(weightSnap?.totalWeightKg ?? order?.totalWeightKg)

  const trackingData = unwrapTrackingPayload(tracking)
  const lastSyncedAt = trackingData?.lastSyncedAt || ship?.lastSyncAt || null
  const lastSyncError = ship?.lastError || null
  const hideStaleTracking = ops?.opsState === 'PROVIDER_RESET'
  const { carrierStatusDisplay, carrierStatusSecondary } = resolveCarrierStatusDisplay({
    tracking: trackingData,
    ship,
    ops,
  })
  const carrierTimeline = buildCarrierTimeline({
    tracking: trackingData,
    ship,
    ops,
    lastSyncedAt,
  })

  const handleConfirm = async () => {
    setActionMsg(null)
    try {
      const data = await confirmOrders.mutateAsync([orderId])
      const row = (data?.results || []).find((r) => String(r.orderId) === String(orderId))
      if (row && !row.success) throw new Error(row.message || row.code || 'Confirm failed.')
      const deferred = row?.code === 'CONFIRMED_SHIPMENT_DEFERRED'
      const text =
        row?.message ||
        (deferred
          ? 'Order confirmed. Shiprocket create failed — retry Ship now below.'
          : 'Order confirmed.')
      setActionMsg({ type: deferred ? 'warn' : 'ok', text })
      toast.success(deferred ? 'Confirmed (shipment deferred)' : 'Order confirmed')
      await refreshOrder()
    } catch (e) {
      const text = errText(e, 'Confirm failed.')
      setActionMsg({ type: 'err', text })
      toast.error(text)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel this pending order? Stock will be restored.')) return
    setActionMsg(null)
    try {
      const data = await cancelOrders.mutateAsync({ orderIds: [orderId] })
      const row = (data?.results || []).find((r) => String(r.orderId) === String(orderId))
      if (row && !row.success) throw new Error(row.message || 'Cancel failed.')
      setActionMsg({ type: 'ok', text: row?.message || 'Order cancelled.' })
      toast.success('Order cancelled')
      await refreshOrder()
    } catch (e) {
      const text = errText(e, 'Cancel failed.')
      setActionMsg({ type: 'err', text })
      toast.error(text)
    }
  }

  const handlePrintInvoice = async () => {
    try {
      await printInvoice.mutateAsync(orderId)
    } catch (e) {
      const text = errText(e, 'Could not load invoice.')
      setActionMsg({ type: 'err', text, surface: 'invoice' })
      toast.error(text)
    }
  }

  const handleShipNow = async () => {
    setActionMsg(null)
    try {
      const r = await ensureShipment.mutateAsync(orderId)
      if (r?.success === false) throw new Error(r?.message || 'Shipment step failed.')
      const si = r?.order?.shipmentInfo || r?.shipmentInfo || {}
      const sr = r?.shipment || {}
      const awbFromResp = Boolean(
        si.awbCode || si.trackingNumber || sr.awb_code || sr.awbCode || sr.tracking_number
      )
      let assignResult = null
      if (!awbFromResp) {
        try {
          assignResult = await assignShip.mutateAsync({ orderId })
        } catch (ae) {
          const data = errPayload(ae)
          const code = data?.code
          if (code === 'AWB_ALREADY_ASSIGNED') {
            setActionMsg({ type: 'ok', text: 'Shipment already has an AWB. Refreshing…', surface: 'ship' })
            await refreshOrder()
            return
          }
          if (code === 'QUOTED_COURIER_UNAVAILABLE') {
            const suggested = data.suggestedCourier
            const quoted = data.quotedCourier
            const confirmMsg = suggested
              ? `Checkout courier "${quoted?.courierName || quoted?.courierId || 'quoted'}" could not be assigned.\n\nAssign suggested "${suggested.courierName || suggested.courierId}"?\nCustomer order total will NOT change.`
              : `${data.message || 'Checkout courier unavailable.'}\n\nRetry with substitute?`
            if (!window.confirm(confirmMsg)) {
              setActionMsg({
                type: 'err',
                surface: 'ship',
                text: `Ship now cancelled. Assign courier from ${providerName} panel.`,
              })
              return
            }
            assignResult = await assignShip.mutateAsync({
              orderId,
              confirmSubstitute: true,
              ...(suggested?.courierId != null ? { courierId: suggested.courierId } : {}),
            })
          } else {
            throw ae
          }
        }
      }
      const siFinal = assignResult?.order?.shipmentInfo || si
      const srFinal = assignResult?.shipment || sr
      const awbDisp =
        siFinal.awbCode ||
        siFinal.trackingNumber ||
        srFinal.awb_code ||
        srFinal.awbCode ||
        srFinal.tracking_number
      const text = awbDisp
        ? `Courier booked. AWB / tracking: ${awbDisp}.`
        : 'Shipment updated. Details will refresh shortly.'
      setActionMsg({ type: 'ok', surface: 'ship', text })
      toast.success(text)
      await refreshOrder()
      refetchTracking()
    } catch (e) {
      const text = errText(e, 'Ship now failed.')
      setActionMsg({ type: 'err', surface: 'ship', text })
      toast.error(text)
    }
  }

  const handleSchedulePickup = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
      toast.error('Choose a valid pickup date')
      return
    }
    setActionMsg(null)
    try {
      const r = await schedulePickup.mutateAsync({ orderId, pickupDate })
      setActionMsg({
        type: 'ok',
        surface: 'pickup',
        text: r?.message || `Pickup scheduled for ${pickupDate}.`,
      })
      toast.success('Pickup scheduled')
      await refreshOrder()
    } catch (e) {
      const text = errText(e, 'Pickup scheduling failed.')
      setActionMsg({ type: 'err', surface: 'pickup', text })
      toast.error(text)
    }
  }

  const handleSync = async () => {
    setActionMsg(null)
    try {
      const r = await syncShiprocket.mutateAsync(orderId)
      setActionMsg({ type: 'ok', surface: 'ops', text: r?.message || `Updated from ${providerName}.` })
      toast.success('Synced')
      await refreshOrder()
      refetchTracking()
    } catch (e) {
      const text = errText(e, 'Sync failed.')
      setActionMsg({ type: 'err', surface: 'ops', text })
      toast.error(text)
    }
  }

  const handleManifest = async () => {
    setActionMsg(null)
    try {
      if (caps.downloadManifest) {
        await downloadManifest.mutateAsync(orderId)
        toast.success('Manifest downloaded')
      } else {
        const r = await generateManifest.mutateAsync(orderId)
        if (r?.manifestUrl) window.open(r.manifestUrl, '_blank', 'noopener,noreferrer')
        toast.success(r?.message || 'Manifest generated')
      }
      await refreshOrder()
    } catch (e) {
      toast.error(errText(e, 'Manifest failed.'))
    }
  }

  const handleDownloadLabel = async () => {
    try {
      await downloadLabel.mutateAsync({ orderId, provider: shippingProviderKey })
      toast.success('Shipping label downloaded')
      await refreshOrder()
    } catch (e) {
      toast.error(errText(e, 'Label download failed.'))
    }
  }

  const handleCancelShipment = async () => {
    if (!window.confirm(`Cancel this shipment on ${providerName} so you can Ship now again?`)) return
    try {
      await cancelShipment.mutateAsync(orderId)
      toast.success('Shipment cancelled')
      await refreshOrder()
    } catch (e) {
      toast.error(errText(e, 'Cancel shipment failed.'))
    }
  }

  if (loading && !order) {
    return (
      <div className="admin-page od-page">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={14} /> Back to orders
        </Button>
        <AdminLoading label="Loading order…" />
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="admin-page od-page">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={14} /> Back to orders
        </Button>
        <AdminError message={error?.message || String(error)} onRetry={onOrderRefresh} />
      </div>
    )
  }

  if (!order) return null

  const displayId = String(order.orderIdDisplay || order.orderId || orderId || '').replace(/^#/, '')

  return (
    <div className="admin-page od-page">
      <button type="button" className="od-back" onClick={onBack}>
        <ArrowLeft size={16} /> Back to orders
      </button>

      <section className="od-header-card">
        <div className="od-header-card__left">
          <p className="od-header-card__eyebrow">Order</p>
          <h1 className="od-header-card__title">#{displayId}</h1>
          <div className="od-header-card__meta">
            <span className={`od-provider od-provider--${shippingProviderKey}`}>
              {providerName}
            </span>
            <span className="od-muted">{formatDateHeader(order.createdAt)}</span>
          </div>
          {showInvoiceAndLogistics && primaryActionLabel && primaryActionKey !== 'openDetail' ? (
            <p className="od-next">
              Next: <strong>{primaryActionLabel}</strong>
              {ops.nextStepMessage ? <span> — {ops.nextStepMessage}</span> : null}
            </p>
          ) : null}
        </div>
        <div className="od-header-card__actions">
          <span className={`od-status-chip od-status-chip--${statusTone(order.orderStatus)}`}>
            <span className="od-status-chip__k">Status</span>
            {labelOrderStatus(order.orderStatus)}
          </span>
          <span className={`od-status-chip od-status-chip--${paymentTone(order.paymentStatus)}`}>
            <span className="od-status-chip__k">Pay</span>
            {labelPaymentStatus(order.paymentStatus)}
          </span>
          {isPendingOrder ? (
            <>
              <Button
                variant="primary"
                size="sm"
                disabled={fulfillmentBusy || !paymentReady}
                onClick={handleConfirm}
              >
                {confirmOrders.isPending ? 'Confirming…' : 'Confirm order'}
              </Button>
              <Button variant="ghost" size="sm" disabled={fulfillmentBusy} onClick={handleCancel}>
                {cancelOrders.isPending ? 'Cancelling…' : 'Cancel'}
              </Button>
            </>
          ) : null}
          {showInvoiceAndLogistics ? (
            <Button
              variant="primary"
              size="sm"
              disabled={printInvoice.isPending}
              onClick={handlePrintInvoice}
            >
              <Printer size={14} />
              {printInvoice.isPending ? '…' : 'Print invoice'}
            </Button>
          ) : null}
        </div>
      </section>

      {actionMsg?.text && !actionMsg?.surface ? (
        <div className={`od-banner od-banner--${actionMsg.type || 'ok'}`} role="status">
          {actionMsg.text}
        </div>
      ) : null}

      {!paymentReady && !unpaidTerminal && fulfillmentPaymentGate?.message ? (
        <div className="od-banner od-banner--warn">{fulfillmentPaymentGate.message}</div>
      ) : null}

      <div className="od-grid">
        <div className="od-grid__main">
          {/* Items — editable when pending, read-only after confirm */}
          {isPendingOrder ? (
            <AdminPendingOrderEditPanel
              order={order}
              orderId={orderId}
              disabled={fulfillmentBusy}
              onApplied={async () => {
                setActionMsg({ type: 'ok', text: 'Pending order items updated.' })
                await refreshOrder()
              }}
            />
          ) : (
          <section className="od-card od-card--items">
            <div className="od-card__head od-card__head--items">
              <h3 className="od-card__title">Items in this order</h3>
              {(weightLabel || packageDimsLabel) ? (
                <p className="od-items-meta">
                  {[weightLabel, packageDimsLabel].filter(Boolean).join(' · ')}
                </p>
              ) : null}
            </div>
            <div className="od-items">
              {items.length === 0 && <p className="od-items__empty">No items</p>}
              {items.map((line, idx) => {
                const name = line?.productId?.name || line?.name || line?.productName || 'Product'
                const img =
                  line?.thumbnailUrl ||
                  line?.image ||
                  line?.productId?.images?.[0]?.url ||
                  line?.productId?.images?.[0]
                const sku = line?.sku || line?.productCode || '—'
                const qty = line?.quantity ?? 1
                const lineTotal = Number(line?.lineTotal ?? line?.priceSnapshot?.total ?? line?.price) || 0
                return (
                  <div key={line.id || line._id || idx} className="od-item">
                    <div className="od-item__thumb">
                      {img ? <img src={img} alt="" /> : <Package size={22} />}
                    </div>
                    <div className="od-item__main">
                      <div className="od-item__body">
                        <p className="od-item__name">{name}</p>
                        <p className="od-item__meta">
                          Qty {qty} · SKU <span className="od-item__sku">{sku}</span>
                        </p>
                      </div>
                      <p className="od-item__price">{formatInr(lineTotal)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="od-totals">
              <div className="od-totals__row">
                <span className="od-totals__label">Subtotal</span>
                <strong className="od-totals__amount">{formatInr(order.subtotal)}</strong>
              </div>
              <div className="od-totals__row">
                <span className="od-totals__label">Taxes & Others</span>
                <strong className="od-totals__amount">{formatInr(order.tax)}</strong>
              </div>
              <div className="od-totals__row">
                <span className="od-totals__label">Delivery</span>
                <DeliveryTotalValue order={order} />
              </div>
              {Number(order.discount) > 0 ? (
                <div className="od-totals__row od-totals__discount">
                  <span className="od-totals__label">Discount</span>
                  <strong className="od-totals__amount">−{formatInr(order.discount)}</strong>
                </div>
              ) : null}
              <div className="od-totals__row od-totals__grand">
                <span className="od-totals__label">Grand total</span>
                <strong className="od-totals__amount">{formatInr(order.totalAmount ?? order.amountInr)}</strong>
              </div>
            </div>
          </section>
          )}

          {/* Logistics */}
          {showInvoiceAndLogistics && !unpaidTerminal ? (
            <section className="od-card">
              <div className="od-card__head">
                <div>
                  <div className="od-card__title-row">
                    <Truck size={16} />
                    <h3 className="od-card__title">Logistics</h3>
                    <span className={`od-provider od-provider--${shippingProviderKey}`}>
                      {providerName}
                    </span>
                  </div>
                  <p className="od-muted">Manage courier assignment and tracking</p>
                </div>
                {(caps.syncShiprocket !== false) && (
                  <Button variant="ghost" size="sm" disabled={fulfillmentBusy} onClick={handleSync}>
                    <RefreshCw size={14} />
                    {syncShiprocket.isPending ? 'Refreshing…' : 'Refresh'}
                  </Button>
                )}
              </div>

              <div className="od-courier-grid">
                <div>
                  <p className="od-field-label">Quoted courier</p>
                  <p className="od-field-value">
                    {ship.quotedCourierName || ship.preferredCourier || ship.courier || '—'}
                  </p>
                </div>
                <div>
                  <p className="od-field-label">Assigned courier</p>
                  <p className="od-field-value">
                    {hasCarrierAwb
                      ? (ship.courier || 'Assigned')
                      : 'Pending assignment'}
                  </p>
                </div>
                {hasCarrierAwb ? (
                  <div>
                    <p className="od-field-label">AWB</p>
                    <p className="od-field-value od-mono">
                      {ship.awbCode || ship.trackingNumber}
                    </p>
                  </div>
                ) : null}
              </div>

              {actionMsg?.surface === 'ops' || actionMsg?.surface === 'ship' || actionMsg?.surface === 'pickup' ? (
                <div className={`od-banner od-banner--${actionMsg.type || 'ok'}`}>{actionMsg.text}</div>
              ) : null}

              <FulfillmentStepCard
                step={1}
                focusStep={fulfillmentFocusStep}
                done={step1Done}
                title="Step 1 · Create & assign"
                heading="Assign courier"
              >
                {step1Done ? (
                  <p className="od-step__done">
                    <strong>{ship.courier || 'Courier'}</strong>
                    {hasCarrierAwb ? (
                      <> · AWB <code>{ship.awbCode || ship.trackingNumber}</code></>
                    ) : null}
                  </p>
                ) : (
                  <div className="od-row-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={
                        fulfillmentBusy ||
                        hasCarrierAwb ||
                        !paymentReady ||
                        caps.shipNow === false
                      }
                      title={blockReasons.shipNow || 'Create shipment and assign courier + AWB'}
                      onClick={handleShipNow}
                    >
                      {ensureShipment.isPending || assignShip.isPending ? 'Working…' : 'Ship now'}
                    </Button>
                  </div>
                )}
              </FulfillmentStepCard>

              {step1Done && shippingProviderKey !== 'shipmozo' ? (
                <FulfillmentStepCard
                  step={2}
                  focusStep={fulfillmentFocusStep}
                  done={pickupAlreadyScheduled}
                  title="Step 2 · Pickup"
                  heading="Schedule pickup"
                >
                  {pickupAlreadyScheduled ? (
                    <p className="od-step__done">
                      Pickup booked{ship.pickupDate ? ` for ${ship.pickupDate}` : ''}.
                    </p>
                  ) : (
                    <div className="od-pickup-row">
                      {pickupAllowedDates.length > 0 ? (
                        <select
                          className="input"
                          value={pickupAllowedDates.includes(pickupDate) ? pickupDate : pickupAllowedDates[0]}
                          onChange={(e) => setPickupDate(e.target.value)}
                        >
                          {pickupAllowedDates.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      ) : (
                        <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={fulfillmentBusy || !paymentReady || caps.schedulePickup === false}
                        onClick={handleSchedulePickup}
                      >
                        {schedulePickup.isPending ? 'Working…' : 'Schedule pickup'}
                      </Button>
                    </div>
                  )}
                </FulfillmentStepCard>
              ) : null}

              {step1Done && shippingProviderKey !== 'shipmozo' && pickupAlreadyScheduled ? (
                <FulfillmentStepCard
                  step={3}
                  focusStep={fulfillmentFocusStep}
                  done={Boolean(ship.manifestUrl || ops.opsState === 'MANIFEST_READY' || ops.opsState === 'LABEL_READY')}
                  title="Step 3 · Manifest"
                  heading="Manifest"
                >
                  <div className="od-row-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={fulfillmentBusy}
                      onClick={handleManifest}
                    >
                      {generateManifest.isPending || downloadManifest.isPending
                        ? 'Working…'
                        : caps.downloadManifest
                          ? 'Download manifest'
                          : 'Generate manifest'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={fulfillmentBusy}
                      onClick={handleDownloadLabel}
                    >
                      {downloadLabel.isPending ? '…' : 'Download label'}
                    </Button>
                    {caps.cancelShipment ? (
                      <Button variant="ghost" size="sm" disabled={fulfillmentBusy} onClick={handleCancelShipment}>
                        Cancel shipment
                      </Button>
                    ) : null}
                  </div>
                </FulfillmentStepCard>
              ) : null}

              {step1Done && shippingProviderKey === 'shipmozo' ? (
                <div className="od-step">
                  <p className="od-muted">
                    Pickup is typically auto-scheduled on Shipmozo after Ship now. Download the shipping label next.
                  </p>
                  <div className="od-row-actions" style={{ marginTop: 12 }}>
                    <Button variant="primary" size="sm" disabled={fulfillmentBusy} onClick={handleDownloadLabel}>
                      Download label
                    </Button>
                    {caps.cancelShipment ? (
                      <Button variant="ghost" size="sm" disabled={fulfillmentBusy} onClick={handleCancelShipment}>
                        Cancel shipment
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          <OrderShipmentTrackingPanel
            ship={ship}
            ops={ops}
            orderStatus={order.orderStatus}
            carrierStatusDisplay={carrierStatusDisplay || (isPendingOrder ? 'Awaiting approval' : null)}
            carrierStatusSecondary={carrierStatusSecondary}
            lastSyncedAt={lastSyncedAt}
            lastSyncError={lastSyncError}
            hideStaleTracking={hideStaleTracking}
            carrierTimeline={carrierTimeline}
            trackingLoading={trackingLoading}
            trackingError={trackingError}
            providerKey={shippingProviderKey}
            trackingUrl={trackingData?.trackingUrl || ship?.trackingUrl || null}
            formatDateTime={formatDateHeader}
            onRefreshTracking={() => refetchTracking()}
          />
        </div>

        <aside className="od-grid__side">
          <AdminPendingAddressPanel
            order={order}
            orderId={orderId}
            disabled={fulfillmentBusy}
            onApplied={refreshOrder}
          />

          <OrderPaymentSummaryCard order={order} showRazorpayIds />
        </aside>
      </div>
    </div>
  )
}

export default AdminOrderDetailView
