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

  /** Global sign-in / register modal (opened from header, cart, etc.) */
  authModalOpen: false,
  authModalMode: 'login',
  authRedirectTo: '/account/profile',

  setCheckoutAddress: (address) => set({ checkoutAddress: address }),
  clearCheckoutAddress: () => set({ checkoutAddress: null }),

  openAuthModal: ({ redirectTo = '/account/profile', mode = 'login' } = {}) =>
    set({
      authModalOpen: true,
      authModalMode: mode === 'register' ? 'register' : 'login',
      authRedirectTo: redirectTo || '/account/profile',
    }),

  closeAuthModal: () =>
    set({
      authModalOpen: false,
      authModalMode: 'login',
      authRedirectTo: '/account/profile',
    }),

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
      cartId: null,
      cartTotalAmount: 0,
      cartTotalOriginalAmount: 0,
      cartTotalDiscount: 0,
      cartTotalDiscountPercentage: 0,
    })
  },
})
