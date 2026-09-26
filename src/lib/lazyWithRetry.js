import { lazy } from 'react'

const RELOAD_KEY = 'fabuniqo:chunk-reload'

function isChunkLoadError(err) {
  const msg = String(err?.message || err || '')
  return (
    /Failed to fetch dynamically imported module/i.test(msg)
    || /Importing a module script failed/i.test(msg)
    || /Loading chunk [\d]+ failed/i.test(msg)
    || err?.name === 'ChunkLoadError'
  )
}

/**
 * Production-safe lazy(): retries once, then one hard reload if still failing.
 * Handles stale chunk URLs after deploys ("Failed to fetch dynamically imported module").
 */
export function lazyWithRetry(importer, { retries = 1 } = {}) {
  return lazy(async () => {
    let lastError
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const mod = await importer()
        try {
          sessionStorage.removeItem(RELOAD_KEY)
        } catch {
          /* ignore */
        }
        return mod
      } catch (err) {
        lastError = err
        if (!isChunkLoadError(err) || attempt >= retries) break
        await new Promise((r) => setTimeout(r, 250))
      }
    }

    if (isChunkLoadError(lastError) && typeof window !== 'undefined') {
      try {
        const already = sessionStorage.getItem(RELOAD_KEY)
        if (!already) {
          sessionStorage.setItem(RELOAD_KEY, '1')
          window.location.reload()
          // Brief hang while reload starts; then throw so RouteErrorBoundary can recover.
          await new Promise((r) => setTimeout(r, 1500))
        }
      } catch {
        /* sessionStorage blocked — fall through */
      }
    }

    throw lastError
  })
}
