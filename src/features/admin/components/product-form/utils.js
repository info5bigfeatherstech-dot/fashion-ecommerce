import {
  emptyMarketingTagsState,
  marketingTagsFromProductTags,
} from '@/features/admin/constants/productMarketingTags'

export const MAX_VARIANT_IMAGES = 10

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

export const SUFFIXED_PRODUCT_CODE_REGEX = /^([A-Z0-9_-]+)-(\d+)$/

/** Extract the base code (stripping trailing -N if present). */
export function getBaseProductCode(rawCode) {
  const code = String(rawCode || '').trim().toUpperCase()
  if (!code) return ''
  const match = code.match(SUFFIXED_PRODUCT_CODE_REGEX)
  if (match) {
    return match[1]
  }
  return code
}

/** Get the base product code from formData (from ProductCode, productCode, or existing variants). */
export function getFormDataProductBase(formData) {
  const main = formData?.ProductCode || formData?.productCode
  if (main && String(main).trim()) {
    return getBaseProductCode(main)
  }

  const variants = Array.isArray(formData?.variants) ? formData.variants : []
  for (const v of variants) {
    const code = v?.ProductCode || v?.productCode
    if (code && String(code).trim()) {
      return getBaseProductCode(code)
    }
  }

  return ''
}

/** Next unused BASE-N for "Add Variant" (788-1 → 788-2 → 788-3, or 788 → 788-2 → 788-3). */
export function nextVariantProductCode(formData) {
  const base = getFormDataProductBase(formData)
  if (!base) return ''

  // Collect all sequence numbers already used for this base
  const usedSeqs = new Set()

  // 1. Check main product code
  const mainRaw = String(formData?.ProductCode || formData?.productCode || '').trim().toUpperCase()
  if (mainRaw) {
    const mainMatch = mainRaw.match(SUFFIXED_PRODUCT_CODE_REGEX)
    if (mainMatch && mainMatch[1] === base) {
      usedSeqs.add(parseInt(mainMatch[2], 10))
    } else {
      // Main product without suffix counts as seq 1 (main product will be saved as base-1)
      usedSeqs.add(1)
    }
  } else {
    usedSeqs.add(1)
  }

  // 2. Check all existing variants
  const variants = Array.isArray(formData?.variants) ? formData.variants : []
  for (const v of variants) {
    const raw = String(v?.ProductCode || v?.productCode || '').trim().toUpperCase()
    if (!raw) continue
    const match = raw.match(SUFFIXED_PRODUCT_CODE_REGEX)
    if (match && match[1] === base) {
      usedSeqs.add(parseInt(match[2], 10))
    }
  }

  // Find next unused sequence number starting from 2 (sequence 1 is the main product)
  let nextSeq = 2
  while (usedSeqs.has(nextSeq)) {
    nextSeq += 1
  }

  return `${base}-${nextSeq}`
}

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
    // quantity '' = empty UI; API normalize → 0 if left blank
    inventory: { quantity: '', lowStockThreshold: 0, trackInventory: true },
    images: [],
    variants: [],
    attributes: [
      { id: 'attr-default-color', key: 'Color', value: '' },
      { id: 'attr-default-plating', key: 'Plating', value: '' },
    ],
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
    marketingTags: emptyMarketingTagsState(),
    status: 'active',
  }
}

/**
 * Controlled quantity input display value.
 * Empty string while cleared / create default — avoids sticky leading "0" → "01".
 */
export function quantityFieldValue(qty) {
  if (qty === '' || qty === null || qty === undefined) return ''
  return qty
}

/**
 * Parse quantity while typing. Allows empty; rejects negatives/NaN.
 * @returns {number|''}
 */
export function parseQuantityInput(raw) {
  if (raw === '' || raw == null) return ''
  const n = Number.parseInt(String(raw), 10)
  if (!Number.isFinite(n) || n < 0) return ''
  return n
}

