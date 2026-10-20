import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  generateMyReferral,
  getMyReferral,
  getPublicReferralSettings,
  validateReferral,
} from './api'
import { useAppStore } from '@/store'

export const referralKeys = {
  all: ['referral'],
  settings: () => [...referralKeys.all, 'settings'],
  me: () => [...referralKeys.all, 'me'],
}

export function usePublicReferralSettings({ enabled = true } = {}) {
  return useQuery({
    queryKey: referralKeys.settings(),
    queryFn: ({ signal }) => getPublicReferralSettings({ signal }),
    enabled,
    staleTime: 1000 * 60,
  })
}

export function useMyReferral({ enabled = true } = {}) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)

  return useQuery({
    queryKey: referralKeys.me(),
    queryFn: ({ signal }) => getMyReferral({ signal }),
    enabled: enabled && isAuthenticated && Boolean(accessToken),
    staleTime: 1000 * 30,
  })
}

export function useGenerateReferral() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generateMyReferral,
    onSuccess: (data) => {
      queryClient.setQueryData(referralKeys.me(), data)
      queryClient.invalidateQueries({ queryKey: referralKeys.me() })
    },
  })
}

export function useValidateReferral() {
  return useMutation({
    mutationFn: validateReferral,
  })
}
