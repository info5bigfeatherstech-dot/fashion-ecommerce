import { useEffect } from 'react'
import { useAppStore } from '@/store'
import { refreshSession } from '@/features/auth/api'

/**
 * After Zustand rehydrates a persisted user, restore the in-memory access token
 * via the HttpOnly refresh cookie. Clears session if refresh fails.
 */
export function SessionBootstrap() {
  const setAuthReady = useAppStore((s) => s.setAuthReady)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const finish = () => {
        if (!cancelled) setAuthReady(true)
      }

      try {
        const persistApi = useAppStore.persist
        if (persistApi && !persistApi.hasHydrated()) {
          await new Promise((resolve) => {
            const unsub = persistApi.onFinishHydration(() => {
              unsub?.()
              resolve()
            })
          })
        }

        if (cancelled) return

        const { user, accessToken, clearUser } = useAppStore.getState()

        if (user && !accessToken) {
          try {
            await refreshSession()
          } catch {
            clearUser()
          }
        }
      } finally {
        finish()
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [setAuthReady])

  return null
}
