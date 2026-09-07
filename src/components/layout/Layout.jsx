import { Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PageLoader'
import { PromoBanner } from './PromoBanner'
import { Header } from './Header'
import { Footer } from './Footer'
import { MobileBottomNav } from './MobileBottomNav'
import { AuthModal } from '@/features/auth/components/AuthModal'
import { getLenis, isScrollRecordingSuppressed, resolveScrollTarget, scrollToPosition } from '@/lib/lenis'

const scrollPositions = new Map()

function recordCurrentScroll(key, pathnameWithSearch) {
  if (isScrollRecordingSuppressed()) return
  const lenis = getLenis()
  const y = lenis ? lenis.scroll : (window.scrollY || document.documentElement.scrollTop || 0)
  if (key) {
    scrollPositions.set(key, y)
    try { sessionStorage.setItem(`sp_${key}`, String(y)) } catch (_) { /* ignore */ }
  }
  if (pathnameWithSearch) {
    scrollPositions.set(pathnameWithSearch, y)
    try { sessionStorage.setItem(`sp_${pathnameWithSearch}`, String(y)) } catch (_) { /* ignore */ }
  }
}

/** Force-save a leave offset even during programmatic scroll suppression. */
function recordLeaveScroll(key, pathnameWithSearch, y) {
  const value = Math.max(0, Number(y) || 0)
  if (key) {
    scrollPositions.set(key, value)
    try { sessionStorage.setItem(`sp_${key}`, String(value)) } catch (_) { /* ignore */ }
  }
  if (pathnameWithSearch) {
    scrollPositions.set(pathnameWithSearch, value)
    try { sessionStorage.setItem(`sp_${pathnameWithSearch}`, String(value)) } catch (_) { /* ignore */ }
  }
}

function getLiveScrollY() {
  const lenis = getLenis()
  return lenis ? lenis.scroll : (window.scrollY || document.documentElement.scrollTop || 0)
}

function readSavedScroll(location) {
  let savedY = scrollPositions.get(location.key)
  if (savedY === undefined) {
    savedY = scrollPositions.get(location.pathname + location.search)
  }
  if (savedY === undefined) {
    try {
      const stored =
        sessionStorage.getItem(`sp_${location.key}`) ||
        sessionStorage.getItem(`sp_${location.pathname}${location.search}`)
      if (stored !== null) savedY = Number(stored)
    } catch (_) { /* ignore */ }
  }
  if (typeof savedY === 'number' && !Number.isNaN(savedY) && savedY > 0) {
    return savedY
  }
  return 0
}

function isPlainLeftClick(event) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  )
}

/**
 * Apply the scroll target for a committed location.
 * Recalculates Lenis metrics after the Outlet swap so a short loading
 * document cannot leave animatedScroll stuck at the previous page's Y.
 */
function applyRouteScroll(y) {
  const lenis = getLenis()
  lenis?.resize?.()
  scrollToPosition(y)
  lenis?.resize?.()
}

/**
 * SINGLE scroll-restoration owner for the storefront Layout.
 *
 * Why Footer used to flash:
 * Layout always mounts Header + <Outlet /> + Footer. On navigation the
 * Outlet briefly renders a short loading/skeleton tree while the browser
 * still holds the previous scrollY. The short document clamps that Y to
 * the bottom → Footer paints in the viewport → then content/scroll catch up.
 *
 * Strategy:
 * 1) Capture-phase <Link> click: save leave Y (for Back) and snap to 0
 *    while the previous (tall) page is still mounted.
 * 2) useLayoutEffect on location change: snap again after Outlet commit,
 *    before paint — PUSH/REPLACE → 0, POP → restored Y.
 * 3) CSS: main.page min-height 100dvh so Footer cannot sit under Header
 *    even if the Outlet is still empty/loading at scrollY 0.
 */
function ScrollToTop() {
  const location = useLocation()
  const navType = useNavigationType()
  const prevLocationRef = useRef(location)
  const locationRef = useRef(location)

  locationRef.current = location

  useEffect(() => {
    const onScroll = () => {
      const loc = locationRef.current
      recordCurrentScroll(loc.key, loc.pathname + loc.search)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('beforeunload', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('beforeunload', onScroll)
    }
  }, [])

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

      recordLeaveScroll(loc.key, currPath, getLiveScrollY())
      applyRouteScroll(0)
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
    const prevLoc = prevLocationRef.current
    const pathChanged =
      prevLoc.pathname !== location.pathname ||
      prevLoc.search !== location.search ||
      prevLoc.key !== location.key

    if (pathChanged && navType !== 'POP') {
      const y = getLiveScrollY()
      if (y > 0) {
        recordLeaveScroll(prevLoc.key, prevLoc.pathname + prevLoc.search, y)
      }
    }

    prevLocationRef.current = location

    if (location.hash) {
      const y = resolveScrollTarget(location.hash)
      applyRouteScroll(y ?? 0)
      return
    }

    if (navType === 'POP') {
      if (location.state?.fromSection && location.pathname === '/') {
        const sectionId = `#${location.state.fromSection.replace(/^#/, '')}`
        const y = resolveScrollTarget(sectionId)
        applyRouteScroll(y ?? readSavedScroll(location))
        return
      }

      applyRouteScroll(readSavedScroll(location))
      return
    }

    if (pathChanged) {
      applyRouteScroll(0)
    }
  }, [location.pathname, location.search, location.hash, location.key, navType, location.state])

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
