import { useLayoutEffect } from 'react'
import { Outlet, ScrollRestoration, useLocation, useNavigationType } from 'react-router-dom'
import { PromoBanner } from './PromoBanner'
import { Header } from './Header'
import { Footer } from './Footer'
import { MobileBottomNav } from './MobileBottomNav'

function ScrollToTop() {
  const { pathname, search, hash } = useLocation()
  const navType = useNavigationType()

  useLayoutEffect(() => {
    if (hash) return
    if (navType === 'POP') return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, search, hash, navType])

  return <ScrollRestoration />
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
