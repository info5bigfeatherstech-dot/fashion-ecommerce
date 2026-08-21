function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function mapDeliveryCheck(payload) {
  const raw = payload?.data && typeof payload.data === 'object' && !('isDeliverable' in payload)
    ? payload.data
    : payload

  return {
    isDeliverable: Boolean(raw?.isDeliverable ?? raw?.deliverable),
    estimatedDays: raw?.estimatedDays || raw?.eta || null,
    courierName: raw?.courierName || raw?.courier || null,
    message: raw?.message || '',
    pincode: String(raw?.pincode || ''),
    shippingProvider: raw?.shippingProvider || null,
    success: raw?.success !== false,
  }
}

export function mapDeliveryCharges(payload, pincode) {
  const raw = payload?.data && typeof payload.data === 'object' ? payload.data : payload

  return {
    pincode: String(raw?.pincode || pincode || ''),
    weight: toNumber(raw?.weight, 0),
    charge: toNumber(raw?.charge ?? raw?.shippingCharge ?? raw?.amount, 0),
    currency: raw?.currency || 'INR',
    message: raw?.message || '',
  }
}
