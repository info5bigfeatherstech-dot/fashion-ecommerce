export const checkoutKeys = {
  all: ['checkout'],
  settings: () => [...checkoutKeys.all, 'settings'],
  quote: (addressId, couponCode, cartKey, paymentKey = '', loyaltyPoints = 0) => [
    ...checkoutKeys.all,
    'quote',
    String(addressId || ''),
    String(couponCode || ''),
    String(cartKey || ''),
    String(paymentKey || ''),
    String(Math.max(0, Math.floor(Number(loyaltyPoints) || 0))),
  ],
  razorpayKey: () => [...checkoutKeys.all, 'razorpay-key'],
}
