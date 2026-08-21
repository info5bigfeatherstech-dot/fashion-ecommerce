export const cartSlice = (set, get) => ({
  cartItems: [],
  isCartOpen: false,

  addItem: (product, options = {}) => {
    const { size = product.sizes?.[0], color = product.colors?.[0], quantity = 1 } = options
    const productId = product.id
    const productCode = product.productCode || product.sku || null

    set((state) => {
      const existing = state.cartItems.find(
        (item) => (
          String(item.productId) === String(productId)
          && item.size === size
          && item.color === color
        )
      )

      if (existing) {
        return {
          cartItems: state.cartItems.map((item) => (
            item.id === existing.id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  productCode: item.productCode || productCode,
                  price: product.price ?? item.price,
                  image: product.images?.[0] || item.image,
                }
              : item
          )),
        }
      }

      return {
        cartItems: [
          ...state.cartItems,
          {
            id: `${productId}-${size ?? 'default'}-${color ?? 'default'}`,
            productId,
            slug: product.slug,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice || null,
            image: product.images?.[0] || product.image,
            productCode,
            size,
            color,
            quantity,
          },
        ],
      }
    })
  },

  patchCartItem: (itemId, patch) => {
    set((state) => ({
      cartItems: state.cartItems.map((item) => (
        item.id === itemId ? { ...item, ...patch } : item
      )),
    }))
  },

  removeItem: (itemId) => {
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.id !== itemId),
    }))
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity < 1) {
      get().removeItem(itemId)
      return
    }
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      ),
    }))
  },

  clearCart: () => set({ cartItems: [] }),

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
})
