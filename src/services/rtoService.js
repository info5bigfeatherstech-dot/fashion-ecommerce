import axiosClient from '@/api/axiosClient'
import { apiConfig } from '@/api/config'
import { API_ENDPOINTS } from '@/api/endpoints'
import { useAdminStore } from '@/features/admin/store'
import { downloadBlob } from '@/features/admin/api/client'

/**
 * Resolves the backend base URL honoring standard environment variables.
 */
export function getApiBaseUrl() {
  const env = import.meta.env || {}
  const rawUrl =
    env.VITE_API_BASE_URL ||
    env.REACT_APP_API_BASE_URL ||
    env.NEXT_PUBLIC_API_BASE_URL ||
    apiConfig.baseURL
  return String(rawUrl || '').replace(/\/+$/, '')
}

/**
 * Retrieves the current admin bearer token header.
 */
export function getAdminAuthHeaders() {
  const token = useAdminStore.getState().accessToken
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Normalizes API response to standard { success, message, data, ... } envelope.
 */
function normalizeResponse(payload, defaultMessage = 'Success') {
  if (!payload || typeof payload !== 'object') {
    return {
      success: true,
      message: defaultMessage,
      data: payload,
    }
  }

  const success = payload.success !== false
  const message = payload.message || (success ? defaultMessage : 'Request failed')
  const data = payload.data !== undefined ? payload.data : payload

  return {
    success,
    message,
    data,
    ...payload,
  }
}

/**
 * Normalizes errors into a consistent structure with helpful fallbacks.
 */
function normalizeError(error, defaultMessage = 'An unexpected error occurred') {
  const response = error?.response
  const data = response?.data
  const status = response?.status

  let message =
    data?.message ||
    data?.error ||
    error?.message ||
    defaultMessage

  if (status === 401) {
    message = 'Session expired or unauthorized. Please log in again.'
  } else if (status === 403) {
    message = 'Access denied. You do not have permission to manage RTO orders.'
  } else if (status === 404) {
    message = data?.message || 'The requested RTO resource was not found.'
  } else if (status >= 500) {
    message = data?.message || 'Server error while processing RTO request. Please try again later.'
  }

  const err = new Error(message)
  err.status = status
  err.code = data?.code || (status ? `HTTP_${status}` : 'NETWORK_ERROR')
  err.details = data?.details || null
  err.data = data
  return err
}

/**
 * Centralized RTO API Service
 */
export const rtoService = {
  /**
   * Fetch paginated RTO orders with filters and sorting
   * GET /api/admin/rto/orders
   */
  async getOrders({
    page = 1,
    limit = 20,
    search = '',
    status = 'all',
    section = 'all',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    signal,
  } = {}) {
    try {
      const params = {
        page,
        limit,
        ...(search ? { search: search.trim() } : {}),
        ...(status && status !== 'all' ? { status } : {}),
        ...(section && section !== 'all' ? { section } : {}),
        ...(sortBy ? { sortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
      }

      const response = await axiosClient.request({
        method: 'GET',
        url: API_ENDPOINTS.admin.rtoOrders,
        params,
        signal,
        useAdminAuth: true,
        headers: getAdminAuthHeaders(),
      })

      return normalizeResponse(response.data, 'RTO orders fetched successfully')
    } catch (err) {
      throw normalizeError(err, 'Failed to fetch RTO orders')
    }
  },

  /**
   * Fetch RTO analytics and summary metrics
   * GET /api/admin/rto/analytics
   */
  async getAnalytics({ signal } = {}) {
    try {
      const response = await axiosClient.request({
        method: 'GET',
        url: API_ENDPOINTS.admin.rtoAnalytics,
        signal,
        useAdminAuth: true,
        headers: getAdminAuthHeaders(),
      })

      return normalizeResponse(response.data, 'RTO analytics fetched successfully')
    } catch (err) {
      throw normalizeError(err, 'Failed to fetch RTO analytics')
    }
  },

  /**
   * Export RTO report as CSV or JSON
   * GET /api/admin/rto/report
   */
  async exportReport({
    status = 'all',
    section = 'all',
    search = '',
    format = 'csv',
    triggerDownload = true,
    signal,
  } = {}) {
    try {
      const params = {
        format,
        ...(status && status !== 'all' ? { status } : {}),
        ...(section && section !== 'all' ? { section } : {}),
        ...(search ? { search: search.trim() } : {}),
      }

      if (format === 'json') {
        const response = await axiosClient.request({
          method: 'GET',
          url: API_ENDPOINTS.admin.rtoReport,
          params,
          signal,
          useAdminAuth: true,
          headers: getAdminAuthHeaders(),
        })

        if (triggerDownload) {
          const jsonBlob = new Blob([JSON.stringify(response.data, null, 2)], {
            type: 'application/json',
          })
          const dateStr = new Date().toISOString().slice(0, 10)
          downloadBlob(jsonBlob, `rto-report-${dateStr}.json`)
        }

        return normalizeResponse(response.data, 'Report exported as JSON')
      }

      // Default: CSV blob download
      const response = await axiosClient.request({
        method: 'GET',
        url: API_ENDPOINTS.admin.rtoReport,
        params,
        responseType: 'blob',
        signal,
        useAdminAuth: true,
        headers: getAdminAuthHeaders(),
      })

      const blob = response.data
      if (triggerDownload && blob) {
        const dateStr = new Date().toISOString().slice(0, 10)
        const filename = `rto-report-${dateStr}.csv`
        downloadBlob(blob, filename)
      }

      return {
        success: true,
        message: 'CSV report downloaded successfully',
        data: blob,
      }
    } catch (err) {
      throw normalizeError(err, 'Failed to export RTO report')
    }
  },

  /**
   * Trigger auto-sync of RTO statuses
   * POST /api/admin/rto/auto-sync-statuses
   */
  async autoSyncStatuses(options = {}) {
    try {
      const response = await axiosClient.request({
        method: 'POST',
        url: API_ENDPOINTS.admin.rtoAutoSync,
        data: options,
        useAdminAuth: true,
        headers: getAdminAuthHeaders(),
      })

      return normalizeResponse(response.data, 'RTO statuses synchronized successfully')
    } catch (err) {
      throw normalizeError(err, 'Auto-sync failed')
    }
  },

  /**
   * Process refund for a specific RTO order
   * POST /api/admin/rto/refund
   */
  async refundOrder({ orderId, amount, reason, deductionNotes } = {}) {
    const cleanId = String(orderId || '').trim()
    if (!cleanId) {
      throw new Error('Order ID is required to process refund')
    }

    try {
      const response = await axiosClient.request({
        method: 'POST',
        url: API_ENDPOINTS.admin.rtoRefund,
        data: {
          orderId: cleanId,
          ...(amount != null ? { amount: Number(amount) } : {}),
          ...(reason ? { reason } : {}),
          ...(deductionNotes ? { deductionNotes } : {}),
        },
        useAdminAuth: true,
        headers: getAdminAuthHeaders(),
      })

      return normalizeResponse(response.data, `Refund processed for order ${cleanId}`)
    } catch (err) {
      throw normalizeError(err, `Failed to process refund for order ${cleanId}`)
    }
  },

  /**
   * Reject RTO claim/order
   * POST /api/admin/rto/reject
   */
  async rejectOrder({ orderId, reason } = {}) {
    const cleanId = String(orderId || '').trim()
    if (!cleanId) {
      throw new Error('Order ID is required to reject RTO')
    }

    try {
      const response = await axiosClient.request({
        method: 'POST',
        url: API_ENDPOINTS.admin.rtoReject,
        data: {
          orderId: cleanId,
          reason: reason || 'RTO claim rejected by administrator',
        },
        useAdminAuth: true,
        headers: getAdminAuthHeaders(),
      })

      return normalizeResponse(response.data, `RTO rejected for order ${cleanId}`)
    } catch (err) {
      throw normalizeError(err, `Failed to reject order ${cleanId}`)
    }
  },

  /**
   * Execute bulk action across multiple RTO orders
   * POST /api/admin/rto/bulk-action
   * @param {{ action: 'refund'|'reject'|'close', orderIds: string[], reason?: string }} params
   */
  async bulkAction({ action, orderIds, reason } = {}) {
    if (!action || !['refund', 'reject', 'close'].includes(action)) {
      throw new Error('Invalid bulk action. Must be refund, reject, or close.')
    }
    const ids = Array.isArray(orderIds)
      ? orderIds.map((id) => String(id).trim()).filter(Boolean)
      : []

    if (ids.length === 0) {
      throw new Error('Please select at least one order to perform bulk action')
    }

    try {
      const response = await axiosClient.request({
        method: 'POST',
        url: API_ENDPOINTS.admin.rtoBulkAction,
        data: {
          action,
          orderIds: ids,
          ...(reason ? { reason } : {}),
        },
        useAdminAuth: true,
        headers: getAdminAuthHeaders(),
      })

      return normalizeResponse(response.data, `Bulk ${action} executed for ${ids.length} orders`)
    } catch (err) {
      throw normalizeError(err, `Bulk ${action} failed`)
    }
  },
}

export default rtoService
