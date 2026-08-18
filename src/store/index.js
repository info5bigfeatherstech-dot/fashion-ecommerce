import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cartSlice } from '@/features/cart/store'
import { wishlistSlice } from '@/features/wishlist/store'
import { authSlice } from '@/features/auth/store'

export const useAppStore = create(
  persist(
    (...a) => ({
      ...cartSlice(...a),
      ...wishlistSlice(...a),
      ...authSlice(...a),
    }),
    {
      name: 'verao-store',
      partialize: (state) => ({
        cartItems: state.cartItems,
        wishlistItems: state.wishlistItems,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        addresses: state.addresses,
      }),
    }
  )
)
