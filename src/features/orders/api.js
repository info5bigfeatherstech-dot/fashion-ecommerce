import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'

export async function getUserOrders({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.orders.items, { signal })
  if (!payload?.success) {
    throw new Error(payload?.message || 'Failed to fetch orders')
  }
  return {
    count: Number(payload.count) || 0,
    orders: Array.isArray(payload.orders) ? payload.orders : [],
  }
}

export async function getOrderById(orderId, { signal } = {}) {
  const id = String(orderId || '').trim()
  if (!id) throw new Error('Order ID is required')

  const payload = await http.get(API_ENDPOINTS.orders.byId(id), { signal })
  if (!payload?.success) {
    throw new Error(payload?.message || 'Order not found')
  }
  return payload.order
}

/** Retry Razorpay checkout for an unpaid online order. */
export async function initiatePendingOrderPayment(orderId) {
  const id = String(orderId || '').trim()
  if (!id) throw new Error('Order ID is required')

  const payload = await http.post(API_ENDPOINTS.orders.initiatePayment(id))
  if (!payload?.success) {
    throw new Error(payload?.message || payload?.error || 'Could not start payment')
  }
  return payload
}
