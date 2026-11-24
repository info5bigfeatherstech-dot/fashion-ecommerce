import { useEffect, useMemo, useState } from 'react'
import { Package, Ruler } from 'lucide-react'
import {
  useAdminApplyPendingShippingMetricsEdit,
  useAdminPreviewPendingShippingMetricsEdit,
} from '@/features/admin/hooks'
import { ShippingWeightMetaText } from '@/features/admin/components/ShippingWeightMetaText'
import {
  buildWeightByVariantId,
  dimWeightKgFromDims,
  formatKg,
  formatPackageDims,
  getShippingWeightSnapshot,
  resolvePackageShippingWeightMeta,
} from '@/features/admin/utils/orderShippingWeightDisplay'
import {
  resolveAdminQuotedDeliveryInr,
  resolveAdminShippingDeltaInr,
  resolveCheckoutDeliveryInr,
} from '@/features/admin/utils/orderShippingMoneyDisplay'

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(v)
}

function lineIds(line) {
  const productId = String(line?.productId?._id || line?.productId || '').trim()
  const variantId = String(line?.variantId?._id || line?.variantId || '').trim()
  return { productId, variantId }
}

function lineImage(line) {
  return (
    line?.thumbnailUrl ||
    line?.image ||
    line?.productId?.images?.[0]?.url ||
    line?.productId?.images?.[0] ||
    null
  )
}

function draftKey(productId, variantId) {
  return `${productId}:${variantId}`
}

function numOrEmpty(v) {
  if (v === '' || v == null) return ''
  const n = Number(v)
  return Number.isFinite(n) ? n : ''
}

function buildInitialDraft(order) {
  const items = Array.isArray(order?.items) ? order.items : []
  const snap = getShippingWeightSnapshot(order)
  const byVariant = buildWeightByVariantId(snap)
  const next = {}
  for (const line of items) {
    const { productId, variantId } = lineIds(line)
    if (!productId || !variantId) continue
    const row = byVariant.get(variantId) || null
    next[draftKey(productId, variantId)] = {
      productId,
      variantId,
      name: line?.productId?.name || line?.name || row?.productName || 'Product',
      sku: line?.sku || line?.productCode || row?.sku || '—',
      image: lineImage(line),
      quantity: Number(line.quantity) || 0,
      unitWeightKg: numOrEmpty(row?.unitWeightKg),
      lengthCm: numOrEmpty(row?.lengthCm),
      widthCm: numOrEmpty(row?.widthCm),
      heightCm: numOrEmpty(row?.heightCm),
      overridden: Boolean(row?.overridden),
    }
  }
  return next
}

function livePackageFromDraft(draft) {
  const lines = Object.values(draft || {}).filter((r) => (Number(r.quantity) || 0) > 0)
  let totalWeightKg = 0
  let maxL = 0
  let maxW = 0
  let heightStack = 0
  for (const row of lines) {
    const qty = Math.max(0, Number(row.quantity) || 0)
    const w = Number(row.unitWeightKg)
    const l = Number(row.lengthCm)
    const wi = Number(row.widthCm)
    const h = Number(row.heightCm)
    if (Number.isFinite(w) && w > 0) totalWeightKg += w * qty
    if (Number.isFinite(l) && l > 0) maxL = Math.max(maxL, l)
    if (Number.isFinite(wi) && wi > 0) maxW = Math.max(maxW, wi)
    if (Number.isFinite(h) && h > 0) heightStack += h * qty
  }
  const dims = {
    lengthCm: maxL || null,
    widthCm: maxW || null,
    heightCm: heightStack ? Math.min(200, heightStack) : null,
  }
  return {
    totalWeightKg: totalWeightKg > 0 ? Math.round(totalWeightKg * 100) / 100 : null,
    dims,
    totalDimWeightKg: dimWeightKgFromDims(dims),
  }
}

/**
 * Pending-order package weight / dimensions editor.
 * Customer checkout shipping stays locked; re-quote is admin-only.
 */
