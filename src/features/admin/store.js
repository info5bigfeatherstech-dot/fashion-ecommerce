import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ADMIN_ROLES } from '@/api/endpoints'

export const useAdminStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      authReady: false,

      setAuthReady: (authReady) => set({ authReady: Boolean(authReady) }),

      setSession: ({ user = null, accessToken = null } = {}) => {
        set({
          user,
          accessToken: accessToken || null,
          isAuthenticated: Boolean(user && accessToken),
        })
      },

      setAccessToken: (accessToken) => {
        set({ accessToken: accessToken || null })
      },

      clearSession: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'fabuniqo-admin-store',
      partialize: (state) => ({ user: state.user }),
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
