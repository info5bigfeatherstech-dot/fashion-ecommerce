import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminLogin,
  adminLogout,
  autoSyncOrderStatuses,
  bulkCancelOrders,
  bulkConfirmOrders,
  bulkShipNowOrders,
  bulkSchedulePickupOrders,
  bulkSyncShiprocketOrders,
  downloadBulkTaxInvoicesZip,
  downloadBulkShippingLabelsZip,
  downloadBulkManifestsZip,
  decideAdminReturnRequest,
  initiateAdminReturnRefund,
  retryAdminReturnReversePickup,
  ensureAdminOrderShipment,
  assignAdminOrderShip,
  scheduleAdminOrderPickup,
  syncAdminOrderShiprocket,
  generateAdminOrderManifest,
  generateAdminOrderShippingLabel,
  cancelAdminOrderShipment,
  retryAdminOrderPickup,
  getAdminAddressIntelligence,
  getAdminPickupCalendar,
  fetchAdminOrderInvoiceHtml,
  downloadAdminOrderShippingLabelFile,
  downloadAdminOrderManifestFile,
  createAdminCoupon,
  createAdminFreeShippingOffer,
  createAdminStaff,
  deleteAdminCoupon,
  deleteAdminFreeShippingOffer,
  deleteAdminStaff,
  getAdminAbandonedCarts,
  getAdminFreeShippingOffers,
  getAdminCheckoutSettings,
  getAdminCoupons,
  getAdminCarts,
  getAdminDashboardSummary,
  getAdminHighValueCarts,
  getAdminOosInquiries,
  getAdminOrderDetail,
  getAdminOrderTracking,
  getAdminOrdersList,
  getAdminOrdersSummary,
  getAdminProductsActiveCount,
  getAdminProductsAll,
  getAdminProductsArchived,
  getAdminProductsLowStock,
  getAdminCategories,
  exportAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  archiveAdminProduct,
  toggleAdminProductFeatured,
  bulkUpdateAdminProductStatus,
  bulkUpdateAdminProductFlags,
  getAdminReturnDetail,
  getAdminReturnRequests,
  getAdminRtoAnalytics,
  getAdminRtoOrders,
  getAdminShippingSettings,
  getAdminStaff,
  getAdminStaffProfile,
  getAdminStaleWishlists,
  getAdminUserDetail,
  getAdminUsers,
  exportAdminUsers,
  getAdminWishlists,
  getAdminPopularWishlistProducts,
  hardDeleteAdminProduct,
  restoreAdminProduct,
  testAdminShippingConnection,
  toggleAdminCoupon,
  toggleAdminFreeShippingOffer,
  updateAdminCheckoutSettings,
  updateAdminCoupon,
  updateAdminFreeShippingOffer,
  updateAdminOosInquiryStatus,
  updateAdminShippingSettings,
  updateAdminStaff,
} from './api'
import { adminKeys } from './queryKeys'
import { useAdminStore } from './store'

function useAdminQueryEnabled(enabled = true) {
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated)
  return enabled && isAuthenticated
}

export function useAdminLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminLogin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

export function useAdminLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminLogout,
    onSuccess: () => queryClient.clear(),
  })
}

export function useAdminCheckoutSettings({ enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.checkoutSettings(),
    queryFn: ({ signal }) => getAdminCheckoutSettings({ signal }),
    enabled: queryEnabled,
    staleTime: 1000 * 30,
  })
}

export function useUpdateAdminCheckoutSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateAdminCheckoutSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.checkoutSettings() }),
  })
}

export function useAdminShippingSettings({ enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.shippingSettings(),
    queryFn: ({ signal }) => getAdminShippingSettings({ signal }),
    enabled: queryEnabled,
    staleTime: 1000 * 30,
  })
}

export function useUpdateAdminShippingSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateAdminShippingSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.shippingSettings() }),
  })
}

export function useTestAdminShippingConnection() {
  return useMutation({ mutationFn: testAdminShippingConnection })
}

export function useAdminDashboardSummary({ enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.dashboardSummary(),
    queryFn: ({ signal }) => getAdminDashboardSummary({ signal }),
    enabled: queryEnabled,
    staleTime: 1000 * 60,
  })
}

export function useAdminOrdersSummary({
  rangePreset = 'all',
  from,
  to,
  enabled = true,
} = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  const rangeKey = from && to ? `custom:${from}:${to}` : rangePreset
  return useQuery({
    queryKey: adminKeys.ordersSummary(rangeKey),
    queryFn: ({ signal }) => getAdminOrdersSummary({ signal, rangePreset, from, to }),
    enabled: queryEnabled,
    staleTime: 1000 * 60,
  })
}

