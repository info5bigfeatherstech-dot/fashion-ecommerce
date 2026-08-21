import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { WishlistProductGrid } from '@/features/wishlist/components/WishlistProductGrid'
import { useWishlist } from '@/features/wishlist/hooks'
import { useAppStore } from '@/store'

export default function Wishlist() {
  const wishlistItems = useAppStore((s) => s.wishlistItems)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)

  useWishlist({ enabled: isAuthenticated })

  if (!isAuthenticated) {
    return (
      <div className="container empty-state wishlist-empty">
        <div className="wishlist-empty__icon" aria-hidden="true">
          <Heart size={28} />
        </div>
        <h1 className="empty-state__title">Sign in to view your wishlist</h1>
        <p className="body-lg text-muted">Your saved jewelry pieces will appear here after login.</p>
        <Link to="/login" state={{ redirectTo: '/wishlist' }}>
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    )
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="container empty-state wishlist-empty">
        <div className="wishlist-empty__icon" aria-hidden="true">
          <Heart size={28} />
        </div>
        <h1 className="empty-state__title">Your wishlist is empty</h1>
        <p className="body-lg text-muted">Save pieces you love by tapping the heart on any product.</p>
        <Link to="/shop/women">
          <Button variant="primary">Explore jewelry</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container wishlist-page">
      <header className="wishlist-header">
        <div>
          <p className="heading-sm text-accent">Saved for later</p>
          <h1 className="display-lg wishlist-header__title">Wishlist</h1>
          <p className="body-sm text-muted">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'piece' : 'pieces'} ready when you are
          </p>
        </div>
        <Link to="/shop/women">
          <Button variant="secondary" size="sm">Continue shopping</Button>
        </Link>
      </header>

      <WishlistProductGrid
        wishlistItems={wishlistItems}
        enabled={isAuthenticated && wishlistItems.length > 0}
      />
    </div>
  )
}
