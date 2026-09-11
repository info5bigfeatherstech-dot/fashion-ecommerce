import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { rtoService } from '@/services/rtoService'
import { useAdminStore } from '@/features/admin/store'

export const RTO_QUERY_KEYS = {
  all: ['admin', 'rto'],
  orders: (params) => ['admin', 'rto', 'orders', params],
  analytics: () => ['admin', 'rto', 'analytics'],
}

/**
 * Checks if current admin user has authorization to view/manage RTO.
 * Only 'admin' and 'order_manager' are authorized.
 */
export function useRtoAuth() {
  const user = useAdminStore((s) => s.user)
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated)
  const authReady = useAdminStore((s) => s.authReady)
  const token = useAdminStore((s) => s.accessToken)

  const role = user?.role ? String(user.role).toLowerCase() : ''
  const isAuthorized = role === 'admin' || role === 'order_manager'

  return {
    authReady,
    isAuthenticated: Boolean(isAuthenticated && token),
    isAuthorized,
    user,
    role,
  }
}

/**
 * Hook to query RTO Orders with full filter/search/sort support.
 */
export function useRtoOrders({
  page = 1,
  limit = 20,
  search = '',
  status = 'all',
  section = 'all',
  sortBy = 'createdAt',
  sortOrder = 'desc',
  enabled = true,
} = {}) {
  const { isAuthorized, isAuthenticated } = useRtoAuth()
  const queryParams = { page, limit, search, status, section, sortBy, sortOrder }

  const query = useQuery({
    queryKey: RTO_QUERY_KEYS.orders(queryParams),
    queryFn: ({ signal }) => rtoService.getOrders({ ...queryParams, signal }),
    enabled: Boolean(enabled && isAuthenticated && isAuthorized),
    staleTime: 1000 * 30, // 30 seconds
  })

  // Extract standardized order items, pagination, and summary counts
  const rawData = query.data?.data || query.data || {}
  const orders = Array.isArray(rawData.orders)
    ? rawData.orders
    : Array.isArray(rawData.items)
      ? rawData.items
      : Array.isArray(rawData)
        ? rawData
        : []

  const pagination = rawData.pagination || query.data?.pagination || {
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    total: rawData.total || orders.length,
    totalPages: Math.max(1, Math.ceil((rawData.total || orders.length) / (limit || 20))),
  }

  const summaryCounts = rawData.summaryCounts || rawData.counts || {
    total: rawData.total || orders.length,
    pending: rawData.pendingCount || orders.filter((o) => o.rtoStatus === 'pending').length,
    refunded: rawData.refundedCount || orders.filter((o) => o.rtoStatus === 'refunded').length,
    closed: rawData.closedCount || orders.filter((o) => o.rtoStatus === 'closed').length,
    refund_failed: rawData.refundFailedCount || orders.filter((o) => o.rtoStatus === 'refund_failed').length,
    refund_rejected: rawData.refundRejectedCount || orders.filter((o) => o.rtoStatus === 'refund_rejected').length,
  }

  return {
    ...query,
    orders,
    pagination,
    summaryCounts,
  }
}

/**
 * Hook to query RTO Analytics Dashboard Metrics
 */
export function useRtoAnalytics({ enabled = true } = {}) {
  const { isAuthorized, isAuthenticated } = useRtoAuth()

  const query = useQuery({
    queryKey: RTO_QUERY_KEYS.analytics(),
    queryFn: ({ signal }) => rtoService.getAnalytics({ signal }),
    enabled: Boolean(enabled && isAuthenticated && isAuthorized),
    staleTime: 1000 * 60, // 1 minute
  })

  const raw = query.data?.data || query.data || {}
  const analytics = {
    totalRto: Number(raw.totalRto ?? raw.total ?? 0),
    pending: Number(raw.pending ?? 0),
    refunded: Number(raw.refunded ?? 0),
    closed: Number(raw.closed ?? 0),
    refundFailed: Number(raw.refundFailed ?? raw.refund_failed ?? 0),
    customerRelated: Number(raw.customerRelated ?? raw.customer_related ?? 0),
    courierRelated: Number(raw.courierRelated ?? raw.courier_related ?? 0),
    eligibleForRefund: Number(raw.eligibleForRefund ?? raw.eligible_refund ?? 0),
    totalRefundAmountInr: Number(raw.totalRefundAmountInr ?? raw.refundAmount ?? raw.totalRefundAmount ?? 0),
    timeline: Array.isArray(raw.timeline) ? raw.timeline : Array.isArray(raw.byDate) ? raw.byDate : [],
  }

  return {
    ...query,
    analytics,
  }
}

/**
 * Hook providing RTO mutations and actions: refund, reject, bulkAction, autoSync, exportReport.
 */
export function useRtoActions() {
  const queryClient = useQueryClient()

  const invalidateRto = () => {
    queryClient.invalidateQueries({ queryKey: RTO_QUERY_KEYS.all })
  }

  // Auto-sync mutation
  const autoSyncMutation = useMutation({
    mutationFn: (options) => rtoService.autoSyncStatuses(options),
    onSuccess: (data) => {
      toast.success(data?.message || 'RTO statuses synchronized successfully')
      invalidateRto()
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to sync RTO statuses')
    },
  })

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: (params) => rtoService.refundOrder(params),
    onSuccess: (data, vars) => {
      toast.success(data?.message || `Refund processed for order ${vars.orderId}`)
      invalidateRto()
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to process refund')
    },
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (params) => rtoService.rejectOrder(params),
    onSuccess: (data, vars) => {
      toast.success(data?.message || `RTO rejected for order ${vars.orderId}`)
      invalidateRto()
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to reject RTO')
    },
  })

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: (params) => rtoService.bulkAction(params),
    onSuccess: (data, vars) => {
      toast.success(data?.message || `Bulk ${vars.action} completed for ${vars.orderIds?.length} orders`)
      invalidateRto()
    },
    onError: (err) => {
      toast.error(err?.message || 'Bulk action failed')
    },
  })

  // Export report handler
  const exportReport = async ({ status, section, search, format = 'csv' } = {}) => {
    const toastId = toast.loading(`Generating ${format.toUpperCase()} report…`)
    try {
      await rtoService.exportReport({
        status,
        section,
        search,
        format,
        triggerDownload: true,
      })
      toast.success(`${format.toUpperCase()} report exported successfully`, { id: toastId })
    } catch (err) {
      toast.error(err?.message || 'Failed to export report', { id: toastId })
    }
  }

  return {
    autoSync: autoSyncMutation.mutateAsync,
    isSyncing: autoSyncMutation.isPending,
    refundOrder: refundMutation.mutateAsync,
    isRefunding: refundMutation.isPending,
    rejectOrder: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
    bulkAction: bulkActionMutation.mutateAsync,
    isBulkActing: bulkActionMutation.isPending,
    exportReport,
    invalidateRto,
  }
}
