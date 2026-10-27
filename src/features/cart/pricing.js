/**
 * Cart / checkout line display math.
 * Payable (`price`) is what the backend charges before coupon.
 * MRP is `originalPrice` (base). On-sale tagged lines also have `salePrice` (middle).
 */

function money(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function getCartLinePricing(item) {
  const qty = Math.max(1, Math.floor(money(item?.quantity, 1)))
  const unitPayable = Math.max(0, money(item?.price))
  const baseRaw = money(item?.originalPrice)
  const unitBase = baseRaw > unitPayable ? baseRaw : unitPayable
  const saleRaw = money(item?.salePrice)
  const showThreeTier =
    Boolean(item?.isPromoActive) &&
    saleRaw > unitPayable &&
    unitBase > saleRaw

  return {
    qty,
    unitPayable,
    unitBase,
    unitSale: showThreeTier ? saleRaw : null,
    linePayable: unitPayable * qty,
    lineBase: unitBase * qty,
    lineSale: showThreeTier ? saleRaw * qty : null,
    productDiscount: Math.max(0, (unitBase - unitPayable) * qty),
    showThreeTier,
  }
}

export function summarizeCartProductPricing(items = []) {
  const list = Array.isArray(items) ? items : []
  return list.reduce(
    (acc, item) => {
      const line = getCartLinePricing(item)
      acc.mrpTotal += line.lineBase
      acc.payableTotal += line.linePayable
      acc.productDiscount += line.productDiscount
      return acc
    },
    { mrpTotal: 0, payableTotal: 0, productDiscount: 0 }
  )
}
