import { API_ENDPOINTS } from '@/api/endpoints'
import { adminGet, adminPost, unwrapAdmin } from './client'

export async function getAdminOrdersSummary({ signal, rangePreset = 'all' } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.ordersSummary, {
    signal,
    params: { rangePreset },
  })
  return unwrapAdmin(payload)
}

export async function getAdminOrdersList({
  signal,
  page = 1,
  limit = 20,
  bucket = 'Pending',
  search = '',
  sortBy = 'createdAt',
  sortOrder = 'desc',
} = {}) {
  const params = { page, limit, sortBy, sortOrder }
  if (bucket && bucket !== 'all') params.bucket = bucket
  if (String(search || '').trim()) params.search = String(search).trim()

  const payload = await adminGet(API_ENDPOINTS.admin.orders, { signal, params })
  return payload
}

export async function getAdminOrderDetail(orderId, { signal } = {}) {
  const id = String(orderId || '').trim()
  const payload = await adminGet(API_ENDPOINTS.orders.byId(id), { signal })
  return payload?.data || payload?.order || unwrapAdmin(payload)
}

export async function getAdminOrderTracking(orderId, { signal } = {}) {
  const id = String(orderId || '').trim()
  const payload = await adminGet(API_ENDPOINTS.orders.track(id), { signal })
  return unwrapAdmin(payload)
}

export async function bulkConfirmOrders(orderIds) {
  const ids = Array.isArray(orderIds) ? orderIds : (orderIds?.orderIds || [])
  const payload = await adminPost(API_ENDPOINTS.admin.bulkConfirm, { orderIds: ids })
  return unwrapAdmin(payload)
}

export async function bulkCancelOrders(orderIds, reason = '') {
  const payload = await adminPost(API_ENDPOINTS.admin.bulkCancel, {
    orderIds,
    ...(reason ? { reason } : {}),
  })
  return unwrapAdmin(payload)
}

export async function autoSyncOrderStatuses(params = {}) {
  const payload = await adminPost(API_ENDPOINTS.admin.ordersAutoSync, null, { params })
  return unwrapAdmin(payload)
}

export async function getAdminReturnRequests({ signal, page = 1, limit = 20, status } = {}) {
  const params = { page, limit }
  if (status) params.status = status
  const payload = await adminGet(API_ENDPOINTS.admin.returns, { signal, params })
  return payload
}

export async function getAdminReturnDetail(orderId, { signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.returnDetail(orderId), { signal })
  return unwrapAdmin(payload)
}

export async function getAdminRtoOrders({ signal, page = 1, limit = 20 } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.rtoOrders, {
    signal,
    params: { page, limit },
  })
  return payload
}

export async function getAdminRtoAnalytics({ signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.rtoAnalytics, { signal })
  return unwrapAdmin(payload)
}
