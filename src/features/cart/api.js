import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'
import { mapCart } from './mappers'

export async function getCart({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.cart.root, { signal })
  return mapCart(payload)
}

export async function addCartItem({ productSlug, variantId, quantity = 1 }) {
  const payload = await http.post(API_ENDPOINTS.cart.root, {
    productSlug,
    variantId,
    quantity,
  })
  return mapCart(payload)
}

export async function updateCartItem({ productId, variantId, quantity }) {
  const payload = await http.put(API_ENDPOINTS.cart.item, {
    productId,
    variantId,
    quantity,
  })
  return mapCart(payload)
}

export async function removeCartItem({ productId, variantId }) {
  const payload = await http.delete(API_ENDPOINTS.cart.item, {
    data: { productId, variantId },
  })
  return mapCart(payload)
}

export async function bulkRemoveCartItems(items = []) {
  const payload = await http.post(API_ENDPOINTS.cart.bulkRemove, { items })
  return mapCart(payload)
}

export async function clearCartApi() {
  const payload = await http.delete(API_ENDPOINTS.cart.clear)
  return mapCart(payload)
}

export async function mergeCart(items = []) {
  const payload = await http.post(API_ENDPOINTS.cart.merge, { items })
  return mapCart(payload)
}
