import { Outlet } from 'react-router-dom'
import { PromoBanner } from './PromoBanner'
import { Header } from './Header'
import { Footer } from './Footer'
import { MobileBottomNav } from './MobileBottomNav'

export function Layout() {
  return (
    <>
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
