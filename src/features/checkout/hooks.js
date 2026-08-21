import { useQuery } from '@tanstack/react-query'
import { getCheckoutSettings } from './api'
import { checkoutKeys } from './queryKeys'
import { useAppStore } from '@/store'

export function useCheckoutSettings({ enabled = true } = {}) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)

  return useQuery({
    queryKey: checkoutKeys.settings(),
    queryFn: ({ signal }) => getCheckoutSettings({ signal }),
    enabled: enabled && isAuthenticated && Boolean(accessToken),
    staleTime: 1000 * 60 * 5,
  })
}
