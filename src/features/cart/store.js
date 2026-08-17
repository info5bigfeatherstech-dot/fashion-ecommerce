export const cartSlice = (set, get) => ({
  cartItems: [],
  isCartOpen: false,

  addItem: (product, options = {}) => {
    const { size = product.sizes?.[0], color = product.colors?.[0], quantity = 1 } = options
    set((state) => {
      const existing = state.cartItems.find(
        (item) => item.productId === product.id && item.size === size && item.color === color
      )
      if (existing) {
        return {
          cartItems: state.cartItems.map((item) =>
            item.id === existing.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        }
      }
      return {
        cartItems: [
          ...state.cartItems,
          {
            id: `${product.id}-${size}-${color}`,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.images[0],
            size,
            color,
            quantity,
          },
        ],
      }
    })
  },

  removeItem: (itemId) => {
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.id !== itemId),
    }))
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity < 1) return
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
