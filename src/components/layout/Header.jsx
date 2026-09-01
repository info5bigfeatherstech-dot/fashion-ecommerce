import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag, Heart, User, MessageCircle, Menu, Search, X, ChevronRight, ChevronDown, Warehouse, Home as HomeIcon, LayoutGrid } from 'lucide-react'
import { SearchBar } from '@/features/search/components/SearchBar'
import { CartDrawer } from '@/features/cart/components/CartDrawer'
import { useAppStore } from '@/store'
import { useCartCount, useWishlistCount } from '@/store/selectors'
import { SITE_NAME } from '@/config/site'
import { useHeaderNavItems } from '@/features/category/hooks'
import { BrandLogo } from './BrandLogo'
import { SaleLiveBadge } from './SaleLiveBadge'
import { getUserFirstName } from '@/lib/utils'
import { MEDIA_QUERIES } from '@/config/breakpoints'

function navHref(item) {
  if (item.href) return item.href
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreTimeoutRef = useRef(null)
  const location = useLocation()
  const cartCount = useCartCount()
  const wishlistCount = useWishlistCount()
  const openCart = useAppStore((s) => s.openCart)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const user = useAppStore((s) => s.user)
  const openAuthModal = useAppStore((s) => s.openAuthModal)
  const { navItems } = useHeaderNavItems()
  const accountFirstName = getUserFirstName(user)
  const accountLabel = isAuthenticated && accountFirstName ? accountFirstName : 'My Account'

  const { homeItem, categoryNavItems, moreCategories } = useMemo(() => {
    const home = navItems.find((item) => item.slug === 'home') || { label: 'Home', slug: 'home' }
    const allCategories = navItems.filter((item) => item.slug !== 'home')
    const visibleCategories = allCategories.slice(0, 5)
    const remainingCategories = allCategories.slice(5)

    return {
      homeItem: home,
      categoryNavItems: visibleCategories,
      moreCategories: remainingCategories,
    }
  }, [navItems])

  const handleMouseEnterMore = () => {
    if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current)
    setMoreOpen(true)
  }

  const handleMouseLeaveMore = () => {
    if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current)
    moreTimeoutRef.current = setTimeout(() => {
      setMoreOpen(false)
    }, 250)
  }

  const handleDropdownItemClick = () => {
    if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current)
    setMoreOpen(false)
  }

  const handleMyAccountClick = (event) => {
    if (!isAuthenticated) {
      event.preventDefault()
      openAuthModal({ redirectTo: '/account/profile', mode: 'login' })
    }
    setMobileNavOpen(false)
  }

  useEffect(() => {
    if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current)
    setMobileNavOpen(false)
    setSearchOpen(false)
    setMoreOpen(false)
  }, [location.pathname])

  useEffect(() => {
    return () => {
      if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current)
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
        <div className="header__main">
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
              <Link to="/wholesale" className="header__util header__util--desktop">
                <span className="header__util-icon">
                  <Warehouse size={22} />
                </span>
                <span className="header__util-label">Wholesale</span>
              </Link>
              <Link to="/contact" className="header__util header__util--desktop">
                <span className="header__util-icon">
                  <MessageCircle size={22} />
                </span>
                <span className="header__util-label">Contact Us</span>
              </Link>
              <Link to="/wishlist" className="header__util header__util--icon header__util--mobile-hide" aria-label="Wishlist">
                <span className="header__util-icon">
                  <Heart size={22} />
                  {wishlistCount > 0 && (
                    <span className="header__badge-count">{wishlistCount}</span>
                  )}
                </span>
                <span className="header__util-label">Wishlist</span>
              </Link>
              <button type="button" className="header__util header__util--icon header__util--mobile-hide" onClick={openCart} aria-label="Shopping bag">
                <span className="header__util-icon">
                  <ShoppingBag size={24} />
                  {cartCount > 0 && (
                    <span className="header__badge-count">{cartCount}</span>
                  )}
                </span>
                <span className="header__util-label">Bag</span>
              </button>
              <Link
                to="/account/profile"
                className="header__util header__util--desktop"
                onClick={handleMyAccountClick}
                aria-label="My Account"
              >
                <span className="header__util-icon">
                  <User size={22} />
                </span>
                <span className="header__util-label">{accountLabel}</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="header__nav-row">
          <div className="container header__nav-inner">
            <nav className="header__nav" aria-label="Main navigation">
              {homeItem && (
                <div key={homeItem.slug}>
                  <Link
                    to={navHref(homeItem)}
                    className={`header__nav-link ${isNavActive(homeItem, location.pathname) ? 'header__nav-link--active' : ''}`}
                  >
                    <HomeIcon size={18} aria-hidden />
                  </Link>
                </div>
              )}
              <div>
                {/* <Link
                  to="/product-all"
                  className={`product-all-nav-btn${location.pathname === '/product-all' ? ' product-all-nav-btn--active' : ''}`}
                  aria-label="Product All — browse every category"
                >
                  <LayoutGrid size={13} aria-hidden="true" />
                  <span>Product All</span>
                </Link> */}
              </div>
              {categoryNavItems.map((item) => (
                <div key={item.slug}>
                  <Link
                    to={navHref(item)}
                    className={`header__nav-link header__nav-link--category ${isNavActive(item, location.pathname) ? 'header__nav-link--active' : ''}`}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
              {moreCategories.length > 0 && (
                <div
                  className="header__nav-more-wrapper"
                  onMouseEnter={handleMouseEnterMore}
                  onMouseLeave={handleMouseLeaveMore}
                >
                  <button
                    type="button"
                    className="header__nav-more-btn"
                    aria-haspopup="true"
                    aria-expanded={moreOpen}
                    aria-label="More categories"
                    onClick={() => {
                      if (moreOpen) {
                        handleDropdownItemClick()
                      } else {
                        handleMouseEnterMore()
                      }
                    }}
                  >
                    <span>More Categories</span>
                    <ChevronDown size={13} className="header__nav-more-icon" />
                  </button>
                  <div
                    className={`header__nav-more-dropdown ${moreOpen ? 'header__nav-more-dropdown--open' : ''}`}
                    role="menu"
                  >
                    <div className="header__nav-more-header">
                      <span>More Collections</span>
                    </div>
                    <div className="header__nav-more-list">
                      {moreCategories.map((item) => (
                        <Link
                          key={item.slug}
                          to={navHref(item)}
                          className={`header__nav-more-item ${isNavActive(item, location.pathname) ? 'header__nav-more-item--active' : ''}`}
                          role="menuitem"
                          onClick={handleDropdownItemClick}
                        >
                          <span>{item.label}</span>
                          <ChevronRight size={13} className="header__nav-more-arrow" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <SaleLiveBadge />
            </nav>
          </div>
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
                {navItems.map((item) => (
                  <Link
                    key={item.slug}
                    to={navHref(item)}
                    className={`header__mobile-link ${isNavActive(item, location.pathname) ? 'header__mobile-link--active' : ''}`}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    {item.slug === 'home' ? <HomeIcon size={18} aria-hidden /> : item.label}
                    <ChevronRight size={16} />
                  </Link>
                ))}

                <Link
                  to="/product-all"
                  className={`header__mobile-link header__mobile-link--product-all ${location.pathname === '/product-all' ? 'header__mobile-link--active' : ''}`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <LayoutGrid size={18} aria-hidden />
                  Product All
                  <ChevronRight size={16} />
                </Link>

                <div className="header__mobile-sale">
                  <SaleLiveBadge />
                </div>

                <div className="header__mobile-extras">
                  <Link to="/account/profile" onClick={handleMyAccountClick} aria-label="My Account">
                    <User size={16} /> {accountLabel} <ChevronRight size={16} />
                  </Link>
                  <Link to="/wholesale" onClick={() => setMobileNavOpen(false)}>
                    <Warehouse size={16} /> Wholesale <ChevronRight size={16} />
                  </Link>
                  <Link to="/wishlist" onClick={() => setMobileNavOpen(false)}>
                    <Heart size={16} /> Wishlist <ChevronRight size={16} />
                  </Link>
                  <Link to="/contact" onClick={() => setMobileNavOpen(false)}>
                    <MessageCircle size={16} /> Contact Us <ChevronRight size={16} />
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
