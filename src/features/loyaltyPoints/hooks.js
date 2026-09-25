import { useQuery } from '@tanstack/react-query'
import { getMyLoyaltyLedger, getMyLoyaltyPoints } from './api'
import { useAppStore } from '@/store'

export const loyaltyPointsKeys = {
  all: ['loyalty-points'],
  me: () => [...loyaltyPointsKeys.all, 'me'],
  ledger: (page = 1) => [...loyaltyPointsKeys.all, 'ledger', page],
}

export function useMyLoyaltyPoints({ enabled = true } = {}) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)

  return useQuery({
    queryKey: loyaltyPointsKeys.me(),
    queryFn: ({ signal }) => getMyLoyaltyPoints({ signal }),
    enabled: enabled && isAuthenticated && Boolean(accessToken),
    staleTime: 1000 * 30,
  })
}

export function useMyLoyaltyLedger({ page = 1, enabled = true } = {}) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)

  return useQuery({
    queryKey: loyaltyPointsKeys.ledger(page),
    queryFn: ({ signal }) => getMyLoyaltyLedger({ signal, page, limit: 50 }),
    enabled: enabled && isAuthenticated && Boolean(accessToken),
    staleTime: 1000 * 30,
  })
}
