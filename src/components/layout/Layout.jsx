import { useLayoutEffect } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { PromoBanner } from './PromoBanner'
import { Header } from './Header'
import { Footer } from './Footer'
import { MobileBottomNav } from './MobileBottomNav'
import { scrollToTop } from '@/lib/lenis'

function ScrollToTop() {
  const { pathname, search, hash } = useLocation()
  const navType = useNavigationType()

  useLayoutEffect(() => {
    if (hash) return
    // Always reset on new navigations; POP can keep prior position
    if (navType === 'POP') return
    scrollToTop()
    // After layout (images/skeletons), force top again so Lenis can't stick at bottom
    const raf = requestAnimationFrame(() => scrollToTop())
    return () => cancelAnimationFrame(raf)
  }, [pathname, search, hash, navType])

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
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  )
}
