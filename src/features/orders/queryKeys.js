export const orderKeys = {
  all: ['orders'],
  list: (userId) => [...orderKeys.all, 'list', String(userId || '')],
  detail: (orderId) => [...orderKeys.all, 'detail', String(orderId || '')],
  tracking: (orderId) => [...orderKeys.all, 'tracking', String(orderId || '')],
  invoice: (orderId) => [...orderKeys.all, 'invoice', String(orderId || '')],
  returnChat: (orderId) => [...orderKeys.all, 'return-chat', String(orderId || '')],
  giftOptions: () => [...orderKeys.all, 'gift-options'],
  giftIntent: (orderId) => [...orderKeys.all, 'gift-intent', String(orderId || '')],
  adminGiftIntent: (orderId) => ['admin', 'orders', 'gift-intent', String(orderId || '')],
}
