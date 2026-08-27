import { useQuery } from '@tanstack/react-query'
import { getProductReviewsBundle } from './api'
import { reviewKeys } from './queryKeys'

export function useProductReviews(productId) {
  return useQuery({
    queryKey: reviewKeys.byProduct(productId),
    queryFn: ({ signal }) => getProductReviewsBundle(productId, { signal }),
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 2,
  })
}
