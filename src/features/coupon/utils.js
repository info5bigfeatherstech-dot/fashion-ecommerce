/**
 * Utility functions for calculating coupon discounts across cart items.
 */

export function normalizeCouponCode(code) {
  return String(code || '').trim().toUpperCase()
}

/**
 * Check if a specific cart item is eligible for the given coupon.
 */
export function isItemEligibleForCoupon(item, coupon) {
  if (!item || !coupon) return false

  const applicable = coupon.applicableProducts || coupon.products || coupon.productIds
  if (Array.isArray(applicable) && applicable.length > 0) {
    const itemIds = [
      String(item.productId || ''),
      String(item.id || ''),
      String(item.slug || '').toLowerCase(),
      String(item.variantId || ''),
      String(item.productCode || '').toLowerCase(),
    ].filter(Boolean)

    const isMatch = applicable.some((val) => {
      const v = String(val).trim().toLowerCase()
      return itemIds.some((id) => id.toLowerCase() === v)
    })

    if (!isMatch) return false
  }

  const applicableCategories = coupon.applicableCategories || coupon.categories
  if (Array.isArray(applicableCategories) && applicableCategories.length > 0) {
    const cat = String(item.category || item.categorySlug || '').toLowerCase()
    const isCatMatch = applicableCategories.some(
      (c) => String(c).trim().toLowerCase() === cat
    )
    if (!isCatMatch) return false
  }

  return true
}

/**
 * Calculates item-level deductions and overall totals for the cart and coupon.
 */
