import { useEffect, useMemo, useState } from 'react'
import { MapPin, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  useAdminAddressIntelligence,
  useAdminApplyPendingAddressEdit,
  useAdminPreviewPendingAddressEdit,
} from '@/features/admin/hooks'
import { getCourierStreetUsage, validateCourierStreetClient } from '@/utils/addressValidation'

const EDITABLE_FIELDS = [
  { key: 'houseNumber', label: 'House / flat' },
  { key: 'building', label: 'Building' },
  { key: 'floor', label: 'Floor' },
  { key: 'addressLine1', label: 'Address line 1' },
  { key: 'addressLine2', label: 'Address line 2' },
  { key: 'area', label: 'Area / locality' },
  { key: 'landmark', label: 'Landmark' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postalCode', label: 'Pincode' },
  { key: 'country', label: 'Country' },
]

function formatInr(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n)
}

function normalizeRiskLevel(raw) {
  const s = String(raw || '').trim().toLowerCase()
  if (!s || s === 'null' || s === 'undefined') return null
  if (s === 'high' || s === 'h') return 'high'
  if (s === 'medium' || s === 'med' || s === 'm' || s === 'moderate') return 'medium'
  if (s === 'low' || s === 'l') return 'low'
  return s
}

function resolveOrderAddress(order) {
  return (
    order?.addressSnapshot ||
    order?.shippingAddress ||
    order?.deliveryAddress ||
    order?.address ||
    {}
  )
}

function scoreRingTone(category) {
  const c = String(category || '').toLowerCase()
  if (c === 'valid') return 'valid'
  if (c === 'ambiguous' || c === 'needs_review') return 'warn'
  if (c) return 'bad'
  return 'neutral'
}

function riskPillTone(level) {
  if (level === 'low') return 'low'
  if (level === 'medium') return 'mid'
  if (level === 'high') return 'high'
  return 'neutral'
}

function RiskPill({ label, value, emptyHint }) {
  const level = normalizeRiskLevel(value)
  const tone = riskPillTone(level)
  return (
    <div className={`od-risk-pill od-risk-pill--${tone}`}>
      <p className="od-risk-pill__label">{label}</p>
      <p className="od-risk-pill__value">{level || emptyHint || '—'}</p>
    </div>
  )
}

function formatDeliveryAddress(addr) {
  return [
    addr?.houseNumber,
    addr?.building,
    addr?.floor,
    addr?.addressLine1 || addr?.fullAddress,
    addr?.addressLine2,
    addr?.area,
    addr?.landmark,
    addr?.city,
    addr?.state,
    addr?.postalCode,
    addr?.country,
  ]
    .filter(Boolean)
    .join(', ')
}

/**
 * Customer & address card. Edit is available only while order status is pending.
 */
