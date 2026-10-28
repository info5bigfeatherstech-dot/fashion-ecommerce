/** Admin UI copy — never call this "promo". */
export const ON_SALE_PRICE_LABEL = 'On-sale price'
export const ON_SALE_PRICE_HINT =
  'Shown as Sale price on the Sale tab. Optional until you add the product to On Sale. Must be less than Sale price.'
export const ON_SALE_PRICE_REQUIRED_MESSAGE =
  'On-sale price is missing. Add On-sale price (less than Sale price) on every variant, then add the product to On Sale.'

function toNum(raw) {
  if (raw === '' || raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : NaN
}

export function readOnSalePriceValue(price) {
  if (!price || typeof price !== 'object') return ''
  const raw = price.onSale ?? price.onSalePrice ?? price.promo
  return raw == null ? '' : raw
}

export function parseOnSalePriceInput(raw) {
  return toNum(raw)
}

export function isValidOnSalePrice(base, sale, onSale) {
  const onSaleNum = toNum(onSale)
  if (onSaleNum == null) return false
  const baseNum = toNum(base)
  const saleNum = toNum(sale)
  return (
    Number.isFinite(onSaleNum) &&
    onSaleNum > 0 &&
    Number.isFinite(baseNum) &&
    onSaleNum < baseNum &&
    Number.isFinite(saleNum) &&
    saleNum > 0 &&
    onSaleNum < saleNum
  )
}

export function assertOnSalePrice(base, sale, onSale) {
  const onSaleNum = toNum(onSale)
  if (onSaleNum == null) return null
  if (!Number.isFinite(onSaleNum) || onSaleNum <= 0) {
    throw new Error('On-sale price must be a positive number')
  }
  const saleNum = toNum(sale)
  if (saleNum == null || !Number.isFinite(saleNum) || saleNum <= 0) {
    throw new Error('Fill Sale price first, then On-sale price')
  }
  const baseNum = toNum(base)
  if (Number.isFinite(baseNum) && onSaleNum >= baseNum) {
    throw new Error('On-sale price must be less than base price')
  }
  if (onSaleNum >= saleNum) {
    throw new Error('On-sale price must be less than sale price')
  }
  return onSaleNum
}

export function variantHasOnSalePrice(variant) {
  const price = variant?.price || {}
  return isValidOnSalePrice(
    price.base,
    price.sale,
    readOnSalePriceValue(price)
  )
}

export function formHasOnSalePriceOnAllVariants(formData) {
  if (!variantHasOnSalePrice({ price: formData?.price })) return false
  const extras = Array.isArray(formData?.variants) ? formData.variants : []
  if (!extras.length) return true
  return extras.every((variant) => variantHasOnSalePrice(variant))
}

/** Matches backend productHasValidOnSalePrice: every variant needs a valid On-sale price. */
export function productHasValidOnSalePrice(product) {
  try {
    const variants = Array.isArray(product?.variants) ? product.variants : []
    if (!variants.length) return false
    return variants.every((variant) => variantHasOnSalePrice(variant))
  } catch {
    return false
  }
}

export function splitSelectedOnSaleEligibility(products = [], selectedSlugs) {
  const selected = (Array.isArray(products) ? products : []).filter((product) => {
    const slug = product?.slug
    if (!slug) return false
    if (selectedSlugs instanceof Set) return selectedSlugs.has(slug)
    if (Array.isArray(selectedSlugs)) return selectedSlugs.includes(slug)
    return false
  })
  const withPrice = []
  const withoutPrice = []
  for (const product of selected) {
    if (productHasValidOnSalePrice(product)) withPrice.push(product)
    else withoutPrice.push(product)
  }
  return {
    selected,
    withPrice,
    withoutPrice,
    selectedCount: selected.length,
    withPriceCount: withPrice.length,
    withoutPriceCount: withoutPrice.length,
    isMixed: withPrice.length > 0 && withoutPrice.length > 0,
    noneEligible: selected.length > 0 && withPrice.length === 0,
  }
}

export function onSaleBulkWarningText(eligibility) {
  if (!eligibility || !eligibility.selectedCount) return ''
  if (eligibility.noneEligible) {
    return `None of the ${eligibility.selectedCount} selected product(s) have On-sale price. Add On-sale price on every variant first — they will not be added to On Sale.`
  }
  if (eligibility.isMixed) {
    return `${eligibility.withPriceCount} of ${eligibility.selectedCount} selected product(s) have On-sale price and will be added to On Sale. ${eligibility.withoutPriceCount} without On-sale price will stay out of this list.`
  }
  return ''
}
