import { Link, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, Heart, ShoppingBag, User } from 'lucide-react'
import { useCartCount, useWishlistCount } from '@/store/selectors'
import { useAppStore } from '@/store'
import { getUserFirstName } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/product-all', label: 'Categories', icon: LayoutGrid },
  { to: '/wishlist', label: 'Wishlist', icon: Heart, badge: 'wishlistCount' },
  {
    to: '/account/cart',
    label: 'Bag',
    icon: ShoppingBag,
    badge: 'cartCount',
    requiresAuth: true,
  },
  {
    to: '/account/profile',
    label: 'Account',
    icon: User,
    requiresAuth: true,
    isAccountHome: true,
  },
]

export function MobileBottomNav() {
  const location = useLocation()
  const cartCount = useCartCount()
  const wishlistCount = useWishlistCount()
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const user = useAppStore((s) => s.user)
  const openAuthModal = useAppStore((s) => s.openAuthModal)
  const accountFirstName = getUserFirstName(user)
  const accountLabel = isAuthenticated && accountFirstName ? accountFirstName : 'Account'

  const badges = { cartCount, wishlistCount }

  const handleAuthLinkClick = (event, redirectTo) => {
    if (!isAuthenticated) {
      event.preventDefault()
      openAuthModal({ redirectTo, mode: 'login' })
    }
  }

  return (
    <nav className="mobile-nav" aria-label="Mobile bottom navigation">
      {NAV_LINKS.map(({ to, label, icon: Icon, badge, requiresAuth, isAccountHome }) => {
        let active = false
        if (to === '/account/cart') {
          active = location.pathname === '/account/cart'
        } else if (isAccountHome) {
          active = location.pathname.startsWith('/account') && location.pathname !== '/account/cart'
        } else {
          active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
        }

        const count = badge ? badges[badge] : 0
        const linkLabel = isAccountHome ? accountLabel : label

        return (
          <Link
            key={to}
            to={to}
            className={`mobile-nav__link ${active ? 'mobile-nav__link--active' : ''}`}
            onClick={requiresAuth ? (event) => handleAuthLinkClick(event, to) : undefined}
            aria-label={isAccountHome ? 'My Account' : undefined}
          >
            <Icon size={20} />
            {linkLabel}
            {count > 0 && <span className="mobile-nav__badge">{count}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
