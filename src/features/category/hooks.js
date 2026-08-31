import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getPublicCategories, getMovingFastCategories } from './api'
import { categoryKeys } from './queryKeys'
import { buildFooterShopLinks, buildHeaderNavItems, findCategoryLabel } from './nav'

export function useCircleCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: ({ signal }) => getPublicCategories({ signal }),
    staleTime: 1000 * 60 * 5,
    // Keep last good list on background refetch failure (production-safe UX)
    placeholderData: (previous) => previous,
    retry: 2,
  })
}

export function useMovingFastCategories() {
  return useQuery({
    queryKey: categoryKeys.movingFast(),
    queryFn: ({ signal }) => getMovingFastCategories({ signal }),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous,
    retry: 2,
  })
}

/** Header nav: Home + live backend categories. */
export function useHeaderNavItems() {
  const query = useCircleCategories()
  const navItems = useMemo(
    () => buildHeaderNavItems(query.data || []),
    [query.data]
  )
  return { ...query, navItems }
}

/** Footer shop links from the same category source. */
export function useFooterShopLinks() {
  const query = useCircleCategories()
  const links = useMemo(
    () => buildFooterShopLinks(query.data || []),
    [query.data]
  )
  return { ...query, links }
}

export function useCategoryLabel(slug) {
  const { data: categories = [] } = useCircleCategories()
  return useMemo(() => findCategoryLabel(categories, slug), [categories, slug])
}
