export const wishlistSlice = (set, get) => ({
  wishlistItems: [],

  addToWishlist: (product) => {
    set((state) => {
      if (state.wishlistItems.some((item) => item.id === product.id)) return state
      return {
        wishlistItems: [
          ...state.wishlistItems,
          {
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.images[0],
            badge: product.badge,
            rating: product.rating,
            reviewCount: product.reviewCount,
          },
        ],
      }
    })
  },

  removeFromWishlist: (productId) => {
    set((state) => ({
      wishlistItems: state.wishlistItems.filter((item) => item.id !== productId),
    }))
  },

  isInWishlist: (productId) => {
    return get().wishlistItems.some((item) => item.id === productId)
  },

  toggleWishlist: (product) => {
    if (get().isInWishlist(product.id)) {
      get().removeFromWishlist(product.id)
    } else {
      get().addToWishlist(product)
    }
  },
})
