import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminLogin,
  adminLogout,
  autoSyncOrderStatuses,
  bulkCancelOrders,
  bulkConfirmOrders,
  createAdminCoupon,
  createAdminStaff,
  deleteAdminCoupon,
  deleteAdminStaff,
  getAdminAbandonedCarts,
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
  getAdminWishlists,
  getAdminPopularWishlistProducts,
  hardDeleteAdminProduct,
  restoreAdminProduct,
  testAdminShippingConnection,
  toggleAdminCoupon,
  updateAdminCheckoutSettings,
  updateAdminCoupon,
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

export function useAdminOrdersSummary({ enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.ordersSummary(),
    queryFn: ({ signal }) => getAdminOrdersSummary({ signal }),
    enabled: queryEnabled,
    staleTime: 1000 * 60,
  })
}

export function useAdminOrdersList({
  bucket = 'Pending',
  page = 1,
  search = '',
  enabled = true,
} = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.ordersList(bucket, page, search),
    queryFn: ({ signal }) => getAdminOrdersList({ signal, bucket, page, search }),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.ordersSummary() })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders-list'] })
    },
  })
}

export function useBulkCancelOrders() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderIds, reason }) => bulkCancelOrders(orderIds, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.ordersSummary() })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders-list'] })
    },
  })
}

export function useAutoSyncOrderStatuses() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: autoSyncOrderStatuses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.ordersSummary() })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders-list'] })
    },
  })
}

export function useAdminProductsAll({ page = 1, search = '', enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.productsAll(page, search),
    queryFn: ({ signal }) => getAdminProductsAll({ signal, page, search }),
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

export function useAdminProductsLowStock({ enabled = true } = {}) {
  const queryEnabled = useAdminQueryEnabled(enabled)
  return useQuery({
    queryKey: adminKeys.productsLowStock(),
    queryFn: ({ signal }) => getAdminProductsLowStock({ signal }),
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
