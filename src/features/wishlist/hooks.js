import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient, useQueries } from '@tanstack/react-query'
import {
  clearWishlistApi,
  getWishlist,
  moveWishlistToCart,
} from '@/features/wishlist/api'
import { wishlistKeys } from '@/features/wishlist/queryKeys'
import { cartKeys } from '@/features/cart/queryKeys'
import { getProductBySlug, getProductDetailedById } from '@/features/product/api'
import { productKeys } from '@/features/product/queryKeys'
import { getCart } from '@/features/cart/api'
import { useAppStore } from '@/store'

/**
 * Server wishlist query — keeps Zustand mirror in sync when authenticated.
 */
export function useWishlist({ enabled = true } = {}) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)
  const replaceWishlistFromApi = useAppStore((s) => s.replaceWishlistFromApi)

  const query = useQuery({
    queryKey: wishlistKeys.detail(),
    queryFn: ({ signal }) => getWishlist({ signal }),
    enabled: enabled && isAuthenticated && Boolean(accessToken),
    staleTime: 1000 * 30,
  })

  useEffect(() => {
    // Only mirror when the server query actually resolves/updates —
    // avoid pushing a cached snapshot over a newer optimistic remove.
    if (query.isSuccess && query.data && query.fetchStatus === 'idle') {
      replaceWishlistFromApi(query.data)
    }
  }, [query.isSuccess, query.dataUpdatedAt, query.fetchStatus, query.data, replaceWishlistFromApi])

  return query
}

export function useClearWishlistMutation() {
  const queryClient = useQueryClient()
  const replaceWishlistFromApi = useAppStore((s) => s.replaceWishlistFromApi)

  return useMutation({
    mutationFn: clearWishlistApi,
    onSuccess: (result) => {
      if (result.wishlist) replaceWishlistFromApi(result.wishlist)
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all })
    },
  })
}

export function useMoveWishlistToCart() {
  const queryClient = useQueryClient()
  const replaceCartFromApi = useAppStore((s) => s.replaceCartFromApi)
  const replaceWishlistFromApi = useAppStore((s) => s.replaceWishlistFromApi)

  return useMutation({
    mutationFn: moveWishlistToCart,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all })
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
      try {
        const [cart, wishlist] = await Promise.all([getCart(), getWishlist()])
        replaceCartFromApi(cart)
        replaceWishlistFromApi(wishlist)
      } catch {
        // invalidation will refetch via hooks when mounted
      }
    },
  })
}

/**
 * Hydrate local wishlist snapshots with live product details (incl. productCode)
 * via GET /products/:slug or GET /products/detailed/:id.
 */
export function useWishlistProducts(wishlistItems = [], { enabled = true } = {}) {
  const queries = useQueries({
    queries: wishlistItems.map((item) => {
      const slug = String(item?.slug || '').trim()
      const id = String(item?.id || '').trim()

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

  // Stabilize product list so consumers' effects don't re-fire every render.
  const dataSignature = queries.map((q) => `${q.status}:${q.dataUpdatedAt}:${q.fetchStatus}`).join('|')

  const products = useMemo(() => (
    wishlistItems.map((item, index) => {
      const query = queries[index]
      const live = query?.data

      if (live) {
        return {
          ...item,
          ...live,
          // Keep the wishlist row id stable so cart/wishlist matching doesn't thrash.
          id: item.id,
          slug: live.slug || item.slug,
          variantId: item.variantId || live.variants?.[0]?.id || null,
          image: item.image || live.images?.[0],
          productCode: item.productCode || live.productCode || live.sku || null,
          _hydrated: true,
          _isLoading: false,
          _isError: false,
        }
      }

      return {
        ...item,
        images: item.images?.length ? item.images : [item.image, item.image].filter(Boolean),
        productCode: item.productCode || item.sku || null,
        _hydrated: false,
        _isLoading: Boolean(query?.isPending || query?.isFetching),
        _isError: Boolean(query?.isError),
      }
    })
  ), [wishlistItems, dataSignature]) // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = queries.length > 0 && queries.some((q) => q.isPending)
  const isFetching = queries.some((q) => q.isFetching)

  return { products, isLoading, isFetching, queries }
}
