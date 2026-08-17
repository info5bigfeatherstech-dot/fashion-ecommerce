import { Link } from 'react-router-dom'
import { Heart, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store'
import { formatPrice, formatDiscount } from '@/lib/utils'
import { FEATURE_FLAGS } from '@/config/site'
import { OfferCode } from './OfferCode'

export function ProductCard({ product, compact = false }) {
  const toggleWishlist = useAppStore((s) => s.toggleWishlist)
  const inWishlist = useAppStore((s) => s.isInWishlist(product.id))
  const addItem = useAppStore((s) => s.addItem)
  const openCart = useAppStore((s) => s.openCart)

  const discount = formatDiscount(product.originalPrice, product.price)

  const handleQuickAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    openCart()
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)
  }

  return (
    <Link to={`/product/${product.slug}`} className={`product-card ${compact ? 'product-card--compact' : ''}`}>
      <div className="product-card__media">
        {product.badge && (
          <div className="product-card__badge">
            <Badge badge={product.badge} />
          </div>
        )}
        <button
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
          src={product.images[0]}
          alt={product.name}
          className="product-card__image product-card__image--primary"
          loading="lazy"
        />
        {!compact && product.images[1] && (
          <img
            src={product.images[1]}
            alt=""
            className="product-card__image product-card__image--secondary"
            loading="lazy"
            aria-hidden="true"
          />
        )}
        {!compact && FEATURE_FLAGS.enableQuickAdd && (
          <div className="product-card__quick-add">
            <Button variant="primary" size="sm" fullWidth onClick={handleQuickAdd}>
              Quick Add
            </Button>
          </div>
        )}
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
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
        <div className="product-card__rating">
          <Star size={12} className="product-card__star" fill="currentColor" />
          <span>{product.rating}</span>
          <span>({product.reviewCount})</span>
        </div>
      </div>
    </Link>
  )
}
