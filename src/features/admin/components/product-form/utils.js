export const formatIndianRupee = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

export const getDiscountPercentage = (base, sale) => {
  if (!base || !sale || Number(sale) >= Number(base)) return 0
  return Math.round(((Number(base) - Number(sale)) / Number(base)) * 100)
}

export const SUFFIXED_PRODUCT_CODE_REGEX = /^([A-Z0-9]+)-(\d+)$/

export function validateProductCodeSeries(rawCodes, contextLabel = 'variants') {
  const normalized = (rawCodes || []).map((c) => String(c || '').trim().toUpperCase()).filter(Boolean)
  if (!normalized.length) {
    throw new Error(`At least one ProductCode is required for ${contextLabel}`)
  }

  const parsed = normalized.map((code, idx) => {
    const match = code.match(SUFFIXED_PRODUCT_CODE_REGEX)
    if (!match) {
      throw new Error(`${contextLabel}[${idx + 1}] ProductCode must be BASE-N (e.g., 3897-1 or 3897-01)`)
    }
    const seq = Number(match[2])
    if (!Number.isInteger(seq) || seq < 1) {
      throw new Error(`${contextLabel}[${idx + 1}] ProductCode suffix must be a whole number ≥ 1`)
    }
    return { code: `${match[1]}-${seq}`, base: match[1], sequence: seq }
  })

  const base = parsed[0].base
  const seenCodes = new Set()
  const seenSeq = new Set()

  for (const entry of parsed) {
    if (entry.base !== base) {
      throw new Error(`All ProductCodes must share same base. Expected ${base}-N, got ${entry.code}`)
    }
    if (seenCodes.has(entry.code)) {
      throw new Error(`Duplicate ProductCode found: ${entry.code}`)
    }
    seenCodes.add(entry.code)
    seenSeq.add(entry.sequence)
  }

  for (let expected = 1; expected <= parsed.length; expected++) {
    if (!seenSeq.has(expected)) {
      throw new Error(`ProductCode sequence must be continuous: missing ${base}-${expected}`)
    }
  }
}

export function emptyProductForm() {
  return {
    name: '',
    title: '',
    description: '',
    brand: 'Generic',
    category: '',
    ProductCode: '',
    price: { base: '', sale: '' },
    inventory: { quantity: 0, lowStockThreshold: 5, trackInventory: true },
    images: [],
    variants: [],
    attributes: [],
    hsnCode: '',
    taxRate: '',
    isFragile: false,
    shipping: { weight: '', dimensions: { length: '', width: '', height: '' } },
    wholesale: false,
    wholesaleBase: '',
    wholesaleSale: '',
    minimumOrderQuantity: 1,
    soldInfo: { enabled: false, count: 0 },
    fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
    isFeatured: false,
    status: 'draft',
  }
}

export function validateCreateProductForm(formData) {
  if (!formData.name?.trim()) throw new Error('Product name is required')
  if (!formData.title?.trim()) throw new Error('Product title is required')
  if (!formData.category) throw new Error('Please select a category')

  const bc0 = String(formData.ProductCode ?? '').trim()
  if (!bc0) throw new Error('Main ProductCode is required')
  const m0 = bc0.toUpperCase().match(SUFFIXED_PRODUCT_CODE_REGEX)
  const s0 = m0 ? Number(m0[2]) : NaN
  if (!m0 || !Number.isInteger(s0) || s0 < 1) {
    throw new Error('Main ProductCode must be BASE-N (e.g., 3897-1 or 3897-01)')
  }

  if (!formData.price?.base || Number.isNaN(Number(formData.price.base))) {
    throw new Error('Main variant base price is required')
  }

  for (let i = 0; i < (formData.variants || []).length; i++) {
    const bc = String(formData.variants[i].ProductCode ?? '').trim()
    if (!bc) throw new Error(`Variant ${i + 1}: ProductCode is required`)
    const mv = bc.toUpperCase().match(SUFFIXED_PRODUCT_CODE_REGEX)
    const sv = mv ? Number(mv[2]) : NaN
    if (!mv || !Number.isInteger(sv) || sv < 1) {
      throw new Error(`Variant ${i + 1}: ProductCode must be BASE-N (e.g., 3897-1 or 3897-01)`)
    }
    if (!formData.variants[i].price?.base || Number.isNaN(Number(formData.variants[i].price.base))) {
      throw new Error(`Variant ${i + 1}: base price is required`)
    }
  }

  const allBarcodes = [bc0, ...(formData.variants || []).map((v) => String(v.ProductCode).trim())]
  if (new Set(allBarcodes).size !== allBarcodes.length) {
    throw new Error('Duplicate barcodes found — each variant must have a unique ProductCode')
  }
  validateProductCodeSeries(allBarcodes, 'create product variants')
}
