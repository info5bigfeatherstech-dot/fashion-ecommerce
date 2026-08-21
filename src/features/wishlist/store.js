import {
  addWishlistItem,
  removeWishlistItemBySlug,
} from '@/features/wishlist/api'
import { wishlistKeys } from '@/features/wishlist/queryKeys'
import { notifyWishlistError } from '@/lib/cart-toast'
import { resolveVariantId } from '@/features/product/mappers'
import { getProductBySlug } from '@/features/product/api'
import { queryClient } from '@/api/queryClient'

async function ensureWishlistVariantId(product) {
  let variantId = product?.variantId || resolveVariantId(product, {})
  if (variantId) return variantId

  const slug = product?.slug
  if (!slug) return null

  try {
    const detailed = await getProductBySlug(slug)
    return resolveVariantId(detailed, {})
  } catch {
    return null
  }
}

export const wishlistSlice = (set, get) => ({
  wishlistItems: [],

  replaceWishlistFromApi: (wishlist) => {
    const nextProducts = Array.isArray(wishlist?.products) ? wishlist.products : []
    const normalized = wishlist && typeof wishlist === 'object'
      ? { ...wishlist, products: nextProducts }
      : { id: null, products: nextProducts }

    // Always refresh the query cache so stale data cannot resurrect removed items.
    queryClient.setQueryData(wishlistKeys.detail(), normalized)

    const current = get().wishlistItems
    const same = (
      current.length === nextProducts.length
      && current.every((item, index) => {
        const next = nextProducts[index]
        return next && String(item.id) === String(next.id) && item.variantId === next.variantId
      })
    )
    if (same) return

    set({ wishlistItems: nextProducts })
  },

  addToWishlist: async (product) => {
    const previous = get().wishlistItems
    if (previous.some((item) => String(item.id) === String(product.id))) return

    const optimistic = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images?.[0] || product.image,
      badge: product.badge,
      rating: product.rating,
      reviewCount: product.reviewCount,
      productCode: product.productCode || product.sku || null,
      variantId: product.variantId || resolveVariantId(product, {}) || null,
    }

    const nextItems = [...previous, optimistic]
    set({ wishlistItems: nextItems })
    queryClient.setQueryData(wishlistKeys.detail(), (old) => ({
      id: old?.id ?? null,
      products: nextItems,
      userType: old?.userType ?? null,
      storefront: old?.storefront ?? 'ecomm',
    }))

    if (!get().accessToken) return

    try {
      const variantId = await ensureWishlistVariantId(product)
      if (!product.slug || !variantId) {
        throw new Error('Could not resolve product variant')
      }

      const result = await addWishlistItem({
        productSlug: product.slug,
        variantId,
      })
      if (result.wishlist) get().replaceWishlistFromApi(result.wishlist)
    } catch (error) {
      const already = String(error?.message || '').toLowerCase().includes('already')
      if (already) return
      set({ wishlistItems: previous })
      queryClient.setQueryData(wishlistKeys.detail(), (old) => ({
        id: old?.id ?? null,
        products: previous,
        userType: old?.userType ?? null,
        storefront: old?.storefront ?? 'ecomm',
      }))
      notifyWishlistError(error)
    }
  },

  /** Merge fresher API fields (e.g. productCode) into a saved wishlist row. */
  patchWishlistItem: (productId, patch) => {
    set((state) => ({
      wishlistItems: state.wishlistItems.map((item) => (
        item.id === productId ? { ...item, ...patch } : item
      )),
    }))
  },

  removeFromWishlist: async (productId) => {
    const previous = get().wishlistItems
    const target = previous.find((item) => String(item.id) === String(productId))
    if (!target) return

    const nextItems = previous.filter((item) => String(item.id) !== String(productId))
    set({ wishlistItems: nextItems })
    queryClient.setQueryData(wishlistKeys.detail(), (old) => ({
      id: old?.id ?? null,
      products: nextItems,
      userType: old?.userType ?? null,
      storefront: old?.storefront ?? 'ecomm',
    }))

    const slug = target.slug
    if (!get().accessToken) return

    if (!slug) {
      set({ wishlistItems: previous })
      queryClient.setQueryData(wishlistKeys.detail(), (old) => ({
        id: old?.id ?? null,
        products: previous,
        userType: old?.userType ?? null,
        storefront: old?.storefront ?? 'ecomm',
      }))
      notifyWishlistError(new Error('Missing product slug — could not remove from wishlist'))
      return
    }

    try {
      const result = await removeWishlistItemBySlug(slug)
      get().replaceWishlistFromApi(result.wishlist || { products: nextItems })
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all })
    } catch (error) {
      set({ wishlistItems: previous })
      queryClient.setQueryData(wishlistKeys.detail(), (old) => ({
        id: old?.id ?? null,
        products: previous,
        userType: old?.userType ?? null,
        storefront: old?.storefront ?? 'ecomm',
      }))
      notifyWishlistError(error)
    }
  },

  isInWishlist: (productId) => {
    return get().wishlistItems.some((item) => String(item.id) === String(productId))
  },

  toggleWishlist: async (product) => {
    if (get().isInWishlist(product.id)) {
      await get().removeFromWishlist(product.id)
    } else {
      await get().addToWishlist(product)
    }
  },
})
