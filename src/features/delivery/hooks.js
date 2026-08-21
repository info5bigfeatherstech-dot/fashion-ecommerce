import { useMutation, useQuery } from '@tanstack/react-query'
import { checkDelivery, getDeliveryCharges } from './api'
import { deliveryKeys } from './queryKeys'
import { useAppStore } from '@/store'

export function useCheckDelivery() {
  return useMutation({
    mutationFn: checkDelivery,
  })
}

export function useDeliveryCharges(pincode, { weight = 1, enabled = true } = {}) {
  const pin = String(pincode || '').trim()

  return useQuery({
    queryKey: deliveryKeys.charges(pin, weight),
    queryFn: ({ signal }) => getDeliveryCharges(pin, { weight, signal }),
    enabled: enabled && pin.length >= 5,
    staleTime: 1000 * 60 * 5,
  })
}

/** Convenience: check deliverability for the selected checkout address pincode. */
export function useDeliveryCheckQuery(pincode, { enabled = true, cartId } = {}) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)
  const pin = String(pincode || '').trim()

  return useQuery({
    queryKey: [...deliveryKeys.check(pin), cartId || 'cart'],
    queryFn: () => checkDelivery({ pincode: pin, cartId }),
    enabled: enabled && isAuthenticated && Boolean(accessToken) && pin.length >= 5,
    staleTime: 1000 * 60 * 2,
    retry: false,
  })
}
