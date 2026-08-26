import { useQuery } from '@tanstack/react-query'
import {
  getProducts,
  getProductBySlug,
  getProductDetailedById,
  getBestsellers,
  getNewArrivals,
  getBeautyProducts,
  getFeaturedProducts,
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

export function useProductsByTag(tag, params = {}) {
  return useQuery({
    queryKey: productKeys.byTag(tag, params),
    queryFn: ({ signal }) => getProductsByTag(tag, { ...params, signal }),
    enabled: Boolean(tag),
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

export function useBestsellers() {
  return useQuery({
    queryKey: productKeys.bestsellers(),
    queryFn: getBestsellers,
  })
}

export function useFeaturedProducts({ limit = 12 } = {}) {
  return useQuery({
    queryKey: productKeys.featured(),
    queryFn: () => getFeaturedProducts({ limit }),
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
