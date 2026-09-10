import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ADMIN_ROLES } from '@/api/endpoints'

export const useAdminStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      authReady: false,

      setAuthReady: (authReady) => set({ authReady: Boolean(authReady) }),

      setSession: ({ user = null, accessToken = null, refreshToken = null } = {}) => {
        set((state) => ({
          user: user ?? state.user,
          accessToken: accessToken || null,
          refreshToken: refreshToken || state.refreshToken || null,
          isAuthenticated: Boolean((user || state.user) && accessToken),
        }))
      },

      setAccessToken: (accessToken) => {
        set({ accessToken: accessToken || null })
      },

      setRefreshToken: (refreshToken) => {
        set({ refreshToken: refreshToken || null })
      },

      clearSession: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'fabuniqo-admin-store',
      partialize: (state) => ({ user: state.user, refreshToken: state.refreshToken }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState && typeof persistedState === 'object' ? persistedState : {}
        return {
          ...currentState,
          ...persisted,
          accessToken: null,
          isAuthenticated: false,
          authReady: false,
        }
      },
    }
  )
)

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(String(role || '').toLowerCase())
}

export const ADMIN_ROLE_LABELS = {
  admin: 'Super Admin',
  product_manager: 'Product Manager',
  order_manager: 'Order Manager',
  marketing_manager: 'Marketing Manager',
}

export { getAllowedAdminTabs, ADMIN_TAB_PERMISSIONS } from './config/nav'
