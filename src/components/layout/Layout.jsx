import { Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PageLoader'
import { PromoBanner } from './PromoBanner'
import { Header } from './Header'
import { Footer } from './Footer'
import { MobileBottomNav } from './MobileBottomNav'
import { AuthModal } from '@/features/auth/components/AuthModal'
import { resolveScrollTarget, scrollToPosition } from '@/lib/lenis'

function isPlainLeftClick(event) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  )
}

function ScrollToTop() {
  const location = useLocation()
  const locationRef = useRef(location)
  locationRef.current = location

  // Early reset for in-app links — before React swaps the Outlet.
  useEffect(() => {
    const onClickCapture = (event) => {
      if (!isPlainLeftClick(event)) return
      if (event.defaultPrevented) return

      const anchor = event.target?.closest?.('a[href]')
      if (!anchor) return
      if (anchor.hasAttribute('download')) return
      if (anchor.target && anchor.target !== '_self') return

      let url
      try {
        url = new URL(anchor.href, window.location.href)
      } catch {
        return
      }

      if (url.origin !== window.location.origin) return

      const loc = locationRef.current
      const nextPath = url.pathname + url.search
      const currPath = loc.pathname + loc.search
      if (nextPath === currPath) return

      scrollToPosition(0)
    }

    document.addEventListener('click', onClickCapture, true)
    return () => document.removeEventListener('click', onClickCapture, true)
  }, [])

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useLayoutEffect(() => {
    if (location.hash) {
      const y = resolveScrollTarget(location.hash)
      scrollToPosition(y ?? 0)
      return
    }

    scrollToPosition(0)
    const id = requestAnimationFrame(() => {
      scrollToPosition(0)
    })
    const timer = setTimeout(() => {
      scrollToPosition(0)
    }, 50)

    return () => {
      cancelAnimationFrame(id)
      clearTimeout(timer)
    }
  }, [location.pathname, location.search, location.hash])

  return null
}

export function Layout() {
  return (
    <>
      <ScrollToTop />
      <div className="site-shell">
        <div className="site-top">
          <PromoBanner />
          <Header />
        </div>
        <main className="page">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
      <MobileBottomNav />
      <AuthModal />
    </>
  )
}
