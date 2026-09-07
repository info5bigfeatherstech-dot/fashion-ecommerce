export const orderKeys = {
  all: ['orders'],
  list: () => [...orderKeys.all, 'list'],
  detail: (orderId) => [...orderKeys.all, 'detail', String(orderId || '')],
  tracking: (orderId) => [...orderKeys.all, 'tracking', String(orderId || '')],
  invoice: (orderId) => [...orderKeys.all, 'invoice', String(orderId || '')],
  returnChat: (orderId) => [...orderKeys.all, 'return-chat', String(orderId || '')],
}
