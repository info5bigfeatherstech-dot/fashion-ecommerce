import { useEffect } from 'react'
import { useAppStore } from '@/store'
import { refreshSession, isFatalAuthRefreshError } from '@/features/auth/api'
import { syncBagsFromServer } from '@/features/commerce/syncBags'

/**
 * Restore the in-memory access token from the HttpOnly refresh cookie
 * (valid ≥ 7 days). Only clears the local session on a real auth rejection,
 * not on transient network / cold-start errors.
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

        const { accessToken, clearUser } = useAppStore.getState()

        if (!accessToken) {
          try {
            await refreshSession()
          } catch (err) {
            if (isFatalAuthRefreshError(err)) {
              clearUser()
            }
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
