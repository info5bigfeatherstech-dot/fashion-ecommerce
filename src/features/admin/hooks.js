import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminLogin,
  adminLogout,
  getAdminCheckoutSettings,
  getAdminOrderDetail,
  getAdminOrdersList,
  getAdminOrdersSummary,
  updateAdminCheckoutSettings,
} from './api'
import { adminKeys } from './queryKeys'
import { useAdminStore } from './store'

export function useAdminLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminLogin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all })
    },
  })
}

export function useAdminLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminLogout,
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useAdminCheckoutSettings({ enabled = true } = {}) {
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: adminKeys.checkoutSettings(),
    queryFn: ({ signal }) => getAdminCheckoutSettings({ signal }),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 30,
  })
}

export function useUpdateAdminCheckoutSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateAdminCheckoutSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.checkoutSettings() })
    },
  })
}

export function useAdminOrdersSummary({ enabled = true } = {}) {
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: adminKeys.ordersSummary(),
    queryFn: ({ signal }) => getAdminOrdersSummary({ signal }),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 60,
  })
}

export function useAdminOrdersList({ bucket = 'Pending', page = 1, enabled = true } = {}) {
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: adminKeys.ordersList(bucket, page),
    queryFn: ({ signal }) => getAdminOrdersList({ signal, bucket, page }),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 20,
  })
}

export function useAdminOrderDetail(orderId, { enabled = true } = {}) {
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated)
  const id = String(orderId || '').trim()
  return useQuery({
    queryKey: adminKeys.orderDetail(id),
    queryFn: ({ signal }) => getAdminOrderDetail(id, { signal }),
    enabled: enabled && isAuthenticated && Boolean(id),
    staleTime: 1000 * 15,
  })
}
