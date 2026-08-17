import { getStoredUser } from './api'

export const authSlice = (set) => ({
  user: getStoredUser(),
  isAuthenticated: !!getStoredUser(),

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  clearUser: () => set({ user: null, isAuthenticated: false }),
})
