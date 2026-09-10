import { Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PageLoader'
import { PromoBanner } from './PromoBanner'
import { Header } from './Header'
import { Footer } from './Footer'
import { MobileBottomNav } from './MobileBottomNav'
import { AuthModal } from '@/features/auth/components/AuthModal'
import { AppInstallNotification } from '@/components/common/AppInstallNotification'
import { AllowNotificationModal } from '@/components/common/AllowNotificationModal'
import { usePushNotifications } from '@/features/notifications/usePushNotifications'
import { useAppStore } from '@/store'
import {
  isScrollRecordingSuppressed,
  restoreScrollPositionSoon,
  scrollToPosition,
} from '@/lib/lenis'

function isPlainLeftClick(event) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  )
}

const scrollPositions = new Map()

function getVisibleSectionId() {
  const sections = Array.from(document.querySelectorAll('section[id]'))
  if (!sections.length) return null

  const viewportHeight = window.innerHeight || 800
  const headerHeight = 80
  let bestSection = null
  let maxScore = -Infinity

  for (const sec of sections) {
    const rect = sec.getBoundingClientRect()
    if (rect.bottom <= headerHeight || rect.top >= viewportHeight) continue

    const visibleTop = Math.max(rect.top, headerHeight)
    const visibleBottom = Math.min(rect.bottom, viewportHeight)
    const visibleHeight = Math.max(0, visibleBottom - visibleTop)

    // A section whose top header is visible in the upper viewport gets a bonus
    const isHeaderInView =
      rect.top >= headerHeight - 40 && rect.top <= headerHeight + viewportHeight * 0.45
    const score = visibleHeight + (isHeaderInView ? 600 : 0)

    if (score > maxScore) {
      maxScore = score
      bestSection = sec.id
    }
  }

  return bestSection
}

function recordCurrentScroll(key, pathnameWithSearch, extra = {}) {
  if (isScrollRecordingSuppressed()) return
  const y = extra.y !== undefined ? extra.y : (window.scrollY || document.documentElement.scrollTop || 0)
  const sectionId = extra.sectionId || getVisibleSectionId() || undefined
  const data = { y, sectionId }

  if (key) {
    scrollPositions.set(key, data)
    try {
      sessionStorage.setItem(`sp_${key}`, JSON.stringify(data))
    } catch (_) { }
  }
  if (pathnameWithSearch) {
    scrollPositions.set(pathnameWithSearch, data)
    try {
      sessionStorage.setItem(`sp_${pathnameWithSearch}`, JSON.stringify(data))
    } catch (_) { }
  }
}

function readSavedScroll(location) {
  let data = scrollPositions.get(location.key)
  if (!data) {
    data = scrollPositions.get(location.pathname + location.search)
  }
  if (!data) {
    try {
      const stored =
        sessionStorage.getItem(`sp_${location.key}`) ||
        sessionStorage.getItem(`sp_${location.pathname}${location.search}`)
      if (stored) {
        data = JSON.parse(stored)
      }
    } catch (_) { }
  }
  if (typeof data === 'number') {
    return { y: data }
  }
  return data || null
}

function ScrollToTop() {
  const location = useLocation()
  const navType = useNavigationType()
  const locationRef = useRef(location)
  const prevLocationRef = useRef(location)
  locationRef.current = location

  // Track scrolling
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

  // Record leave position and clicked section on in-app link clicks
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

      const section = anchor.closest('section[id]')
      const sectionId = section?.id || getVisibleSectionId() || undefined
      const y = window.scrollY || document.documentElement.scrollTop || 0

      recordCurrentScroll(loc.key, currPath, { sectionId, y })

      if (sectionId) {
        try {
          sessionStorage.setItem(`return_to_section_${nextPath}`, sectionId)
          sessionStorage.setItem(`return_to_y_${nextPath}`, String(y))
        } catch (_) { }
      }
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
    prevLocationRef.current = location

    if (location.hash) {
      return restoreScrollPositionSoon(location.hash)
    }

    if (navType === 'POP') {
      const prevPath = prevLoc ? prevLoc.pathname + prevLoc.search : null
      let returnSection = null
      let returnY = null
      if (prevPath) {
        try {
          returnSection = sessionStorage.getItem(`return_to_section_${prevPath}`)
          const storedY = sessionStorage.getItem(`return_to_y_${prevPath}`)
          if (storedY !== null) returnY = Number(storedY)
        } catch (_) { }
      }

      const stateSection = location.state?.fromSection
      const saved = readSavedScroll(location)
      const targetSection = returnSection || stateSection || saved?.sectionId
      const finalY = returnY ?? saved?.y ?? 0

      if (targetSection) {
        return restoreScrollPositionSoon({ sectionId: targetSection, y: finalY })
      }

      if (finalY > 0) {
        return restoreScrollPositionSoon(finalY)
      }

      return
    }

    // Normal forward navigation (PUSH / REPLACE) -> reset to top
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
  }, [location.pathname, location.search, location.hash, location.key, navType, location.state])

  return null
}

export function Layout() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  usePushNotifications(Boolean(isAuthenticated))

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
      <AppInstallNotification />
      <AllowNotificationModal />
    </>
  )
}
