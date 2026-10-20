export function isReferralCodeFormat(code) {
  return /^RF-\d+$/i.test(String(code || '').trim())
}

export function normalizeReferralCode(code) {
  return String(code || '').trim().toUpperCase()
}

export function referralDiscountLabel(settings) {
  const type = String(settings?.discountType || 'percentage').toLowerCase()
  const value = Number(settings?.discountValue) || 0
  if (!(value > 0)) return 'a discount'
  if (type === 'fixed') {
    return `₹${value.toLocaleString('en-IN')} off`
  }
  return `${value}% off`
}

export function buildReferralShareText({ code, settings, siteName, origin }) {
  const discount = referralDiscountLabel(settings)
  const points = Math.max(0, Math.floor(Number(settings?.rewardPoints) || 0))
  const shop = origin ? ` Shop here: ${origin}` : ''
  const reward =
    points > 0
      ? ` After they complete their order, I earn ${points} loyalty points.`
      : ''
  return `Use my ${siteName || 'store'} referral code ${code} at checkout and get ${discount}.${reward}${shop}`
}
