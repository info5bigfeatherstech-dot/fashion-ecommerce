import { API_ENDPOINTS } from '@/api/endpoints'
import { adminGet, adminPost, adminPostBlob, downloadBlob, unwrapAdmin } from './client'

/** Maps UI tab labels → backend `bucket` query param (same as fabFE). */
export const ORDER_TAB_LABEL_TO_BUCKET = Object.freeze({
  All: 'all',
  Pending: 'new',
  Confirmed: 'bill_sent',
  'Ready to Ship': 'ready_to_ship',
  Processing: 'ready_to_pick',
  'In transit': 'in_transit',
  Delivered: 'completed',
  RTO: 'rto',
  Cancelled: 'others',
  'Pickup Exception': 'pickup_exception',
})

/** Maps backend countsByBucket keys → UI tab labels. */
export const BUCKET_KEY_TO_TAB_LABEL = Object.freeze({
  all: 'All',
  new: 'Pending',
  bill_sent: 'Confirmed',
  ready_to_ship: 'Ready to Ship',
  pickup_exception: 'Pickup Exception',
  ready_to_pick: 'Processing',
  in_transit: 'In transit',
  completed: 'Delivered',
  rto: 'RTO',
  others: 'Cancelled',
})

export const ORDER_TAB_ORDER = Object.freeze([
  'Pending',
  'Confirmed',
  'Ready to Ship',
  'Processing',
  'In transit',
  'Delivered',
  'RTO',
  'Cancelled',
  'Pickup Exception',
])

function toApiBucket(bucket) {
  if (!bucket || bucket === 'all') return null
  return ORDER_TAB_LABEL_TO_BUCKET[bucket] ?? bucket
}

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
  const apiBucket = toApiBucket(bucket)
  if (apiBucket) params.bucket = apiBucket
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

export async function bulkShipNowOrders(orderIds) {
  const ids = Array.isArray(orderIds) ? orderIds : (orderIds?.orderIds || [])
  const payload = await adminPost(API_ENDPOINTS.admin.bulkShipNow, { orderIds: ids })
  return unwrapAdmin(payload)
}

export async function bulkSchedulePickupOrders(orderIds, pickupDate) {
  const ids = Array.isArray(orderIds) ? orderIds : (orderIds?.orderIds || [])
  const payload = await adminPost(API_ENDPOINTS.admin.bulkSchedulePickup, {
    orderIds: ids,
    pickupDate,
  })
  return unwrapAdmin(payload)
}

export async function bulkSyncShiprocketOrders(orderIds) {
  const ids = Array.isArray(orderIds) ? orderIds : (orderIds?.orderIds || [])
  const payload = await adminPost(API_ENDPOINTS.admin.bulkSyncShiprocket, { orderIds: ids })
  return unwrapAdmin(payload)
}

async function downloadBulkOrderZip(url, orderIds, filenamePrefix) {
  const response = await adminPostBlob(url, { orderIds, concurrency: 4 })
  const ct = String(response.headers?.['content-type'] || '')
  if (ct.includes('application/json')) {
    const text = await response.data.text()
    let message = 'Download failed'
    try {
      message = JSON.parse(text)?.message || message
    } catch {
      message = text || message
    }
    throw new Error(message)
  }
  if (!(response.data instanceof Blob) || response.data.size === 0) {
    throw new Error('Unexpected empty response from server')
  }
  downloadBlob(response.data, `${filenamePrefix}-${Date.now()}.zip`)
}

export async function downloadBulkTaxInvoicesZip(orderIds) {
  const ids = Array.isArray(orderIds) ? orderIds : (orderIds?.orderIds || [])
  return downloadBulkOrderZip(API_ENDPOINTS.admin.bulkTaxInvoicesZip, ids, 'tax-invoices-bulk')
}

export async function downloadBulkShippingLabelsZip(orderIds) {
  const ids = Array.isArray(orderIds) ? orderIds : (orderIds?.orderIds || [])
  return downloadBulkOrderZip(API_ENDPOINTS.admin.bulkShippingLabelsZip, ids, 'shipping-labels-bulk')
}

export async function downloadBulkManifestsZip(orderIds) {
  const ids = Array.isArray(orderIds) ? orderIds : (orderIds?.orderIds || [])
  return downloadBulkOrderZip(API_ENDPOINTS.admin.bulkManifestsZip, ids, 'shiprocket-manifests-bulk')
}

export async function decideAdminReturnRequest(orderId, { decision, decisionReason = '' } = {}) {
  const payload = await adminPost(API_ENDPOINTS.admin.returnDecision(orderId), {
    decision,
    decisionReason,
  })
  return unwrapAdmin(payload)
}

export async function initiateAdminReturnRefund(orderId) {
  const payload = await adminPost(API_ENDPOINTS.admin.returnRefund(orderId))
  return unwrapAdmin(payload)
}

export async function retryAdminReturnReversePickup(orderId) {
  const payload = await adminPost(API_ENDPOINTS.admin.returnReversePickupRetry(orderId))
  return unwrapAdmin(payload)
}
