import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, Heart, User } from 'lucide-react'
import { SearchBar } from '@/features/search/components/SearchBar'
import { CartDrawer } from '@/features/cart/components/CartDrawer'
import { MegaMenuPanel } from '@/features/category/components/MegaMenu'
import { useAppStore } from '@/store'
import { useCartCount } from '@/store/selectors'
import { SITE_NAME, NAV_ITEMS } from '@/config/site'

const MENU_CLOSE_DELAY = 280

export function Header() {
  const [activeMenu, setActiveMenu] = useState(null)
  const closeTimer = useRef(null)
  const location = useLocation()
  const cartCount = useCartCount()
  const wishlistCount = useAppStore((s) => s.wishlistItems.length)
  const openCart = useAppStore((s) => s.openCart)

  const categoryMap = {
    women: 'women',
    men: 'men',
    kids: 'kids',
    beauty: 'beauty',
  }

  const openMenu = (slug) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setActiveMenu(slug)
  }

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      setActiveMenu(null)
      closeTimer.current = null
    }, MENU_CLOSE_DELAY)
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  return (
    <>
      <header className="header" onMouseLeave={scheduleClose}>
        <div className="container header__inner">
          <Link to="/" className="header__logo" aria-label={`${SITE_NAME} home`}>
            {SITE_NAME}
          </Link>

          <nav className="header__nav" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.slug}
                onMouseEnter={() => {
                  if (item.megaMenu) {
                    openMenu(item.slug)
                  } else {
                    scheduleClose()
                  }
                }}
              >
                <Link
                  to={item.slug === 'new-arrivals' ? '/shop/new-arrivals' : item.slug === 'sale' ? '/shop/sale' : `/shop/${item.slug}`}
                  className={`header__nav-link ${location.pathname.includes(item.slug) ? 'header__nav-link--active' : ''}`}
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </nav>

          <div className="header__search">
            <SearchBar />
          </div>

          <div className="header__actions">
            <Link to="/account" className="header__action-btn" aria-label="Account">
              <User size={20} />
            </Link>
            <Link to="/wishlist" className="header__action-btn" aria-label="Wishlist">
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="header__badge-count">{wishlistCount}</span>
              )}
            </Link>
            <button className="header__action-btn" onClick={openCart} aria-label="Shopping bag">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="header__badge-count">{cartCount}</span>
              )}
            </button>
          </div>
        </div>

        {activeMenu && categoryMap[activeMenu] && (
          <div
            className="mega-menu"
            onMouseEnter={() => openMenu(activeMenu)}
          >
            <MegaMenuPanel activeCategory={categoryMap[activeMenu]} />
          </div>
        )}
      </header>
      <CartDrawer />
    </>
  )
}
