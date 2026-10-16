/**
 * Display helpers for Order.shippingWeightSnapshot (checkout-frozen package + per-line kg).
 * Volumetric: (L × B × H cm) / 5000 → kg. Safe when snapshot / fields are missing.
 */

const DIM_WEIGHT_DIVISOR = 5000

export function formatKg(kg) {
  const n = Number(kg)
  if (!Number.isFinite(n)) return null
  return `${n.toFixed(2)} kg`
}

export function formatPackageDims(dims) {
  if (!dims || typeof dims !== 'object') return null
  const l = Number(dims.lengthCm ?? dims.length)
  const w = Number(dims.widthCm ?? dims.width)
  const h = Number(dims.heightCm ?? dims.height)
  if (![l, w, h].every((x) => Number.isFinite(x) && x > 0)) return null
  return `${l} × ${w} × ${h} cm`
}

export function dimWeightKgFromDims(dims) {
  if (!dims || typeof dims !== 'object') return null
  const l = Number(dims.lengthCm ?? dims.length)
  const w = Number(dims.widthCm ?? dims.width)
  const h = Number(dims.heightCm ?? dims.height)
  if (![l, w, h].every((x) => Number.isFinite(x) && x > 0)) return null
  return Math.round(((l * w * h) / DIM_WEIGHT_DIVISOR) * 100) / 100
}

/** Prefer shippingWeightSnapshot; tolerate legacy aliases if API ever sends them. */
export function getShippingWeightSnapshot(order) {
  if (!order || typeof order !== 'object') return null
  return (
    order.shippingWeightSnapshot ||
    order.packageWeightSnapshot ||
    order.weightSnapshot ||
    null
  )
}

export function buildWeightByVariantId(weightSnap) {
  const map = new Map()
  for (const row of weightSnap?.lines || []) {
    if (row?.variantId != null) map.set(String(row.variantId), row)
  }
  return map
}

function variantKeyFromLine(line) {
  const v = line?.variantId
  if (v == null) return ''
  return String(v?._id || v)
}

/**
 * @param {object} line — order item
 * @param {Map<string, object>} weightByVariantId
 * @param {number} [displayQty] — draft qty (pending edit); defaults to line.quantity
 */
export function resolveLineShippingWeightMeta(line, weightByVariantId, displayQty) {
  const key = variantKeyFromLine(line)
  const weightRow = key && weightByVariantId instanceof Map ? weightByVariantId.get(key) : null
  if (!weightRow) {
    return {
      weightRow: null,
      dimsLabel: null,
      lineWeightKg: null,
      lineDimWeightKg: null,
      metaParts: [],
      metaSegments: [],
    }
  }

  const qty = Math.max(0, Number(displayQty ?? line?.quantity) || 0)
  const snapQty = Math.max(0, Number(weightRow.quantity) || 0)
  const unitWeightKg =
    weightRow.unitWeightKg != null
      ? Number(weightRow.unitWeightKg)
      : snapQty > 0 && weightRow.lineWeightKg != null
        ? Number(weightRow.lineWeightKg) / snapQty
        : null

  let lineWeightKg = null
  if (unitWeightKg != null && Number.isFinite(unitWeightKg)) {
    lineWeightKg = Math.round(unitWeightKg * qty * 100) / 100
  } else if (weightRow.lineWeightKg != null && snapQty > 0) {
    lineWeightKg = Math.round((Number(weightRow.lineWeightKg) * qty) / snapQty * 100) / 100
  } else if (weightRow.lineWeightKg != null && qty === snapQty) {
    lineWeightKg = Number(weightRow.lineWeightKg)
  }

  const dimsLabel = formatPackageDims(weightRow)
  const unitDimWeightKg =
    weightRow.unitDimWeightKg != null
      ? Number(weightRow.unitDimWeightKg)
      : dimWeightKgFromDims(weightRow)

  let lineDimWeightKg = null
  if (weightRow.lineDimWeightKg != null && snapQty > 0 && qty !== snapQty) {
    lineDimWeightKg = Math.round((Number(weightRow.lineDimWeightKg) * qty) / snapQty * 100) / 100
  } else if (weightRow.lineDimWeightKg != null && (qty === snapQty || snapQty === 0)) {
    lineDimWeightKg = Number(weightRow.lineDimWeightKg)
  } else if (unitDimWeightKg != null && Number.isFinite(unitDimWeightKg)) {
    lineDimWeightKg = Math.round(unitDimWeightKg * qty * 100) / 100
  }

  /** @type {Array<{ label: string|null, value: string }>} */
  const metaSegments = []
  const dead = formatKg(lineWeightKg)
  if (dead) metaSegments.push({ label: 'Wt', value: dead })
  if (dimsLabel) metaSegments.push({ label: null, value: dimsLabel })
  // Hide near-zero volumetric (tiny jewellery dims often round to 0.00 kg)
  if (lineDimWeightKg != null && Number.isFinite(lineDimWeightKg) && lineDimWeightKg >= 0.01) {
    const dim = formatKg(lineDimWeightKg)
    if (dim) metaSegments.push({ label: 'Vol', value: dim })
  }

  const metaParts = metaSegments.map((s) => (s.label ? `${s.label} ${s.value}` : s.value))

  return {
    weightRow,
    dimsLabel,
    lineWeightKg,
    lineDimWeightKg,
    metaParts,
    metaSegments,
  }
}

export function resolvePackageShippingWeightMeta(order) {
  const weightSnap = getShippingWeightSnapshot(order)
  if (!weightSnap || typeof weightSnap !== 'object') {
    return {
      weightSnap: null,
      weightLabel: null,
      dimsLabel: null,
      dimWeightLabel: null,
      catalogFallback: false,
      headerParts: [],
      headerSegments: [],
    }
  }

  const dims =
    weightSnap.dims || weightSnap.packageDims || weightSnap.dimensions || order?.packageDimensions
  const weightLabel = formatKg(
    weightSnap.totalWeightKg ?? order?.totalWeightKg
  )
  const dimsLabel = formatPackageDims(dims)
  const packageDimKg =
    weightSnap.totalDimWeightKg != null
      ? Number(weightSnap.totalDimWeightKg)
      : dimWeightKgFromDims(dims)
  const dimWeightLabel = formatKg(packageDimKg)
  const catalogFallback = String(weightSnap.source || '') === 'catalog_fallback'

  /** @type {Array<{ label: string|null, value: string }>} */
  const headerSegments = []
  if (weightLabel) headerSegments.push({ label: 'Wt', value: weightLabel })
  if (dimsLabel) headerSegments.push({ label: null, value: dimsLabel })
  if (
    packageDimKg != null &&
    Number.isFinite(packageDimKg) &&
    packageDimKg >= 0.01 &&
    dimWeightLabel
  ) {
    headerSegments.push({ label: 'Vol', value: dimWeightLabel })
  }

  const headerParts = headerSegments.map((s) => (s.label ? `${s.label} ${s.value}` : s.value))

  return {
    weightSnap,
    weightLabel,
    dimsLabel,
    dimWeightLabel,
    catalogFallback,
    headerParts,
    headerSegments,
  }
}
