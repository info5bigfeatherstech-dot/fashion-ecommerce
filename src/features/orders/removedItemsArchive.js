/**
 * Helpers for order.removedItemsArchive (admin OOS / qty cuts before confirm).
 * Backend already persists these; storefront only needs safe display.
 */

function isArchiveRow(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

/** @returns {Array<object>} */
export function getRemovedItemsArchive(order = {}) {
  try {
    const raw = order?.removedItemsArchive
    if (!Array.isArray(raw)) return []
    return raw.filter(isArchiveRow)
  } catch {
    return []
  }
}

export function getRemovedArchiveName(row = {}) {
  try {
    return (
      String(row.productName || row.name || row.title || '').trim()
      || row?.productId?.name
      || 'Product'
    )
  } catch {
    return 'Product'
  }
}

export function getRemovedArchiveQty(row = {}) {
  const qty = Number(row?.quantity)
  return Number.isFinite(qty) && qty > 0 ? qty : 0
}

export function getRemovedArchiveLineTotal(row = {}) {
  try {
    if (row?.lineTotal != null && Number.isFinite(Number(row.lineTotal))) {
      return Number(row.lineTotal)
    }
    const snapTotal = Number(row?.priceSnapshot?.total)
    if (Number.isFinite(snapTotal)) return snapTotal
    const unit = Number(
      row?.priceSnapshot?.sale ?? row?.priceSnapshot?.base ?? row?.price ?? 0
    )
    const qty = getRemovedArchiveQty(row)
    if (Number.isFinite(unit) && qty > 0) return unit * qty
    return 0
  } catch {
    return 0
  }
}

export function getRemovedArchiveUnitPrice(row = {}) {
  try {
    const sale = Number(row?.priceSnapshot?.sale)
    if (Number.isFinite(sale)) return sale
    const base = Number(row?.priceSnapshot?.base)
    if (Number.isFinite(base)) return base
    const qty = getRemovedArchiveQty(row)
    const total = getRemovedArchiveLineTotal(row)
    if (qty > 0 && total > 0) return total / qty
    return null
  } catch {
    return null
  }
}

export function getRemovedArchiveBadge(row = {}) {
  const reason = String(row?.reason || '').toLowerCase()
  if (reason === 'qty_reduced') return 'Qty reduced'
  if (reason === 'order_cancelled_empty') return 'Removed — order cancelled'
  return 'Removed — unavailable'
}

export function getRemovedArchiveSku(row = {}) {
  const sku = String(row?.sku || row?.productCode || '').trim()
  return sku || null
}
