import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, Heart, User, MessageCircle, MapPin, Menu, Search, X, ChevronDown, LogIn } from 'lucide-react'
import { SearchBar } from '@/features/search/components/SearchBar'
import { CartDrawer } from '@/features/cart/components/CartDrawer'
import { MegaMenuPanel } from '@/features/category/components/MegaMenu'
import { PointsBadge } from '@/features/loyalty/components/LoyaltySpotlight'
import { useAppStore } from '@/store'
import { useCartCount, useWishlistCount } from '@/store/selectors'
import { SITE_NAME, NAV_ITEMS } from '@/config/site'
import { MEGA_MENUS } from '@/features/category/api'
import { BrandLogo } from './BrandLogo'

const MENU_CLOSE_DELAY = 280

function navHref(item) {
  if (item.slug === 'home') return '/'
  if (item.slug === 'new-arrivals') return '/shop/new-arrivals'
  if (item.slug === 'sale') return '/shop/sale'
  return `/shop/${item.slug}`
}

function isNavActive(item, pathname) {
  if (item.slug === 'home') return pathname === '/'
  return pathname.includes(item.slug)
}

export function Header() {
  const [activeMenu, setActiveMenu] = useState(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileSection, setMobileSection] = useState(null)
  const closeTimer = useRef(null)
  const location = useLocation()
  const cartCount = useCartCount()
  const wishlistCount = useWishlistCount()
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
    setMobileNavOpen(false)
    setSearchOpen(false)
    setMobileSection(null)
  }, [location.pathname])

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== 'Escape') return
      setMobileNavOpen(false)
      setSearchOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = () => {
      if (!media.matches) return
      setMobileNavOpen(false)
      setSearchOpen(false)
    }
    media.addEventListener('change', closeOnDesktop)
    return () => media.removeEventListener('change', closeOnDesktop)
  }, [])

  return (
    <>
      <header className={`header ${searchOpen ? 'header--search-open' : ''} ${mobileNavOpen ? 'header--menu-open' : ''}`}>
        <div className="header__main" onMouseEnter={closeMenu}>
          <div className="container header__main-inner">
            <button
              type="button"
              className="header__util header__util--icon header__menu-btn"
              onClick={() => {
                setSearchOpen(false)
                setMobileNavOpen((open) => !open)
              }}
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <Link to="/" className="header__logo" aria-label={`${SITE_NAME} home`}>
              <BrandLogo />
            </Link>

            <div className="header__search">
              <SearchBar iconRight autoFocus={searchOpen} />
            </div>

            <div className="header__utils">
              <button
                type="button"
                className="header__util header__util--icon header__search-toggle"
                onClick={() => {
                  setMobileNavOpen(false)
                  setSearchOpen((open) => !open)
                }}
                aria-label={searchOpen ? 'Close search' : 'Open search'}
                aria-expanded={searchOpen}
              >
                {searchOpen ? <X size={18} /> : <Search size={18} />}
              </button>
              {/* <Link to="/account" className="header__util header__util--desktop">
                <MessageCircle size={18} />
                <span className="header__util-label">Chat</span>
              </Link> */}
              {/* <Link to="/account" className="header__util header__util--desktop">
                <MapPin size={18} />
                <span className="header__util-label">Stores</span>
              </Link> */}
              <Link to="/wishlist" className="header__util header__util--icon" aria-label="Wishlist">
                <Heart size={18} />
                {wishlistCount > 0 && (
                  <span className="header__badge-count">{wishlistCount}</span>
                )}
              </Link>
              <Link to="/profile" className="header__util header__util--desktop">
                <User size={18} />
                <span className="header__util-label">My Account</span>
              </Link>
              <Link
                to={isAuthenticated ? '/loyalty' : '/login'}
                className={`header__points ${isAuthenticated ? '' : 'header__points--login'}`}
                aria-label={isAuthenticated ? 'Loyalty points' : 'Log in'}
              >
                {isAuthenticated ? (
                  <PointsBadge />
                ) : (
                  <>
                    <LogIn size={14} strokeWidth={1.75} aria-hidden="true" />
                    <span>Log in</span>
                  </>
                )}
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
                    className={`header__nav-link ${isNavActive(item, location.pathname) ? 'header__nav-link--active' : ''}`}
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

      {mobileNavOpen && (
        <>
          <button
            type="button"
            className="header__mobile-overlay"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <nav className="header__mobile-menu" aria-label="Mobile navigation">
            <div className="header__mobile-menu-head">
              <p className="heading-sm text-accent">Shop</p>
              <button
                type="button"
                className="btn btn--ghost btn--icon"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            {NAV_ITEMS.map((item) => {
              const columns = item.megaMenu ? MEGA_MENUS[categoryMap[item.slug]] : null
              const isExpanded = mobileSection === item.slug

              if (columns?.length) {
                return (
                  <div key={item.slug} className="header__mobile-group">
                    <button
                      type="button"
                      className={`header__mobile-link ${isNavActive(item, location.pathname) ? 'header__mobile-link--active' : ''}`}
                      aria-expanded={isExpanded}
                      onClick={() => setMobileSection(isExpanded ? null : item.slug)}
                    >
                      {item.label}
                      <ChevronDown size={18} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }} />
                    </button>
                    {isExpanded && (
                      <div className="header__mobile-sub">
                        {columns.flatMap((column) =>
                          column.links.map((link) => (
                            <Link
                              key={`${item.slug}-${link.label}`}
                              to={link.href}
                              className="header__mobile-sublink"
                              onClick={() => setMobileNavOpen(false)}
                            >
                              {link.label}
                            </Link>
                          ))
                        )}
                        <Link
                          to={navHref(item)}
                          className="header__mobile-sublink"
                          onClick={() => setMobileNavOpen(false)}
                        >
                          Shop all {item.label}
                        </Link>
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.slug}
                  to={navHref(item)}
                  className={`header__mobile-link ${isNavActive(item, location.pathname) ? 'header__mobile-link--active' : ''}`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  {item.label}
                </Link>
              )
            })}
            <div className="header__mobile-extras">
              <Link to="/profile" onClick={() => setMobileNavOpen(false)}>My Account</Link>
              <Link to="/wishlist" onClick={() => setMobileNavOpen(false)}>Wishlist</Link>
              <Link to="/loyalty" onClick={() => setMobileNavOpen(false)}>Circle Points</Link>
              <Link to="/account" onClick={() => setMobileNavOpen(false)}>Stores</Link>
              {/* <Link to="/account" onClick={() => setMobileNavOpen(false)}>Chat</Link> */}
            </div>
          </nav>
        </>
      )}
      <CartDrawer />
    </>
  )
}
