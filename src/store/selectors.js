import { useAppStore } from '@/store'

export function useCartTotal() {
  return useAppStore((s) =>
    s.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )
}

export function useCartCount() {
  return useAppStore((s) =>
    s.cartItems.reduce((sum, item) => sum + item.quantity, 0)
  )
}

export function useWishlistCount() {
  return useAppStore((s) => s.wishlistItems.length)
}
