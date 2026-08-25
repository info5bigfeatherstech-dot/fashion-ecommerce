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

export async function getAdminOrdersSummary({ signal, rangePreset = 'all', from, to } = {}) {
  const params = {}
  if (from && to) {
    params.from = from
    params.to = to
  } else if (rangePreset) {
    params.rangePreset = rangePreset
  }
  const payload = await adminGet(API_ENDPOINTS.admin.ordersSummary, {
    signal,
    params,
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
  rangePreset,
  from,
  to,
} = {}) {
  const params = { page, limit, sortBy, sortOrder }
  const apiBucket = toApiBucket(bucket)
  if (apiBucket) params.bucket = apiBucket
  if (String(search || '').trim()) params.search = String(search).trim()
  if (from && to) {
    params.from = from
    params.to = to
  } else if (rangePreset) {
    params.rangePreset = rangePreset
  }

  const payload = await adminGet(API_ENDPOINTS.admin.orders, { signal, params })
  return payload
}

export async function getAdminOrderDetail(orderId, { signal } = {}) {
  const id = String(orderId || '').trim()
  const payload = await adminGet(API_ENDPOINTS.orders.byId(id), { signal })
  const order = payload?.data || payload?.order || unwrapAdmin(payload)
  if (order && typeof order === 'object' && payload?.fulfillmentPaymentGate) {
    return { ...order, fulfillmentPaymentGate: payload.fulfillmentPaymentGate }
  }
  return order
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

/** Order statuses where GST invoice + courier fulfilment UI are allowed. */
export function isPostConfirmOrderStatus(orderStatus) {
  return [
    'confirmed',
    'processing',
    'shipped',
    'out_for_delivery',
    'delivered',
    'return_requested',
  ].includes(String(orderStatus || '').toLowerCase())
}

export async function ensureAdminOrderShipment(orderId) {
  const payload = await adminPost(API_ENDPOINTS.admin.orderEnsureShipment(orderId))
  return unwrapAdmin(payload) || payload
}

export async function assignAdminOrderShip(orderId, { courierId, confirmSubstitute } = {}) {
  const body = {}
  if (courierId != null) body.courierId = courierId
  if (confirmSubstitute) body.confirmSubstitute = true
  const payload = await adminPost(API_ENDPOINTS.admin.orderAssignShip(orderId), body)
  return unwrapAdmin(payload) || payload
}

export async function scheduleAdminOrderPickup(orderId, pickupDate) {
  const payload = await adminPost(API_ENDPOINTS.admin.orderSchedulePickup(orderId), { pickupDate })
  return unwrapAdmin(payload) || payload
}

export async function syncAdminOrderShiprocket(orderId) {
  const payload = await adminPost(API_ENDPOINTS.admin.orderSyncShiprocket(orderId))
  return unwrapAdmin(payload) || payload
}

export async function generateAdminOrderManifest(orderId) {
  const payload = await adminPost(API_ENDPOINTS.admin.orderManifest(orderId))
  return unwrapAdmin(payload) || payload
}

export async function generateAdminOrderShippingLabel(orderId) {
  const payload = await adminPost(API_ENDPOINTS.admin.orderShippingLabel(orderId))
  return unwrapAdmin(payload) || payload
}

export async function cancelAdminOrderShipment(orderId) {
  const payload = await adminPost(API_ENDPOINTS.admin.orderCancelShipment(orderId))
  return unwrapAdmin(payload) || payload
}

export async function retryAdminOrderPickup(orderId) {
  const payload = await adminPost(API_ENDPOINTS.admin.orderRetryPickup(orderId))
  return unwrapAdmin(payload) || payload
}

export async function getAdminAddressIntelligence(orderId, { signal, refresh = false } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.orderAddressIntelligence(orderId), {
    signal,
    params: refresh ? { refresh: 1 } : undefined,
  })
  return unwrapAdmin(payload) || payload
}

export async function getAdminPickupCalendar({ signal, daysAhead = 45 } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.pickupCalendar, {
    signal,
    params: { daysAhead },
  })
  return unwrapAdmin(payload) || payload
}

export async function fetchAdminOrderInvoiceHtml(orderId) {
  const axiosClient = (await import('@/api/axiosClient')).default
  const response = await axiosClient.request({
    method: 'GET',
    url: API_ENDPOINTS.admin.orderInvoiceHtml(orderId),
    responseType: 'text',
    headers: { Accept: 'text/html' },
    useAdminAuth: true,
    timeout: 120000,
  })
  return response.data
}

export async function downloadAdminOrderShippingLabelFile(orderId, { provider = 'shiprocket' } = {}) {
  const response = await adminGetBlob(API_ENDPOINTS.admin.orderShippingLabelFile(orderId))
  const ct = String(response.headers?.['content-type'] || '')
  if (ct.includes('application/json')) {
    const text = await response.data.text()
    let message = 'Label download failed'
    try {
      message = JSON.parse(text)?.message || message
    } catch {
      message = text || message
    }
    throw new Error(message)
  }
  const prefix = String(provider).toLowerCase() === 'shipmozo' ? 'Shipmozo' : 'Shiprocket'
  let filename = `${prefix}-label-${String(orderId).replace(/[^\w.-]+/g, '_').slice(0, 80)}.pdf`
  const dispo = response.headers?.['content-disposition']
  if (dispo) {
    const m = /filename\*?=(?:UTF-8''|"?)([^";\n]+)/i.exec(dispo)
    if (m?.[1]) filename = decodeURIComponent(m[1].replace(/"/g, '').trim())
  }
  const rawCt = ct.split(';')[0].trim() || 'application/pdf'
  downloadBlob(new Blob([response.data], { type: rawCt }), filename)
}

export async function downloadAdminOrderManifestFile(orderId) {
  const response = await adminGetBlob(API_ENDPOINTS.admin.orderManifestFile(orderId))
  const ct = String(response.headers?.['content-type'] || '')
  if (ct.includes('application/json')) {
    const text = await response.data.text()
    let message = 'Manifest download failed'
    try {
      message = JSON.parse(text)?.message || message
    } catch {
      message = text || message
    }
    throw new Error(message)
  }
  let filename = `Shiprocket-manifest-${String(orderId).replace(/[^\w.-]+/g, '_').slice(0, 80)}.pdf`
  const dispo = response.headers?.['content-disposition']
  if (dispo) {
    const m = /filename\*?=(?:UTF-8''|"?)([^";\n]+)/i.exec(dispo)
    if (m?.[1]) filename = decodeURIComponent(m[1].replace(/"/g, '').trim())
  }
  downloadBlob(new Blob([response.data], { type: ct.split(';')[0].trim() || 'application/pdf' }), filename)
}
