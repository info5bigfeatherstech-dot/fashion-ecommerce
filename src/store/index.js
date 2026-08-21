import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cartSlice } from '@/features/cart/store'
import { wishlistSlice } from '@/features/wishlist/store'
import { authSlice } from '@/features/auth/store'

const LEGACY_TOKEN_KEY = 'verao_token'
const LEGACY_USER_KEY = 'verao_user'

function clearLegacyAuthStorage() {
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    localStorage.removeItem(LEGACY_USER_KEY)
  } catch {
    // ignore
  }
}

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
        // accessToken intentionally excluded — memory only
        addresses: state.addresses,
        checkoutAddress: state.checkoutAddress,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState && typeof persistedState === 'object' ? persistedState : {}
        return {
          ...currentState,
          ...persisted,
          accessToken: null,
          isAuthenticated: !!persisted.user,
          authReady: false,
        }
      },
      onRehydrateStorage: () => () => {
        clearLegacyAuthStorage()
      },
    }
  )
)
