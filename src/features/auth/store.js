import { getStoredUser } from './api'

export const authSlice = (set, get) => ({
  user: getStoredUser(),
  isAuthenticated: !!getStoredUser(),

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  addresses: [],

  // Address selected in the checkout flow (set from the checkout address popup).
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

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      addresses: [],
      checkoutAddress: null,
      cartItems: [],
      wishlistItems: [],
      isCartOpen: false,
    }),
})
