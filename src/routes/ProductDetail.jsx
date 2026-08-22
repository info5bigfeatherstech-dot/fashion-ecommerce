import { useLayoutEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, Heart, Minus, Plus } from 'lucide-react'
import { ProductGallery } from '@/features/product/components/ProductGallery'
import { PriceBlock } from '@/features/product/components/PriceBlock'
import { SizeSelector, ColorSelector } from '@/features/product/components/SizeSelector'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Accordion } from '@/components/ui/Accordion'
import { ProductCarousel } from '@/features/product/components/ProductCarousel'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { useProductDetail, useRelatedProducts } from '@/features/product/hooks'
import { OfferCode } from '@/features/product/components/OfferCode'
import { useAppStore } from '@/store'
import { showAddedToCartToast } from '@/lib/cart-toast'
import { scrollToTop } from '@/lib/lenis'

function formatLabel(value) {
  if (!value) return ''
  return value.replace(/-/g, ' ')
}

export default function ProductDetail() {
  const { slug } = useParams()
  const { data: product, isLoading, isError } = useProductDetail(slug)
  const { data: relatedProducts = [] } = useRelatedProducts(slug, { limit: 8 })

  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [quantity, setQuantity] = useState(1)

  const addItem = useAppStore((s) => s.addItem)
  const toggleWishlist = useAppStore((s) => s.toggleWishlist)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const inWishlist = useAppStore((s) => (
    s.isAuthenticated && product ? s.isInWishlist(product.id) : false
  ))
  const navigate = useNavigate()

  useLayoutEffect(() => {
    setSelectedSize(null)
    setSelectedColor(null)
    setQuantity(1)
    scrollToTop()
  }, [slug])

  // Product + related content loads async; reset again so we don't land on "You May Also Like"
  useLayoutEffect(() => {
    if (isLoading || !product) return
    scrollToTop()
    const raf = requestAnimationFrame(() => scrollToTop())
    return () => cancelAnimationFrame(raf)
  }, [slug, isLoading, product?.id])

  if (isLoading) {
    return (
      <div className="container pdp-page">
        <div className="pdp">
          <div className="skeleton skeleton--image pdp-gallery__main" />
          <div className="pdp-info">
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--text" />
            <div className="skeleton skeleton--text" style={{ width: '40%' }} />
            <ProductGridSkeleton count={2} />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="container empty-state">
        <h1 className="empty-state__title">Product not found</h1>
        <Link to="/"><Button variant="secondary">Back to Home</Button></Link>
      </div>
    )
  }

  const size = selectedSize || product.sizes?.[0]
  const color = selectedColor || product.colors?.[0]

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { redirectTo: `/product/${slug}` }, replace: true })
      return
    }
    addItem(product, { size, color, quantity })
    showAddedToCartToast(product, {
      quantity,
      onViewBag: () => navigate('/cart'),
    })
  }

  const accordionItems = [
    ...(product.description
      ? [{
          value: 'description',
          title: 'Description',
          content: product.description,
        }]
      : []),
    ...(product.composition
      ? [{
          value: 'details',
          title: 'Details',
          content: product.composition,
        }]
      : []),
  ]

  const related = relatedProducts.filter((p) => p.id !== product.id).slice(0, 8)

  return (
    <div className="container pdp-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb__sep">/</span>
        <Link to={`/shop/${product.category}`}>{formatLabel(product.category)}</Link>
        {product.subcategory && (
          <>
            <span className="breadcrumb__sep">/</span>
            <Link to={`/shop/${product.category}`}>{formatLabel(product.subcategory)}</Link>
          </>
        )}
        <span className="breadcrumb__sep">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="pdp">
        <ProductGallery images={product.images} name={product.name} />

        <div className="pdp-info">
          <div className="pdp-info__kicker">
            {product.badge && <Badge badge={product.badge} />}
            <p className="pdp-info__category">
              {formatLabel(product.category)}
              {product.subcategory ? ` · ${formatLabel(product.subcategory)}` : ''}
            </p>
          </div>

          <h1 className="pdp-info__title">{product.name}</h1>

          {product.productCode && (
            <p className="pdp-info__code">{product.productCode}</p>
          )}

          <div className="pdp-info__rating">
            <span className="pdp-info__stars" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < Math.round(product.rating) ? 'currentColor' : 'none'}
                />
              ))}
            </span>
            <span>{product.rating}</span>
            <span className="text-muted">({product.reviewCount} reviews)</span>
          </div>

          <PriceBlock price={product.price} originalPrice={product.originalPrice} size="large" />
          <OfferCode />

          {product.colors?.length > 0 && (
            <ColorSelector
              colors={product.colors}
              selected={color}
              onSelect={setSelectedColor}
            />
          )}

          {product.sizes?.length > 0 && (
            <SizeSelector
              sizes={product.sizes}
              selected={size}
              onSelect={setSelectedSize}
            />
          )}

          <div className="pdp-info__qty">
            <p className="heading-sm">Quantity</p>
            <div className="qty-stepper">
              <button
                type="button"
                className="qty-stepper__btn"
                onClick={() => setQuantity((n) => Math.max(1, n - 1))}
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="qty-stepper__value">{quantity}</span>
              <button
                type="button"
                className="qty-stepper__btn"
                onClick={() => setQuantity((n) => Math.min(8, n + 1))}
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="pdp-info__actions">
            <Button variant="primary" size="lg" fullWidth onClick={handleAddToCart}>
              Add to Bag
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className={`pdp-info__wish${inWishlist ? ' pdp-info__wish--active' : ''}`}
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login', { state: { redirectTo: `/product/${slug}` }, replace: true })
                  return
                }
                toggleWishlist(product)
              }}
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
            </Button>
          </div>

          {accordionItems.length > 0 && (
            <Accordion items={accordionItems} defaultValue="description" />
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="pdp-related">
          <div className="section-header">
            <div>
              <p className="heading-sm">Complete the look</p>
              <h2 className="display-md">You May Also Like</h2>
            </div>
          </div>
          <ProductCarousel products={related} />
        </section>
      )}
    </div>
  )
}