export function AdminPendingAddressPanel({ order, orderId, disabled, onApplied }) {
  const addr = resolveOrderAddress(order)
  const customer = order?.customer || {}
  const isPending = String(order?.orderStatus || '').toLowerCase() === 'pending'

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [alsoUpdateSaved, setAlsoUpdateSaved] = useState(false)
  const [preview, setPreview] = useState(null)
  const [localMsg, setLocalMsg] = useState(null)

  const hasShiprocketOrder = Boolean(
    order?.shipmentInfo?.shiprocketOrderId || order?.shipmentInfo?.shipmentId
  )

  const {
    data: addressIntel,
    isLoading: intelLoading,
    isFetching: intelFetching,
    refetch: refetchIntel,
  } = useAdminAddressIntelligence(orderId, {
    enabled: Boolean(orderId),
    refresh: hasShiprocketOrder,
  })

  const previewEdit = useAdminPreviewPendingAddressEdit()
  const applyEdit = useAdminApplyPendingAddressEdit()

  useEffect(() => {
    const next = {}
    for (const f of EDITABLE_FIELDS) {
      next[f.key] = addr[f.key] != null ? String(addr[f.key]) : ''
    }
    setDraft(next)
    setPreview(null)
    setLocalMsg(null)
    setEditing(false)
  }, [
    orderId,
    addr.postalCode,
    addr.addressLine1,
    addr.city,
    addr.state,
    addr.houseNumber,
    addr.area,
  ])

  const addressPatch = useMemo(() => {
    const patch = {}
    for (const f of EDITABLE_FIELDS) {
      const original = addr[f.key] != null ? String(addr[f.key]) : ''
      const value = draft[f.key] != null ? String(draft[f.key]) : ''
      if (value !== original) patch[f.key] = value
    }
    return patch
  }, [draft, addr])

  const hasChanges = Object.keys(addressPatch).length > 0
  const busy = previewEdit.isPending || applyEdit.isPending || disabled
  const intelLoadingAny = intelLoading || intelFetching
  const primary = addressIntel?.data?.primary || addressIntel?.primary || null
  const shiprocketIntel = addressIntel?.data?.shiprocket || addressIntel?.shiprocket || null
  const scorePercent = primary?.scorePercent
  const addressRisk =
    normalizeRiskLevel(primary?.risk) || normalizeRiskLevel(shiprocketIntel?.risk) || primary?.categoryLabel
  const rtoRisk = normalizeRiskLevel(primary?.rtoRisk) || normalizeRiskLevel(shiprocketIntel?.rtoRisk)
  const hasShiprocketRisks = Boolean(shiprocketIntel?.available || primary?.source === 'shiprocket')
  const courierUsage = useMemo(() => getCourierStreetUsage(draft), [draft])
  const email = customer.email || order.userEmail || order.email || addr.email || null
  const scoreTone = scoreRingTone(primary?.category)
  const scoreLabel = primary?.categoryLabel || (scorePercent != null ? 'Valid address' : 'Score pending')
  const scoreSource = primary?.source === 'shiprocket' ? 'Shiprocket score' : 'Local pre-ship check'
  const showScoreRow = Boolean(primary?.available || scorePercent != null || intelLoadingAny)

  const guardCourierStreetLength = () => {
    const err = validateCourierStreetClient(draft)
    if (err) {
      setLocalMsg({ type: 'err', text: err })
      return false
    }
    return true
  }

  const runPreview = async () => {
    setLocalMsg(null)
    setPreview(null)
    if (!guardCourierStreetLength()) return
    try {
      const res = await previewEdit.mutateAsync({
        orderId,
        addressPatch,
        alsoUpdateSavedAddress: alsoUpdateSaved,
      })
      setPreview(res?.data || res || null)
    } catch (e) {
      setLocalMsg({
        type: 'err',
        text: e?.data?.message || e?.message || 'Preview failed.',
      })
    }
  }

  const runApply = async () => {
    if (!guardCourierStreetLength()) return
    if (
      !window.confirm(
        'Update delivery address on this order? Name and phone stay unchanged. Shipping will be re-quoted (customer never charged more).'
      )
    ) {
      return
    }
    setLocalMsg(null)
    try {
      const res = await applyEdit.mutateAsync({
        orderId,
        addressPatch,
        alsoUpdateSavedAddress: alsoUpdateSaved,
      })
      setPreview(null)
      setEditing(false)
      setLocalMsg({
        type: res?.data?.refundWarning ? 'warn' : 'ok',
        text: res?.message || 'Address updated.',
      })
      await refetchIntel()
      if (typeof onApplied === 'function') await onApplied(res?.data || res)
    } catch (e) {
      setLocalMsg({
        type: 'err',
        text: e?.data?.message || e?.message || 'Update failed.',
      })
    }
  }

  return (
    <section className="od-card od-card--address">
      <div className="od-card__head od-card__head--address">
        <div className="od-card__title-row">
          <span className="od-card__icon" aria-hidden>
            <MapPin size={16} />
          </span>
          <div className="od-card__title-text">
            <h3 className="od-card__title">Customer & address</h3>
            <p className="od-muted">Who receives this order</p>
          </div>
        </div>
        <div className="od-address-actions">
          <button
            type="button"
            className="od-address-actions__btn"
            disabled={busy || intelLoadingAny}
            onClick={() => refetchIntel()}
          >
            {intelLoadingAny ? '…' : 'Refresh score'}
          </button>
          {isPending ? (
            <button
              type="button"
              className="od-address-actions__btn od-address-actions__btn--edit"
              disabled={busy}
              onClick={() => {
                setEditing((v) => !v)
                setPreview(null)
                setLocalMsg(null)
              }}
            >
              <Pencil size={12} aria-hidden />
              {editing ? 'Cancel' : 'Edit'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="od-address-body">
        {showScoreRow ? (
          <div className="od-address-status">
            {intelLoadingAny && !primary ? (
              <p className="od-address-status__loading">Checking address quality…</p>
            ) : (
              <>
                <div
                  className={`od-score-ring od-score-ring--${scoreTone}`}
                  title={scoreLabel}
                >
                  <span className="od-score-ring__pct">
                    {Number.isFinite(Number(scorePercent)) ? `${Math.round(Number(scorePercent))}%` : '—'}
                  </span>
                  <span className="od-score-ring__valid">Valid</span>
                </div>
                <div className="od-score-meta">
                  <p className="od-score-meta__title">{scoreLabel}</p>
                  <p className="od-score-meta__sub">{scoreSource}</p>
                </div>
                <div className="od-risk-row">
                  <RiskPill
                    label="Address risk"
                    value={addressRisk}
                    emptyHint={hasShiprocketRisks ? '—' : 'After SR'}
                  />
                  <RiskPill
                    label="RTO risk"
                    value={rtoRisk}
                    emptyHint={hasShiprocketRisks ? '—' : 'After SR'}
                  />
                </div>
              </>
            )}
          </div>
        ) : null}

        <div className="od-contact-grid">
          <div>
            <p className="od-field-label">Name</p>
            <p className="od-field-value">
              {addr.fullName || addr.name || order.customerName || customer.name || '—'}
            </p>
          </div>
          <div>
            <p className="od-field-label">Phone</p>
            <p className="od-field-value">
              {addr.phone || order.contactPhone || order.phone || customer.phone || '—'}
            </p>
          </div>
          {email ? (
            <div className="od-contact-grid__full">
              <p className="od-field-label">Email</p>
              <p className="od-field-value od-field-value--email">{email}</p>
            </div>
          ) : null}
          {!editing ? (
            <div className="od-contact-grid__full">
              <p className="od-field-label">Delivery address</p>
              <p className="od-field-value od-field-value--address">
                {formatDeliveryAddress(addr) || '—'}
              </p>
            </div>
          ) : null}
        </div>

      {isPending && editing ? (
        <div className="od-address-edit">
          <p className="od-muted">
            Name and phone stay locked. Street fields update this order&apos;s snapshot for Shiprocket.
          </p>
          <div
            className={`od-address-edit__meter${
              courierUsage.overLimit ? ' is-error' : courierUsage.remaining <= 30 ? ' is-warn' : ''
            }`}
          >
            Courier street length: {courierUsage.combinedLength}/{courierUsage.max}
            {courierUsage.overLimit
              ? ' — too long. Shorten house, building, floor, landmark, or street details.'
              : ' (city / state / pincode count separately)'}
          </div>
          <div className="od-address-edit__grid">
            {EDITABLE_FIELDS.map((f) => (
              <label
                key={f.key}
                className={`od-address-edit__field${
                  f.key === 'addressLine1' || f.key === 'addressLine2' || f.key === 'landmark'
                    ? ' is-wide'
                    : ''
                }`}
              >
                <span className="od-field-label">{f.label}</span>
                <Input
                  type="text"
                  disabled={busy}
                  value={draft[f.key] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <label className="od-address-edit__checkbox">
            <input
              type="checkbox"
              checked={alsoUpdateSaved}
              disabled={busy}
              onChange={(e) => setAlsoUpdateSaved(e.target.checked)}
            />
            <span>Also update this customer&apos;s saved address (same user only).</span>
          </label>
          <div className="od-row-actions">
            <Button
              variant="secondary"
              size="sm"
              disabled={busy || !hasChanges || courierUsage.overLimit}
              onClick={runPreview}
            >
              {previewEdit.isPending ? 'Previewing…' : 'Preview'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={busy || !hasChanges || !preview || courierUsage.overLimit}
              onClick={runApply}
            >
              {applyEdit.isPending ? 'Saving…' : 'Apply update'}
            </Button>
          </div>
          {preview ? (
            <div className="od-address-edit__preview">
              <p>
                Shipping: {formatInr(preview.shipping?.oldDelivery)} →{' '}
                {formatInr(preview.shipping?.customerDelivery)}
                {preview.shipping?.courierName ? ` · ${preview.shipping.courierName}` : ''}
              </p>
              <p>
                New total: {formatInr(preview.after?.totalAmount)}
                {Number(preview.refundInr) > 0.005
                  ? ` · Refund ${formatInr(preview.refundInr)}`
                  : ' · No refund'}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {localMsg?.text ? (
        <div className={`od-banner od-banner--${localMsg.type || 'ok'}`} role="status">
          {localMsg.text}
        </div>
      ) : null}
      </div>
    </section>
  )
}

export default AdminPendingAddressPanel
