import { useAppStore } from '@/store'

export function useCartTotal() {
  return useAppStore((s) =>
    s.isAuthenticated
      ? s.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      : 0
  )
}

export function useCartCount() {
  return useAppStore((s) =>
    s.isAuthenticated
      ? s.cartItems.reduce((sum, item) => sum + item.quantity, 0)
      : 0
  )
}

export function useWishlistCount() {
  return useAppStore((s) => (s.isAuthenticated ? s.wishlistItems.length : 0))
}
