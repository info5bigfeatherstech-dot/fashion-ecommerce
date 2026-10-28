import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cartSlice } from '@/features/cart/store'
import { wishlistSlice } from '@/features/wishlist/store'
import { authSlice } from '@/features/auth/store'

const LEGACY_TOKEN_KEY = 'verao_token'
const LEGACY_USER_KEY = 'verao_user'
const PERSISTED_STATE_KEYS = ['cartItems', 'wishlistItems', 'user', 'appliedCoupon']
const CHECKOUT_ADDRESS_KEY = 'verao-checkout-address'

let lastPersistedState = null

const appStorage = {
  getItem(name) {
    const serialized = localStorage.getItem(name)
    if (!serialized) {
      lastPersistedState = null
      return null
    }

    const value = JSON.parse(serialized)
    const storedAddress = localStorage.getItem(CHECKOUT_ADDRESS_KEY)
    const persistedState = value?.state || {}
    value.state = {
      ...persistedState,
      checkoutAddress: storedAddress === null
        ? persistedState.checkoutAddress ?? null
        : JSON.parse(storedAddress),
    }
    lastPersistedState = value.state
    return value
  },
  setItem(name, value) {
    const nextState = value?.state
    const persistedStateUnchanged = nextState
      && lastPersistedState
      && PERSISTED_STATE_KEYS.every((key) => nextState[key] === lastPersistedState[key])

    if (persistedStateUnchanged) {
      if (nextState.checkoutAddress !== lastPersistedState.checkoutAddress) {
        localStorage.setItem(CHECKOUT_ADDRESS_KEY, JSON.stringify(nextState.checkoutAddress))
        lastPersistedState = nextState
      }
      return
    }

    const { checkoutAddress, ...persistedState } = nextState
    localStorage.setItem(name, JSON.stringify({
      ...value,
      state: persistedState,
    }))
    localStorage.setItem(CHECKOUT_ADDRESS_KEY, JSON.stringify(checkoutAddress ?? null))
    lastPersistedState = nextState || null
  },
  removeItem(name) {
    localStorage.removeItem(name)
    localStorage.removeItem(CHECKOUT_ADDRESS_KEY)
    lastPersistedState = null
  },
}

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
      storage: appStorage,
      partialize: (state) => ({
        cartItems: state.cartItems,
        wishlistItems: state.wishlistItems,
        user: state.user,
        // accessToken intentionally excluded — memory only
        checkoutAddress: state.checkoutAddress,
        appliedCoupon: state.appliedCoupon,
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
