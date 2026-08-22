import {
  addCartItem,
  clearCartApi,
  removeCartItem,
  updateCartItem,
} from '@/features/cart/api'
import { cartKeys } from '@/features/cart/queryKeys'
import { notifyBagError } from '@/lib/cart-toast'
import { resolveVariant, resolveVariantId } from '@/features/product/mappers'
import { getProductBySlug } from '@/features/product/api'
import { queryClient } from '@/api/queryClient'

function emptyCartMeta() {
  return {
    cartId: null,
    cartTotalAmount: 0,
    cartTotalOriginalAmount: 0,
    cartTotalDiscount: 0,
    cartTotalDiscountPercentage: 0,
  }
}

function buildLocalLine(product, options = {}) {
  const quantity = Math.max(1, Number(options.quantity) || 1)
  const variant = resolveVariant(product, options)
  const size = options.size ?? product.sizes?.[0]
  const color = options.color ?? product.colors?.[0]
  const productId = product.id
  const variantId = variant?.id || options.variantId || null
  const productCode = product.productCode || variant?.productCode || null
  const price = variant?.price ?? product.price
  const originalPrice = variant?.originalPrice ?? product.originalPrice ?? null
  const image = variant?.images?.[0] || product.images?.[0] || product.image

  return {
    id: variantId
      ? `${productId}-${variantId}`
      : `${productId}-${size ?? 'default'}-${color ?? 'default'}`,
    productId,
    variantId,
    slug: product.slug,
    name: product.name,
    price,
    originalPrice,
    image,
    productCode,
    size: size ?? null,
    color: color ?? null,
    quantity,
    lineTotal: price * quantity,
  }
}

async function ensureVariantId(product, options = {}) {
  let variantId = options.variantId || resolveVariantId(product, options)
  if (variantId) return variantId

  const slug = product?.slug
  if (!slug) return null

  try {
    const detailed = await getProductBySlug(slug)
    return resolveVariantId(detailed, options)
  } catch {
    return null
  }
}

