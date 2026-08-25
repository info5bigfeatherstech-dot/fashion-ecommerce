/** Keep rules aligned with backend courier street limits. */

export const MAX_COURIER_COMBINED_STREET_CHARS = 190

function trim(value) {
  if (value == null) return ''
  return String(value).trim()
}

export function buildCourierStreetLines(addr = {}) {
  const line1 = [addr.houseNumber, addr.building, addr.floor, addr.addressLine1]
    .map(trim)
    .filter(Boolean)
    .join(', ')
  const line2 = [addr.addressLine2, addr.area, addr.landmark]
    .map(trim)
    .filter(Boolean)
    .join(', ')
  return {
    line1,
    line2,
    combinedLength: line1.length + line2.length,
  }
}

export function getCourierStreetUsage(addr = {}) {
  const { combinedLength } = buildCourierStreetLines(addr)
  const max = MAX_COURIER_COMBINED_STREET_CHARS
  return {
    combinedLength,
    max,
    remaining: Math.max(0, max - combinedLength),
    overLimit: combinedLength > max,
  }
}

export function validateCourierStreetClient(addr = {}) {
  const usage = getCourierStreetUsage(addr)
  if (usage.overLimit) {
    return `Address too long for courier (${usage.combinedLength}/${usage.max}). Shorten street details.`
  }
  return null
}
