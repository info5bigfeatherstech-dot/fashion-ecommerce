import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Minus, Plus, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store'
import { cn, formatPrice, formatDiscount } from '@/lib/utils'
import { FEATURE_FLAGS } from '@/config/site'
import { showAddedToCartToast } from '@/lib/cart-toast'
import { resolveVariantId } from '@/features/product/mappers'
import { OfferCode } from './OfferCode'

const MAX_QUICK_QTY = 8

function getDefaultOptions(product) {
  return {
    size: product.sizes?.[0],
    color: product.colors?.[0],
  }
}

export function ProductCard({ product, compact = false }) {
  const toggleWishlist = useAppStore((s) => s.toggleWishlist)
  const addItem = useAppStore((s) => s.addItem)
  const updateQuantity = useAppStore((s) => s.updateQuantity)
  const removeItem = useAppStore((s) => s.removeItem)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const inWishlist = useAppStore((s) => (s.isAuthenticated ? s.isInWishlist(product.id) : false))
  const cartItems = useAppStore((s) => s.cartItems)
  const navigate = useNavigate()

  const defaults = getDefaultOptions(product)
  const { size, color } = defaults
  const productId = String(product.id)
  const defaultVariantId = useMemo(() => {
    const id = resolveVariantId(product, defaults)
    return id ? String(id) : null
  }, [product, defaults.size, defaults.color]) // eslint-disable-line react-hooks/exhaustive-deps

  const cartLine = useMemo(() => {
    if (!isAuthenticated) return null
    return cartItems.find((item) => {
      if (String(item.productId) !== productId) return false
      if (item.variantId && defaultVariantId) {
        return String(item.variantId) === defaultVariantId
      }
      if (size == null && color == null) return true
      return item.size === size && item.color === color
    }) || null
  }, [isAuthenticated, cartItems, productId, size, color, defaultVariantId])

  const cartQtyForProduct = useMemo(() => {
    if (!isAuthenticated) return 0
    return cartItems
      .filter((item) => String(item.productId) === productId)
      .reduce((sum, item) => sum + (item.quantity || 0), 0)
  }, [isAuthenticated, cartItems, productId])

  const discount = formatDiscount(product.originalPrice, product.price)
  const inCartQty = cartLine?.quantity || 0
  const isInCart = cartQtyForProduct > 0
  const defaultVariant = useMemo(() => {
    if (!product.variants?.length) return null
    if (defaultVariantId) {
      return product.variants.find((v) => String(v.id) === defaultVariantId) || null
    }
    return product.variants.find((v) => v.inStock) || product.variants[0] || null
  }, [product.variants, defaultVariantId])
  const isAvailable = product.inStock !== false
  const canQuickAdd = defaultVariant
    ? Boolean(defaultVariant.inStock)
    : isAvailable

  const requireAuth = () => {
    if (isAuthenticated) return true
    navigate('/login', { state: { redirectTo: `/product/${product.slug}` } })
    return false
  }

  const handleQuickAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canQuickAdd) return
    if (!requireAuth()) return

    addItem(product, { ...getDefaultOptions(product), quantity: 1 })
    showAddedToCartToast(product, {
      quantity: 1,
      onViewBag: () => navigate('/cart'),
    })
  }

  const handleDecrease = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!requireAuth() || !cartLine) return

    if (cartLine.quantity <= 1) {
      removeItem(cartLine.id)
      return
    }
    updateQuantity(cartLine.id, cartLine.quantity - 1)
  }

  const handleIncrease = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canQuickAdd) return
    if (!requireAuth()) return

    if (cartLine) {
      if (cartLine.quantity >= MAX_QUICK_QTY) return
      updateQuantity(cartLine.id, cartLine.quantity + 1)
      return
    }

    handleQuickAdd(e)
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!requireAuth()) return
    toggleWishlist(product)
  }

  return (
    <Link
      to={`/product/${product.slug}`}
      className={cn(
        'product-card',
        compact && 'product-card--compact',
        isInCart && 'product-card--in-cart',
        !isAvailable && 'product-card--unavailable',
      )}
      aria-label={
        !isAvailable
          ? `${product.name}, not available`
          : isInCart
            ? `${product.name}, ${cartQtyForProduct} in bag`
            : product.name
      }
    >
      <div className="product-card__media">
        {product.badge && (
          <div className="product-card__badge">
            <Badge badge={product.badge} />
          </div>
        )}

        {!isAvailable && (
          <span className="product-card__unavailable" aria-hidden="true">
            Not available
          </span>
        )}

        {/* {isInCart && (
          <span className="product-card__in-cart" aria-hidden="true">
            <ShoppingBag size={12} />
            In bag · {cartQtyForProduct}
          </span>
        )} */}

        <button
          type="button"
          className={`product-card__wishlist wishlist-btn ${inWishlist ? 'wishlist-btn--active' : ''}`}
          onClick={handleWishlist}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            transition={{ duration: 0.15 }}
          >
            <Heart size={compact ? 16 : 18} />
          </motion.div>
        </button>
        <img
          src={product.images?.[0]}
          alt={product.name}
          className="product-card__image product-card__image--primary"
          loading="lazy"
        />
        {!compact && product.images?.[1] && (
          <img
            src={product.images[1]}
            alt=""
            className="product-card__image product-card__image--secondary"
            loading="lazy"
            aria-hidden="true"
          />
        )}
        {!compact && FEATURE_FLAGS.enableQuickAdd && canQuickAdd && (
          <div
            className={`product-card__quick-add${inCartQty > 0 ? ' product-card__quick-add--active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <div className="product-card__qty" role="group" aria-label="Quick add quantity">
              <button
                type="button"
                className="product-card__qty-btn"
                onClick={handleDecrease}
                aria-label="Decrease quantity"
                disabled={inCartQty === 0}
              >
                <Minus size={14} />
              </button>

              {inCartQty > 0 ? (
                <span className="product-card__qty-value" aria-live="polite">
                  {inCartQty}
                </span>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  className="product-card__qty-add"
                  onClick={handleQuickAdd}
                >
                  Quick Add
                </Button>
              )}

              <button
                type="button"
                className="product-card__qty-btn"
                onClick={handleIncrease}
                aria-label="Increase quantity"
                disabled={inCartQty >= MAX_QUICK_QTY}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        {(product.productCode || product.sku) && (
          <p className="product-card__code">Code: {product.productCode || product.sku}</p>
        )}
        <div className="product-card__price-row">
          <span className="product-card__price">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="product-card__original">{formatPrice(product.originalPrice)}</span>
          )}
          {discount && (
            <span className="product-card__discount">-{discount}%</span>
          )}
        </div>
        <OfferCode compact />
        <div className="product-card__rating" data-empty={!(product.reviewCount > 0) ? 'true' : undefined}>
          <Star size={12} className="product-card__star" fill="currentColor" />
          <span>{product.rating}</span>
          <span>({product.reviewCount})</span>
        </div>
      </div>
    </Link>
  )
}
