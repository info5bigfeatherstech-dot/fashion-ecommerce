function asArray(value) {
  return Array.isArray(value) ? value : []
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value == null) continue
    const text = String(value).trim()
    if (text) return text
  }
  return ''
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
    minOrderAmount: toNumber(raw.minOrderAmount ?? raw.minOrderValue ?? raw.minCartValue, 0),
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

function emptyValidation(message = 'Invalid coupon') {
  return {
    valid: false,
    code: null,
    couponCode: null,
    discountAmount: 0,
    discountType: null,
    discountValue: 0,
    maxDiscountAmount: null,
    minOrderAmount: 0,
    applicableProducts: null,
    applicableCategories: null,
    message,
    freeShipping: false,
    raw: null,
  }
}

/**
 * Backend validate returns:
 * { success, valid, coupon: { code, discountType, discountValue, discountAmount, minOrderValue, ... } }
 * Flatten nested coupon so checkout/PDP calculators always see `code` + discount fields.
 */
export function mapCouponValidation(payload) {
  if (!isPlainObject(payload)) {
    return emptyValidation()
  }

  const data = isPlainObject(payload.data) ? payload.data : null
  const nestedCoupon =
    (isPlainObject(payload.coupon) && payload.coupon) ||
    (isPlainObject(data?.coupon) && data.coupon) ||
    null
  const src = nestedCoupon || data || payload

  const explicitlyInvalid =
    payload.success === false ||
    payload.valid === false ||
    payload.isValid === false ||
    data?.valid === false ||
    data?.isValid === false

  const valid = explicitlyInvalid
    ? false
    : Boolean(
        payload.valid ??
          payload.isValid ??
          data?.valid ??
          data?.isValid ??
          src.valid ??
          src.isValid ??
          (payload.success === true &&
            (nestedCoupon ||
              src.discountAmount != null ||
              src.discount != null ||
              src.discountType ||
              src.code ||
              src.couponCode))
      )

  const code = firstNonEmpty(
    src.couponCode,
    src.code,
    payload.couponCode,
    payload.code,
    data?.couponCode,
    data?.code
  ).toUpperCase() || null

  const applicable = src.applicableProducts || src.products || src.productIds || null
  const applicableCategories = src.applicableCategories || src.categories || null

  const maxRaw = src.maxDiscountAmount ?? payload.maxDiscountAmount ?? data?.maxDiscountAmount

  return {
    valid,
    code,
    couponCode: code,
    discountAmount: toNumber(src.discountAmount ?? src.discount ?? payload.discountAmount, 0),
    discountType: src.discountType || src.type || payload.discountType || null,
    discountValue: toNumber(src.discountValue ?? src.value ?? payload.discountValue, 0),
    maxDiscountAmount: maxRaw != null && maxRaw !== '' ? toNumber(maxRaw) : null,
    minOrderAmount: toNumber(
      src.minOrderAmount ??
        src.minOrderValue ??
        src.minCartValue ??
        payload.minOrderAmount ??
        payload.minOrderValue ??
        data?.minOrderValue,
      0
    ),
    applicableProducts: Array.isArray(applicable) ? applicable : null,
    applicableCategories: Array.isArray(applicableCategories) ? applicableCategories : null,
    message:
      firstNonEmpty(
        payload.message,
        data?.message,
        src.message,
        src.description
      ) || (valid ? 'Coupon applied' : 'Invalid coupon'),
    freeShipping: Boolean(src.freeShipping || payload.freeShipping || data?.freeShipping),
    raw: payload,
  }
}
