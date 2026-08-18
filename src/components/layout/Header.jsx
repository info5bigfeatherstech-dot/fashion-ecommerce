import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, Heart, User, MessageCircle, MapPin } from 'lucide-react'
import { SearchBar } from '@/features/search/components/SearchBar'
import { CartDrawer } from '@/features/cart/components/CartDrawer'
import { MegaMenuPanel } from '@/features/category/components/MegaMenu'
import { PointsBadge } from '@/features/loyalty/components/LoyaltySpotlight'
import { useAppStore } from '@/store'
import { useCartCount } from '@/store/selectors'
import { SITE_NAME, NAV_ITEMS } from '@/config/site'

const MENU_CLOSE_DELAY = 280

function navHref(item) {
  if (item.slug === 'new-arrivals') return '/shop/new-arrivals'
  if (item.slug === 'sale') return '/shop/sale'
  return `/shop/${item.slug}`
}

export function Header() {
  const [activeMenu, setActiveMenu] = useState(null)
  const closeTimer = useRef(null)
  const location = useLocation()
  const cartCount = useCartCount()
  const wishlistCount = useAppStore((s) => s.wishlistItems.length)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
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

  const closeMenu = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setActiveMenu(null)
  }

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      setActiveMenu(null)
      closeTimer.current = null
    }, MENU_CLOSE_DELAY)
  }

  useEffect(() => {
    closeMenu()
  }, [location.pathname])

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  return (
    <>
      <header className="header">
        <div className="header__main" onMouseEnter={closeMenu}>
          <div className="container header__main-inner">
            <Link to="/" className="header__logo" aria-label={`${SITE_NAME} home`}>
              <span className="header__logo-mark">{SITE_NAME}</span>
            </Link>

            <div className="header__search">
              <SearchBar iconRight />
            </div>

            <div className="header__utils">
              <Link to="/account" className="header__util">
                <MessageCircle size={18} />
                <span className="header__util-label">Chat</span>
              </Link>
              <Link to="/account" className="header__util">
                <MapPin size={18} />
                <span className="header__util-label">Stores</span>
              </Link>
              <Link to="/wishlist" className="header__util header__util--icon" aria-label="Wishlist">
                <Heart size={18} />
                {wishlistCount > 0 && (
                  <span className="header__badge-count">{wishlistCount}</span>
                )}
              </Link>
              <Link to="/profile" className="header__util">
                <User size={18} />
                <span className="header__util-label">My Account</span>
              </Link>
              <Link to="/loyalty" className="header__points">
                {isAuthenticated ? <PointsBadge /> : 'Circle Points: Log in'}
              </Link>
              <button type="button" className="header__util header__util--icon" onClick={openCart} aria-label="Shopping bag">
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="header__badge-count">{cartCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div
          className="header__nav-row"
          onMouseLeave={scheduleClose}
        >
          <div className="container header__nav-inner">
            <nav className="header__nav" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.slug}
                  onMouseEnter={() => {
                    if (item.megaMenu) {
                      openMenu(item.slug)
                    } else {
                      closeMenu()
                    }
                  }}
                >
                  <Link
                    to={navHref(item)}
                    className={`header__nav-link ${location.pathname.includes(item.slug) ? 'header__nav-link--active' : ''}`}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          {activeMenu && categoryMap[activeMenu] && (
            <div
              className={`mega-menu ${activeMenu === 'women' ? 'mega-menu--women' : ''}`}
              onMouseEnter={() => openMenu(activeMenu)}
              onMouseLeave={scheduleClose}
            >
              <MegaMenuPanel activeCategory={categoryMap[activeMenu]} />
            </div>
          )}
        </div>
      </header>
      <CartDrawer />
    </>
  )
}
