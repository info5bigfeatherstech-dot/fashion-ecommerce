import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'
import { mapWishlist } from './mappers'

export async function getWishlist({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.wishlist.root, { signal })
  return mapWishlist(payload)
}

export async function addWishlistItem({ productSlug, variantId }) {
  const payload = await http.post(API_ENDPOINTS.wishlist.add, {
    productSlug,
    variantId,
  })
  return {
    message: payload?.message || 'Added to wishlist',
    wishlist: mapWishlist(payload),
  }
}

export async function removeWishlistItemBySlug(productSlug) {
  const payload = await http.delete(API_ENDPOINTS.wishlist.removeBySlug(productSlug))
  return {
    message: payload?.message || 'Removed from wishlist',
    wishlist: mapWishlist(payload),
  }
}

export async function bulkRemoveWishlistItems(slugs = []) {
  const payload = await http.delete(API_ENDPOINTS.wishlist.removeBulk, {
    data: { slugs },
  })
  return {
    message: payload?.message || 'Removed from wishlist',
    wishlist: mapWishlist(payload),
  }
}

export async function clearWishlistApi() {
  const payload = await http.delete(API_ENDPOINTS.wishlist.clear)
  return {
    message: payload?.message || 'Wishlist cleared',
    wishlist: mapWishlist(payload),
  }
}

export async function mergeWishlist({ items, slugs } = {}) {
  const body = Array.isArray(items) ? { items } : { slugs: slugs || [] }
  const payload = await http.post(API_ENDPOINTS.wishlist.merge, body)
  return {
    message: payload?.message || 'Wishlist merged',
    mergedCount: Number(payload?.mergedCount) || 0,
    wishlist: payload?.wishlist ? mapWishlist(payload) : null,
  }
}

export async function moveWishlistToCart({ moveAll = false, productIds } = {}) {
  const payload = await http.post(API_ENDPOINTS.wishlist.moveToCart, {
    moveAll: Boolean(moveAll),
    ...(productIds != null ? { productIds } : {}),
  })
  return {
    message: payload?.message || 'Wishlist items moved to cart',
    cart: payload?.cart || null,
    userType: payload?.userType || null,
    storefront: payload?.storefront || 'ecomm',
  }
}
