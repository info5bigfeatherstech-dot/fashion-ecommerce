import { Suspense, useLayoutEffect } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PageLoader'
import { PromoBanner } from './PromoBanner'
import { Header } from './Header'
import { Footer } from './Footer'
import { MobileBottomNav } from './MobileBottomNav'
import { AuthModal } from '@/features/auth/components/AuthModal'
import { scrollToTopSoon } from '@/lib/lenis'

function ScrollToTop() {
  const { pathname, search, hash } = useLocation()
  const navType = useNavigationType()

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useLayoutEffect(() => {
    if (hash) return
    // Keep browser back/forward position; reset on normal navigations
    if (navType === 'POP') return
    return scrollToTopSoon()
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
