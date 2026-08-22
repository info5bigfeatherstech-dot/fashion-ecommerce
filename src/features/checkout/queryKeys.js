export const checkoutKeys = {
  all: ['checkout'],
  settings: () => [...checkoutKeys.all, 'settings'],
  quote: (addressId, couponCode, cartKey, paymentKey = '') => [
    ...checkoutKeys.all,
    'quote',
    String(addressId || ''),
    String(couponCode || ''),
    String(cartKey || ''),
    String(paymentKey || ''),
  ],
  razorpayKey: () => [...checkoutKeys.all, 'razorpay-key'],
}
