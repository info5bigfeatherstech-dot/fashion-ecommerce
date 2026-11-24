/**
 * Admin dual shipping display: locked checkout vs admin/courier re-quote.
 */

function asMoney(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.round(n * 100) / 100
}

/** Customer-billed shipping (checkout lock). */
export function resolveCheckoutDeliveryInr(order) {
  const locked = asMoney(order?.checkoutDeliveryCharges)
  if (locked != null) return locked
  const facing = asMoney(order?.customerFacing?.deliveryInr)
  if (facing != null) return facing
  return asMoney(order?.deliveryCharges) ?? 0
}

/** Admin / actual courier quote when known. */
export function resolveAdminQuotedDeliveryInr(order) {
  const quoted = asMoney(order?.adminQuotedDeliveryInr)
  if (quoted != null) return quoted
  const freight = asMoney(order?.shippingSnapshot?.freightInr)
  if (freight != null) return freight
  return null
}

export function resolveAdminShippingDeltaInr(order) {
  const explicit = asMoney(order?.adminShippingDeltaInr)
  if (explicit != null) return explicit
  const quoted = resolveAdminQuotedDeliveryInr(order)
  if (quoted == null) return null
  return Math.round((quoted - resolveCheckoutDeliveryInr(order)) * 100) / 100
}
