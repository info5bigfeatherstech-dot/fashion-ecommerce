import { useMutation, useQuery } from '@tanstack/react-query'
import { getAvailableCoupons, validateCoupon } from './api'
import { couponKeys } from './queryKeys'
import { useAppStore } from '@/store'

export function useAvailableCoupons({ enabled = true } = {}) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)

  return useQuery({
    queryKey: couponKeys.available(),
    queryFn: ({ signal }) => getAvailableCoupons({ signal }),
    enabled: enabled && isAuthenticated && Boolean(accessToken),
    staleTime: 1000 * 60,
  })
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: validateCoupon,
  })
}
