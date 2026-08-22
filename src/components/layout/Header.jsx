import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag, Heart, User, MessageCircle, MapPin, Menu, Search, X, ChevronDown, ChevronRight, Warehouse, Home as HomeIcon } from 'lucide-react'
import { SearchBar } from '@/features/search/components/SearchBar'
import { CartDrawer } from '@/features/cart/components/CartDrawer'
import { MegaMenuPanel } from '@/features/category/components/MegaMenu'
import { useAppStore } from '@/store'
import { useCartCount, useWishlistCount } from '@/store/selectors'
import { SITE_NAME, NAV_ITEMS } from '@/config/site'
import { MEGA_MENUS } from '@/features/category/api'
import { BrandLogo } from './BrandLogo'
import { SaleLiveBadge } from './SaleLiveBadge'
import { getUserFirstName } from '@/lib/utils'
import { MEDIA_QUERIES } from '@/config/breakpoints'

const MENU_CLOSE_DELAY = 280

function navHref(item) {
  if (item.slug === 'home') return '/'
  if (item.slug === 'new-arrivals') return '/shop/new-arrivals'
  if (item.slug === 'sale') return '/shop/sale'
  return `/shop/${item.slug}`
}

function isNavActive(item, pathname) {
  if (item.slug === 'home') return pathname === '/'
  const href = navHref(item)
  return pathname === href || pathname.startsWith(`${href}/`)
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
  const openCart = useAppStore((s) => s.openCart)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const user = useAppStore((s) => s.user)
  const openAuthModal = useAppStore((s) => s.openAuthModal)
  const accountFirstName = getUserFirstName(user)
  const accountLabel = isAuthenticated && accountFirstName ? accountFirstName : 'My Account'

  const handleMyAccountClick = (event) => {
    if (!isAuthenticated) {
      event.preventDefault()
      openAuthModal({ redirectTo: '/profile', mode: 'login' })
    }
    setMobileNavOpen(false)
  }

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
    const media = window.matchMedia(MEDIA_QUERIES.desktop)
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
                <span className="header__util-icon">
                  <Heart size={22} />
                  {wishlistCount > 0 && (
                    <span className="header__badge-count">{wishlistCount}</span>
                  )}
                </span>
                <span className="header__util-label">Wishlist</span>
              </Link>
              <Link
                to="/profile"
                className="header__util header__util--desktop"
                onClick={handleMyAccountClick}
                aria-label="My Account"
              >
                <span className="header__util-icon">
                  <User size={22} />
                </span>
                <span className="header__util-label">{accountLabel}</span>
              </Link>
              <Link to="/wholesale" className="header__util header__util--desktop">
                <span className="header__util-icon">
                  <Warehouse size={22} />
                </span>
                <span className="header__util-label">Wholesale</span>
              </Link>
              <button type="button" className="header__util header__util--icon" onClick={openCart} aria-label="Shopping bag">
                <span className="header__util-icon">
                  <ShoppingBag size={24} />
                  {cartCount > 0 && (
                    <span className="header__badge-count">{cartCount}</span>
                  )}
                </span>
                <span className="header__util-label">Bag</span>
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
                    if (!item.megaMenu) {
                      closeMenu()
                      return
                    }
                    if (!window.matchMedia(MEDIA_QUERIES.desktop).matches) {
                      closeMenu()
                      return
                    }
                    openMenu(item.slug)
                  }}
                >
                  <Link
                    to={navHref(item)}
                    className={`header__nav-link ${isNavActive(item, location.pathname) ? 'header__nav-link--active' : ''}`}
                  >
                    {item.slug === 'home' ? <HomeIcon size={18} aria-hidden /> : item.label}
                  </Link>
                </div>
              ))}
              <SaleLiveBadge />
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

      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.button
              type="button"
              className="drawer-overlay"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.nav
              className="drawer drawer--left"
              aria-label="Mobile navigation"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="drawer__header">
                <div>
                  <p className="drawer__eyebrow">Menu</p>
                  <h2 className="drawer__title">{SITE_NAME}</h2>
                  <p className="drawer__meta">Shop jewelry by category</p>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--icon"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="drawer__body header__mobile-body">
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
                          <ChevronDown size={18} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 180ms ease' }} />
                        </button>
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              className="header__mobile-sub"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
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
                            </motion.div>
                          )}
                        </AnimatePresence>
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
                      {item.slug === 'home' ? <HomeIcon size={18} aria-hidden /> : item.label}
                      <ChevronRight size={16} />
                    </Link>
                  )
                })}

                <div className="header__mobile-sale">
                  <SaleLiveBadge />
                </div>

                <div className="header__mobile-extras">
                  <Link to="/profile" onClick={handleMyAccountClick} aria-label="My Account">
                    <User size={16} /> {accountLabel} <ChevronRight size={16} />
                  </Link>
                  <Link to="/wholesale" onClick={() => setMobileNavOpen(false)}>
                    <Warehouse size={16} /> Wholesale <ChevronRight size={16} />
                  </Link>
                  <Link to="/wishlist" onClick={() => setMobileNavOpen(false)}>
                    <Heart size={16} /> Wishlist <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
      <CartDrawer />
    </>
  )
}
