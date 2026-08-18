import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react'
import { useCartCount, useWishlistCount } from '@/store/selectors'

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/shop/women', label: 'Shop', icon: Search },
  { to: '/wishlist', label: 'Wishlist', icon: Heart, badge: 'wishlistCount' },
  { to: '/cart', label: 'Bag', icon: ShoppingBag, badge: 'cartCount' },
  { to: '/profile', label: 'Account', icon: User },
]

export function MobileBottomNav() {
  const location = useLocation()
  const cartCount = useCartCount()
  const wishlistCount = useWishlistCount()

  const badges = { cartCount, wishlistCount }

  return (
    <nav className="mobile-nav" aria-label="Mobile bottom navigation">
      {NAV_LINKS.map(({ to, label, icon: Icon, badge }) => {
        const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
        const count = badge ? badges[badge] : 0

        return (
          <Link
            key={to}
            to={to}
            className={`mobile-nav__link ${isActive ? 'mobile-nav__link--active' : ''}`}
          >
            <Icon size={20} />
            {label}
            {count > 0 && <span className="mobile-nav__badge">{count}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