export const cartSlice = (set, get) => ({
  cartItems: [],
  isCartOpen: false,
  ...emptyCartMeta(),

  replaceCartFromApi: (cart) => {
    if (!cart) {
      const empty = { items: [], totalAmount: 0, id: null }
      queryClient.setQueryData(cartKeys.detail(), empty)
      const current = get()
      if (current.cartItems.length === 0 && !current.cartId) return
      set({ cartItems: [], ...emptyCartMeta() })
      return
    }

    const nextItems = Array.isArray(cart.items) ? cart.items : []
    const nextMeta = {
      cartId: cart.id || null,
      cartTotalAmount: cart.totalAmount ?? 0,
      cartTotalOriginalAmount: cart.totalOriginalAmount ?? 0,
      cartTotalDiscount: cart.totalDiscount ?? 0,
      cartTotalDiscountPercentage: cart.totalDiscountPercentage ?? 0,
    }

    queryClient.setQueryData(cartKeys.detail(), cart)

    const current = get()
    const sameMeta = (
      current.cartId === nextMeta.cartId
      && current.cartTotalAmount === nextMeta.cartTotalAmount
      && current.cartTotalOriginalAmount === nextMeta.cartTotalOriginalAmount
      && current.cartTotalDiscount === nextMeta.cartTotalDiscount
      && current.cartTotalDiscountPercentage === nextMeta.cartTotalDiscountPercentage
    )
    const sameItems = (
      current.cartItems.length === nextItems.length
      && current.cartItems.every((item, index) => {
        const next = nextItems[index]
        return next
          && item.id === next.id
          && item.quantity === next.quantity
          && item.price === next.price
          && item.variantId === next.variantId
      })
    )

    if (sameMeta && sameItems) return

    set({ cartItems: nextItems, ...nextMeta })
  },

  addItem: async (product, options = {}) => {
    const quantity = Math.max(1, Number(options.quantity) || 1)
    const previousItems = get().cartItems
    const previousMeta = {
      cartId: get().cartId,
      cartTotalAmount: get().cartTotalAmount,
      cartTotalOriginalAmount: get().cartTotalOriginalAmount,
      cartTotalDiscount: get().cartTotalDiscount,
      cartTotalDiscountPercentage: get().cartTotalDiscountPercentage,
    }

    const localLine = buildLocalLine(product, { ...options, quantity })
    const existing = previousItems.find(
      (item) => (
        String(item.productId) === String(localLine.productId)
        && String(item.variantId || '') === String(localLine.variantId || '')
        && item.size === localLine.size
        && item.color === localLine.color
      )
    )

    if (existing) {
      set({
        cartItems: previousItems.map((item) => (
          item.id === existing.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                productCode: item.productCode || localLine.productCode,
                variantId: item.variantId || localLine.variantId,
                price: localLine.price ?? item.price,
                image: localLine.image || item.image,
                lineTotal: (localLine.price ?? item.price) * (item.quantity + quantity),
              }
            : item
        )),
      })
    } else {
      set({ cartItems: [...previousItems, localLine] })
    }

    if (!get().accessToken) return

    try {
      const variantId = await ensureVariantId(product, options)
      if (!variantId || !product.slug) {
        throw new Error('Could not resolve product variant')
      }

      const cart = await addCartItem({
        productSlug: product.slug,
        variantId,
        quantity,
      })
      get().replaceCartFromApi(cart)
    } catch (error) {
      set({ cartItems: previousItems, ...previousMeta })
      notifyBagError(error)
    }
  },

  patchCartItem: (itemId, patch) => {
    set((state) => ({
      cartItems: state.cartItems.map((item) => (
        item.id === itemId ? { ...item, ...patch } : item
      )),
    }))
  },

  removeItem: async (itemId) => {
    const previousItems = get().cartItems
    const previousMeta = {
      cartId: get().cartId,
      cartTotalAmount: get().cartTotalAmount,
      cartTotalOriginalAmount: get().cartTotalOriginalAmount,
      cartTotalDiscount: get().cartTotalDiscount,
      cartTotalDiscountPercentage: get().cartTotalDiscountPercentage,
    }
    const target = previousItems.find((item) => item.id === itemId)
    if (!target) return

    set({ cartItems: previousItems.filter((item) => item.id !== itemId) })

    if (!get().accessToken || !target.productId || !target.variantId) return

    try {
      const cart = await removeCartItem({
        productId: target.productId,
        variantId: target.variantId,
      })
      get().replaceCartFromApi(cart)
    } catch (error) {
      set({ cartItems: previousItems, ...previousMeta })
      notifyBagError(error)
    }
  },

  updateQuantity: async (itemId, quantity) => {
    if (quantity < 1) {
      await get().removeItem(itemId)
      return
    }

    const previousItems = get().cartItems
    const previousMeta = {
      cartId: get().cartId,
      cartTotalAmount: get().cartTotalAmount,
      cartTotalOriginalAmount: get().cartTotalOriginalAmount,
      cartTotalDiscount: get().cartTotalDiscount,
      cartTotalDiscountPercentage: get().cartTotalDiscountPercentage,
    }
    const target = previousItems.find((item) => item.id === itemId)
    if (!target) return

    set({
      cartItems: previousItems.map((item) => (
        item.id === itemId
          ? {
              ...item,
              quantity,
              lineTotal: (item.price || 0) * quantity,
            }
          : item
      )),
    })

    if (!get().accessToken || !target.productId || !target.variantId) return

    try {
      const cart = await updateCartItem({
        productId: target.productId,
        variantId: target.variantId,
        quantity,
      })
      get().replaceCartFromApi(cart)
    } catch (error) {
      set({ cartItems: previousItems, ...previousMeta })
      notifyBagError(error)
    }
  },

  clearCart: async () => {
    const previousItems = get().cartItems
    const previousMeta = {
      cartId: get().cartId,
      cartTotalAmount: get().cartTotalAmount,
      cartTotalOriginalAmount: get().cartTotalOriginalAmount,
      cartTotalDiscount: get().cartTotalDiscount,
      cartTotalDiscountPercentage: get().cartTotalDiscountPercentage,
    }

    set({ cartItems: [], ...emptyCartMeta() })

    if (!get().accessToken) return

    try {
      const cart = await clearCartApi()
      get().replaceCartFromApi(cart)
    } catch (error) {
      set({ cartItems: previousItems, ...previousMeta })
      notifyBagError(error, 'Could not clear bag')
    }
  },

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
})
