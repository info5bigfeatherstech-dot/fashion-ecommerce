import { clearAuthSession } from '@/api/config'

export const authSlice = (set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  authReady: false,

  setAuthReady: (authReady) => set({ authReady: Boolean(authReady) }),

  setSession: ({ user = null, accessToken = null } = {}) => {
    set({
      user,
      accessToken: accessToken || null,
      isAuthenticated: !!user,
    })
  },

  setAccessToken: (accessToken) => {
    set({ accessToken: accessToken || null })
  },

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      accessToken: user ? get().accessToken : null,
    })
  },

  /** Selected delivery address for the current checkout flow (API-shaped). */
  checkoutAddress: null,

  setCheckoutAddress: (address) => set({ checkoutAddress: address }),
  clearCheckoutAddress: () => set({ checkoutAddress: null }),

  clearUser: () => {
    clearAuthSession()
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      checkoutAddress: null,
      cartItems: [],
      wishlistItems: [],
      isCartOpen: false,
    })
  },
})
