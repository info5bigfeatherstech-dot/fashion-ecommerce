import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient, useQueries } from '@tanstack/react-query'
import { getCart, clearCartApi } from '@/features/cart/api'
import { cartKeys } from '@/features/cart/queryKeys'
import { getProductBySlug, getProductDetailedById } from '@/features/product/api'
import { productKeys } from '@/features/product/queryKeys'
import { useAppStore } from '@/store'

/**
 * Server cart query — keeps Zustand mirror in sync when authenticated.
 */
export function useCart({ enabled = true } = {}) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)
  const replaceCartFromApi = useAppStore((s) => s.replaceCartFromApi)

  const query = useQuery({
    queryKey: cartKeys.detail(),
    queryFn: ({ signal }) => getCart({ signal }),
    enabled: enabled && isAuthenticated && Boolean(accessToken),
    staleTime: 1000 * 30,
  })

  useEffect(() => {
    if (query.data) replaceCartFromApi(query.data)
  }, [query.dataUpdatedAt, query.data, replaceCartFromApi])

  return query
}

export function useClearCartMutation() {
  const queryClient = useQueryClient()
  const replaceCartFromApi = useAppStore((s) => s.replaceCartFromApi)

  return useMutation({
    mutationFn: clearCartApi,
    onSuccess: (cart) => {
      replaceCartFromApi(cart)
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
  })
}

/**
 * Hydrate cart rows with live product details (productCode, price, image).
 * Display-only — does not write back into the cart store (avoids update loops).
 */
export function useCartProducts(cartItems = [], { enabled = true } = {}) {
  const queries = useQueries({
    queries: cartItems.map((item) => {
      const slug = String(item?.slug || '').trim()
      const id = String(item?.productId || item?.id || '').trim()

      return {
        queryKey: slug ? productKeys.detail(slug) : productKeys.detailedById(id),
        queryFn: ({ signal }) => (
          slug
            ? getProductBySlug(slug, { signal })
            : getProductDetailedById(id, { signal })
        ),
        enabled: enabled && Boolean(slug || id),
        staleTime: 1000 * 60 * 5,
      }
    }),
  })

  const dataSignature = queries.map((q) => `${q.status}:${q.dataUpdatedAt}`).join('|')
  const itemsSignature = cartItems.map((item) => `${item.id}:${item.quantity}`).join('|')

  const products = useMemo(() => (
    cartItems.map((item, index) => {
      const live = queries[index]?.data
      if (!live) {
        return {
          ...item,
          productCode: item.productCode || item.sku || null,
          _hydrated: false,
          _isLoading: Boolean(queries[index]?.isPending || queries[index]?.isFetching),
        }
      }

      return {
        ...item,
        name: live.name || item.name,
        slug: live.slug || item.slug,
        price: item.price ?? live.price,
        originalPrice: item.originalPrice ?? live.originalPrice ?? null,
        image: item.image || live.images?.[0],
        productCode: item.productCode || live.productCode || live.sku || null,
        _hydrated: true,
        _isLoading: false,
      }
    })
  ), [cartItems, dataSignature, itemsSignature]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    products,
    isLoading: queries.length > 0 && queries.some((q) => q.isPending),
  }
}
