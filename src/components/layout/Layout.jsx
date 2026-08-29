import { Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PageLoader'
import { PromoBanner } from './PromoBanner'
import { Header } from './Header'
import { Footer } from './Footer'
import { MobileBottomNav } from './MobileBottomNav'
import { AuthModal } from '@/features/auth/components/AuthModal'
import { scrollToTopSoon, restoreScrollPositionSoon, getLenis } from '@/lib/lenis'

const scrollPositions = new Map()

function recordCurrentScroll(key, pathnameWithSearch) {
  const lenis = getLenis()
  const y = lenis ? lenis.scroll : (window.scrollY || document.documentElement.scrollTop || 0)
  if (key) {
    scrollPositions.set(key, y)
    try { sessionStorage.setItem(`sp_${key}`, String(y)) } catch (_) {}
  }
  if (pathnameWithSearch) {
    scrollPositions.set(pathnameWithSearch, y)
    try { sessionStorage.setItem(`sp_${pathnameWithSearch}`, String(y)) } catch (_) {}
  }
}

function ScrollToTop() {
  const location = useLocation()
  const navType = useNavigationType()
  const prevLocationRef = useRef(location)

  useEffect(() => {
    const onScroll = () => {
      recordCurrentScroll(location.key, location.pathname + location.search)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('beforeunload', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('beforeunload', onScroll)
    }
  }, [location.key, location.pathname, location.search])

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useLayoutEffect(() => {
    const prevLoc = prevLocationRef.current
    if (prevLoc) {
      recordCurrentScroll(prevLoc.key, prevLoc.pathname + prevLoc.search)
    }
    prevLocationRef.current = location

    if (location.hash) {
      return restoreScrollPositionSoon(location.hash)
    }

    if (navType === 'POP') {
      if (location.state?.fromSection && location.pathname === '/') {
        const sectionId = `#${location.state.fromSection.replace(/^#/, '')}`
        return restoreScrollPositionSoon(sectionId)
      }

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
        } catch (_) {}
      }

      if (typeof savedY === 'number' && !Number.isNaN(savedY) && savedY > 0) {
        return restoreScrollPositionSoon(savedY)
      }
    }

    return scrollToTopSoon()
  }, [location.pathname, location.search, location.hash, location.key, navType, location.state])

  return null
}

export function Layout() {
  return (
    <>
      <ScrollToTop />
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
      <MobileBottomNav />
      <AuthModal />
    </>
  )
}
