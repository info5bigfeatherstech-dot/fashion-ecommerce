import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient, useQueries } from '@tanstack/react-query'
import { getCart, clearCartApi } from '@/features/cart/api'
import { cartKeys } from '@/features/cart/queryKeys'
import { getProductBySlug, getProductDetailedById } from '@/features/product/api'
import { productKeys } from '@/features/product/queryKeys'
import { useAppStore } from '@/store'

/** Only fetch product details when the cart row is missing display fields. */
export function cartItemNeedsHydration(item) {
  if (!item) return false
  const slug = String(item.slug || '').trim()
  const productId = String(item.productId || '').trim()
  if (!slug && !productId) return false

  const hasName = Boolean(String(item.name || '').trim() && item.name !== 'Product')
  const hasImage = Boolean(item.image)
  const hasPrice = item.price != null && Number.isFinite(Number(item.price))

  return !hasName || !hasImage || !hasPrice
}

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
    staleTime: 1000 * 60 * 2,
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
      const id = String(item?.productId || '').trim()
      const needsHydration = cartItemNeedsHydration(item)

      return {
        queryKey: slug ? productKeys.detail(slug) : productKeys.detailedById(id),
        queryFn: ({ signal }) => (
          slug
            ? getProductBySlug(slug, { signal })
            : getProductDetailedById(id, { signal })
        ),
        enabled: enabled && needsHydration && Boolean(slug || id),
        staleTime: 1000 * 60 * 5,
      }
    }),
  })

  const dataSignature = queries.map((q) => `${q.status}:${q.dataUpdatedAt}`).join('|')
  const itemsSignature = cartItems.map((item) => `${item.id}:${item.quantity}`).join('|')

  const products = useMemo(() => (
    cartItems.map((item, index) => {
      if (!cartItemNeedsHydration(item)) {
        return { ...item, _hydrated: true, _isLoading: false }
      }

      const live = queries[index]?.data
      if (!live) {
        return {
          ...item,
          productCode: item.productCode || null,
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
        productCode: live.productCode || item.productCode || null,
        _hydrated: true,
        _isLoading: false,
      }
    })
  ), [cartItems, dataSignature, itemsSignature]) // eslint-disable-line react-hooks/exhaustive-deps

  const pendingIndexes = cartItems
    .map((item, index) => (cartItemNeedsHydration(item) ? index : -1))
    .filter((index) => index >= 0)

  return {
    products,
    isLoading: pendingIndexes.some((index) => queries[index]?.isPending),
  }
}
