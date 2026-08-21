function asArray(value) {
  return Array.isArray(value) ? value : []
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function mapCoupon(raw) {
  if (!raw) return null

  const code = raw.couponCode || raw.code || raw.name
  if (!code) return null

  return {
    id: raw._id || raw.id || code,
    code: String(code).toUpperCase(),
    title: raw.title || raw.description || raw.code || code,
    description: raw.description || raw.message || '',
    discountType: raw.discountType || raw.type || null,
    discountValue: toNumber(raw.discountValue ?? raw.value, 0),
    minOrderAmount: toNumber(raw.minOrderAmount ?? raw.minCartValue, 0),
    isActive: raw.isActive !== false,
  }
}

export function mapAvailableCoupons(payload) {
  const candidates = [
    payload?.coupons,
    payload?.data?.coupons,
    payload?.data,
    payload?.items,
    payload,
  ]

  let list = []
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      list = candidate
      break
    }
  }

  return asArray(list).map(mapCoupon).filter(Boolean)
}

export function mapCouponValidation(payload) {
  const raw = payload?.data && typeof payload.data === 'object' && !('valid' in payload)
    ? payload.data
    : payload

  const valid = Boolean(
    raw?.valid
    ?? raw?.isValid
    ?? (raw?.success && (raw?.discountAmount != null || raw?.discount != null))
  )

  return {
    valid,
    couponCode: String(raw?.couponCode || raw?.code || '').toUpperCase() || null,
    discountAmount: toNumber(raw?.discountAmount ?? raw?.discount, 0),
    message: raw?.message || (valid ? 'Coupon applied' : 'Invalid coupon'),
    discountType: raw?.discountType || null,
    freeShipping: Boolean(raw?.freeShipping),
  }
}
