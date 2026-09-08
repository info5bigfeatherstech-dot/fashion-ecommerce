import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { WishlistProductGrid } from '@/features/wishlist/components/WishlistProductGrid'
import { useWishlist } from '@/features/wishlist/hooks'
import { useAppStore } from '@/store'

export function AccountWishlistTab() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const wishlistItems = useAppStore((s) => s.wishlistItems)

  useWishlist({ enabled: isAuthenticated })

  return (
    <div className="account-section">
      <div className="account-section__header">
        <div>
          <p className="heading-sm text-accent">Saved</p>
          <h2 className="display-md">Wishlist</h2>
          {wishlistItems.length > 0 && (
            <p className="body-sm text-muted" style={{ marginTop: 4 }}>
              {wishlistItems.length} {wishlistItems.length === 1 ? 'piece' : 'pieces'} saved
            </p>
          )}
        </div>
        {wishlistItems.length > 0 && (
          <Link to="/wishlist">
            <Button variant="secondary" size="sm">Open full wishlist</Button>
          </Link>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <div className="account-panel">
          <div className="account-empty">
            <div className="account-empty__icon"><Heart size={22} /></div>
            <p className="body-lg">Your wishlist is empty</p>
            <p className="body-sm text-muted">Tap the heart on any product and it will appear here.</p>
            <Link to="/shop/women" style={{ marginTop: 'var(--space-2)' }}>
              <Button variant="primary">Explore jewelry</Button>
            </Link>
          </div>
        </div>
      ) : (
        <WishlistProductGrid
          wishlistItems={wishlistItems}
          enabled={isAuthenticated && wishlistItems.length > 0}
          className="account-wishlist-grid"
          defaultView="list"
        />
      )}
    </div>
  )
}
