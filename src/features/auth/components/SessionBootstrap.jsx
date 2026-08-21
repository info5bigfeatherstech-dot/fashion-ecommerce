import { useEffect } from 'react'
import { useAppStore } from '@/store'
import { refreshSession } from '@/features/auth/api'
import { syncBagsFromServer } from '@/features/commerce/syncBags'

/**
 * After Zustand rehydrates a persisted user, restore the in-memory access token
 * via the HttpOnly refresh cookie. Clears session if refresh fails.
 * Then loads server cart + wishlist (no guest merge — that runs on login only).
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

        if (cancelled) return

        if (useAppStore.getState().accessToken) {
          try {
            await syncBagsFromServer()
          } catch {
            // Keep local mirrored bags; pages can refetch via useCart/useWishlist.
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