export function useAdminOrdersList({
  bucket = 'Pending',
  page = 1,
  search = '',
  rangePreset = 'last30',
  from,
  to,
  enabled = true,
} = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  const rangeKey = from && to ? `custom:${from}:${to}` : rangePreset
  return useQuery({
    queryKey: adminKeys.ordersList(bucket, page, search, rangeKey),
    queryFn: ({ signal }) => getAdminOrdersList({
      signal,
      bucket,
      page,
      search,
      rangePreset,
      from,
      to,
    }),
    enabled: queryEnabled,
    staleTime: 1000 * 20,
  })
}

export function useAdminOrderDetail(orderId, { enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  const id = String(orderId || '').trim()
  return useQuery({
    queryKey: adminKeys.orderDetail(id),
    queryFn: ({ signal }) => getAdminOrderDetail(id, { signal }),
    enabled: queryEnabled && Boolean(id),
    staleTime: 1000 * 15,
  })
}

export function useAdminOrderTracking(orderId, { enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  const id = String(orderId || '').trim()
  return useQuery({
    queryKey: adminKeys.orderTracking(id),
    queryFn: ({ signal }) => getAdminOrderTracking(id, { signal }),
    enabled: queryEnabled && Boolean(id),
    staleTime: 1000 * 15,
  })
}

export function useBulkConfirmOrders() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bulkConfirmOrders,
    onSuccess: (_data, orderIds) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.ordersSummary() })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders-list'] })
      const ids = Array.isArray(orderIds) ? orderIds : []
      for (const id of ids) {
        queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(id) })
      }
    },
  })
}

export function useBulkCancelOrders() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderIds, reason }) => bulkCancelOrders(orderIds, reason),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.ordersSummary() })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders-list'] })
      const ids = Array.isArray(vars?.orderIds) ? vars.orderIds : []
      for (const id of ids) {
        queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(id) })
      }
    },
  })
}

export function useBulkShipNowOrders() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderIds) => bulkShipNowOrders(orderIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.ordersSummary() })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders-list'] })
    },
  })
}

export function useBulkSchedulePickupOrders() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderIds, pickupDate }) => bulkSchedulePickupOrders(orderIds, pickupDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.ordersSummary() })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders-list'] })
    },
  })
}

export function useBulkSyncShiprocketOrders() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderIds) => bulkSyncShiprocketOrders(orderIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.ordersSummary() })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders-list'] })
    },
  })
}

export function useDownloadBulkTaxInvoicesZip() {
  return useMutation({ mutationFn: downloadBulkTaxInvoicesZip })
}

export function useDownloadBulkShippingLabelsZip() {
  return useMutation({ mutationFn: downloadBulkShippingLabelsZip })
}

export function useDownloadBulkManifestsZip() {
  return useMutation({ mutationFn: downloadBulkManifestsZip })
}

export function useDecideAdminReturnRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, decision, decisionReason }) =>
      decideAdminReturnRequest(orderId, { decision, decisionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.returns() })
    },
  })
}

export function useInitiateAdminReturnRefund() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: initiateAdminReturnRefund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.returns() })
    },
  })
}

export function useRetryAdminReturnReversePickup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: retryAdminReturnReversePickup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.returns() })
    },
  })
}

export function useExportAdminUsers() {
  return useMutation({ mutationFn: exportAdminUsers })
}

export function useEnsureAdminOrderShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ensureAdminOrderShipment,
    onSuccess: (_d, orderId) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(orderId) })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders-list'] })
      queryClient.invalidateQueries({ queryKey: adminKeys.ordersSummary() })
    },
  })
}

export function useAssignAdminOrderShip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, courierId, confirmSubstitute }) =>
      assignAdminOrderShip(orderId, { courierId, confirmSubstitute }),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(vars.orderId) })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders-list'] })
    },
  })
}

export function useScheduleAdminOrderPickup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, pickupDate }) => scheduleAdminOrderPickup(orderId, pickupDate),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(vars.orderId) })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders-list'] })
    },
  })
}

export function useSyncAdminOrderShiprocket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: syncAdminOrderShiprocket,
    onSuccess: (_d, orderId) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(orderId) })
      queryClient.invalidateQueries({ queryKey: adminKeys.orderTracking(orderId) })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders-list'] })
    },
  })
}

export function useGenerateAdminOrderManifest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generateAdminOrderManifest,
    onSuccess: (_d, orderId) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(orderId) })
    },
  })
}

export function useGenerateAdminOrderShippingLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generateAdminOrderShippingLabel,
    onSuccess: (_d, orderId) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(orderId) })
    },
  })
}

export function useCancelAdminOrderShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelAdminOrderShipment,
    onSuccess: (_d, orderId) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(orderId) })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders-list'] })
    },
  })
}

