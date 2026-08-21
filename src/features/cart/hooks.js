import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { getProductBySlug, getProductDetailedById } from '@/features/product/api'
import { productKeys } from '@/features/product/queryKeys'

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
        price: live.price ?? item.price,
        originalPrice: live.originalPrice ?? item.originalPrice ?? null,
        image: live.images?.[0] || item.image,
        productCode: live.productCode || live.sku || item.productCode || null,
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
