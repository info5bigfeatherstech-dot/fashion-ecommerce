function joinParts(parts) {
  return parts
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ')
}

/** Courier street composition used by the backend validation rule. */
export function buildCourierLines(fields = {}) {
  const line1 = joinParts([
    fields.houseNumber,
    fields.building,
    fields.floor,
    fields.addressLine1,
  ])
  const line2 = joinParts([
    fields.addressLine2,
    fields.area,
    fields.landmark,
  ])
  return { line1, line2, combinedLength: line1.length + line2.length }
}

export function formatAddressLines(address = {}) {
  const { line1, line2 } = buildCourierLines(address)
  const cityLine = joinParts([
    address.city,
    address.state,
    address.postalCode || address.zip,
  ])
  return {
    line1,
    line2,
    cityLine,
    fullAddress: joinParts([line1, line2, cityLine, address.country]),
  }
}

export function mapAddress(raw) {
  if (!raw) return null

  const mapped = {
    id: raw._id || raw.id,
    userId: raw.userId || null,
    storefront: raw.storefront || 'ecomm',
    fullName: raw.fullName || '',
    phone: raw.phone || '',
    houseNumber: raw.houseNumber || '',
    building: raw.building || '',
    floor: raw.floor || '',
    area: raw.area || '',
    landmark: raw.landmark || '',
    addressLine1: raw.addressLine1 || '',
    addressLine2: raw.addressLine2 || '',
    city: raw.city || '',
    state: raw.state || '',
    postalCode: raw.postalCode || '',
    zip: raw.postalCode || raw.zip || '',
    country: raw.country || 'India',
    addressType: raw.addressType || 'home',
    isGift: Boolean(raw.isGift),
    deliveryInstructions: raw.deliveryInstructions || '',
    isDefault: Boolean(raw.isDefault),
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  }

  const display = formatAddressLines(mapped)
  return {
    ...mapped,
    fullAddress: display.fullAddress || display.line1,
    displayLine1: display.line1,
    displayLine2: display.line2,
  }
}

export function toAddressPayload(form = {}) {
  const phoneDigits = String(form.phone || '').replace(/\D/g, '')

  return {
    fullName: String(form.fullName || '').trim(),
    phone: phoneDigits,
    houseNumber: String(form.houseNumber || '').trim(),
    building: String(form.building || '').trim() || undefined,
    floor: String(form.floor || '').trim() || undefined,
    area: String(form.area || '').trim(),
    landmark: String(form.landmark || '').trim() || undefined,
    addressLine1: String(form.addressLine1 || '').trim(),
    addressLine2: String(form.addressLine2 || '').trim() || undefined,
    city: String(form.city || '').trim(),
    state: String(form.state || '').trim(),
    postalCode: String(form.postalCode || form.zip || '').trim(),
    country: String(form.country || 'India').trim() || 'India',
    addressType: form.addressType || 'home',
    isDefault: Boolean(form.isDefault),
    isGift: Boolean(form.isGift),
    deliveryInstructions: String(form.deliveryInstructions || '').trim() || undefined,
  }
}

export function applyFieldErrors(error, setError) {
  const fieldErrors = error?.details?.errors
  if (!Array.isArray(fieldErrors) || !setError) return false

  let applied = false
  for (const item of fieldErrors) {
    const field = item?.field
    if (!field) continue
    setError(field, {
      type: 'server',
      message: item.message || 'Invalid value',
    })
    applied = true
  }
  return applied
}
