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
