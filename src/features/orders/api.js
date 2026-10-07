import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'

/**
 * 1) List my orders
 * GET /orders/items
 */
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

/**
 * 2) Order detail
 * GET /orders/items/:orderId
 */
export async function getOrderById(orderId, { signal } = {}) {
  const id = String(orderId || '').trim()
  if (!id) throw new Error('Order ID is required')

  const payload = await http.get(API_ENDPOINTS.orders.byId(id), { signal })
  if (!payload?.success) {
    throw new Error(payload?.message || 'Order not found')
  }
  return payload.order
}

/**
 * 3) Track order
 * GET /orders/items/:orderId/track
 */
export async function getOrderTracking(orderId, { signal } = {}) {
  const id = String(orderId || '').trim()
  if (!id) throw new Error('Order ID is required')

  const payload = await http.get(API_ENDPOINTS.orders.track(id), { signal })
  if (!payload?.success) {
    throw new Error(payload?.message || 'Tracking details not found')
  }
  return payload.tracking
}

/**
 * 4) Invoice (JSON)
 * GET /orders/items/:orderId/invoice
 */
export async function getOrderInvoice(orderId, { signal } = {}) {
  const id = String(orderId || '').trim()
  if (!id) throw new Error('Order ID is required')

  const payload = await http.get(API_ENDPOINTS.orders.invoice(id), { signal })
  if (!payload?.success) {
    throw new Error(payload?.message || 'Could not fetch invoice')
  }
  return {
    invoice: payload.invoice || null,
    gstInvoice: payload.gstInvoice || null,
  }
}

/**
 * 5) Create return request
 * POST /orders/items/:orderId/return-request (multipart/form-data)
 */
export async function createReturnRequest(orderId, data) {
  const id = String(orderId || '').trim()
  if (!id) throw new Error('Order ID is required')

  let formData = data
  if (!(data instanceof FormData)) {
    formData = new FormData()
    if (data?.reasonType) formData.append('reasonType', data.reasonType)
    if (data?.reasonMessage) formData.append('reasonMessage', data.reasonMessage)
    if (data?.proofVideo) formData.append('proofVideo', data.proofVideo)

    if (Array.isArray(data?.proofImages)) {
      data.proofImages.forEach((img) => formData.append('proofImages', img))
    } else if (data?.proofImages instanceof FileList) {
      Array.from(data.proofImages).forEach((img) => formData.append('proofImages', img))
    } else if (data?.proofImages) {
      formData.append('proofImages', data.proofImages)
    }
  }

  const payload = await http.post(API_ENDPOINTS.orders.returnRequest(id), formData)
  if (!payload?.success) {
    throw new Error(payload?.message || 'Could not submit return request')
  }
  return payload
}

/**
 * 6) Return chat — get messages
 * GET /orders/items/:orderId/return-chat
 */
export async function getReturnChat(orderId, { signal } = {}) {
  const id = String(orderId || '').trim()
  if (!id) throw new Error('Order ID is required')

  const payload = await http.get(API_ENDPOINTS.orders.returnChat(id), { signal })
  if (!payload?.success) {
    throw new Error(payload?.message || 'Could not load return chat')
  }
  return {
    chat: Array.isArray(payload.chat) ? payload.chat : [],
    userLastRead: payload.userLastRead || null,
    adminLastRead: payload.adminLastRead || null,
    chatWindowDeadline: payload.chatWindowDeadline || null,
    isChatActive: Boolean(payload.isChatActive),
  }
}

/**
 * 7) Return chat — send message
 * POST /orders/items/:orderId/return-chat
 */
export async function sendReturnChatMessage(orderId, message) {
  const id = String(orderId || '').trim()
  if (!id) throw new Error('Order ID is required')
  const msg = String(message || '').trim()
  if (!msg) throw new Error('Message is required')

  const payload = await http.post(API_ENDPOINTS.orders.returnChat(id), { message: msg })
  if (!payload?.success) {
    throw new Error(payload?.message || 'Failed to send message')
  }
  return payload
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

/** Abandon online checkout hold. */
export async function abandonOnlineCheckout(orderId) {
  const id = String(orderId || '').trim()
  if (!id) throw new Error('Order ID is required')

  const payload = await http.post(API_ENDPOINTS.orders.abandonOnlineCheckout(id))
  return payload
}

/** Pay remaining balance for an order (partial pay). */
export async function payOrderBalance(orderId) {
  const id = String(orderId || '').trim()
  if (!id) throw new Error('Order ID is required')

  const payload = await http.post(API_ENDPOINTS.orders.payBalance(id))
  if (!payload?.success) {
    throw new Error(payload?.message || 'Could not initiate balance payment')
  }
  return payload
}

/**
 * 8) Gift intent options catalog (checkout UI)
 * GET /orders/gift-intent/options
 */
export async function getGiftIntentOptions({ signal } = {}) {
  try {
    const payload = await http.get(API_ENDPOINTS.orders.giftIntentOptions, { signal })
    const data = payload?.data || payload
    return {
      types: Array.isArray(data?.types)
        ? data.types
        : [
            { id: 'my_order', label: 'For Myself' },
            { id: 'gift_other', label: 'Send as a Gift' },
          ],
      occasions: Array.isArray(data?.occasions)
        ? data.occasions
        : ['birthday', 'anniversary', 'festival', 'other'],
      maxLengths: {
        recipientName: Number(data?.maxLengths?.recipientName) || 60,
        senderName: Number(data?.maxLengths?.senderName) || 60,
        message: Number(data?.maxLengths?.message) || 1000,
      },
    }
  } catch (err) {
    // Graceful fallback defaults if network or offline
    return {
      types: [
        { id: 'my_order', label: 'For Myself' },
        { id: 'gift_other', label: 'Send as a Gift' },
      ],
      occasions: ['birthday', 'anniversary', 'festival', 'other'],
      maxLengths: {
        recipientName: 60,
        senderName: 60,
        message: 1000,
      },
    }
  }
}

/**
 * 9) Order gift intent snapshot
 * GET /orders/items/:orderId/gift-intent
 */
export async function getOrderGiftIntent(orderId, { signal } = {}) {
  const id = String(orderId || '').trim()
  if (!id) throw new Error('Order ID is required')

  const payload = await http.get(API_ENDPOINTS.orders.giftIntent(id), { signal })
  return payload?.data || payload?.giftIntent || payload?.orderIntent || payload
}

