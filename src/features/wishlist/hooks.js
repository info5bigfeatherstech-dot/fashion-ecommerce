import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { getProductBySlug, getProductDetailedById } from '@/features/product/api'
import { productKeys } from '@/features/product/queryKeys'

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
          image: live.images?.[0] || item.image,
          productCode: live.productCode || live.sku || item.productCode || null,
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