export function useRetryAdminOrderPickup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: retryAdminOrderPickup,
    onSuccess: (_d, orderId) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(orderId) })
    },
  })
}

export function useAdminAddressIntelligence(orderId, { refresh = false, enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  const id = String(orderId || '').trim()
  return useQuery({
    queryKey: [...adminKeys.orderDetail(id), 'address-intel', refresh ? 1 : 0],
    queryFn: ({ signal }) => getAdminAddressIntelligence(id, { signal, refresh }),
    enabled: queryEnabled && Boolean(id),
    staleTime: 1000 * 60,
  })
}

export function useAdminPickupCalendar({ enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: [...adminKeys.all, 'pickup-calendar'],
    queryFn: ({ signal }) => getAdminPickupCalendar({ signal }),
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 5,
  })
}

export function usePrintAdminOrderInvoice() {
  return useMutation({
    mutationFn: async (orderId) => {
      const html = await fetchAdminOrderInvoiceHtml(orderId)
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const w = window.open(url, '_blank', 'noopener,noreferrer')
      if (!w) {
        URL.revokeObjectURL(url)
        throw new Error('Pop-up blocked — allow pop-ups to print the invoice.')
      }
      const runPrint = () => {
        try {
          w.focus()
          w.print()
        } catch {
          /* ignore */
        }
      }
      w.addEventListener('load', runPrint, { once: true })
      if (w.document?.readyState === 'complete') setTimeout(runPrint, 0)
      setTimeout(() => URL.revokeObjectURL(url), 180000)
    },
  })
}

export function useDownloadAdminOrderShippingLabel() {
  return useMutation({
    mutationFn: ({ orderId, provider }) =>
      downloadAdminOrderShippingLabelFile(orderId, { provider }),
  })
}

export function useDownloadAdminOrderManifest() {
  return useMutation({
    mutationFn: downloadAdminOrderManifestFile,
  })
}

export function useAutoSyncOrderStatuses() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: autoSyncOrderStatuses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'orders-summary'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders-list'] })
    },
  })
}

export function useAdminProductsAll({ page = 1, search = '', limit = 50, enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.productsAll(page, search, limit),
    queryFn: ({ signal }) => getAdminProductsAll({ signal, page, search, limit }),
    enabled: queryEnabled,
    staleTime: 1000 * 30,
  })
}

export function useAdminProductsActiveCount({ enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.productsActive(),
    queryFn: ({ signal }) => getAdminProductsActiveCount({ signal }),
    enabled: queryEnabled,
    staleTime: 1000 * 60,
  })
}

export function useAdminProductsLowStock({ page = 1, limit = 100, enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: [...adminKeys.productsLowStock(), page, limit],
    queryFn: ({ signal }) => getAdminProductsLowStock({ signal, page, limit }),
    enabled: queryEnabled,
    staleTime: 1000 * 60,
  })
}

export function useAdminProductsArchived({ page = 1, enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.productsArchived(page),
    queryFn: ({ signal }) => getAdminProductsArchived({ signal, page }),
    enabled: queryEnabled,
    staleTime: 1000 * 30,
  })
}

export function useRestoreAdminProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: restoreAdminProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products-archived'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products-all'] })
    },
  })
}

export function useHardDeleteAdminProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: hardDeleteAdminProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products-archived'] })
    },
  })
}

export function useAdminCategories({ enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: [...adminKeys.all, 'categories'],
    queryFn: ({ signal }) => getAdminCategories({ signal }),
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 5,
  })
}

export function useExportAdminProducts() {
  return useMutation({ mutationFn: exportAdminProducts })
}

export function useCreateAdminProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products-all'] }),
  })
}

export function useUpdateAdminProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slug, formData }) => updateAdminProduct(slug, formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products-all'] }),
  })
}

export function useArchiveAdminProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: archiveAdminProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products-all'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products-archived'] })
    },
  })
}

export function useToggleAdminProductFeatured() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slug, isFeatured }) => toggleAdminProductFeatured(slug, isFeatured),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products-all'] }),
  })
}

export function useBulkUpdateAdminProductStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bulkUpdateAdminProductStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products-all'] }),
  })
}

export function useBulkUpdateAdminProductFlags() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bulkUpdateAdminProductFlags,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products-all'] }),
  })
}

export function useAdminUsers({ page = 1, search = '', role = '', enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.users(page, search, role),
    queryFn: ({ signal }) => getAdminUsers({ signal, page, search, role }),
    enabled: queryEnabled,
    staleTime: 1000 * 30,
  })
}

