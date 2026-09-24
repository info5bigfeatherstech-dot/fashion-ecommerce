import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Minus, Plus, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store'
import { cn, formatPrice, formatDiscount } from '@/lib/utils'
import { getProductRatingDisplay } from '@/lib/productRatingDisplay'
import { FEATURE_FLAGS } from '@/config/site'
import { showAddedToCartToast } from '@/lib/cart-toast'
import { resolveVariantId } from '@/features/product/mappers'
import { resolveSwatchColor } from '@/features/product/components/SizeSelector'

const MAX_QUICK_QTY = 8
const MAX_CARD_COLOR_SWATCHES = 3

function getDefaultOptions(product) {
  return {
    size: product.sizes?.[0],
    color: product.colors?.[0],
  }
}

/** Unique color labels for card preview — max 3 visible, rest as "+". */
function getCardColorSwatches(product) {
  const seen = new Set()
  const colors = []
  for (const raw of product?.colors || []) {
    const label = String(raw || '').trim()
    if (!label) continue
    const key = label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    colors.push(label)
  }
  return {
    visible: colors.slice(0, MAX_CARD_COLOR_SWATCHES),
    extra: Math.max(0, colors.length - MAX_CARD_COLOR_SWATCHES),
  }
}

function stopCardNav(e) {
  e.preventDefault()
  e.stopPropagation()
}

function ProductCardQtyControls({
  inCartQty,
  onDecrease,
  onIncrease,
  onQuickAdd,
}) {
  return (
    <div className="product-card__qty" role="group" aria-label="Quick add quantity">
      <button
        type="button"
        className="product-card__qty-btn"
        onClick={onDecrease}
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
          onClick={onQuickAdd}
        >
          Quick Add
        </Button>
      )}

      <button
        type="button"
        className="product-card__qty-btn"
        onClick={onIncrease}
        aria-label="Increase quantity"
        disabled={inCartQty >= MAX_QUICK_QTY}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

/** Slim mobile/touch CTA — sits under price, never covers the photo. */
function ProductCardBodyAdd({
  inCartQty,
  onDecrease,
  onIncrease,
  onQuickAdd,
}) {
  if (inCartQty > 0) {
    return (
      <div className="product-card__body-qty" role="group" aria-label="Bag quantity">
        <button
          type="button"
          className="product-card__body-qty-btn"
          onClick={onDecrease}
          aria-label="Decrease quantity"
        >
          <Minus size={12} />
        </button>
        <span className="product-card__body-qty-value" aria-live="polite">
          {inCartQty}
        </span>
        <button
          type="button"
          className="product-card__body-qty-btn"
          onClick={onIncrease}
          aria-label="Increase quantity"
          disabled={inCartQty >= MAX_QUICK_QTY}
        >
          <Plus size={12} />
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="product-card__body-add"
      onClick={onQuickAdd}
    >
      Quick Add
    </button>
  )
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
  const ratingDisplay = useMemo(() => getProductRatingDisplay(product), [product])
  const colorSwatches = useMemo(() => getCardColorSwatches(product), [product])
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
  const showQuickAdd = !compact && FEATURE_FLAGS.enableQuickAdd && canQuickAdd

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
      onViewBag: () => navigate('/account/cart'),
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

  const qtyProps = {
    inCartQty,
    onDecrease: handleDecrease,
    onIncrease: handleIncrease,
    onQuickAdd: handleQuickAdd,
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
        {(discount || product.badge) && (
          <div className="product-card__badges">
            {discount && (
              <span className="product-card__discount-badge">
                {discount}% OFF
              </span>
            )}
            {product.badge && (
              <Badge badge={product.badge} />
            )}
          </div>
        )}

        {!isAvailable && (
          <span className="product-card__unavailable" aria-hidden="true">
            Not available
          </span>
        )}

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
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="product-card__image product-card__image--primary"
            loading="lazy"
          />
        ) : (
          <div className="product-card__image product-card__image--empty" aria-hidden="true" />
        )}
        {!compact && product.images?.[1] && (
          <img
            src={product.images[1]}
            alt=""
            className="product-card__image product-card__image--secondary"
            loading="lazy"
            aria-hidden="true"
          />
        )}
        {/* Desktop: image overlay on hover only — keeps jewelry photo clean on mobile */}
        {showQuickAdd && (
          <div
            className={cn(
              'product-card__quick-add',
              'product-card__quick-add--overlay',
              inCartQty > 0 && 'product-card__quick-add--active',
            )}
            onClick={stopCardNav}
          >
            <ProductCardQtyControls {...qtyProps} />
          </div>
        )}
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        {product.categoryLabel ? (
          <p className="product-card__meta">{product.categoryLabel}</p>
        ) : null}
        {(product.productCode || product.sku) ? (
          <p className="product-card__code">{product.productCode || product.sku}</p>
        ) : null}
        <div className="product-card__colors-row">
          {colorSwatches.visible.length > 0 ? (
            <div
              className="product-card__colors"
              aria-label={`${colorSwatches.visible.length + colorSwatches.extra} color options`}
            >
              <div className="product-card__colors-stack" aria-hidden="true">
                {colorSwatches.visible.map((swatchColor, index) => (
                  <span
                    key={`${swatchColor}-${index}`}
                    className="product-card__swatch"
                    title={swatchColor}
                    style={{
                      backgroundColor: resolveSwatchColor(swatchColor),
                    }}
                  />
                ))}
              </div>
              {colorSwatches.extra > 0 ? (
                <span className="product-card__swatch-more">+</span>
              ) : null}
            </div>
          ) : null}
          <div
            className="product-card__rating"
            data-empty={ratingDisplay.count === 0 ? 'true' : undefined}
          >
            <Star size={12} className="product-card__star" fill="currentColor" />
            <span>{Number(ratingDisplay.average).toFixed(1)}</span>
            <span>({ratingDisplay.count})</span>
          </div>
        </div>
        <div className="product-card__price-row">
          <span className="product-card__price">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="product-card__original">{formatPrice(product.originalPrice)}</span>
          )}
          {discount && (
            <span className="product-card__discount">{discount}%</span>
          )}
        </div>
        {showQuickAdd && (
          <div className="product-card__footer">
            <div
              className={cn(
                'product-card__quick-add',
                'product-card__quick-add--body',
                inCartQty > 0 && 'product-card__quick-add--active',
              )}
              onClick={stopCardNav}
            >
              <ProductCardBodyAdd {...qtyProps} />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
