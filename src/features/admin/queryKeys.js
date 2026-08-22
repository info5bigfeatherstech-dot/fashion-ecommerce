export const adminKeys = {
  all: ['admin'],
  me: () => [...adminKeys.all, 'me'],
  checkoutSettings: () => [...adminKeys.all, 'checkout-settings'],
  ordersSummary: () => [...adminKeys.all, 'orders-summary'],
  ordersList: (bucket, page) => [...adminKeys.all, 'orders-list', bucket, page],
  orderDetail: (orderId) => [...adminKeys.all, 'order', String(orderId || '')],
}
