import { getCart, mergeCart } from '@/features/cart/api'
import { toCartMergeItems } from '@/features/cart/mappers'
import { getWishlist, mergeWishlist } from '@/features/wishlist/api'
import { toWishlistMergeItems } from '@/features/wishlist/mappers'
import { useAppStore } from '@/store'

/**
 * Replace local cart/wishlist from server (no merge).
 * Used after SessionBootstrap refresh / cold start.
 */
export async function syncBagsFromServer() {
  const { accessToken, replaceCartFromApi, replaceWishlistFromApi } = useAppStore.getState()
  if (!accessToken) return { cart: null, wishlist: null }

  const [cartResult, wishlistResult] = await Promise.allSettled([
    getCart(),
    getWishlist(),
  ])

  if (cartResult.status === 'fulfilled') {
    replaceCartFromApi(cartResult.value)
  }

  if (wishlistResult.status === 'fulfilled') {
    replaceWishlistFromApi(wishlistResult.value)
  }

  return {
    cart: cartResult.status === 'fulfilled' ? cartResult.value : null,
    wishlist: wishlistResult.status === 'fulfilled' ? wishlistResult.value : null,
  }
}

/**
 * Merge any leftover local guest lines into the server bags, then refetch.
 * Call once after login / register OTP — not on every session refresh.
 */
export async function syncBagsAfterLogin() {
  const state = useAppStore.getState()
  if (!state.accessToken) return { cart: null, wishlist: null }

  const cartMergeItems = toCartMergeItems(state.cartItems)
  const wishlistMergeItems = toWishlistMergeItems(state.wishlistItems)

  await Promise.allSettled([
    cartMergeItems.length ? mergeCart(cartMergeItems) : Promise.resolve(),
    wishlistMergeItems.length
      ? mergeWishlist({ items: wishlistMergeItems })
      : Promise.resolve(),
  ])

  return syncBagsFromServer()
}
