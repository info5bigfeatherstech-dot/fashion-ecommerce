import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from './api'
import { addressKeys } from './queryKeys'
import { useAppStore } from '@/store'

export function useAddresses({ enabled = true, refetchOnMount } = {}) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const authReady = useAppStore((s) => s.authReady)
  const accessToken = useAppStore((s) => s.accessToken)
  const userId = useAppStore((s) => s.user?.id)

  return useQuery({
    queryKey: addressKeys.list(userId),
    queryFn: ({ signal }) => listAddresses({ signal }),
    enabled: enabled && authReady && isAuthenticated && Boolean(accessToken),
    ...(refetchOnMount !== undefined ? { refetchOnMount } : {}),
  })
}

export function useCreateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all })
    },
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }) => updateAddress(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all })
    },
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all })
    },
  })
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all })
    },
  })
}
