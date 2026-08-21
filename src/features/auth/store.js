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
      // Keep existing accessToken when only profile is updated
      accessToken: user ? get().accessToken : null,
    })
  },

  addresses: [],
  checkoutAddress: null,

  addAddress: (address) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    set((state) => ({
      addresses: [
        ...state.addresses,
        {
          id,
          ...address,
        },
      ],
    }))

    return id
  },

  removeAddress: (addressId) => {
    set((state) => ({
      addresses: state.addresses.filter((a) => a.id !== addressId),
    }))
  },

  setCheckoutAddress: (address) => set({ checkoutAddress: address }),
  clearCheckoutAddress: () => set({ checkoutAddress: null }),

  clearUser: () => {
    clearAuthSession()
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      addresses: [],
      checkoutAddress: null,
      cartItems: [],
      wishlistItems: [],
      isCartOpen: false,
    })
  },
})
