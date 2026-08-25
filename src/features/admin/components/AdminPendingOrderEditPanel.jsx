import { useEffect, useMemo, useState } from 'react'
import { Package, Trash2 } from 'lucide-react'
import {
  useAdminApplyPendingOrderEdit,
  useAdminPreviewPendingOrderEdit,
} from '@/features/admin/hooks'

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

/**
 * Pending-order item editor: reduce qty / remove lines before Confirm.
 * Parent should not also render the read-only items list for pending orders.
 */
export function AdminPendingOrderEditPanel({ order, orderId, disabled, onApplied }) {
  const items = useMemo(
    () => (Array.isArray(order?.items) ? order.items : order?.orderItems || []),
    [order?.items, order?.orderItems]
  )
  const [draftQty, setDraftQty] = useState({})
  const [preview, setPreview] = useState(null)
  const [localMsg, setLocalMsg] = useState(null)

  const previewEdit = useAdminPreviewPendingOrderEdit()
  const applyEdit = useAdminApplyPendingOrderEdit()

  useEffect(() => {
    const next = {}
    for (const line of items) {
      const { productId, variantId } = lineIds(line)
      if (!productId || !variantId) continue
      next[`${productId}:${variantId}`] = Number(line.quantity) || 0
    }
    setDraftQty(next)
    setPreview(null)
    setLocalMsg(null)
  }, [orderId, items])

  const itemUpdates = useMemo(() => {
    return items
      .map((line) => {
        const { productId, variantId } = lineIds(line)
        if (!productId || !variantId) return null
        const key = `${productId}:${variantId}`
        const quantity = Number(draftQty[key])
        if (!Number.isFinite(quantity) || quantity < 0) return null
        return { productId, variantId, quantity: Math.floor(quantity) }
      })
      .filter(Boolean)
  }, [items, draftQty])

  const hasChanges = useMemo(() => {
    return items.some((line) => {
      const { productId, variantId } = lineIds(line)
      const key = `${productId}:${variantId}`
      return Number(draftQty[key]) !== Number(line.quantity)
    })
  }, [items, draftQty])

  const busy = previewEdit.isPending || applyEdit.isPending || disabled

  const setQty = (key, next, maxQty) => {
    const v = Math.max(0, Math.min(maxQty, Math.floor(Number(next) || 0)))
    setDraftQty((prev) => ({ ...prev, [key]: v }))
    setPreview(null)
  }

  const runPreview = async () => {
    setLocalMsg(null)
    setPreview(null)
    try {
      const res = await previewEdit.mutateAsync({ orderId, itemUpdates })
      setPreview(res?.data || res || null)
    } catch (e) {
      setLocalMsg({
        type: 'err',
        text: e?.data?.message || e?.message || 'Preview failed.',
      })
    }
  }

  const runApply = async () => {
    if (
      !window.confirm(
        'Apply these item changes? For prepaid orders, money is NOT refunded yet — after Confirm → Ship Now, final bill uses actual courier shipping and any excess is refunded. Balance due / COD will never increase. Customer is never asked for extra.'
      )
    ) {
      return
    }
    setLocalMsg(null)
    try {
      const res = await applyEdit.mutateAsync({ orderId, itemUpdates })
      const data = res?.data || res || {}
      setPreview(null)
      const deferred = Boolean(
        data.shippingSettlementDeferred ||
          data.refundDeferredUntilShipNow ||
          data.shipping?.shippingSettlementDeferred
      )
      setLocalMsg({
        type: data.refundWarning ? 'warn' : 'ok',
        text:
          res?.message ||
          (data.cancelledEmpty
            ? 'Order cancelled — no items left.'
            : deferred
              ? 'Items updated. Refund (if any) will run after Ship Now with actual shipping.'
              : 'Order updated successfully.'),
      })
      if (typeof onApplied === 'function') await onApplied(data)
    } catch (e) {
      setLocalMsg({
        type: 'err',
        text: e?.data?.message || e?.message || 'Update failed.',
      })
    }
  }

  if (!items.length) return null

  const displaySubtotal = preview?.after?.subtotal ?? order?.subtotal
  const displayDelivery = preview?.shipping?.customerDelivery ?? order?.deliveryCharges
  const displayTotal = preview?.after?.totalAmount ?? order?.totalAmount ?? order?.amountInr
  const displayDiscount = order?.discount
  const couponCode = order?.appliedCoupon?.code

  return (
    <section className="od-card od-card--pending-items">
      <div className="od-pending-items__head">
        <h3 className="od-card__title">Edit items before confirm</h3>
        <p className="od-pending-items__sub">
          Change quantity or remove a product, then Preview and Apply. Confirm the order only after stock looks
          correct.
        </p>
      </div>

      <div className="od-pending-items__list">
        {items.map((line, idx) => {
          const { productId, variantId } = lineIds(line)
          const key = `${productId}:${variantId}`
          const name = line?.productId?.name || line?.name || line?.productName || 'Product'
          const sku = line?.sku || line?.productCode || '—'
          const maxQty = Number(line.quantity) || 0
          const qty = draftQty[key] ?? maxQty
          const img = lineImage(line)
          const lineTotal = Number(line?.lineTotal ?? line?.priceSnapshot?.total ?? line?.price) || 0
          const removed = qty === 0
          return (
            <div
              key={key || idx}
              className={`od-pending-item${removed ? ' is-removed' : ''}`}
            >
              <div className="od-pending-item__thumb">
                {img ? <img src={img} alt="" /> : <Package size={22} />}
              </div>
              <div className="od-pending-item__info">
                <p className="od-pending-item__name">{name}</p>
                <p className="od-pending-item__sku">
                  SKU <span>{sku}</span>
                  {removed ? <span className="od-pending-item__removed">Will be removed</span> : null}
                </p>
              </div>
              <div className="od-pending-item__controls">
                <div className="od-qty">
                  <button
                    type="button"
                    disabled={busy || qty <= 0}
                    aria-label="Decrease quantity"
                    onClick={() => setQty(key, qty - 1, maxQty)}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={maxQty}
                    step={1}
                    disabled={busy}
                    value={qty}
                    onChange={(e) => setQty(key, e.target.value, maxQty)}
                  />
                  <button
                    type="button"
                    disabled={busy || qty >= maxQty}
                    aria-label="Increase quantity"
                    onClick={() => setQty(key, qty + 1, maxQty)}
                  >
                    +
                  </button>
                </div>
                <p className="od-pending-item__price">{formatInr(lineTotal)}</p>
                <button
                  type="button"
                  className="od-pending-item__delete"
                  disabled={busy || qty === 0}
                  title="Remove item"
                  aria-label="Remove item"
                  onClick={() => setQty(key, 0, maxQty)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="od-pending-items__totals">
        <div className="od-pending-items__row">
          <span>Subtotal</span>
          <span>{formatInr(displaySubtotal)}</span>
        </div>
        <div className="od-pending-items__row">
          <span>Shipping</span>
          <span>
            {Number(displayDelivery) === 0 ? (
              <span className="od-pending-items__free">FREE</span>
            ) : (
              formatInr(displayDelivery)
            )}
          </span>
        </div>
        {Number(displayDiscount) > 0 ? (
          <div className="od-pending-items__row od-pending-items__row--discount">
            <span>Discount{couponCode ? ` (${couponCode})` : ''}</span>
            <span>−{formatInr(displayDiscount)}</span>
          </div>
        ) : null}
        <div className="od-pending-items__row od-pending-items__row--total">
          <span>Total</span>
          <span>{formatInr(displayTotal)}</span>
        </div>
      </div>

      <div className="od-pending-items__actions">
        <button
          type="button"
          className="od-pending-items__btn od-pending-items__btn--secondary"
          disabled={busy || !hasChanges}
          onClick={runPreview}
        >
          {previewEdit.isPending ? 'Calculating…' : 'Preview totals'}
        </button>
        <button
          type="button"
          className="od-pending-items__btn od-pending-items__btn--primary"
          disabled={busy || !hasChanges}
          onClick={runApply}
        >
          {applyEdit.isPending ? 'Applying…' : 'Apply changes'}
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
          {preview.cancelledEmpty ? (
            <p className="od-pending-items__preview-warn">
              All items removed → order will be cancelled. Refund: {formatInr(preview.refundInr)}
            </p>
          ) : (
            <div className="od-pending-items__preview-grid">
              <div>
                <p className="od-field-label">New subtotal</p>
                <p className="od-field-value">{formatInr(preview.after?.subtotal)}</p>
              </div>
              <div>
                <p className="od-field-label">Shipping (on bill now)</p>
                <p className="od-field-value">{formatInr(preview.shipping?.customerDelivery)}</p>
              </div>
              <div>
                <p className="od-field-label">New total</p>
                <p className="od-field-value">{formatInr(preview.after?.totalAmount)}</p>
              </div>
              <div>
                <p className="od-field-label">Refund now / COD due</p>
                <p className="od-field-value">
                  Refund {formatInr(preview.refundInr)} · Due {formatInr(preview.after?.balanceDueInr)}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}

export default AdminPendingOrderEditPanel
