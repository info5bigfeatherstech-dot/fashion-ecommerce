import { useQuery } from '@tanstack/react-query'
import { getPublicCategories } from './api'
import { categoryKeys } from './queryKeys'

export function useCircleCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: ({ signal }) => getPublicCategories({ signal }),
    staleTime: 1000 * 60 * 5,
  })
}
