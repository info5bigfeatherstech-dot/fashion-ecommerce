import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getMyProductReview,
  getProductReviewEligibility,
  getProductReviewsBundle,
  submitProductReview,
} from './api'
import { reviewKeys } from './queryKeys'
import { useAppStore } from '@/store'

export function useProductReviews(productId) {
  return useQuery({
    queryKey: reviewKeys.byProduct(productId),
    queryFn: ({ signal }) => getProductReviewsBundle(productId, { signal }),
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 2,
  })
}

export function useMyProductReview(productId) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)

  return useQuery({
    queryKey: reviewKeys.mine(productId),
    queryFn: ({ signal }) => getMyProductReview(productId, { signal }),
    enabled: Boolean(productId) && isAuthenticated && Boolean(accessToken),
    staleTime: 1000 * 60,
  })
}

export function useProductReviewEligibility(productId) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)

  return useQuery({
    queryKey: reviewKeys.eligibility(productId),
    queryFn: ({ signal }) => getProductReviewEligibility(productId, { signal }),
    enabled: Boolean(productId) && isAuthenticated && Boolean(accessToken),
    staleTime: 1000 * 60,
  })
}

export function useSubmitProductReview(productId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => submitProductReview({ ...payload, productId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewKeys.byProduct(productId) }),
        queryClient.invalidateQueries({ queryKey: reviewKeys.mine(productId) }),
        queryClient.invalidateQueries({ queryKey: reviewKeys.eligibility(productId) }),
      ])
    },
  })
}
