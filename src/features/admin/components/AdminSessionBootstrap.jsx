import { useEffect } from 'react'
import { useAdminStore } from '@/features/admin/store'
import { refreshAdminSession } from '@/features/admin/api'

/** Restore admin access token from HttpOnly refresh cookie when available. */
export function AdminSessionBootstrap() {
  const setAuthReady = useAdminStore((s) => s.setAuthReady)
  const clearSession = useAdminStore((s) => s.clearSession)
  const setSession = useAdminStore((s) => s.setSession)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const persistApi = useAdminStore.persist
        if (persistApi && !persistApi.hasHydrated()) {
          await new Promise((resolve) => {
            const unsub = persistApi.onFinishHydration(() => {
              unsub?.()
              resolve()
            })
          })
        }

        if (cancelled) return

        const { accessToken } = useAdminStore.getState()
        if (!accessToken) {
          try {
            const session = await refreshAdminSession()
            if (!cancelled) setSession(session)
          } catch {
            if (!cancelled) clearSession()
          }
        }
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [clearSession, setAuthReady, setSession])

  return null
}
