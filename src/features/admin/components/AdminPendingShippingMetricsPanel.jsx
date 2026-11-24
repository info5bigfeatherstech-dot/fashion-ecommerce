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

function buildInitialPackageDraft(order) {
  const snap = getShippingWeightSnapshot(order)
  const po = snap?.packageOverride
  if (po && Number(po.totalWeightKg) > 0) {
    return {
      totalWeightKg: numOrEmpty(po.totalWeightKg),
      lengthCm: numOrEmpty(po.lengthCm ?? snap?.dims?.lengthCm),
      widthCm: numOrEmpty(po.widthCm ?? snap?.dims?.widthCm),
      heightCm: numOrEmpty(po.heightCm ?? snap?.dims?.heightCm),
    }
  }
  return {
    totalWeightKg: numOrEmpty(snap?.totalWeightKg),
    lengthCm: numOrEmpty(snap?.dims?.lengthCm),
    widthCm: numOrEmpty(snap?.dims?.widthCm),
    heightCm: numOrEmpty(snap?.dims?.heightCm),
  }
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

function livePackageFromPackageDraft(pkg) {
  const dims = {
    lengthCm: Number(pkg?.lengthCm) || null,
    widthCm: Number(pkg?.widthCm) || null,
    heightCm: Number(pkg?.heightCm) || null,
  }
  return {
    totalWeightKg: Number.isFinite(Number(pkg?.totalWeightKg))
      ? Math.round(Number(pkg.totalWeightKg) * 100) / 100
      : null,
    dims,
    totalDimWeightKg: dimWeightKgFromDims(dims),
  }
}

function defaultModeForOrder(order) {
  const snap = getShippingWeightSnapshot(order)
  if (String(snap?.source || '') === 'admin_package_override' || snap?.packageOverride) {
    return 'package'
  }
  const itemCount = Array.isArray(order?.items) ? order.items.length : 0
  return itemCount > 1 ? 'package' : 'lines'
}

/**
 * Pending-order package weight / dimensions editor.
 * Modes: full packed box OR per-item. Customer shipping stays locked.
 */
export function AdminPendingShippingMetricsPanel({ order, orderId, disabled, onApplied }) {
  const [mode, setMode] = useState(() => defaultModeForOrder(order))
  const [draft, setDraft] = useState(() => buildInitialDraft(order))
  const [pkgDraft, setPkgDraft] = useState(() => buildInitialPackageDraft(order))
  const [preview, setPreview] = useState(null)
  const [localMsg, setLocalMsg] = useState(null)

  const previewEdit = useAdminPreviewPendingShippingMetricsEdit()
  const applyEdit = useAdminApplyPendingShippingMetricsEdit()

  const snapEpoch = [
    orderId,
    order?.shippingWeightSnapshot?.totalWeightKg,
    order?.shippingWeightSnapshot?.source,
    order?.shippingWeightSnapshot?.packageOverride?.totalWeightKg,
    order?.adminQuotedDeliveryAt,
    Array.isArray(order?.items) ? order.items.map((i) => `${i.variantId}:${i.quantity}`).join('|') : '',
  ].join('::')

  useEffect(() => {
    setDraft(buildInitialDraft(order))
    setPkgDraft(buildInitialPackageDraft(order))
    setMode(defaultModeForOrder(order))
    setPreview(null)
    setLocalMsg(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapEpoch])

  const rows = useMemo(() => Object.values(draft), [draft])
  const packageFromLines = useMemo(() => livePackageFromDraft(draft), [draft])
  const packageFromBox = useMemo(() => livePackageFromPackageDraft(pkgDraft), [pkgDraft])
  const packageLive = mode === 'package' ? packageFromBox : packageFromLines
  const packageMeta = useMemo(() => resolvePackageShippingWeightMeta(order), [order])

  const initial = useMemo(() => buildInitialDraft(order), [order])
  const initialPkg = useMemo(() => buildInitialPackageDraft(order), [order])

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

  const packageOverride = useMemo(() => {
    const changed =
      Number(pkgDraft.totalWeightKg) !== Number(initialPkg.totalWeightKg) ||
      Number(pkgDraft.lengthCm) !== Number(initialPkg.lengthCm) ||
      Number(pkgDraft.widthCm) !== Number(initialPkg.widthCm) ||
      Number(pkgDraft.heightCm) !== Number(initialPkg.heightCm)
    if (!changed) return null
    return {
      totalWeightKg: Number(pkgDraft.totalWeightKg),
      lengthCm: Number(pkgDraft.lengthCm),
      widthCm: Number(pkgDraft.widthCm),
      heightCm: Number(pkgDraft.heightCm),
    }
  }, [pkgDraft, initialPkg])

  const hasChanges = mode === 'package' ? Boolean(packageOverride) : lineOverrides.length > 0

  const busy = previewEdit.isPending || applyEdit.isPending || disabled
  const checkoutShip = resolveCheckoutDeliveryInr(order)
  const adminQuoted = resolveAdminQuotedDeliveryInr(order)
  const delta = resolveAdminShippingDeltaInr(order)

  function switchMode(next) {
    if (next === mode) return
    setMode(next)
    setPreview(null)
    setLocalMsg(null)
  }

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

  function setPkgField(field, value) {
    setPreview(null)
    setLocalMsg(null)
    setPkgDraft((prev) => ({
      ...prev,
      [field]: value === '' ? '' : Number(value),
    }))
  }

  async function runPreview() {
    setLocalMsg(null)
    if (mode === 'package') {
      if (!packageOverride) {
        setLocalMsg({ type: 'err', text: 'Change package weight or dimensions first.' })
        return
      }
      try {
        const data = await previewEdit.mutateAsync({ orderId, packageOverride })
        setPreview(data)
      } catch (err) {
        setLocalMsg({
          type: 'err',
          text: err?.response?.data?.message || err?.message || 'Preview failed',
        })
      }
      return
    }
    if (!lineOverrides.length) {
      setLocalMsg({ type: 'err', text: 'Change at least one item weight or dimension first.' })
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
    if (mode === 'package') {
      if (!packageOverride) {
        setLocalMsg({ type: 'err', text: 'Change package weight or dimensions first.' })
        return
      }
      try {
        await applyEdit.mutateAsync({ orderId, packageOverride })
        setPreview(null)
        setLocalMsg({
          type: 'ok',
          text: 'Packed-box metrics saved. Order lines aligned to package total for courier; product catalog unchanged.',
        })
        if (typeof onApplied === 'function') await onApplied()
      } catch (err) {
        setLocalMsg({
          type: 'err',
          text: err?.response?.data?.message || err?.message || 'Apply failed',
        })
      }
      return
    }
    if (!lineOverrides.length) {
      setLocalMsg({ type: 'err', text: 'Change at least one item weight or dimension first.' })
      return
    }
    try {
      await applyEdit.mutateAsync({ orderId, lineOverrides })
      setPreview(null)
      setLocalMsg({
        type: 'ok',
        text: 'Per-item metrics updated. Package totals rebuilt; customer shipping stayed locked.',
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
              Use packed box for multi-item ship-as-one, or edit items one by one. Customer shipping
              stays locked — only admin courier quote changes.
            </p>
          </div>
        </div>

        <div className="od-ship-metrics__mode" role="tablist" aria-label="Edit mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'package'}
            className={`od-ship-metrics__mode-btn${mode === 'package' ? ' is-active' : ''}`}
            disabled={busy}
            onClick={() => switchMode('package')}
          >
            Full package
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'lines'}
            className={`od-ship-metrics__mode-btn${mode === 'lines' ? ' is-active' : ''}`}
            disabled={busy}
            onClick={() => switchMode('lines')}
          >
            Per item
          </button>
        </div>

        {headerSegments.length > 0 ? (
          <div className="od-ship-metrics__pkg-chip">
            <span className="od-ship-metrics__pkg-chip-label">
              {mode === 'package' ? 'Courier package' : 'Package from items'}
            </span>
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

      {mode === 'package' ? (
        <div className="od-ship-metrics__package-edit">
          <p className="od-ship-metrics__hint">
            Enter the measured packed box (all items together). Courier (Shiprocket or Shipmozo —
            whichever is active) gets these package totals; order line weights are aligned to match
            so there is no weight conflict. Product catalog listing is never changed.
          </p>
          <div className="od-ship-metrics__fields od-ship-metrics__fields--package">
            <label>
              Total wt (kg)
              <input
                type="number"
                min={0.05}
                max={100}
                step={0.01}
                disabled={busy}
                value={pkgDraft.totalWeightKg}
                onChange={(e) => setPkgField('totalWeightKg', e.target.value)}
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
                value={pkgDraft.lengthCm}
                onChange={(e) => setPkgField('lengthCm', e.target.value)}
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
                value={pkgDraft.widthCm}
                onChange={(e) => setPkgField('widthCm', e.target.value)}
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
                value={pkgDraft.heightCm}
                onChange={(e) => setPkgField('heightCm', e.target.value)}
              />
            </label>
          </div>
          <p className="od-ship-metrics__package-value">
            Vol {formatKg(packageLive.totalDimWeightKg) || '—'}
            {formatPackageDims(packageLive.dims) ? ` · ${formatPackageDims(packageLive.dims)}` : ''}
          </p>

          <div className="od-ship-metrics__ref-list">
            <p className="od-field-label">Items in this package (reference)</p>
            {rows.map((row) => {
              const key = draftKey(row.productId, row.variantId)
              return (
                <div key={key} className="od-ship-metrics__ref-row">
                  <div className="od-pending-item__thumb od-ship-metrics__thumb od-ship-metrics__thumb--sm">
                    {row.image ? <img src={row.image} alt="" /> : <Package size={18} />}
                  </div>
                  <div className="od-ship-metrics__info">
                    <p className="od-pending-item__name">{row.name}</p>
                    <p className="od-pending-item__sku">
                      <span className="od-pending-item__sku-code">{row.sku}</span>
                      <span className="od-ship-metrics__qty">Qty {row.quantity}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="od-ship-metrics__list">
          <p className="od-ship-metrics__hint od-ship-metrics__hint--pad">
            Edit each item; package totals rebuild from lines (sum weight, max L/W, stacked height).
          </p>
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
          <div className="od-ship-metrics__package">
            <p className="od-field-label">Live package (from items)</p>
            <p className="od-field-value od-ship-metrics__package-value">
              Wt {formatKg(packageLive.totalWeightKg) || '—'}
              {formatPackageDims(packageLive.dims) ? ` · ${formatPackageDims(packageLive.dims)}` : ''}
              {packageLive.totalDimWeightKg != null && packageLive.totalDimWeightKg >= 0.01
                ? ` · Vol ${formatKg(packageLive.totalDimWeightKg)}`
                : ''}
            </p>
          </div>
        </div>
      )}

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
          <p className="od-pending-items__preview-label">
            Preview{preview.mode ? ` · ${preview.mode === 'package' ? 'full package' : 'per item'}` : ''}
          </p>
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
