function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function mapCheckoutSettings(payload) {
  const raw = payload?.data && typeof payload.data === 'object' ? payload.data : payload

  return {
    storefront: raw?.storefront || 'ecomm',
    codEnabled: raw?.codEnabled !== false,
    partialPaymentEnabled: Boolean(raw?.partialPaymentEnabled),
    partialPaymentPercent: Math.min(100, Math.max(0, toNumber(raw?.partialPaymentPercent, 0))),
  }
}
