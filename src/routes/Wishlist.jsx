import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/features/product/components/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { useWishlistProducts } from '@/features/wishlist/hooks'
import { useAppStore } from '@/store'
import { showAddedToCartToast } from '@/lib/cart-toast'

export default function Wishlist() {
  const wishlistItems = useAppStore((s) => s.wishlistItems)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const addItem = useAppStore((s) => s.addItem)
  const removeFromWishlist = useAppStore((s) => s.removeFromWishlist)
  const patchWishlistItem = useAppStore((s) => s.patchWishlistItem)
  const navigate = useNavigate()

  const { products, isLoading } = useWishlistProducts(wishlistItems, {
    enabled: isAuthenticated && wishlistItems.length > 0,
  })

  // Persist hydrated fields (productCode, price, etc.) back into local wishlist.
  useEffect(() => {
    products.forEach((product) => {
      if (!product._hydrated || !product.id) return
      const saved = wishlistItems.find((item) => item.id === product.id)
      if (!saved) return

      const nextCode = product.productCode || null
      const nextImage = product.images?.[0] || saved.image
      if (
        saved.productCode === nextCode
        && saved.price === product.price
        && saved.name === product.name
        && saved.image === nextImage
        && saved.slug === (product.slug || saved.slug)
      ) {
        return
      }

      patchWishlistItem(product.id, {
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: nextImage,
        badge: product.badge,
        rating: product.rating,
        reviewCount: product.reviewCount,
        productCode: nextCode,
        slug: product.slug || saved.slug,
      })
    })
  }, [products, wishlistItems, patchWishlistItem])

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

      <div className="wishlist-grid">
        {products.map((product) => {
          const code = product.productCode
          const pending = product._isLoading && !product._hydrated

          if (pending && isLoading) {
            return (
              <div key={product.id} className="wishlist-item wishlist-item--skeleton">
                <ProductCardSkeleton />
              </div>
            )
          }

          return (
            <article key={product.id} className="wishlist-item">
              <ProductCard product={product} />
              <div className="wishlist-item__footer">
                {code ? (
                  <p className="wishlist-item__code">Code: {code}</p>
                ) : pending ? (
                  <p className="wishlist-item__code wishlist-item__code--muted">Loading code…</p>
                ) : product._isError ? (
                  <p className="wishlist-item__code wishlist-item__code--muted">Could not load code</p>
                ) : (
                  <p className="wishlist-item__code wishlist-item__code--muted">Code unavailable</p>
                )}
                <div className="wishlist-item__actions">
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      addItem(product)
                      showAddedToCartToast(product, { onViewBag: () => navigate('/cart') })
                    }}
                  >
                    <ShoppingBag size={14} />
                    Add to bag
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => removeFromWishlist(product.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
