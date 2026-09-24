import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import {
  getProducts,
  getProductBySlug,
  getProductDetailedById,
  getBestsellers,
  getHomeBestsellers,
  getNewArrivals,
  getBeautyProducts,
  getFeaturedProducts,
  getJewellerySpotted,
  getProductsByCategory,
  getProductsByTag,
  getRelatedProducts,
  searchProducts,
} from './api'
import { productKeys } from './queryKeys'

export function useProductListing(filters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => getProducts(filters),
  })
}

export function useInfiniteProductListing(filters = {}) {
  return useInfiniteQuery({
    queryKey: productKeys.infiniteList(filters),
    queryFn: ({ pageParam = 1, signal }) =>
      getProducts({ ...filters, page: pageParam, limit: 50 }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage?.pagination?.hasNextPage) {
        return (lastPage?.pagination?.page || allPages.length) + 1
      }
      const loadedCount = allPages.reduce((acc, p) => acc + (p?.products?.length || 0), 0)
      const total = lastPage?.pagination?.total ?? lastPage?.total ?? 0
      if (total > loadedCount && (lastPage?.products?.length || 0) > 0) {
        return allPages.length + 1
      }
      // If a full batch of 50 products was returned, allow loading next page
      if ((lastPage?.products?.length || 0) >= 50) {
        return (lastPage?.pagination?.page || allPages.length) + 1
      }
      return undefined
    },
  })
}

export function useProductsByTag(tag, params = {}) {
  return useQuery({
    queryKey: productKeys.byTag(tag, params),
    queryFn: ({ signal }) => getProductsByTag(tag, { ...params, signal }),
    enabled: Boolean(tag),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  })
}

export function useProductDetail(slug) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: ({ signal }) => getProductBySlug(slug, { signal }),
    enabled: !!slug,
  })
}

export function useProductDetailedById(id) {
  return useQuery({
    queryKey: productKeys.detailedById(id),
    queryFn: ({ signal }) => getProductDetailedById(id, { signal }),
    enabled: !!id,
  })
}

export function useProductsByCategory(slug, params = {}) {
  return useQuery({
    queryKey: productKeys.byCategory(slug, params),
    queryFn: ({ signal }) => getProductsByCategory(slug, { ...params, signal }),
    enabled: !!slug,
  })
}

export function useRelatedProducts(slug, { limit = 8, categorySlug, enabled = true } = {}) {
  return useQuery({
    queryKey: productKeys.related(slug, categorySlug || ''),
    queryFn: ({ signal }) => getRelatedProducts(slug, { signal, limit, categorySlug }),
    enabled: Boolean(slug) && enabled,
  })
}

export function useProductSearch(query, { page = 1, limit = 12 } = {}) {
  const q = String(query || '').trim()

  return useQuery({
    queryKey: productKeys.search(q, { page, limit }),
    queryFn: ({ signal }) => searchProducts(q, { page, limit, signal }),
    enabled: q.length >= 2,
  })
}

export function useBestsellers({ limit = 20 } = {}) {
  return useQuery({
    queryKey: [...productKeys.bestsellers(), limit],
    queryFn: ({ signal }) => getBestsellers({ limit, signal }),
  })
}

export function useHomeBestsellers({ limit = 20 } = {}) {
  return useQuery({
    queryKey: [...productKeys.bestsellers(), 'home', limit],
    queryFn: ({ signal }) => getHomeBestsellers({ limit, signal }),
    staleTime: 1000 * 60,
  })
}

export function useFeaturedProducts({ limit = 50 } = {}) {
  return useQuery({
    queryKey: [...productKeys.featured(), limit],
    queryFn: () => getFeaturedProducts({ limit }),
    staleTime: 1000 * 60,
  })
}

export function useNewArrivals() {
  return useQuery({
    queryKey: productKeys.newArrivals(),
    queryFn: getNewArrivals,
  })
}

export function useBeautyProducts() {
  return useQuery({
    queryKey: productKeys.beauty(),
    queryFn: getBeautyProducts,
  })
}

export function useJewellerySpotted({ limit = 12 } = {}) {
  return useQuery({
    queryKey: [...productKeys.byTag('jewellery-spotted'), limit],
    queryFn: ({ signal }) => getJewellerySpotted({ limit, signal }),
  })
}