export function calculateCartCouponDiscounts(cartItems = [], coupon = null) {
  const safeItems = Array.isArray(cartItems) ? cartItems : []

  const cartSubtotal = safeItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  )

  if (!coupon || !coupon.code || safeItems.length === 0) {
    return {
      cartSubtotal,
      totalDiscount: 0,
      finalTotal: cartSubtotal,
      items: safeItems.map((item) => {
        const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1)
        return {
          ...item,
          originalLineTotal: lineTotal,
          discountedLineTotal: lineTotal,
          itemDiscount: 0,
          unitPrice: Number(item.price) || 0,
          unitDiscountedPrice: Number(item.price) || 0,
          hasDiscount: false,
        }
      }),
      hasCoupon: false,
      appliedCoupon: null,
      isMinOrderSatisfied: true,
    }
  }

  const minOrder = Number(coupon.minOrderAmount ?? coupon.minOrderValue ?? 0)
  if (minOrder > 0 && cartSubtotal < minOrder) {
    return {
      cartSubtotal,
      totalDiscount: 0,
      finalTotal: cartSubtotal,
      items: safeItems.map((item) => {
        const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1)
        return {
          ...item,
          originalLineTotal: lineTotal,
          discountedLineTotal: lineTotal,
          itemDiscount: 0,
          unitPrice: Number(item.price) || 0,
          unitDiscountedPrice: Number(item.price) || 0,
          hasDiscount: false,
        }
      }),
      hasCoupon: false,
      appliedCoupon: coupon,
      isMinOrderSatisfied: false,
      minOrderAmount: minOrder,
      errorMessage: `Minimum order amount of ₹${minOrder} required for this coupon`,
    }
  }

  // Find eligible items for the coupon
  const eligibleIndices = []
  let eligibleSubtotal = 0

  safeItems.forEach((item, idx) => {
    if (isItemEligibleForCoupon(item, coupon)) {
      eligibleIndices.push(idx)
      eligibleSubtotal += (Number(item.price) || 0) * (Number(item.quantity) || 1)
    }
  })

  if (eligibleSubtotal <= 0 || eligibleIndices.length === 0) {
    return {
      cartSubtotal,
      totalDiscount: 0,
      finalTotal: cartSubtotal,
      items: safeItems.map((item) => {
        const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1)
        return {
          ...item,
          originalLineTotal: lineTotal,
          discountedLineTotal: lineTotal,
          itemDiscount: 0,
          unitPrice: Number(item.price) || 0,
          unitDiscountedPrice: Number(item.price) || 0,
          hasDiscount: false,
        }
      }),
      hasCoupon: false,
      appliedCoupon: coupon,
      isMinOrderSatisfied: true,
      errorMessage: 'No items in your bag are eligible for this coupon',
    }
  }

  const type = String(coupon.discountType || '').toLowerCase()
  const discountVal = Number(coupon.discountValue ?? coupon.discount ?? 0)
  const isPercent = type === 'percentage' || type === 'percent'

  let targetDiscount = 0
  if (isPercent && discountVal > 0) {
    targetDiscount = Math.round((eligibleSubtotal * discountVal) / 100)
  } else if (coupon.discountAmount != null && Number(coupon.discountAmount) > 0) {
    targetDiscount = Number(coupon.discountAmount)
  } else if (discountVal > 0) {
    targetDiscount = discountVal
  }

  const maxDiscount = Number(coupon.maxDiscountAmount)
  if (Number.isFinite(maxDiscount) && maxDiscount > 0) {
    targetDiscount = Math.min(targetDiscount, maxDiscount)
  }
  targetDiscount = Math.min(targetDiscount, eligibleSubtotal)

  // Calculate discount for each item
  const rawItemDiscounts = new Array(safeItems.length).fill(0)

  if (isPercent && discountVal > 0) {
    eligibleIndices.forEach((idx) => {
      const item = safeItems[idx]
      const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1)
      const itemDisc = Math.min(lineTotal, Math.round((lineTotal * discountVal) / 100))
      rawItemDiscounts[idx] = itemDisc
    })
    // Ensure capped by maxDiscount if applicable
    const sumPercentDisc = rawItemDiscounts.reduce((a, b) => a + b, 0)
    if (sumPercentDisc > targetDiscount && sumPercentDisc > 0) {
      eligibleIndices.forEach((idx) => {
        rawItemDiscounts[idx] = Math.round((rawItemDiscounts[idx] / sumPercentDisc) * targetDiscount)
      })
    }
  } else {
    // Distribute proportionally across eligible items
    eligibleIndices.forEach((idx) => {
      const item = safeItems[idx]
      const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1)
      rawItemDiscounts[idx] = Math.min(
        lineTotal,
        Math.round((lineTotal / eligibleSubtotal) * targetDiscount)
      )
    })
  }

  // Adjust rounding difference so total matches targetDiscount
  const currentSum = rawItemDiscounts.reduce((a, b) => a + b, 0)
  const diff = targetDiscount - currentSum
  if (diff !== 0 && eligibleIndices.length > 0) {
    const firstEligible = eligibleIndices[0]
    const itemTotal =
      (Number(safeItems[firstEligible].price) || 0) *
      (Number(safeItems[firstEligible].quantity) || 1)
    rawItemDiscounts[firstEligible] = Math.max(
      0,
      Math.min(itemTotal, rawItemDiscounts[firstEligible] + diff)
    )
  }

  const totalDiscount = rawItemDiscounts.reduce((a, b) => a + b, 0)
  const finalTotal = Math.max(0, cartSubtotal - totalDiscount)

  const items = safeItems.map((item, idx) => {
    const qty = Number(item.quantity) || 1
    const lineTotal = (Number(item.price) || 0) * qty
    const itemDiscount = rawItemDiscounts[idx] || 0
    const discountedLineTotal = Math.max(0, lineTotal - itemDiscount)
    const unitDiscountedPrice = qty > 0 ? Math.round(discountedLineTotal / qty) : 0

    return {
      ...item,
      originalLineTotal: lineTotal,
      discountedLineTotal,
      itemDiscount,
      unitPrice: Number(item.price) || 0,
      unitDiscountedPrice,
      hasDiscount: itemDiscount > 0,
    }
  })

  return {
    cartSubtotal,
    totalDiscount,
    finalTotal,
    items,
    hasCoupon: totalDiscount > 0,
    appliedCoupon: {
      ...coupon,
      calculatedDiscount: totalDiscount,
    },
    isMinOrderSatisfied: true,
  }
}
