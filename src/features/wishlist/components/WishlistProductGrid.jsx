import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutGrid, List, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/features/product/components/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { useWishlistProducts } from '@/features/wishlist/hooks'
import { useAppStore } from '@/store'
import { formatPrice } from '@/lib/utils'
import { showAddedToCartToast } from '@/lib/cart-toast'

const PAGE_SIZE = 12

export function WishlistProductGrid({
  wishlistItems = [],
  enabled = true,
  className = '',
  defaultView = 'list',
}) {
  const navigate = useNavigate()
  const addItem = useAppStore((s) => s.addItem)
  const removeFromWishlist = useAppStore((s) => s.removeFromWishlist)
  const cartItems = useAppStore((s) => s.cartItems)
  const [view, setView] = useState(defaultView)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const cartByProductId = useMemo(() => {
    const map = new Map()
    cartItems.forEach((item) => {
      const key = String(item.productId)
      map.set(key, (map.get(key) || 0) + (item.quantity || 0))
    })
    return map
  }, [cartItems])

  const visibleItems = useMemo(
    () => wishlistItems.slice(0, visibleCount),
    [wishlistItems, visibleCount],
  )

  const { products, isLoading } = useWishlistProducts(visibleItems, {
    enabled: enabled && visibleItems.length > 0,
  })

  const remaining = Math.max(0, wishlistItems.length - visibleCount)
  const showing = Math.min(visibleCount, wishlistItems.length)

  if (!wishlistItems.length) return null

  return (
    <div className={`wishlist-browser ${className}`.trim()}>
      <div className="wishlist-toolbar">
        <p className="wishlist-toolbar__meta">
          Showing {showing} of {wishlistItems.length}
        </p>
        <div className="wishlist-toolbar__views" role="group" aria-label="Wishlist layout">
          <button
            type="button"
            className={`wishlist-toolbar__view${view === 'list' ? ' is-active' : ''}`}
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
          >
            <List size={16} />
            List
          </button>
          <button
            type="button"
            className={`wishlist-toolbar__view${view === 'grid' ? ' is-active' : ''}`}
            onClick={() => setView('grid')}
            aria-pressed={view === 'grid'}
          >
            <LayoutGrid size={16} />
            Grid
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="wishlist-list">
          {products.map((product) => {
            const pending = product._isLoading && !product._hydrated
            const inBagQty = cartByProductId.get(String(product.id)) || 0
            const code = product.productCode
            const image = product.images?.[0] || product.image

            if (pending && isLoading) {
              return (
                <div key={product.id} className="wishlist-row wishlist-row--skeleton">
                  <div className="skeleton skeleton--image wishlist-row__thumb" />
                  <div className="wishlist-row__body">
                    <div className="skeleton skeleton--text" />
                    <div className="skeleton skeleton--text" style={{ width: '40%' }} />
                  </div>
                </div>
              )
            }

            return (
              <article
                key={product.id}
                className={`wishlist-row${inBagQty > 0 ? ' wishlist-row--in-cart' : ''}`}
              >
                <Link to={`/product/${product.slug}`} className="wishlist-row__media">
                  <img src={image} alt="" className="wishlist-row__thumb" />
                </Link>

                <div className="wishlist-row__body">
                  <Link to={`/product/${product.slug}`} className="wishlist-row__name">
                    {product.name}
                  </Link>
                  <div className="wishlist-row__meta">
                    {code && <span>{code}</span>}
                    <span>{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <span className="wishlist-row__was">{formatPrice(product.originalPrice)}</span>
                    )}
                  </div>
                  {inBagQty > 0 && (
                    <span className="wishlist-row__badge">In bag · {inBagQty}</span>
                  )}
                </div>

                <div className="wishlist-row__actions">
                  <Button
                    variant={inBagQty > 0 ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => {
                      addItem(product)
                      showAddedToCartToast(product, { onViewBag: () => navigate('/cart') })
                    }}
                  >
                    <ShoppingBag size={14} />
                    {inBagQty > 0 ? 'Add again' : 'Add'}
                  </Button>
                  <button
                    type="button"
                    className="wishlist-row__remove"
                    onClick={() => removeFromWishlist(product.id)}
                    aria-label={`Remove ${product.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="wishlist-grid wishlist-grid--compact">
          {products.map((product) => {
            const code = product.productCode
            const pending = product._isLoading && !product._hydrated
            const inBagQty = cartByProductId.get(String(product.id)) || 0

            if (pending && isLoading) {
              return (
                <div key={product.id} className="wishlist-item wishlist-item--skeleton">
                  <ProductCardSkeleton />
                </div>
              )
            }

            return (
              <article
                key={product.id}
                className={`wishlist-item wishlist-item--compact${inBagQty > 0 ? ' wishlist-item--in-cart' : ''}`}
              >
                <ProductCard product={product} compact />
                <div className="wishlist-item__footer">
                  {code && <p className="wishlist-item__code">{code}</p>}
                  <div className="wishlist-item__actions">
                    <Button
                      variant={inBagQty > 0 ? 'secondary' : 'primary'}
                      size="sm"
                      fullWidth
                      onClick={() => {
                        addItem(product)
                        showAddedToCartToast(product, { onViewBag: () => navigate('/cart') })
                      }}
                    >
                      <ShoppingBag size={14} />
                      {inBagQty > 0 ? 'Add again' : 'Add'}
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
      )}

      {remaining > 0 && (
        <div className="wishlist-more">
          <Button
            variant="secondary"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            Show more ({Math.min(PAGE_SIZE, remaining)} of {remaining} left)
          </Button>
        </div>
      )}
    </div>
  )
}
