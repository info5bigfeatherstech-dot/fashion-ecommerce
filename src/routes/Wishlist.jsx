import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/features/product/components/ProductCard'
import { useAppStore } from '@/store'

export default function Wishlist() {
  const wishlistItems = useAppStore((s) => s.wishlistItems)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return (
      <div className="container empty-state">
        <Heart size={48} style={{ color: 'var(--color-muted)' }} />
        <h1 className="empty-state__title">Sign in to view your wishlist</h1>
        <p className="body-lg text-muted">Your saved jewelry items will appear here after login.</p>
        <Link to="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    )
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="container empty-state">
        <Heart size={48} style={{ color: 'var(--color-muted)' }} />
        <h1 className="empty-state__title">Your wishlist is empty</h1>
        <p className="body-lg text-muted">Save items you love by tapping the heart icon.</p>
        <Link to="/shop/women">
          <Button variant="primary">Explore Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-4)' }}>
      <h1 className="display-lg" style={{ marginBottom: 'var(--space-4)' }}>
        Wishlist ({wishlistItems.length})
      </h1>
      <div className="grid-4">
        {wishlistItems.map((item) => (
          <ProductCard
            key={item.id}
            product={{
              ...item,
              images: [item.image, item.image],
              category: '',
              subcategory: '',
              sizes: [],
              colors: [],
              description: '',
            }}
          />
        ))}
      </div>
    </div>
  )
}
