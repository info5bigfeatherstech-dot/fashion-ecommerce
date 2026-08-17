import { useQuery } from '@tanstack/react-query'
import { getMemberStatus, getRewards } from './api'
import { loyaltyKeys } from './queryKeys'

export function useMemberStatus() {
  return useQuery({
    queryKey: loyaltyKeys.status(),
    queryFn: getMemberStatus,
  })
}

export function useRewards() {
  return useQuery({
    queryKey: loyaltyKeys.rewards(),
    queryFn: getRewards,
  })
}
