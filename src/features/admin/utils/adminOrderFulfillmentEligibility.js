/**
 * Admin list + bulk actions — keep in sync with backend shipment ops `actionPolicy`.
 * List rows expose `actionCapabilities` from GET /admin/orders; prefer those over heuristics.
 */

function rowActionEnabled(row, key) {
  const caps = row?.actionCapabilities
  if (caps && typeof caps === 'object' && key in caps) {
    return caps[key] === true
  }
  return null
}

export function isAdminOrderRowPending(row) {
  return String(row?.orderStatus || '').toLowerCase() === 'pending'
}

/** Bulk confirm: pending and server-evaluated payment gate. */
export function canAdminBulkConfirmOrderRow(row) {
  if (!isAdminOrderRowPending(row)) return false
  return row?.canConfirmForFulfillment === true
}

/** Bulk cancel: any pending order (payment not required). */
export function canAdminBulkCancelOrderRow(row) {
  return isAdminOrderRowPending(row)
}

export function canAdminBulkShipNowOrderRow(row) {
  if (!row) return false
  const fromCaps = rowActionEnabled(row, 'shipNow')
  if (fromCaps != null) return fromCaps
  const st = String(row.orderStatus || '').toLowerCase()
  return st === 'confirmed' && !row.hasAwb
}

export function canAdminBulkSchedulePickupOrderRow(row) {
  if (!row) return false
  const fromCaps = rowActionEnabled(row, 'schedulePickup')
  if (fromCaps != null) return fromCaps
  const st = String(row.orderStatus || '').toLowerCase()
  return (st === 'confirmed' || st === 'processing') && row.hasAwb && !row.pickupScheduled
}

function isRowRtoBlocked(row) {
  const st = String(row?.orderStatus || '').toLowerCase()
  if (st === 'rto') return true
  const ps = String(row?.providerStatus || row?.shipmentInfo?.providerStatus || '')
  return /\brto\b/i.test(ps) || /return to origin/i.test(ps)
}

function isRowMoneyCaptured(row) {
  const pay = String(row?.paymentStatus || '').toLowerCase()
  return (pay === 'paid' || pay === 'partially_paid') && Number(row?.amountPaidInr || 0) > 0.01
}

function isRowUnpaidTerminalBlocked(row) {
  const st = String(row?.orderStatus || '').toLowerCase()
  if (st !== 'cancelled' && st !== 'payment_failed') return false
  return !isRowMoneyCaptured(row)
}

export function canAdminBulkDownloadManifestOrderRow(row) {
  if (!row) return false
  if (isRowUnpaidTerminalBlocked(row) || isRowRtoBlocked(row)) return false
  const fromCaps = rowActionEnabled(row, 'downloadManifest')
  if (fromCaps != null) return fromCaps
  return Boolean(row.hasShipmentId && row.hasAwb)
}

export function canAdminBulkDownloadLabelOrderRow(row) {
  if (!row) return false
  if (isRowUnpaidTerminalBlocked(row) || isRowRtoBlocked(row)) return false
  const fromCaps = rowActionEnabled(row, 'downloadLabel')
  if (fromCaps != null) return fromCaps
  return Boolean(row.hasShipmentId && row.hasAwb)
}

export function canAdminBulkSyncShiprocketOrderRow(row) {
  if (!row) return false
  if (isRowUnpaidTerminalBlocked(row) || isRowRtoBlocked(row)) return false
  const fromCaps = rowActionEnabled(row, 'syncShiprocket')
  if (fromCaps === true) return true
  return Boolean(row.hasShiprocketOrderId || row.hasShipmentId || row.hasAwb)
}
