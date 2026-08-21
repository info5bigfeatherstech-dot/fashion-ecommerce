import { useAppStore } from '@/store'

export function useCartTotal() {
  return useAppStore((s) =>
    s.isAuthenticated
      ? s.cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
      : 0
  )
}

export function useCartCount() {
  return useAppStore((s) =>
    s.isAuthenticated
      ? s.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
      : 0
  )
}

export function useWishlistCount() {
  return useAppStore((s) => (s.isAuthenticated ? s.wishlistItems.length : 0))
}

export function useCartDiscount() {
  return useAppStore((s) => (
    s.isAuthenticated
      ? {
          totalAmount: s.cartTotalAmount || 0,
          totalDiscount: s.cartTotalDiscount || 0,
          totalDiscountPercentage: s.cartTotalDiscountPercentage || 0,
          totalOriginalAmount: s.cartTotalOriginalAmount || 0,
        }
      : {
          totalAmount: 0,
          totalDiscount: 0,
          totalDiscountPercentage: 0,
          totalOriginalAmount: 0,
        }
  ))
}