export function useAdminUserDetail(userId, { enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  const id = String(userId || '').trim()
  return useQuery({
    queryKey: adminKeys.userDetail(id),
    queryFn: ({ signal }) => getAdminUserDetail(id, { signal }),
    enabled: queryEnabled && Boolean(id),
  })
}

export function useAdminCarts({ variant = 'all', page = 1, enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.carts(variant, page),
    queryFn: ({ signal }) => {
      if (variant === 'abandoned') return getAdminAbandonedCarts({ signal, page })
      if (variant === 'high-value') return getAdminHighValueCarts({ signal, page })
      return getAdminCarts({ signal, page })
    },
    enabled: queryEnabled,
    staleTime: 1000 * 30,
  })
}

export function useAdminWishlists({ variant = 'all', page = 1, enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.wishlists(variant, page),
    queryFn: ({ signal }) => {
      if (variant === 'stale') return getAdminStaleWishlists({ signal, page })
      return getAdminWishlists({ signal, page })
    },
    enabled: queryEnabled,
    staleTime: 1000 * 30,
  })
}

export function useAdminPopularWishlistProducts({ enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.wishlistsPopular(),
    queryFn: ({ signal }) => getAdminPopularWishlistProducts({ signal }),
    enabled: queryEnabled,
    staleTime: 1000 * 60,
  })
}

export function useAdminCoupons({ page = 1, status = 'all', search = '', enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.coupons(page, status, search),
    queryFn: ({ signal }) => getAdminCoupons({ signal, page, status, search }),
    enabled: queryEnabled,
    staleTime: 1000 * 30,
  })
}

export function useCreateAdminCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminCoupon,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  })
}

export function useUpdateAdminCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => updateAdminCoupon(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  })
}

export function useDeleteAdminCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminCoupon,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  })
}

export function useToggleAdminCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleAdminCoupon,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  })
}

export function useAdminFreeShippingOffers({
  page = 1,
  status = 'all',
  search = '',
  enabled = true,
} = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.freeShippingOffers(page, status, search),
    queryFn: ({ signal }) => getAdminFreeShippingOffers({ signal, page, status, search }),
    enabled: queryEnabled,
    staleTime: 1000 * 30,
  })
}

export function useCreateAdminFreeShippingOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminFreeShippingOffer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'free-shipping-offers'] }),
  })
}

export function useUpdateAdminFreeShippingOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => updateAdminFreeShippingOffer(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'free-shipping-offers'] }),
  })
}

export function useDeleteAdminFreeShippingOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminFreeShippingOffer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'free-shipping-offers'] }),
  })
}

export function useToggleAdminFreeShippingOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleAdminFreeShippingOffer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'free-shipping-offers'] }),
  })
}

export function useAdminStaff({ page = 1, search = '', enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.staff(page, search),
    queryFn: ({ signal }) => getAdminStaff({ signal, page, search }),
    enabled: queryEnabled,
    staleTime: 1000 * 30,
  })
}

export function useAdminStaffProfile({ enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.staffProfile(),
    queryFn: ({ signal }) => getAdminStaffProfile({ signal }),
    enabled: queryEnabled,
  })
}

export function useCreateAdminStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminStaff,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] }),
  })
}

export function useUpdateAdminStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => updateAdminStaff(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] }),
  })
}

export function useDeleteAdminStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminStaff,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] }),
  })
}

export function useAdminReturnRequests({ page = 1, status = '', enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.returns(page, status),
    queryFn: ({ signal }) => getAdminReturnRequests({ signal, page, status }),
    enabled: queryEnabled,
    staleTime: 1000 * 30,
  })
}

export function useAdminReturnDetail(orderId, { enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  const id = String(orderId || '').trim()
  return useQuery({
    queryKey: adminKeys.returnDetail(id),
    queryFn: ({ signal }) => getAdminReturnDetail(id, { signal }),
    enabled: queryEnabled && Boolean(id),
  })
}

export function useAdminRtoOrders({ page = 1, enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.rtoOrders(page),
    queryFn: ({ signal }) => getAdminRtoOrders({ signal, page }),
    enabled: queryEnabled,
    staleTime: 1000 * 30,
  })
}

export function useAdminRtoAnalytics({ enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.rtoAnalytics(),
    queryFn: ({ signal }) => getAdminRtoAnalytics({ signal }),
    enabled: queryEnabled,
    staleTime: 1000 * 60,
  })
}

export function useAdminOosInquiries({
  page = 1,
  status = 'all',
  search = '',
  enabled = true,
} = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.oosInquiries(page, status, search),
    queryFn: ({ signal }) => getAdminOosInquiries({ signal, page, status, search }),
    enabled: queryEnabled,
    staleTime: 1000 * 30,
  })
}

export function useUpdateAdminOosInquiryStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, adminNote }) => updateAdminOosInquiryStatus(id, { status, adminNote }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'oos'] }),
  })
}
