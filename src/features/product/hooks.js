import { useQuery } from '@tanstack/react-query'
import {
  getProducts,
  getProductBySlug,
  getBestsellers,
  getNewArrivals,
  getBeautyProducts,
  getFeaturedProducts,
} from './api'
import { productKeys } from './queryKeys'

export function useProductListing(filters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => getProducts(filters),
  })
}

export function useProductDetail(slug) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
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
