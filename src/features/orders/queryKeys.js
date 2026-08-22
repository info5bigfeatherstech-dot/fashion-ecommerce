export const orderKeys = {
  all: ['orders'],
  list: () => [...orderKeys.all, 'list'],
  detail: (orderId) => [...orderKeys.all, 'detail', String(orderId || '')],
}
