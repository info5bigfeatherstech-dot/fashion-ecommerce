import { useMemo } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createReturnRequest,
  getOrderById,
  getOrderInvoice,
  getOrderTracking,
  getReturnChat,
  getUserOrders,
  initiatePendingOrderPayment,
  payOrderBalance,
  sendReturnChatMessage,
} from './api'
import { orderKeys } from './queryKeys'
import { getOrderItems, mergeOrderWithDetail } from './utils'
import { useAppStore } from '@/store'

export function useUserOrders({ enabled = true, refetchOnMount } = {}) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)

  return useQuery({
    queryKey: orderKeys.list(),
    queryFn: ({ signal }) => getUserOrders({ signal }),
    enabled: enabled && isAuthenticated && Boolean(accessToken),
    staleTime: 1000 * 30,
    ...(refetchOnMount !== undefined ? { refetchOnMount } : {}),
  })
}

export function useOrderDetail(orderId, { enabled = true } = {}) {
  const id = String(orderId || '').trim()
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)

  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: ({ signal }) => getOrderById(id, { signal }),
    enabled: enabled && isAuthenticated && Boolean(accessToken) && Boolean(id),
    staleTime: 1000 * 15,
  })
}

export function useOrderTracking(orderId, { enabled = true } = {}) {
  const id = String(orderId || '').trim()
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)

  return useQuery({
    queryKey: orderKeys.tracking(id),
    queryFn: ({ signal }) => getOrderTracking(id, { signal }),
    enabled: enabled && isAuthenticated && Boolean(accessToken) && Boolean(id),
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useOrderInvoice(orderId, { enabled = false } = {}) {
  const id = String(orderId || '').trim()
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)

  return useQuery({
    queryKey: orderKeys.invoice(id),
    queryFn: ({ signal }) => getOrderInvoice(id, { signal }),
    enabled: enabled && isAuthenticated && Boolean(accessToken) && Boolean(id),
    staleTime: 1000 * 60 * 10,
  })
}

export function useReturnChat(orderId, { enabled = true } = {}) {
  const id = String(orderId || '').trim()
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)

  return useQuery({
    queryKey: orderKeys.returnChat(id),
    queryFn: ({ signal }) => getReturnChat(id, { signal }),
    enabled: enabled && isAuthenticated && Boolean(accessToken) && Boolean(id),
    refetchInterval: 1000 * 15, // poll every 15s when open
  })
}

export function useCreateReturnRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, data }) => createReturnRequest(orderId, data),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.list() })
      queryClient.invalidateQueries({ queryKey: orderKeys.returnChat(orderId) })
    },
  })
}

export function useSendReturnChatMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, message }) => sendReturnChatMessage(orderId, message),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.returnChat(orderId) })
    },
  })
}

export function useInitiateOrderPayment() {
  return useMutation({
    mutationFn: initiatePendingOrderPayment,
  })
}

export function usePayOrderBalance() {
  return useMutation({
    mutationFn: payOrderBalance,
  })
}

export function useInvalidateOrders() {
  const queryClient = useQueryClient()

  return (orderId) => {
    queryClient.invalidateQueries({ queryKey: orderKeys.list() })
    if (orderId) {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.tracking(orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.invoice(orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.returnChat(orderId) })
    }
  }
}

/** Hydrate list rows with item previews when GET /orders/items omits populated lines. */
export function useOrdersWithDetails(orders = [], { enabled = true } = {}) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)

  const idsNeedingDetail = useMemo(
    () =>
      orders
        .filter((order) => getOrderItems(order).length === 0 && order.orderId)
        .map((order) => order.orderId),
    [orders]
  )

  const detailQueries = useQueries({
    queries: idsNeedingDetail.map((orderId) => ({
      queryKey: orderKeys.detail(orderId),
      queryFn: ({ signal }) => getOrderById(orderId, { signal }),
      enabled: enabled && isAuthenticated && Boolean(accessToken) && Boolean(orderId),
      staleTime: 1000 * 30,
    })),
  })

  const detailById = useMemo(() => {
    const map = new Map()
    idsNeedingDetail.forEach((orderId, index) => {
      const detail = detailQueries[index]?.data
      if (detail) map.set(orderId, detail)
    })
    return map
  }, [detailQueries, idsNeedingDetail])

  const isHydrating = detailQueries.some((query) => query.isLoading || query.isFetching)

  const enrichedOrders = useMemo(
    () => orders.map((order) => mergeOrderWithDetail(order, detailById.get(order.orderId))),
    [detailById, orders]
  )

  return { orders: enrichedOrders, isHydrating }
}
