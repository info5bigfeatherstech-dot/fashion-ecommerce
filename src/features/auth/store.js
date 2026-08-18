import { getStoredUser } from './api'

export const authSlice = (set, get) => ({
  user: getStoredUser(),
  isAuthenticated: !!getStoredUser(),

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  addresses: [],

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
  },

  removeAddress: (addressId) => {
    set((state) => ({
      addresses: state.addresses.filter((a) => a.id !== addressId),
    }))
  },

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      addresses: [],
      cartItems: [],
      wishlistItems: [],
      isCartOpen: false,
    }),
})
