import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react'
import { useCartCount, useWishlistCount } from '@/store/selectors'
import { useAppStore } from '@/store'
import { getUserFirstName } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/shop/women', label: 'Shop', icon: Search },
  { to: '/wishlist', label: 'Wishlist', icon: Heart, badge: 'wishlistCount' },
  { to: '/cart', label: 'Bag', icon: ShoppingBag, badge: 'cartCount' },
  { to: '/profile', label: 'Account', icon: User, requiresAuth: true },
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

  const handleAccountClick = (event) => {
    if (!isAuthenticated) {
      event.preventDefault()
      openAuthModal({ redirectTo: '/profile', mode: 'login' })
    }
  }

  return (
    <nav className="mobile-nav" aria-label="Mobile bottom navigation">
      {NAV_LINKS.map(({ to, label, icon: Icon, badge, requiresAuth }) => {
        const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
        const count = badge ? badges[badge] : 0
        const linkLabel = requiresAuth ? accountLabel : label

        return (
          <Link
            key={to}
            to={to}
            className={`mobile-nav__link ${isActive ? 'mobile-nav__link--active' : ''}`}
            onClick={requiresAuth ? handleAccountClick : undefined}
            aria-label={requiresAuth ? 'My Account' : undefined}
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