/** Submit/API: blank → 0, invalid → 0, else non-negative int. */
export function normalizeQuantity(qty) {
  if (qty === '' || qty == null) return 0
  const n = Number.parseInt(String(qty), 10)
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

/** Normalize API variants into the edit-form shape used by ProductFormBody. */
export function normaliseVariantsForEdit(variants = []) {
  return variants.map((v, vIdx) => ({
    ...v,
    productCode: v.productCode ?? v.ProductCode ?? '',
    ProductCode: v.ProductCode ?? v.productCode ?? '',
    price: {
      base: v.price?.base ?? '',
      sale: v.price?.sale ?? '',
      wholesaleBase: v.price?.wholesaleBase ?? '',
      wholesaleSale: v.price?.wholesaleSale ?? '',
    },
    inventory: {
      quantity: v.inventory?.quantity ?? 0,
      lowStockThreshold: v.inventory?.lowStockThreshold ?? 0,
      trackInventory: v.inventory?.trackInventory !== false,
    },
    attributes: (v.attributes || []).map((a, i) => ({
      key: a.key || '',
      value: a.value || '',
      hex: a.hex || '',
      id: a.id ?? a._id ?? `var-${vIdx}-attr-${i}`,
    })),
    images: (v.images || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((img, iIdx) => ({
        ...img,
        id: img._id || img.publicId || img.url || `var-${vIdx}-img-${iIdx}`,
        isMain: iIdx === 0 ? true : Boolean(img.isMain),
      })),
    isActive:
      v.channelVisibility?.ecomm != null
        ? v.channelVisibility.ecomm === 'active'
        : v.isActive !== false,
    wholesale: Boolean(v.wholesale),
    minimumOrderQuantity: v.minimumOrderQuantity || 1,
    channelVisibility: v.channelVisibility || { ecomm: 'active', wholesale: 'draft' },
    title: v.title || '',
    description: v.description || '',
    shipping: v.shipping || undefined,
  }))
}

/** Map a product API object into ProductFormBody edit state. */
export function productToEditForm(product) {
  if (!product) return emptyProductForm()
  const variants = normaliseVariantsForEdit(product.variants || [])
  const main = variants[0] || {}
  const categoryId =
    typeof product.category === 'object' && product.category !== null
      ? (product.category._id || product.category.id || '')
      : (product.category || '')

  return {
    ...emptyProductForm(),
    name: product.name || '',
    title: product.title || '',
    description: product.description || '',
    brand: product.brand || 'Generic',
    category: categoryId,
    hsnCode: product.hsnCode || '',
    taxRate: product.gstRate ?? product.taxRate ?? '',
    isFragile: Boolean(product.isFragile),
    shipping: {
      weight: product.shipping?.weight ?? '',
      dimensions: {
        length: product.shipping?.dimensions?.length ?? '',
        width: product.shipping?.dimensions?.width ?? '',
        height: product.shipping?.dimensions?.height ?? '',
      },
    },
    soldInfo: product.soldInfo || { enabled: false, count: 0 },
    fomo: product.fomo || {
      enabled: false,
      type: 'viewing_now',
      viewingNow: 0,
      productLeft: 0,
      customMessage: '',
    },
    images: (product.images || []).map((img, i) => ({
      ...img,
      id: img._id || img.publicId || img.url || `main-img-${i}`,
      isMain: img.isMain || i === 0,
    })),
    attributes: (product.attributes || main.attributes || []).map((a, i) => ({
      ...a,
      id: a.id ?? a._id ?? `attr-${i}`,
    })),
    variants,
    isFeatured: Boolean(product.isFeatured),
    marketingTags: marketingTagsFromProductTags(product.tags),
    status: product.status || 'draft',
    ProductCode: String(main.productCode || main.ProductCode || ''),
    price: {
      base: main.price?.base ?? '',
      sale: main.price?.sale ?? '',
    },
    inventory: {
      quantity: main.inventory?.quantity ?? 0,
      lowStockThreshold: main.inventory?.lowStockThreshold ?? 0,
      trackInventory: main.inventory?.trackInventory !== false,
    },
    wholesale: Boolean(main.wholesale),
    wholesaleBase: main.price?.wholesaleBase ?? '',
    wholesaleSale: main.price?.wholesaleSale ?? '',
    minimumOrderQuantity: main.minimumOrderQuantity || 1,
  }
}

export function validateCreateProductForm(formData) {
  if (!formData.name?.trim()) throw new Error('Product name is required')
  if (!formData.title?.trim()) throw new Error('Product title is required')
  if (!formData.category) throw new Error('Please select a category')

  let bc0 = String(formData.ProductCode ?? '').trim()
  if (!bc0) throw new Error('Main ProductCode is required')
  if (!/-\d+$/.test(bc0) && /^[A-Za-z0-9_-]+$/.test(bc0)) {
    bc0 = `${bc0}-1`
    formData.ProductCode = bc0
  }
  const m0 = bc0.toUpperCase().match(SUFFIXED_PRODUCT_CODE_REGEX)
  const s0 = m0 ? Number(m0[2]) : NaN
  if (!m0 || !Number.isInteger(s0) || s0 < 1) {
    throw new Error('Main ProductCode must be BASE-N (e.g., 3897-1 or 3897-01)')
  }

  if (!formData.price?.base || Number.isNaN(Number(formData.price.base))) {
    throw new Error('Main variant base price is required')
  }

  for (let i = 0; i < (formData.variants || []).length; i++) {
    let bc = String(formData.variants[i].ProductCode ?? '').trim()
    if (!bc) throw new Error(`Variant ${i + 1}: ProductCode is required`)
    if (!/-\d+$/.test(bc) && /^[A-Za-z0-9_-]+$/.test(bc)) {
      bc = `${bc}-${i + 2}`
      formData.variants[i].ProductCode = bc
    }
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