export function AdminPendingShippingMetricsPanel({ order, orderId, disabled, onApplied }) {
  const [draft, setDraft] = useState(() => buildInitialDraft(order))
  const [preview, setPreview] = useState(null)
  const [localMsg, setLocalMsg] = useState(null)

  const previewEdit = useAdminPreviewPendingShippingMetricsEdit()
  const applyEdit = useAdminApplyPendingShippingMetricsEdit()

  const snapEpoch = [
    orderId,
    order?.shippingWeightSnapshot?.totalWeightKg,
    order?.shippingWeightSnapshot?.source,
    order?.shippingWeightSnapshot?.adminQuotedDeliveryAt,
    order?.adminQuotedDeliveryAt,
    Array.isArray(order?.items) ? order.items.map((i) => `${i.variantId}:${i.quantity}`).join('|') : '',
  ].join('::')

  useEffect(() => {
    setDraft(buildInitialDraft(order))
    setPreview(null)
    setLocalMsg(null)
    // Reset draft when server package/items change (after apply / refresh), not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapEpoch])

  const rows = useMemo(() => Object.values(draft), [draft])
  const packageLive = useMemo(() => livePackageFromDraft(draft), [draft])
  const packageMeta = useMemo(() => resolvePackageShippingWeightMeta(order), [order])

  const initial = useMemo(() => buildInitialDraft(order), [order])
  const hasChanges = useMemo(() => {
    return rows.some((row) => {
      const key = draftKey(row.productId, row.variantId)
      const base = initial[key]
      if (!base) return false
      return (
        Number(row.unitWeightKg) !== Number(base.unitWeightKg) ||
        Number(row.lengthCm) !== Number(base.lengthCm) ||
        Number(row.widthCm) !== Number(base.widthCm) ||
        Number(row.heightCm) !== Number(base.heightCm)
      )
    })
  }, [rows, initial])

  const lineOverrides = useMemo(() => {
    return rows
      .filter((row) => {
        const key = draftKey(row.productId, row.variantId)
        const base = initial[key]
        if (!base) return false
        return (
          Number(row.unitWeightKg) !== Number(base.unitWeightKg) ||
          Number(row.lengthCm) !== Number(base.lengthCm) ||
          Number(row.widthCm) !== Number(base.widthCm) ||
          Number(row.heightCm) !== Number(base.heightCm)
        )
      })
      .map((row) => ({
        productId: row.productId,
        variantId: row.variantId,
        unitWeightKg: Number(row.unitWeightKg),
        lengthCm: Number(row.lengthCm),
        widthCm: Number(row.widthCm),
        heightCm: Number(row.heightCm),
      }))
  }, [rows, initial])

  const busy = previewEdit.isPending || applyEdit.isPending || disabled
  const checkoutShip = resolveCheckoutDeliveryInr(order)
  const adminQuoted = resolveAdminQuotedDeliveryInr(order)
  const delta = resolveAdminShippingDeltaInr(order)

  function setField(key, field, value) {
    setPreview(null)
    setLocalMsg(null)
    setDraft((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value === '' ? '' : Number(value),
      },
    }))
  }

  async function runPreview() {
    setLocalMsg(null)
    if (!lineOverrides.length) {
      setLocalMsg({ type: 'err', text: 'Change at least one weight or dimension first.' })
      return
    }
    try {
      const data = await previewEdit.mutateAsync({ orderId, lineOverrides })
      setPreview(data)
    } catch (err) {
      setLocalMsg({
        type: 'err',
        text: err?.response?.data?.message || err?.message || 'Preview failed',
      })
    }
  }

  async function runApply() {
    setLocalMsg(null)
    if (!lineOverrides.length) {
      setLocalMsg({ type: 'err', text: 'Change at least one weight or dimension first.' })
      return
    }
    try {
      await applyEdit.mutateAsync({ orderId, lineOverrides })
      setPreview(null)
      setLocalMsg({
        type: 'ok',
        text: 'Package metrics updated. Customer shipping stayed locked; courier will use new weight/dims.',
      })
      if (typeof onApplied === 'function') await onApplied()
    } catch (err) {
      setLocalMsg({
        type: 'err',
        text: err?.response?.data?.message || err?.message || 'Apply failed',
      })
    }
  }

  if (!rows.length) return null

  const previewPkg = preview?.shipping?.package
  const previewCheckout =
    preview?.shipping?.checkoutDeliveryCharges ?? preview?.shipping?.customerDelivery
  const previewQuoted = preview?.shipping?.adminQuotedDeliveryInr ?? preview?.shipping?.quotedDelivery
  const previewDelta = preview?.shipping?.adminShippingDeltaInr

  const headerSegments = (() => {
    const liveSegments = []
    const wt = formatKg(packageLive.totalWeightKg)
    const dims = formatPackageDims(packageLive.dims)
    const vol =
      packageLive.totalDimWeightKg != null && packageLive.totalDimWeightKg >= 0.01
        ? formatKg(packageLive.totalDimWeightKg)
        : null
    if (wt) liveSegments.push({ label: 'Wt', value: wt })
    if (dims) liveSegments.push({ label: null, value: dims })
    if (vol) liveSegments.push({ label: 'Vol', value: vol })
    return liveSegments.length ? liveSegments : packageMeta.headerSegments
  })()

  return (
    <section className="od-card od-card--pending-ship-metrics">
      <div className="od-ship-metrics__head">
        <div className="od-ship-metrics__title-row">
          <span className="od-ship-metrics__icon" aria-hidden>
            <Ruler size={16} />
          </span>
          <div className="od-ship-metrics__title-block">
            <h3 className="od-card__title od-ship-metrics__title">Edit weight &amp; dimensions</h3>
            <p className="od-ship-metrics__sub">
              Fix wrong listing weight/dims. Package rebuilds live. Customer shipping stays locked —
              only admin courier quote changes.
            </p>
          </div>
        </div>
        {headerSegments.length > 0 ? (
          <div className="od-ship-metrics__pkg-chip">
            <span className="od-ship-metrics__pkg-chip-label">Package</span>
            <ShippingWeightMetaText
              as="span"
              segments={headerSegments}
              className="od-ship-metrics__pkg-chip-line"
            />
          </div>
        ) : null}
      </div>

      <div className="od-ship-metrics__money">
        <div className="od-ship-metrics__stat">
          <p className="od-field-label">Customer shipping (locked)</p>
          <p className="od-field-value od-ship-metrics__stat-value">
            {Number(checkoutShip) === 0 ? (
              <span className="od-pending-items__free">FREE</span>
            ) : (
              formatInr(checkoutShip)
            )}
          </p>
        </div>
        <div className="od-ship-metrics__stat">
          <p className="od-field-label">Admin courier quote</p>
          <p className="od-field-value od-ship-metrics__stat-value">
            {adminQuoted == null ? '—' : Number(adminQuoted) === 0 ? 'FREE' : formatInr(adminQuoted)}
          </p>
        </div>
        <div className="od-ship-metrics__stat">
          <p className="od-field-label">Delta (admin)</p>
          <p
            className={`od-field-value od-ship-metrics__stat-value${
              delta != null && delta > 0.005
                ? ' is-up'
                : delta != null && delta < -0.005
                  ? ' is-down'
                  : ''
            }`}
          >
            {delta == null ? '—' : formatInr(delta)}
          </p>
        </div>
      </div>

      <div className="od-ship-metrics__list">
        {rows.map((row) => {
          const key = draftKey(row.productId, row.variantId)
          const unitVol = dimWeightKgFromDims({
            lengthCm: row.lengthCm,
            widthCm: row.widthCm,
            heightCm: row.heightCm,
          })
          const lineVol =
            unitVol != null && Number.isFinite(Number(row.quantity))
              ? Math.round(unitVol * Number(row.quantity) * 100) / 100
              : null
          const lineDead =
            Number.isFinite(Number(row.unitWeightKg)) && Number.isFinite(Number(row.quantity))
              ? Math.round(Number(row.unitWeightKg) * Number(row.quantity) * 100) / 100
              : null
          return (
            <div key={key} className="od-ship-metrics__row">
              <div className="od-ship-metrics__product">
                <div className="od-pending-item__thumb od-ship-metrics__thumb">
                  {row.image ? <img src={row.image} alt="" /> : <Package size={22} />}
                </div>
                <div className="od-ship-metrics__info">
                  <p className="od-pending-item__name">{row.name}</p>
                  <p className="od-pending-item__sku">
                    <span className="od-pending-item__sku-code">{row.sku}</span>
                    <span className="od-ship-metrics__qty">Qty {row.quantity}</span>
                    {row.overridden ? (
                      <span className="od-ship-metrics__badge">Overridden</span>
                    ) : null}
                  </p>
                  <p className="od-pending-item__ship">
                    Line wt {formatKg(lineDead) || '—'}
                    {lineVol != null && lineVol >= 0.01 ? ` · Vol ${formatKg(lineVol)}` : ''}
                  </p>
                </div>
              </div>
              <div className="od-ship-metrics__fields">
                <label>
                  Wt (kg)
                  <input
                    type="number"
                    min={0.05}
                    max={50}
                    step={0.01}
                    disabled={busy}
                    value={row.unitWeightKg}
                    onChange={(e) => setField(key, 'unitWeightKg', e.target.value)}
                  />
                </label>
                <label>
                  L (cm)
                  <input
                    type="number"
                    min={1}
                    max={200}
                    step={0.1}
                    disabled={busy}
                    value={row.lengthCm}
                    onChange={(e) => setField(key, 'lengthCm', e.target.value)}
                  />
                </label>
                <label>
                  W (cm)
                  <input
                    type="number"
                    min={1}
                    max={200}
                    step={0.1}
                    disabled={busy}
                    value={row.widthCm}
                    onChange={(e) => setField(key, 'widthCm', e.target.value)}
                  />
                </label>
                <label>
                  H (cm)
                  <input
                    type="number"
                    min={1}
                    max={200}
                    step={0.1}
                    disabled={busy}
                    value={row.heightCm}
                    onChange={(e) => setField(key, 'heightCm', e.target.value)}
                  />
                </label>
              </div>
            </div>
          )
        })}
      </div>

      <div className="od-ship-metrics__package">
        <p className="od-field-label">Live package (from draft)</p>
        <p className="od-field-value od-ship-metrics__package-value">
          Wt {formatKg(packageLive.totalWeightKg) || '—'}
          {formatPackageDims(packageLive.dims) ? ` · ${formatPackageDims(packageLive.dims)}` : ''}
          {packageLive.totalDimWeightKg != null && packageLive.totalDimWeightKg >= 0.01
            ? ` · Vol ${formatKg(packageLive.totalDimWeightKg)}`
            : ''}
        </p>
      </div>

      <div className="od-pending-items__actions">
        <button
          type="button"
          className="od-pending-items__btn od-pending-items__btn--secondary"
          disabled={busy || !hasChanges}
          onClick={runPreview}
        >
          {previewEdit.isPending ? 'Calculating…' : 'Preview quote'}
        </button>
        <button
          type="button"
          className="od-pending-items__btn od-pending-items__btn--primary"
          disabled={busy || !hasChanges}
          onClick={runApply}
        >
          {applyEdit.isPending ? 'Applying…' : 'Apply package update'}
        </button>
      </div>

      {localMsg?.text ? (
        <p className={`od-pending-items__msg od-pending-items__msg--${localMsg.type || 'ok'}`}>
          {localMsg.text}
        </p>
      ) : null}

      {preview ? (
        <div className="od-pending-items__preview">
          <p className="od-pending-items__preview-label">Preview</p>
          <div className="od-pending-items__preview-grid">
            <div>
              <p className="od-field-label">Customer shipping (locked)</p>
              <p className="od-field-value">
                {Number(previewCheckout) === 0 ? 'FREE' : formatInr(previewCheckout)}
              </p>
            </div>
            <div>
              <p className="od-field-label">Admin courier quote</p>
              <p className="od-field-value">
                {previewQuoted == null
                  ? '—'
                  : Number(previewQuoted) === 0
                    ? 'FREE'
                    : formatInr(previewQuoted)}
              </p>
            </div>
            <div>
              <p className="od-field-label">Delta</p>
              <p className="od-field-value">
                {previewDelta == null ? '—' : formatInr(previewDelta)}
              </p>
            </div>
            <div>
              <p className="od-field-label">Package after</p>
              <p className="od-field-value">
                Wt {formatKg(previewPkg?.totalWeightKg) || '—'}
                {formatPackageDims(previewPkg?.dims)
                  ? ` · ${formatPackageDims(previewPkg.dims)}`
                  : ''}
                {previewPkg?.totalDimWeightKg != null && previewPkg.totalDimWeightKg >= 0.01
                  ? ` · Vol ${formatKg(previewPkg.totalDimWeightKg)}`
                  : ''}
              </p>
            </div>
            {preview?.shipping?.courierName ? (
              <div>
                <p className="od-field-label">Quoted courier</p>
                <p className="od-field-value">{preview.shipping.courierName}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default AdminPendingShippingMetricsPanel
